<?php

namespace App\Models;

use App\Models\Concerns\BelongsToTenant;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Automation extends Model
{
    use BelongsToTenant;

    protected $fillable = [
        'tenant_id', 'name', 'event_type', 'conditions',
        'actions', 'is_active', 'priority', 'cooldown_hours',
    ];

    protected $casts = [
        'conditions' => 'array',
        'actions' => 'array',
        'is_active' => 'boolean',
    ];

    /**
     * All supported event types.
     */
    public const EVENT_TYPES = [
        'contact_created' => 'Contacto creado',
        'contact_updated' => 'Contacto actualizado',
        'contact_score_changed' => 'Score cambiado',
        'booking_created' => 'Cita creada',
        'booking_confirmed' => 'Cita confirmada',
        'booking_cancelled' => 'Cita cancelada',
        'booking_completed' => 'Cita completada',
        'purchase_created' => 'Compra registrada',
        'repurchase_due' => 'Recompra vencida',
        'lead_inactive' => 'Lead inactivo',
        'message_received' => 'Mensaje recibido',
        'campaign_sent' => 'Campaña enviada',
    ];

    /**
     * All supported action types.
     */
    public const ACTION_TYPES = [
        'send_whatsapp' => 'Enviar WhatsApp',
        'update_score' => 'Actualizar score',
        'update_funnel' => 'Actualizar embudo',
        'create_task' => 'Crear tarea',
        'assign_advisor' => 'Asignar asesor',
        'trigger_ai' => 'Ejecutar IA',
        'schedule_followup' => 'Programar seguimiento',
        'trigger_n8n' => 'Disparar flujo n8n',
        'update_memory' => 'Actualizar memoria',
        'pause_bot' => 'Pausar bot',
    ];

    public function logs(): HasMany
    {
        return $this->hasMany(AutomationLog::class);
    }

    public function scopeActive($query)
    {
        return $query->where('is_active', true);
    }

    public function scopeForEvent($query, string $eventType)
    {
        return $query->where('event_type', $eventType)
            ->where('is_active', true)
            ->orderBy('priority', 'desc');
    }
}
