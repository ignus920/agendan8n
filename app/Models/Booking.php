<?php

namespace App\Models;

use App\Events\BookingCreated;
use App\Events\BookingConfirmed;
use App\Events\BookingCancelled;
use App\Events\BookingCompleted;
use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Booking extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'contact_id', 'resource_id', 'product_id',
        'assigned_user_id', 'title', 'starts_at', 'ends_at',
        'status', 'notes', 'source', 'metadata',
    ];

    protected $casts = [
        'starts_at' => 'datetime',
        'ends_at' => 'datetime',
        'metadata' => 'array',
    ];

    public const STATUSES = [
        'pending' => 'Pendiente',
        'confirmed' => 'Confirmada',
        'in_progress' => 'En curso',
        'completed' => 'Completada',
        'cancelled' => 'Cancelada',
        'no_show' => 'No asistió',
    ];

    protected $dispatchesEvents = [
        'created' => BookingCreated::class,
    ];

    // Relationships
    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }

    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }

    public function product(): BelongsTo
    {
        return $this->belongsTo(Product::class);
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    // Status transitions
    public function confirm(): void
    {
        $this->update(['status' => 'confirmed']);
        event(new BookingConfirmed($this));
    }

    public function cancel(): void
    {
        $this->update(['status' => 'cancelled']);
        event(new BookingCancelled($this));
    }

    public function complete(): void
    {
        $this->update(['status' => 'completed']);
        event(new BookingCompleted($this));
    }

    // Scopes
    public function scopeUpcoming($query)
    {
        return $query->where('starts_at', '>=', now())
            ->whereNotIn('status', ['cancelled', 'no_show'])
            ->orderBy('starts_at');
    }

    public function scopeToday($query)
    {
        return $query->whereDate('starts_at', today())
            ->whereNotIn('status', ['cancelled', 'no_show']);
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function getDurationMinutesAttribute(): int
    {
        return $this->starts_at->diffInMinutes($this->ends_at);
    }
}
