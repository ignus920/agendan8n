-- Script SQL de Producción para Sergas (Menú Principal Interactivo)
-- Tenant ID: 019f514e-7924-71b2-9861-86be43bc2d1c
-- Base de datos: sac

USE `sac`;

START TRANSACTION;

-- 1. Actualizar Regla de Bienvenida (ID: 6)
-- Cuando es "new", muestra el menú principal y pasa a "interested"
UPDATE `automations` 
SET 
    `priority` = 100,
    `conditions` = '{"contact.funnel_stage":"new"}',
    `actions` = '[{"type":"update_funnel","params":{"stage":"interested"}},{"type":"send_whatsapp","params":{"message":"¡Hola! Bienvenido a Sergas. ¿Cómo podemos ayudarte hoy? Por favor responde con el número de tu opción:\\n\\n1️⃣ *Agendar o Gestionar Citas*\\n2️⃣ *Ver Servicios y Precios*\\n3️⃣ *Hablar con un Asesor*"}}]'
WHERE `id` = 6 AND `tenant_id` = '019f514e-7924-71b2-9861-86be43bc2d1c';

-- 2. Actualizar Regla de Cancelación (ID: 12)
UPDATE `automations` 
SET 
    `priority` = 90,
    `conditions` = '{"contact.funnel_stage":"qualified","message":"regex:/(cancelar|desagendar|cancelar cita|eliminar cita)/i"}',
    `actions` = '[{"type":"cancel_booking","params":[]},{"type":"update_funnel","params":{"stage":"lost"}},{"type":"update_score","params":{"delta":-15}},{"type":"send_whatsapp","params":{"message":"Tu cita para *{last_product.name}* ha sido cancelada correctamente. Si deseas volver a agendar en el futuro, escribe *Hola*."}}]'
WHERE `id` = 12 AND `tenant_id` = '019f514e-7924-71b2-9861-86be43bc2d1c';

-- 3. Actualizar Regla de Reprogramación (ID: 13)
UPDATE `automations` 
SET 
    `priority` = 90,
    `conditions` = '{"contact.funnel_stage":"qualified","message":"regex:/(reprogramar|reagendar|cambiar fecha|cambiar hora)/i"}',
    `actions` = '[{"type":"reschedule_booking","params":[]},{"type":"update_funnel","params":{"stage":"negotiation"}},{"type":"send_whatsapp","params":{"message":"Iniciando reprogramación. Por favor responde con el número del servicio que deseas agendar:\\n\\n{products_list}"}}]'
WHERE `id` = 13 AND `tenant_id` = '019f514e-7924-71b2-9861-86be43bc2d1c';

-- Eliminar reglas viejas de Sergas para evitar duplicados en re-ejecuciones
DELETE FROM `automations` 
WHERE `tenant_id` = '019f514e-7924-71b2-9861-86be43bc2d1c' 
AND `name` IN (
    'Selección Opción 1 - Agendar Con Cita - Sergas',
    'Selección Opción 1 - Agendar Sin Cita - Sergas',
    'Selección Opción 2 - Precios - Sergas',
    'Selección Opción 3 - Asesor - Sergas',
    'Selección Opción Numérica Producto - Sergas',
    'Fallback General Interesado - Sergas',
    'Fallback Calificado - Sergas',
    'Fallback Negociacion - Sergas',
    'Fallback Cliente/Perdido - Sergas',
    'Selección de Opción Numérica - Sergas',
    'Fallback Interesado - Sergas',
    'Fallback Cliente - Sergas',
    'Fallback Perdido - Sergas'
);

-- 4. Selección Opción 1: Agendar con cita activa (Prioridad 85)
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1c',
    'Selección Opción 1 - Agendar Con Cita - Sergas',
    'message_received',
    '{"contact.funnel_stage":"qualified","message":"regex:/^(1|agendar|cita|citas|gestionar)/i"}',
    '[{"type":"send_whatsapp","params":{"message":"Hola {contact.name}, actualmente ya tienes una cita programada para *{last_product.name}* con *{last_resource.name}*.\\n\\nSi deseas cambiarla, responde *reprogramar*. Si deseas cancelarla, responde *cancelar*."}}]',
    1,
    85,
    0,
    NOW(),
    NOW()
);

-- 5. Selección Opción 1: Agendar sin cita activa (Prioridad 80)
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1c',
    'Selección Opción 1 - Agendar Sin Cita - Sergas',
    'message_received',
    '{"contact.funnel_stage":"interested","message":"regex:/^(1|agendar|cita|citas|gestionar)/i"}',
    '[{"type":"update_funnel","params":{"stage":"negotiation"}},{"type":"send_whatsapp","params":{"message":"Por favor responde con el número de la opción del servicio que deseas agendar:\\n\\n{products_list}"}}]',
    1,
    80,
    0,
    NOW(),
    NOW()
);

-- 6. Selección Opción 2: Ver precios y servicios (Prioridad 80)
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1c',
    'Selección Opción 2 - Precios - Sergas',
    'message_received',
    '{"contact.funnel_stage":"interested","message":"regex:/^(2|precios|productos|servicios)/i"}',
    '[{"type":"send_whatsapp","params":{"message":"Aquí tienes nuestros servicios y precios disponibles:\\n\\n{products_list}\\n\\nSi deseas agendar alguno de ellos, responde escribiendo *1* o *agendar*."}}]',
    1,
    80,
    0,
    NOW(),
    NOW()
);

-- 7. Selección Opción 3: Hablar con asesor (Prioridad 80)
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1c',
    'Selección Opción 3 - Asesor - Sergas',
    'message_received',
    '{"contact.funnel_stage":"interested","message":"regex:/^(3|asesor|hablar|persona|humano)/i"}',
    '[{"type":"pause_bot","params":{"hours":12}},{"type":"send_whatsapp","params":{"message":"He pausado el asistente automático. Un asesor comercial de Sergas se comunicará contigo lo antes posible para atender tu solicitud."}}]',
    1,
    80,
    0,
    NOW(),
    NOW()
);

-- 8. Selección Numérica de Producto (Sólo en etapa negociación) (Prioridad 75)
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1c',
    'Selección Opción Numérica Producto - Sergas',
    'message_received',
    '{"contact.funnel_stage":"negotiation","message":"regex:/^\\\\d+$/"}',
    '[{"type":"trigger_n8n","params":{"webhook_url":"https://wfm.dosil.com.co/webhook/booking"}}]',
    1,
    75,
    0,
    NOW(),
    NOW()
);

-- 9. Fallback General en Interesado (Muestra el menú principal si no entiende la opción)
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1c',
    'Fallback General Interesado - Sergas',
    'message_received',
    '{"contact.funnel_stage":"interested"}',
    '[{"type":"send_whatsapp","params":{"message":"No he logrado entender tu respuesta. Por favor selecciona una de las opciones del menú respondiendo con su número:\\n\\n1️⃣ *Agendar o Gestionar Citas*\\n2️⃣ *Ver Servicios y Precios*\\n3️⃣ *Hablar con un Asesor*"}}]',
    1,
    1,
    0,
    NOW(),
    NOW()
);

-- 10. Fallback en Calificado (Tiene cita activa)
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

-- 11. Fallback en Negociación (No escribió un número de producto válido)
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1c',
    'Fallback Negociacion - Sergas',
    'message_received',
    '{"contact.funnel_stage":"negotiation"}',
    '[{"type":"send_whatsapp","params":{"message":"Por favor responde con el número del servicio de la lista para continuar con tu agenda, o escribe *regresar* para volver al menú principal:\\n\\n{products_list}"}}]',
    1,
    1,
    0,
    NOW(),
    NOW()
);

-- 12. Regresar al menú principal desde negociación
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1c',
    'Regresar al Menú - Sergas',
    'message_received',
    '{"contact.funnel_stage":"negotiation","message":"regex:/(regresar|volver|menu)/i"}',
    '[{"type":"update_funnel","params":{"stage":"interested"}},{"type":"send_whatsapp","params":{"message":"Volviendo al menú principal. ¿Cómo podemos ayudarte hoy? Responde con tu opción:\\n\\n1️⃣ *Agendar o Gestionar Citas*\\n2️⃣ *Ver Servicios y Precios*\\n3️⃣ *Hablar con un Asesor*"}}]',
    1,
    80,
    0,
    NOW(),
    NOW()
);

-- 13. Fallback en Cliente o Perdido (Muestra el menú principal y pasa a interested)
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1c',
    'Fallback Cliente/Perdido - Sergas',
    'message_received',
    '{"contact.funnel_stage":["customer","lost"]}',
    '[{"type":"update_funnel","params":{"stage":"interested"}},{"type":"send_whatsapp","params":{"message":"¡Hola! Qué gusto saludarte de nuevo. ¿Cómo podemos ayudarte hoy? Responde con el número de tu opción:\\n\\n1️⃣ *Agendar o Gestionar Citas*\\n2️⃣ *Ver Servicios y Precios*\\n3️⃣ *Hablar con un Asesor*"}}]',
    1,
    1,
    0,
    NOW(),
    NOW()
);

COMMIT;
