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
}
