-- Script SQL para insertar Producto, Recurso y Horarios genéricos
-- Tenant ID: 019f514e-7924-71b2-9861-86be43bc2d1e
-- Base de datos: sac

START TRANSACTION;

-- 1. Insertar Producto Genérico (Servicio de Demo)
-- Usamos ID 100 de forma fija para evitar colisiones
INSERT INTO `products` (`id`, `tenant_id`, `name`, `description`, `price`, `duration_minutes`, `repurchase_frequency_days`, `tags`, `is_featured`, `status`, `created_at`, `updated_at`)
VALUES (
    100,
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'Demo Comercial de 20 Minutos',
    'Sesión de demostración guiada del Sistema Autónomo Comercial.',
    0.00,
    20,
    NULL,
    '["demo", "sac"]',
    1,
    'active',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- 2. Insertar Recurso Genérico (Asesor Comercial de pruebas)
-- Usamos ID 100 de forma fija
INSERT INTO `resources` (`id`, `tenant_id`, `name`, `type`, `description`, `capacity`, `is_active`, `metadata`, `created_at`, `updated_at`)
VALUES (
    100,
    '019f514e-7924-71b2-9861-86be43bc2d1e',
    'Asesor Comercial Virtual',
    'person',
    'Asesor virtual para demostraciones del SAC.',
    1,
    1,
    '{"whatsapp":"+573000000001"}',
    NOW(),
    NOW()
) ON DUPLICATE KEY UPDATE `name` = VALUES(`name`);

-- Limpiar horarios anteriores del recurso de prueba
DELETE FROM `resource_schedules` WHERE `resource_id` = 100 AND `tenant_id` = '019f514e-7924-71b2-9861-86be43bc2d1e';

-- 3. Insertar horarios semanales (Lunes a Viernes de 09:00 a 18:00)
-- day_of_week: 1 = Lunes, 2 = Martes, 3 = Miércoles, 4 = Jueves, 5 = Viernes
INSERT INTO `resource_schedules` (`resource_id`, `tenant_id`, `day_of_week`, `start_time`, `end_time`, `is_active`)
VALUES 
(100, '019f514e-7924-71b2-9861-86be43bc2d1e', 1, '09:00:00', '18:00:00', 1),
(100, '019f514e-7924-71b2-9861-86be43bc2d1e', 2, '09:00:00', '18:00:00', 1),
(100, '019f514e-7924-71b2-9861-86be43bc2d1e', 3, '09:00:00', '18:00:00', 1),
(100, '019f514e-7924-71b2-9861-86be43bc2d1e', 4, '09:00:00', '18:00:00', 1),
(100, '019f514e-7924-71b2-9861-86be43bc2d1e', 5, '09:00:00', '18:00:00', 1);

COMMIT;
