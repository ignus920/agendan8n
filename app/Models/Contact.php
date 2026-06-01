<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Contact extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'whatsapp_phone', 'name', 'email', 'lead_score',
        'funnel_stage', 'interest_level', 'assigned_user_id', 'tags',
        'last_product_id', 'last_purchase_at', 'next_repurchase_at',
        'bot_paused', 'bot_paused_until', 'metadata',
    ];

    protected $casts = [
        'tags' => 'array',
        'metadata' => 'array',
        'bot_paused' => 'boolean',
        'last_purchase_at' => 'datetime',
        'next_repurchase_at' => 'datetime',
        'bot_paused_until' => 'datetime',
    ];

    protected static bool $isHandlingEvents = false;

    protected static function booted()
    {
        static::created(function (Contact $contact) {
            if (self::$isHandlingEvents) {
                return;
            }
            self::$isHandlingEvents = true;

            try {
                // Log creation in automation_logs
                \App\Models\AutomationLog::create([
                    'tenant_id' => $contact->tenant_id,
                    'contact_id' => $contact->id,
                    'event_type' => 'contact_created',
                    'event_payload' => [
                        'name' => $contact->name,
                        'funnel_stage' => $contact->funnel_stage,
                        'interest_level' => $contact->interest_level,
                        'lead_score' => $contact->lead_score,
                    ],
                    'actions_executed' => [
                        'description' => "Contacto registrado en el sistema con fase '" . (self::FUNNEL_STAGES[$contact->funnel_stage] ?? $contact->funnel_stage) . "'",
                    ],
                    'status' => 'success',
                    'executed_at' => now(),
                ]);

                // Associate follow-up campaign
                app(\App\Services\CampaignFollowupService::class)->associateCampaign($contact, 'contact_created');

                // Dispatch sync to WhatsMark
                \App\Jobs\SyncContactToWhatsMarkJob::dispatch($contact);
            } finally {
                self::$isHandlingEvents = false;
            }
        });

        static::updated(function (Contact $contact) {
            if (self::$isHandlingEvents) {
                return;
            }
            self::$isHandlingEvents = true;

            try {
                $dirty = $contact->getDirty();

                // Track funnel_stage changes
                if (array_key_exists('funnel_stage', $dirty)) {
                    $oldValue = $contact->getOriginal('funnel_stage');
                    $newValue = $contact->funnel_stage;

                    \App\Models\AutomationLog::create([
                        'tenant_id' => $contact->tenant_id,
                        'contact_id' => $contact->id,
                        'event_type' => 'funnel_stage_changed',
                        'event_payload' => [
                            'from' => $oldValue,
                            'to' => $newValue,
                        ],
                        'actions_executed' => [
                            'description' => "Fase de embudo cambiada de '" . (self::FUNNEL_STAGES[$oldValue] ?? $oldValue) . "' a '" . (self::FUNNEL_STAGES[$newValue] ?? $newValue) . "'",
                        ],
                        'status' => 'success',
                        'executed_at' => now(),
                    ]);

                    // Associate follow-up campaign
                    app(\App\Services\CampaignFollowupService::class)->associateCampaign($contact, 'funnel_stage_changed', [
                        'from' => $oldValue,
                        'to' => $newValue
                    ]);
                }

                // Track lead_score changes
                if (array_key_exists('lead_score', $dirty)) {
                    $oldValue = $contact->getOriginal('lead_score');
                    $newValue = $contact->lead_score;

                    \App\Models\AutomationLog::create([
                        'tenant_id' => $contact->tenant_id,
                        'contact_id' => $contact->id,
                        'event_type' => 'lead_score_changed',
                        'event_payload' => [
                            'from' => $oldValue,
                            'to' => $newValue,
                        ],
                        'actions_executed' => [
                            'description' => "Puntuación de lead cambiada de {$oldValue} a {$newValue} pts",
                        ],
                        'status' => 'success',
                        'executed_at' => now(),
                    ]);
                }

                // Track interest_level changes
                if (array_key_exists('interest_level', $dirty)) {
                    $oldValue = $contact->getOriginal('interest_level');
                    $newValue = $contact->interest_level;

                    \App\Models\AutomationLog::create([
                        'tenant_id' => $contact->tenant_id,
                        'contact_id' => $contact->id,
                        'event_type' => 'interest_level_changed',
                        'event_payload' => [
                            'from' => $oldValue,
                            'to' => $newValue,
                        ],
                        'actions_executed' => [
                            'description' => "Nivel de interés cambiado de '" . (self::INTEREST_LEVELS[$oldValue] ?? $oldValue) . "' a '" . (self::INTEREST_LEVELS[$newValue] ?? $newValue) . "'",
                        ],
                        'status' => 'success',
                        'executed_at' => now(),
                    ]);
                }

                // Sync to WhatsMark if relevant fields changed
                $fieldsToSync = ['name', 'email', 'tags', 'lead_score', 'funnel_stage', 'interest_level', 'bot_paused'];
                $shouldSync = false;
                foreach ($fieldsToSync as $field) {
                    if (array_key_exists($field, $dirty)) {
                        $shouldSync = true;
                        break;
                    }
                }

                if ($shouldSync) {
                    \App\Jobs\SyncContactToWhatsMarkJob::dispatch($contact);
                }
            } finally {
                self::$isHandlingEvents = false;
            }
        });
    }

    public const FUNNEL_STAGES = [
        'new' => 'Nuevo',
        'interested' => 'Interesado',
        'qualified' => 'Calificado',
        'negotiation' => 'Negociación',
        'customer' => 'Cliente',
        'lost' => 'Perdido',
    ];

    public const INTEREST_LEVELS = [
        'unknown' => 'Desconocido',
        'low' => 'Bajo',
        'medium' => 'Medio',
        'high' => 'Alto',
        'hot' => 'Caliente',
    ];

    // Relationships
    public function automationLogs(): HasMany
    {
        return $this->hasMany(AutomationLog::class, 'contact_id')->orderByDesc('executed_at');
    }

    public function assignedUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'assigned_user_id');
    }

    public function lastProduct(): BelongsTo
    {
        return $this->belongsTo(Product::class, 'last_product_id');
    }

    public function memory(): HasMany
    {
        return $this->hasMany(ContactMemory::class);
    }

    public function interactions(): HasMany
    {
        return $this->hasMany(ContactInteraction::class)->orderByDesc('created_at');
    }

    public function bookings(): HasMany
    {
        return $this->hasMany(Booking::class);
    }

    public function purchases(): HasMany
    {
        return $this->hasMany(Purchase::class);
    }

    // Memory helpers
    public function getMemory(string $key): ?string
    {
        return $this->memory()->where('key', $key)->value('value');
    }

    public function setMemory(string $key, ?string $value): void
    {
        $this->memory()->updateOrCreate(
            ['key' => $key, 'contact_id' => $this->id],
            ['value' => $value, 'tenant_id' => $this->tenant_id, 'updated_at' => now()]
        );
    }

    // Scopes
    public function scopeByStage($query, string $stage)
    {
        return $query->where('funnel_stage', $stage);
    }

    public function scopeRepurchaseDue($query)
    {
        return $query->whereNotNull('next_repurchase_at')
            ->where('next_repurchase_at', '<=', now());
    }

    public function scopeHotLeads($query)
    {
        return $query->where('interest_level', 'hot')
            ->orWhere('lead_score', '>=', 80);
    }

    public function isBotActive(): bool
    {
        if (!$this->bot_paused) return true;
        if ($this->bot_paused_until && $this->bot_paused_until->isPast()) {
            $this->update(['bot_paused' => false, 'bot_paused_until' => null]);
            return true;
        }
        return false;
    }

    public function getHasActiveBookingAttribute(): bool
    {
        return $this->bookings()->whereIn('status', ['pending', 'confirmed'])->exists();
    }

    public function getMemoryLastPromptAttribute(): ?string
    {
        return $this->getMemory('last_prompt');
    }
}
