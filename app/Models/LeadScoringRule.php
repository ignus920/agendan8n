<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;

class LeadScoringRule extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'event_type',
        'condition', 'score_delta', 'is_active',
    ];

    protected $casts = [
        'condition' => 'array',
        'is_active' => 'boolean',
    ];

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForEvent($query, string $eventType)
    {
        return $query->where('event_type', $eventType)->active();
    }
}
