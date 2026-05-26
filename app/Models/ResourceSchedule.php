<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ResourceSchedule extends Model
{
    use BelongsToTenant;

    public $timestamps = false;

    protected $fillable = [
        'resource_id', 'tenant_id', 'day_of_week',
        'start_time', 'end_time', 'is_active',
    ];

    protected $casts = [
        'is_active' => 'boolean',
    ];

    public const DAYS = [
        0 => 'Domingo', 1 => 'Lunes', 2 => 'Martes',
        3 => 'Miércoles', 4 => 'Jueves', 5 => 'Viernes', 6 => 'Sábado',
    ];

    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }
}
