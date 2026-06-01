<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Campaign extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'whatsmark_campaign_id', 'name', 'template_name', 'template_params',
        'segment_filters', 'status', 'scheduled_at',
        'sent_count', 'delivered_count', 'read_count', 'daily_limit',
    ];


    protected $casts = [
        'template_params' => 'array',
        'segment_filters' => 'array',
        'scheduled_at' => 'datetime',
    ];

    public const STATUSES = [
        'draft' => 'Borrador',
        'scheduled' => 'Programada',
        'sending' => 'Enviando',
        'sent' => 'Enviada',
        'cancelled' => 'Cancelada',
    ];

    public function recipients(): HasMany
    {
        return $this->hasMany(CampaignRecipient::class);
    }

    public function scopeDraft($query) { return $query->where('status', 'draft'); }
    public function scopeScheduled($query) { return $query->where('status', 'scheduled'); }
    public function scopeSending($query) { return $query->where('status', 'sending'); }
}
