<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AutomationLog extends Model
{
    use BelongsToTenant;

    public $timestamps = false;

    protected $fillable = [
        'automation_id', 'tenant_id', 'contact_id', 'event_type',
        'event_payload', 'actions_executed', 'status', 'error_message',
        'executed_at',
    ];

    protected $casts = [
        'event_payload' => 'array',
        'actions_executed' => 'array',
        'executed_at' => 'datetime',
    ];

    public function automation(): BelongsTo
    {
        return $this->belongsTo(Automation::class);
    }

    public function contact(): BelongsTo
    {
        return $this->belongsTo(Contact::class);
    }
}
