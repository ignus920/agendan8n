-- Script SQL para actualizar las automatizaciones de Sergas
-- Tenant ID: 019f514e-7924-71b2-9861-86be43bc2d1c
-- Base de datos: sac

USE `sac`;

START TRANSACTION;

-- 1. Actualizar Regla de Bienvenida (ID: 6) para asegurar alta prioridad y condiciones correctas
UPDATE `automations` 
SET 
    `priority` = 100,
    `conditions` = '{"contact.funnel_stage":"new"}',
    `actions` = '[{"type":"update_funnel","params":{"stage":"interested"}},{"type":"update_score","params":{"delta":10}},{"type":"send_whatsapp","params":{"message":"¡Hola! Bienvenido a Sergas. ¿En qué servicio estás interesado hoy? Por favor responde con el número de la opción:\\n\\n{products_list}"}}]'
WHERE `id` = 6 AND `tenant_id` = '019f514e-7924-71b2-9861-86be43bc2d1c';

-- 2. Actualizar Regla de Cancelación (ID: 12) para que solo aplique en etapa qualified y por palabras clave
UPDATE `automations` 
SET 
    `priority` = 90,
    `conditions` = '{"contact.funnel_stage":"qualified","message":"regex:/(cancelar|desagendar|cancelar cita|eliminar cita)/i"}',
    `actions` = '[{"type":"cancel_booking","params":[]},{"type":"update_funnel","params":{"stage":"lost"}},{"type":"update_score","params":{"delta":-15}},{"type":"send_whatsapp","params":{"message":"Tu cita para *{last_product.name}* ha sido cancelada correctamente. Si deseas volver a agendar en el futuro, escribe *Hola*."}}]'
WHERE `id` = 12 AND `tenant_id` = '019f514e-7924-71b2-9861-86be43bc2d1c';

-- 3. Actualizar Regla de Reprogramación (ID: 13) para que solo aplique en etapa qualified y por palabras clave
UPDATE `automations` 
SET 
    `priority` = 90,
    `conditions` = '{"contact.funnel_stage":"qualified","message":"regex:/(reprogramar|reagendar|cambiar fecha|cambiar hora)/i"}',
    `actions` = '[{"type":"reschedule_booking","params":[]},{"type":"trigger_n8n","params":{"webhook_url":"https://wfm.dosil.com.co/webhook/booking"}}]'
WHERE `id` = 13 AND `tenant_id` = '019f514e-7924-71b2-9861-86be43bc2d1c';

-- Eliminar reglas de fallback anteriores de Sergas para evitar duplicados en re-ejecuciones
DELETE FROM `automations` 
WHERE `tenant_id` = '019f514e-7924-71b2-9861-86be43bc2d1c' 
AND `name` IN (
    'Selección de Opción Numérica - Sergas',
    'Fallback Interesado - Sergas',
    'Fallback Calificado - Sergas',
    'Fallback Cliente - Sergas',
    'Fallback Perdido - Sergas'
);

-- 4. Insertar Regla de Selección de Opción Numérica (dispara el flujo de reserva n8n al recibir un número)
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1c',
    'Selección de Opción Numérica - Sergas',
    'message_received',
    '{"contact.funnel_stage":"interested","message":"regex:/^\\\\d+$/"}',
    '[{"type":"trigger_n8n","params":{"webhook_url":"https://wfm.dosil.com.co/webhook/booking"}}]',
    1,
    80,
    0,
    NOW(),
    NOW()
);

-- 5. Insertar Fallback para etapa "interested" (cuando el contacto no escribe un número)
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1c',
    'Fallback Interesado - Sergas',
    'message_received',
    '{"contact.funnel_stage":"interested"}',
    '[{"type":"send_whatsapp","params":{"message":"Hola {contact.name}, para continuar con tu solicitud por favor selecciona una de las opciones del menú respondiendo con su número:\\n\\n{products_list}"}}]',
    1,
    1,
    0,
    NOW(),
    NOW()
);

-- 6. Insertar Fallback para etapa "qualified" (indica cita agendada y opciones de cambiar/cancelar)
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1c',
    'Fallback Calificado - Sergas',
    'message_received',
    '{"contact.funnel_stage":"qualified"}',
    '[{"type":"send_whatsapp","params":{"message":"Hola {contact.name}, actualmente tienes una cita programada para *{last_product.name}* con *{last_resource.name}*.\\n\\nSi deseas cambiarla, escribe *reprogramar*. Si deseas cancelarla, escribe *cancelar*."}}]',
    1,
    1,
    0,
    NOW(),
    NOW()
);

-- 7. Insertar Fallback para etapa "customer" (regresa al cliente a interested y muestra menú de servicios)
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1c',
    'Fallback Cliente - Sergas',
    'message_received',
    '{"contact.funnel_stage":"customer"}',
    '[{"type":"update_funnel","params":{"stage":"interested"}},{"type":"send_whatsapp","params":{"message":"¡Hola de nuevo, {contact.name}! Qué gusto saludarte. ¿Deseas agendar un nuevo servicio? Responde con el número de la opción:\\n\\n{products_list}"}}]',
    1,
    1,
    0,
    NOW(),
    NOW()
);

-- 8. Insertar Fallback para etapa "lost" (regresa al cliente a interested y muestra menú de servicios)
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1c',
    'Fallback Perdido - Sergas',
    'message_received',
    '{"contact.funnel_stage":"lost"}',
    '[{"type":"update_funnel","params":{"stage":"interested"}},{"type":"send_whatsapp","params":{"message":"¡Hola, {contact.name}! Si deseas volver a agendar un servicio con nosotros, responde con el número de la opción:\\n\\n{products_list}"}}]',
    1,
    1,
    0,
    NOW(),
    NOW()
);

COMMIT;
