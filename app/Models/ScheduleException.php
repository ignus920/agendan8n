<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ScheduleException extends Model
{
    use BelongsToTenant;

    public $timestamps = false;

    protected $fillable = [
        'resource_id', 'tenant_id', 'exception_date',
        'start_time', 'end_time', 'is_available', 'reason',
    ];

    protected $casts = [
        'exception_date' => 'date',
        'is_available' => 'boolean',
    ];

    public function resource(): BelongsTo
    {
        return $this->belongsTo(Resource::class);
    }
}
