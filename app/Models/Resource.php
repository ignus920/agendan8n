<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Resource extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'type', 'description',
        'capacity', 'is_active', 'metadata',
    ];

    protected $casts = [
        'metadata' => 'array',
        'is_active' => 'boolean',
    ];

    public const TYPES = [
        'person' => 'Persona',
        'room' => 'Sala',
        'equipment' => 'Equipo',
        'vehicle' => 'Vehículo',
    ];

    public function schedules(): HasMany
    {
        return $this->hasMany(ResourceSchedule::class);
    }

    public function exceptions(): HasMany
    {
        return $this->hasMany(ScheduleException::class);
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    /**
     * Check if resource is available at a given time slot.
     */
    public function isAvailableAt(\Carbon\Carbon $start, \Carbon\Carbon $end): bool
    {
        // Check for schedule exceptions (blocked days)
        $exception = $this->exceptions()
            ->where('exception_date', $start->toDateString())
            ->first();

        if ($exception && !$exception->is_available) {
            return false;
        }

        // Check weekly schedule
        $daySchedule = $this->schedules()
            ->where('day_of_week', $start->dayOfWeek)
            ->where('is_active', true)
            ->where('start_time', '<=', $start->format('H:i:s'))
            ->where('end_time', '>=', $end->format('H:i:s'))
            ->exists();

        if (!$daySchedule && !($exception && $exception->is_available)) {
            return false;
        }

        // Check for conflicting bookings
        $conflicts = $this->bookings()
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->where(function ($q) use ($start, $end) {
                $q->where(function ($q2) use ($start, $end) {
                    $q2->where('starts_at', '<', $end)
                        ->where('ends_at', '>', $start);
                });
            })
            ->count();

        return $conflicts < $this->capacity;
    }
}
