-- Script SQL para crear el Tenant "Sistema Autónomo Comercial (SAC)"
-- y configurar todo el flujo de Captura, Perfilamiento, Lead Scoring y Agenda Demo.
-- Tenant ID: 019f514e-7924-71b2-9861-86be43bc2d1e

USE `sac_db`;

START TRANSACTION;

-- 1. Crear el Tenant
INSERT INTO `tenants` (`id`, `name`, `slug`, `whatsapp_number`, `whatsmark_api_key`, `whatsmark_instance_id`, `n8n_webhook_url`, `ai_provider`, `ai_model`, `timezone`, `settings`, `plan_name`, `subscription_status`, `is_active`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'Sistema Autónomo Comercial (SAC)',
    'sac-demo',
    '+573000000001',
    'wm_sac_demo_key_998877',
    'sac_demo_instance',
    'https://wfm.dosil.com.co/webhook/booking',
    'openrouter',
    'google/gemini-2.0-flash',
    'America/Bogota',
    '{"theme":"dark","auto_decay_enabled":true}',
    'pro',
    'active',
    1,
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 2. Limpiar automatizaciones anteriores de este tenant
DELETE FROM `automations` WHERE `tenant_id` = '019f514e-7924-71b2-9861-86be43bc2d1e';

-- 3. Crear las Reglas de Automatización del Flujo

-- ETAPA 2: BIENVENIDA & PREGUNTA 1 (Tipo de Negocio)
-- Evento: message_received, stage: new
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'SAC - 1. Bienvenida y Pregunta Negocio',
    'message_received',
    '{"contact.funnel_stage":"new"}',
    '[{"type":"update_funnel","params":{"stage":"interested"}},{"type":"send_whatsapp","params":{"message":"Hola 👋\\n\\nSoy el asistente del Sistema Autónomo Comercial.\\n\\nAyudo a empresas a responder automáticamente WhatsApp, hacer seguimiento comercial y agendar clientes sin intervención manual.\\n\\nAntes de mostrarte la demo:\\n\\n¿Qué tipo de negocio tienes?\\n\\n1. Taller / Servicios técnicos\\n2. Clínica / Salud\\n3. Turismo / Reservas\\n4. Servicios profesionales\\n5. Otro"}}]',
    1,
    100,
    0,
    NOW(),
    NOW()
);

-- ETAPA 3: PERFILAMIENTO - PREGUNTA 1 -> PREGUNTA 2 (Principal Problema)
-- Opción 1: Taller
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'SAC - 2A. Tipo Negocio: Taller',
    'message_received',
    '{"contact.funnel_stage":"interested","message":"regex:/^(1|taller)/i"}',
    '[{"type":"update_funnel","params":{"stage":"profile_taller"}},{"type":"send_whatsapp","params":{"message":"¿Cuál es tu principal problema actualmente?\\n\\n1. Respondo tarde WhatsApp\\n2. Pierdo clientes\\n3. Falta seguimiento\\n4. Agendar consume tiempo\\n5. No logro cerrar ventas"}}]',
    1,
    90,
    0,
    NOW(),
    NOW()
);

-- Opción 2: Clínica
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'SAC - 2B. Tipo Negocio: Clinica',
    'message_received',
    '{"contact.funnel_stage":"interested","message":"regex:/^(2|clinica)/i"}',
    '[{"type":"update_funnel","params":{"stage":"profile_clinica"}},{"type":"send_whatsapp","params":{"message":"¿Cuál es tu principal problema actualmente?\\n\\n1. Respondo tarde WhatsApp\\n2. Pierdo clientes\\n3. Falta seguimiento\\n4. Agendar consume tiempo\\n5. No logro cerrar ventas"}}]',
    1,
    90,
    0,
    NOW(),
    NOW()
);

-- Opción 3: Turismo
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'SAC - 2C. Tipo Negocio: Turismo',
    'message_received',
    '{"contact.funnel_stage":"interested","message":"regex:/^(3|turismo)/i"}',
    '[{"type":"update_funnel","params":{"stage":"profile_turismo"}},{"type":"send_whatsapp","params":{"message":"¿Cuál es tu principal problema actualmente?\\n\\n1. Respondo tarde WhatsApp\\n2. Pierdo clientes\\n3. Falta seguimiento\\n4. Agendar consume tiempo\\n5. No logro cerrar ventas"}}]',
    1,
    90,
    0,
    NOW(),
    NOW()
);

-- Opción 4/5/Otro
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'SAC - 2D. Tipo Negocio: Otros',
    'message_received',
    '{"contact.funnel_stage":"interested","message":"regex:/^(4|5|profesionales|otro)/i"}',
    '[{"type":"update_funnel","params":{"stage":"profile_otro"}},{"type":"send_whatsapp","params":{"message":"¿Cuál es tu principal problema actualmente?\\n\\n1. Respondo tarde WhatsApp\\n2. Pierdo clientes\\n3. Falta seguimiento\\n4. Agendar consume tiempo\\n5. No logro cerrar ventas"}}]',
    1,
    85,
    0,
    NOW(),
    NOW()
);

-- ETAPA 3: PERFILAMIENTO - PREGUNTA 2 -> PREGUNTA 3 (Tamaño de Empresa)
-- Para contactos de Taller
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'SAC - 3A. Problema: Taller',
    'message_received',
    '{"contact.funnel_stage":"profile_taller","message":"regex:/^[1-5]$/"}',
    '[{"type":"update_funnel","params":{"stage":"problem_taller"}},{"type":"send_whatsapp","params":{"message":"¿Cuántas personas atienden clientes actualmente?\\n\\n1. Solo yo\\n2. 2 a 5 personas\\n3. Más de 5 personas"}}]',
    1,
    80,
    0,
    NOW(),
    NOW()
);

-- Para contactos de Clinica
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'SAC - 3B. Problema: Clinica',
    'message_received',
    '{"contact.funnel_stage":"profile_clinica","message":"regex:/^[1-5]$/"}',
    '[{"type":"update_funnel","params":{"stage":"problem_clinica"}},{"type":"send_whatsapp","params":{"message":"¿Cuántas personas atienden clientes actualmente?\\n\\n1. Solo yo\\n2. 2 a 5 personas\\n3. Más de 5 personas"}}]',
    1,
    80,
    0,
    NOW(),
    NOW()
);

-- Para contactos de Turismo
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'SAC - 3C. Problema: Turismo',
    'message_received',
    '{"contact.funnel_stage":"profile_turismo","message":"regex:/^[1-5]$/"}',
    '[{"type":"update_funnel","params":{"stage":"problem_turismo"}},{"type":"send_whatsapp","params":{"message":"¿Cuántas personas atienden clientes actualmente?\\n\\n1. Solo yo\\n2. 2 a 5 personas\\n3. Más de 5 personas"}}]',
    1,
    80,
    0,
    NOW(),
    NOW()
);

-- Para contactos de Otros
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'SAC - 3D. Problema: Otros',
    'message_received',
    '{"contact.funnel_stage":"profile_otro","message":"regex:/^[1-5]$/"}',
    '[{"type":"update_funnel","params":{"stage":"problem_otro"}},{"type":"send_whatsapp","params":{"message":"¿Cuántas personas atienden clientes actualmente?\\n\\n1. Solo yo\\n2. 2 a 5 personas\\n3. Más de 5 personas"}}]',
    1,
    80,
    0,
    NOW(),
    NOW()
);

-- ETAPA 5 & 6: RESPUESTA PERSONALIZADA & CTA DEMO (Lead Scoring Integrado)
-- Caso Taller
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'SAC - 4A. Scoring & Custom: Taller',
    'message_received',
    '{"contact.funnel_stage":"problem_taller","message":"regex:/^[1-3]$/"}',
    '[{"type":"update_score","params":{"delta":30}},{"type":"update_funnel","params":{"stage":"demo_cta"}},{"type":"send_whatsapp","params":{"message":"Perfecto 👍\\n\\nMuchos talleres pierden clientes porque las cotizaciones quedan sin seguimiento.\\n\\nEl sistema puede:\\n\\n✅ responder automáticamente\\n✅ hacer seguimiento comercial\\n✅ recordar mantenimientos\\n✅ agendar clientes automáticamente\\n✅ recuperar clientes inactivos\\n\\n¿Quieres ver una demo real de cómo automatizar tus ventas por WhatsApp?\\n\\nLa demo dura solo 20 minutos y puedes programarla respondiendo *SI* o *AGENDAR*."}}]',
    1,
    75,
    0,
    NOW(),
    NOW()
);

-- Caso Clinica
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'SAC - 4B. Scoring & Custom: Clinica',
    'message_received',
    '{"contact.funnel_stage":"problem_clinica","message":"regex:/^[1-3]$/"}',
    '[{"type":"update_score","params":{"delta":30}},{"type":"update_funnel","params":{"stage":"demo_cta"}},{"type":"send_whatsapp","params":{"message":"Perfecto 👍\\n\\nMuchas clínicas pierden citas por falta de seguimiento automático.\\n\\nEl sistema puede:\\n\\n✅ confirmar citas\\n✅ enviar recordatorios\\n✅ responder fuera de horario\\n✅ segmentar pacientes\\n✅ automatizar seguimientos\\n\\n¿Quieres ver una demo real de cómo automatizar tus ventas por WhatsApp?\\n\\nLa demo dura solo 20 minutos y puedes programarla respondiendo *SI* o *AGENDAR*."}}]',
    1,
    75,
    0,
    NOW(),
    NOW()
);

-- Caso Turismo
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'SAC - 4C. Scoring & Custom: Turismo',
    'message_received',
    '{"contact.funnel_stage":"problem_turismo","message":"regex:/^[1-3]$/"}',
    '[{"type":"update_score","params":{"delta":30}},{"type":"update_funnel","params":{"stage":"demo_cta"}},{"type":"send_whatsapp","params":{"message":"Perfecto 👍\\n\\nMuchas agencias pierden reservas por responder tarde.\\n\\nEl sistema puede:\\n\\n✅ responder automáticamente\\n✅ clasificar prospectos\\n✅ automatizar reservas\\n✅ hacer seguimiento\\n✅ recuperar clientes interesados\\n\\n¿Quieres ver una demo real de cómo automatizar tus ventas por WhatsApp?\\n\\nLa demo dura solo 20 minutos y puedes programarla respondiendo *SI* o *AGENDAR*."}}]',
    1,
    75,
    0,
    NOW(),
    NOW()
);

-- Caso Otros / General
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'SAC - 4D. Scoring & Custom: Otros',
    'message_received',
    '{"contact.funnel_stage":"problem_otro","message":"regex:/^[1-3]$/"}',
    '[{"type":"update_score","params":{"delta":25}},{"type":"update_funnel","params":{"stage":"demo_cta"}},{"type":"send_whatsapp","params":{"message":"Perfecto 👍\\n\\nNuestra plataforma ayuda a automatizar tu comunicación en WhatsApp de forma integrada.\\n\\nEl sistema puede:\\n\\n✅ Responder de forma inmediata\\n✅ Calificar leads de forma autónoma\\n✅ Agendar demos o citas comerciales\\n✅ Mantener el control con notificaciones al equipo\\n\\n¿Quieres ver una demo real de cómo automatizar tus ventas por WhatsApp?\\n\\nLa demo dura solo 20 minutos y puedes programarla respondiendo *SI* o *AGENDAR*."}}]',
    1,
    70,
    0,
    NOW(),
    NOW()
);

-- ETAPA 7: AGENDA AUTOMÁTICA (Mostrar Slots)
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'SAC - 5. Mostrar Slots Disponibles',
    'message_received',
    '{"contact.funnel_stage":"demo_cta","message":"regex:/(si|agendar|demo|agenda|quiero)/i"}',
    '[{"type":"update_funnel","params":{"stage":"demo_scheduling"}},{"type":"send_whatsapp","params":{"message":"Por favor responde con el número de la opción del horario que prefieras para tu demo de 20 minutos:\\n\\nHoy:\\n1. 3:00 PM\\n2. 5:00 PM\\n\\nMañana:\\n3. 9:00 AM\\n4. 11:00 AM"}}]',
    1,
    80,
    0,
    NOW(),
    NOW()
);

-- ETAPA 8: CREACIÓN BOOKING (Dispara flujo n8n para agendar)
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'SAC - 6. Ejecutar Reserva',
    'message_received',
    '{"contact.funnel_stage":"demo_scheduling","message":"regex:/^[1-4]$/"}',
    '[{"type":"trigger_n8n","params":{"webhook_url":"https://wfm.dosil.com.co/webhook/booking"}},{"type":"update_funnel","params":{"stage":"demo_scheduled"}}]',
    1,
    90,
    0,
    NOW(),
    NOW()
);

-- Fallback en demo_cta si responde algo que no sea SI/Agendar
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'SAC - Fallback CTA',
    'message_received',
    '{"contact.funnel_stage":"demo_cta"}',
    '[{"type":"send_whatsapp","params":{"message":"¿Te gustaría ver la demo comercial de 20 minutos para automatizar tu negocio?\\n\\nResponde escribiendo *SI* para elegir tu horario o *NO* para continuar más tarde."}}]',
    1,
    1,
    0,
    NOW(),
    NOW()
);

-- Fallback en demo_scheduling si responde algo que no sea una opción horaria
INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`)
VALUES (
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'SAC - Fallback Horario',
    'message_received',
    '{"contact.funnel_stage":"demo_scheduling"}',
    '[{"type":"send_whatsapp","params":{"message":"Por favor responde únicamente con el número del horario seleccionado (1, 2, 3 o 4):\\n\\nHoy:\\n1. 3:00 PM\\n2. 5:00 PM\\n\\nMañana:\\n3. 9:00 AM\\n4. 11:00 AM"}}]',
    1,
    1,
    0,
    NOW(),
    NOW()
);

COMMIT;
