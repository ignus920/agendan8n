<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CampaignRecipient extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'campaign_id', 'contact_id', 'status', 'sent_at', 'error_message',
    ];

    protected $casts = ['sent_at' => 'datetime'];

    public function campaign(): BelongsTo
    {
        return $this->belongsTo(Campaign::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }
}
