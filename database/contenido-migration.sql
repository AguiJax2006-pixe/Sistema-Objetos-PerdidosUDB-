-- Ejecutar una sola vez en phpMyAdmin con permisos de administrador.
-- Mantiene las tablas existentes y agrega el soporte de sesión y fotos.

CREATE TABLE IF NOT EXISTS sesiones (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    usuario_id BIGINT UNSIGNED NOT NULL,
    token_hash CHAR(64) NOT NULL,
    vence_en DATETIME NOT NULL,
    creado_en TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_sesiones_token_hash (token_hash),
    KEY ix_sesiones_usuario_vence (usuario_id, vence_en),
    CONSTRAINT fk_sesiones_usuario
        FOREIGN KEY (usuario_id) REFERENCES usuarios (id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE objetos
    MODIFY COLUMN foto_url MEDIUMTEXT NULL;

