-- Script de Creación del Flujo Conversacional Dinámico para SAC
-- Tenant ID: 019f514e-7924-71b2-9861-86be43bc2d1e

-- Eliminar automatizaciones previas de 'message_received' para este tenant para evitar duplicados
DELETE FROM `automations` WHERE `tenant_id` = '019f514e-7924-71b2-9861-86be43bc2d1e' AND `event_type` = 'message_received';

INSERT INTO `automations` (`tenant_id`, `name`, `event_type`, `conditions`, `actions`, `is_active`, `priority`, `cooldown_hours`, `created_at`, `updated_at`) VALUES

-- ==========================================
-- 1. MENÚ PRINCIPAL (PRIORIDAD 10)
-- ==========================================
('019f514e-7924-71b2-9861-86be43bc2d1e', 'Menú Principal (Bienvenida)', 'message_received', 
'{"message": "regex:/^(hola|buenas|informacion|buen dia|buenas tardes|buenas noches|info|menu|menú|inicio|quiero mas informacion)/i"}', 
'[
  {
    "type": "send_whatsapp",
    "params": {
      "message": "¡Hola {contact.name}! ¿En qué puedo ayudarte hoy?\\n\\n*1.* 📦 Productos y Servicios\\n*2.* 📅 Agendar / Gestionar Cita\\n*3.* 👤 Hablar con un Asesor Comercial\\n\\nPor favor, responde con el *número* de la opción que deseas."
    }
  },
  {
    "type": "update_memory",
    "params": {
      "last_prompt": "main_menu"
    }
  }
]', 1, 10, 0, NOW(), NOW()),

-- ==========================================
-- 2. OPCIÓN 1: SELECCIONAR SECTOR (PRIORIDAD 10)
-- ==========================================
('019f514e-7924-71b2-9861-86be43bc2d1e', 'Menú - Sector', 'message_received', 
'{"message": "regex:/^(1|productos|servicios|paquetes)$/i"}', 
'[
  {
    "type": "send_whatsapp",
    "params": {
      "message": "¡Excelente! Para darte la información correcta, cuéntame: ¿A qué sector pertenece tu empresa?\\n\\n*1.* 🚗 Talleres Automotrices\\n*2.* 🏥 Clínicas y Consultorios\\n*3.* ✈️ Agencias de Turismo\\n*4.* 👨‍💼 Servicios Profesionales\\n*5.* 🎓 Instituciones Educativas\\n*6.* 💅 Centros de Belleza\\n*7.* 🛠️ Servicios Técnicos\\n*8.* 🍽️ Restaurantes y Eventos\\n*9.* 🏢 Otro Sector\\n\\nResponde con el número de tu sector."
    }
  },
  {
    "type": "update_memory",
    "params": {
      "last_prompt": "profiling_sector"
    }
  }
]', 1, 10, 0, NOW(), NOW()),

-- ==========================================
-- 2.1 PERFILAMIENTO: PROBLEMA (PRIORIDAD 20)
-- ==========================================
('019f514e-7924-71b2-9861-86be43bc2d1e', 'Perfilamiento - Problema', 'message_received', 
'{"message": "regex:/^[1-9]$/", "contact.memory_last_prompt": "profiling_sector"}', 
'[
  {
    "type": "update_memory",
    "params": {
      "sector": "{message}",
      "last_prompt": "profiling_problem"
    }
  },
  {
    "type": "send_whatsapp",
    "params": {
      "message": "Entendido. ¿Cuál es el desafío principal que enfrentas en tu negocio hoy?\\n\\n*1.* ⏳ Me demoro en responder y pierdo clientes.\\n*2.* 📉 Los prospectos se enfrían por falta de seguimiento.\\n*3.* 📅 Agendar citas me consume mucho tiempo.\\n*4.* ❌ Recibo mensajes pero no logro cerrar las ventas."
    }
  }
]', 1, 20, 0, NOW(), NOW()),

-- ==========================================
-- 2.2 PERFILAMIENTO: TAMAÑO (PRIORIDAD 20)
-- ==========================================
('019f514e-7924-71b2-9861-86be43bc2d1e', 'Perfilamiento - Tamaño', 'message_received', 
'{"message": "regex:/^[1-4]$/", "contact.memory_last_prompt": "profiling_problem"}', 
'[
  {
    "type": "update_memory",
    "params": {
      "problem": "{message}",
      "last_prompt": "profiling_size"
    }
  },
  {
    "type": "send_whatsapp",
    "params": {
      "message": "Es un desafío muy común. Una última pregunta: ¿Cuántas personas atienden actualmente el WhatsApp en tu empresa?\\n\\n*1.* 👤 Solo yo\\n*2.* 👥 De 2 a 5 personas\\n*3.* 🏢 Más de 5 personas"
    }
  }
]', 1, 20, 0, NOW(), NOW()),

-- ==========================================
-- 2.3 PERFILAMIENTO: BENEFICIOS Y CTA (PRIORIDAD 20)
-- ==========================================
('019f514e-7924-71b2-9861-86be43bc2d1e', 'Perfilamiento - Beneficios', 'message_received', 
'{"message": "regex:/^[1-3]$/", "contact.memory_last_prompt": "profiling_size"}', 
'[
  {
    "type": "update_memory",
    "params": {
      "size": "{message}",
      "last_prompt": "demo_or_agent"
    }
  },
  {
    "type": "send_whatsapp",
    "params": {
      "message": "¡Perfecto! Con el *Sistema Autónomo Comercial* vas a poder automatizar tus respuestas 24/7, calificar a los clientes al instante y agendar citas sin intervención humana, aumentando tus ventas y recuperando tu tiempo libre.\\n\\n¿Qué te gustaría hacer ahora?\\n\\n*1.* 📅 Agendar una demostración gratuita de 20 min\\n*2.* 👤 Hablar con un asesor comercial"
    }
  }
]', 1, 20, 0, NOW(), NOW()),

-- ==========================================
-- 2.4 CTA: AGENDAR DESDE PERFILAMIENTO (PRIORIDAD 20)
-- ==========================================
('019f514e-7924-71b2-9861-86be43bc2d1e', 'CTA - Agendar', 'message_received', 
'{"message": "regex:/^1$/", "contact.memory_last_prompt": "demo_or_agent"}', 
'[
  {
    "type": "send_schedules",
    "params": {}
  },
  {
    "type": "update_memory",
    "params": {
      "last_prompt": "booking_flow"
    }
  }
]', 1, 20, 0, NOW(), NOW()),

-- ==========================================
-- 2.5 CTA: ASESOR DESDE PERFILAMIENTO (PRIORIDAD 20)
-- ==========================================
('019f514e-7924-71b2-9861-86be43bc2d1e', 'CTA - Asesor', 'message_received', 
'{"message": "regex:/^2$/", "contact.memory_last_prompt": "demo_or_agent"}', 
'[
  {
    "type": "assign_advisor",
    "params": {
      "user_id": "round_robin"
    }
  },
  {
    "type": "send_whatsapp",
    "params": {
      "message": "En unos momentos un asesor comercial se comunicará contigo. Por favor, mantente en línea..."
    }
  },
  {
    "type": "pause_bot",
    "params": {
      "hours": 24
    }
  },
  {
    "type": "update_memory",
    "params": {
      "last_prompt": "waiting_advisor"
    }
  }
]', 1, 20, 0, NOW(), NOW()),

-- ==========================================
-- 3. OPCIÓN 2: AGENDAR (SIN CITA ACTIVA) (PRIORIDAD 10)
-- ==========================================
('019f514e-7924-71b2-9861-86be43bc2d1e', 'Menú - Agendar (Sin Cita)', 'message_received', 
'{"message": "regex:/^(2|agendar.*)$/i", "contact.has_active_booking": false}', 
'[
  {
    "type": "send_schedules",
    "params": {}
  },
  {
    "type": "update_memory",
    "params": {
      "last_prompt": "booking_flow"
    }
  }
]', 1, 10, 0, NOW(), NOW()),

-- ==========================================
-- 4. OPCIÓN 2: AGENDAR (CON CITA ACTIVA) (PRIORIDAD 10)
-- ==========================================
('019f514e-7924-71b2-9861-86be43bc2d1e', 'Menú - Agendar (Con Cita)', 'message_received', 
'{"message": "regex:/^(2|agendar.*)$/i", "contact.has_active_booking": true}', 
'[
  {
    "type": "send_whatsapp",
    "params": {
      "message": "Veo que ya tienes una cita activa. ¿Qué deseas hacer?\\n\\n*1.* 👁️ Ver mi cita actual\\n*2.* 🔄 Reagendar cita\\n*3.* ❌ Cancelar cita\\n*4.* ➕ Crear una nueva cita adicional"
    }
  },
  {
    "type": "update_memory",
    "params": {
      "last_prompt": "manage_booking"
    }
  }
]', 1, 10, 0, NOW(), NOW()),

-- ==========================================
-- 5. SUBMENÚ GESTIÓN CITA: 1 VER (PRIORIDAD 20)
-- ==========================================
('019f514e-7924-71b2-9861-86be43bc2d1e', 'Gestión Cita - Ver', 'message_received', 
'{"message": "regex:/^(1|ver.*)$/i", "contact.memory_last_prompt": "manage_booking"}', 
'[
  {
    "type": "trigger_n8n",
    "params": {
      "action": "view_booking"
    }
  },
  {
    "type": "update_memory",
    "params": {
      "last_prompt": "main_menu"
    }
  }
]', 1, 20, 0, NOW(), NOW()),

-- ==========================================
-- 6. SUBMENÚ GESTIÓN CITA: 2 REAGENDAR (PRIORIDAD 20)
-- ==========================================
('019f514e-7924-71b2-9861-86be43bc2d1e', 'Gestión Cita - Reagendar', 'message_received', 
'{"message": "regex:/^(2|reagendar.*)$/i", "contact.memory_last_prompt": "manage_booking"}', 
'[
  {
    "type": "reschedule_booking",
    "params": {}
  },
  {
    "type": "send_whatsapp",
    "params": {
      "message": "Tu cita actual ha sido liberada. Vamos a buscar un nuevo horario para ti..."
    }
  },
  {
    "type": "send_schedules",
    "params": {}
  },
  {
    "type": "update_memory",
    "params": {
      "last_prompt": "booking_flow"
    }
  }
]', 1, 20, 0, NOW(), NOW()),

-- ==========================================
-- 7. SUBMENÚ GESTIÓN CITA: 3 CANCELAR (PRIORIDAD 20)
-- ==========================================
('019f514e-7924-71b2-9861-86be43bc2d1e', 'Gestión Cita - Cancelar', 'message_received', 
'{"message": "regex:/^(3|cancelar.*)$/i", "contact.memory_last_prompt": "manage_booking"}', 
'[
  {
    "type": "cancel_booking",
    "params": {}
  },
  {
    "type": "send_whatsapp",
    "params": {
      "message": "Tu cita ha sido cancelada exitosamente. ¡Esperamos verte pronto! Si necesitas algo más, escribe *Menu*."
    }
  },
  {
    "type": "update_memory",
    "params": {
      "last_prompt": "main_menu"
    }
  }
]', 1, 20, 0, NOW(), NOW()),

-- ==========================================
-- 8. SUBMENÚ GESTIÓN CITA: 4 NUEVA CITA (PRIORIDAD 20)
-- ==========================================
('019f514e-7924-71b2-9861-86be43bc2d1e', 'Gestión Cita - Nueva Adicional', 'message_received', 
'{"message": "regex:/^(4|nueva.*)$/i", "contact.memory_last_prompt": "manage_booking"}', 
'[
  {
    "type": "send_schedules",
    "params": {}
  },
  {
    "type": "update_memory",
    "params": {
      "last_prompt": "booking_flow"
    }
  }
]', 1, 20, 0, NOW(), NOW()),

-- ==========================================
-- 9. FLUJO DE SELECCIÓN DE FECHA (NUMÉRICO) (PRIORIDAD 30)
-- ==========================================
('019f514e-7924-71b2-9861-86be43bc2d1e', 'Gestión Cita - Procesar Selección', 'message_received', 
'{"message": "regex:/^\\d+$/", "contact.memory_last_prompt": "booking_flow"}', 
'[
  {
    "type": "process_booking",
    "params": {}
  }
]', 1, 30, 0, NOW(), NOW()),

-- ==========================================
-- 10. OPCIÓN 3: ASESOR COMERCIAL (PRIORIDAD 10)
-- ==========================================
('019f514e-7924-71b2-9861-86be43bc2d1e', 'Menú - Asesor Comercial', 'message_received', 
'{"message": "regex:/^(3|asesor.*)$/i"}', 
'[
  {
    "type": "assign_advisor",
    "params": {
      "user_id": "round_robin"
    }
  },
  {
    "type": "send_whatsapp",
    "params": {
      "message": "En unos momentos un asesor comercial se comunicará contigo. Por favor, mantente en línea..."
    }
  },
  {
    "type": "pause_bot",
    "params": {
      "hours": 24
    }
  },
  {
    "type": "update_memory",
    "params": {
      "last_prompt": "waiting_advisor"
    }
  }
]', 1, 10, 0, NOW(), NOW());
