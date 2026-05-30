-- Script de Creación del Flujo Conversacional VISUAL Dinámico para SAC
-- Tenant ID: 019f514e-7924-71b2-9861-86be43bc2d1e

-- Eliminar automations antiguas para evitar conflictos
DELETE FROM `automations` WHERE `tenant_id` = '019e7529-c948-72a9-a3d1-ab645dc2fd8d' AND `event_type` = 'message_received' AND `name` != 'Gestión Cita - Procesar Selección';
-- IMPORTANTE: No borramos el "Procesar Selección" porque el AutomationEngine lo usará para capturar el número (1, 2, 3...) y crear la cita en la base de datos después de mostrar {schedules_list}.

-- Eliminar flujos visuales previos si existen para este tenant
DELETE FROM `visual_flows` WHERE `tenant_id` = '019e7529-c948-72a9-a3d1-ab645dc2fd8d';

-- Insertar el nuevo flujo visual basado en nodos y variables dinámicas
INSERT INTO `visual_flows` (`tenant_id`, `name`, `description`, `is_active`, `flow_data`, `created_at`, `updated_at`) VALUES 
('019e7529-c948-72a9-a3d1-ab645dc2fd8d', 'Flujo SAC Dinámico (React Flow)', 'Flujo principal usando variables como {products_list} y {schedules_list}.', 1, 
'{
  "nodes": [
    {
      "id": "trig_menu",
      "type": "trigger",
      "position": { "x": 100, "y": 100 },
      "data": {
        "label": "Disparador: Menú Principal",
        "isValid": true,
        "output": [
          {
            "reply_type_text": "Cuando el mensaje contiene",
            "reply_type": "2",
            "rel_type": "customer",
            "trigger": "hola,menu,informacion,info,empezar"
          }
        ]
      }
    },
    {
      "id": "msg_menu",
      "type": "textMessage",
      "position": { "x": 500, "y": 100 },
      "data": {
        "label": "Enviar Menú",
        "isValid": true,
        "output": [
          {
            "reply_text": "¡Hola {contact.name}! ¿En qué puedo ayudarte hoy?\\n\\n*1.* 📦 Ver Productos y Servicios\\n*2.* 📅 Agendar Cita\\n*3.* 👤 Hablar con un Asesor\\n\\nResponde con la palabra clave de lo que deseas (ej. *productos*, *agendar*, *asesor*)"
          }
        ]
      }
    },
    {
      "id": "trig_productos",
      "type": "trigger",
      "position": { "x": 100, "y": 300 },
      "data": {
        "label": "Disparador: Productos",
        "isValid": true,
        "output": [
          {
            "reply_type_text": "Cuando el mensaje contiene",
            "reply_type": "2",
            "rel_type": "customer",
            "trigger": "1,productos,servicios,paquetes"
          }
        ]
      }
    },
    {
      "id": "msg_productos",
      "type": "textMessage",
      "position": { "x": 500, "y": 300 },
      "data": {
        "label": "Mostrar Catálogo",
        "isValid": true,
        "output": [
          {
            "reply_text": "Estos son nuestros servicios disponibles actualizados en tiempo real:\\n\\n{products_list}\\n\\nEscribe *agendar* si deseas reservar un espacio para alguno de estos servicios."
          }
        ]
      }
    },
    {
      "id": "trig_agendar",
      "type": "trigger",
      "position": { "x": 100, "y": 500 },
      "data": {
        "label": "Disparador: Agendar Cita",
        "isValid": true,
        "output": [
          {
            "reply_type_text": "Cuando el mensaje contiene",
            "reply_type": "2",
            "rel_type": "customer",
            "trigger": "2,agendar,cita,reserva"
          }
        ]
      }
    },
    {
      "id": "msg_agendar",
      "type": "textMessage",
      "position": { "x": 500, "y": 500 },
      "data": {
        "label": "Mostrar Horarios",
        "isValid": true,
        "output": [
          {
            "reply_text": "¡Claro que sí! Aquí tienes nuestros horarios disponibles para los próximos días:\\n\\n{schedules_list}\\n\\n👉 Responde *únicamente con el número* de la opción que prefieres."
          }
        ]
      }
    },
    {
      "id": "trig_asesor",
      "type": "trigger",
      "position": { "x": 100, "y": 700 },
      "data": {
        "label": "Disparador: Asesor",
        "isValid": true,
        "output": [
          {
            "reply_type_text": "Cuando el mensaje contiene",
            "reply_type": "2",
            "rel_type": "customer",
            "trigger": "3,asesor,humano,hablar"
          }
        ]
      }
    },
    {
      "id": "msg_asesor",
      "type": "textMessage",
      "position": { "x": 500, "y": 700 },
      "data": {
        "label": "Transferir Asesor",
        "isValid": true,
        "output": [
          {
            "reply_text": "En unos momentos un asesor comercial se comunicará contigo {contact.name}. Por favor, mantente en línea..."
          }
        ]
      }
    }
  ],
  "edges": [
    { "id": "e_menu", "source": "trig_menu", "target": "msg_menu" },
    { "id": "e_prod", "source": "trig_productos", "target": "msg_productos" },
    { "id": "e_age", "source": "trig_agendar", "target": "msg_agendar" },
    { "id": "e_ase", "source": "trig_asesor", "target": "msg_asesor" }
  ]
}', NOW(), NOW());
