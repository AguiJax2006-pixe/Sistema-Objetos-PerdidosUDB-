-- Ejecutar una sola vez en phpMyAdmin con permisos de administrador.
-- Añade los datos que ya solicita el formulario de registro.

ALTER TABLE usuarios
    ADD COLUMN apellido VARCHAR(100) NULL AFTER nombre,
    ADD COLUMN carnet VARCHAR(40) NULL AFTER correo,
    ADD COLUMN carrera VARCHAR(150) NULL AFTER carnet,
    ADD UNIQUE KEY uq_usuarios_carnet (carnet);

-- Corrige los privilegios para el usuario de aplicación usado en .env.
GRANT SELECT, INSERT, UPDATE, DELETE
ON backtome.*
TO 'backtome'@'localhost';
