-- =============================================================================
-- ReservaUPLA - Script de inicialización (PostgreSQL)
-- Crea las tablas (equivalentes a lo que genera la migración de EF Core) y
-- carga datos de prueba para que el dashboard muestre números reales.
--
-- Cómo ejecutarlo (desde la raíz del proyecto, PowerShell):
--   psql -U postgres -d reservaupla -f database/01_init.sql
--
-- Es seguro correrlo varias veces: usa IF NOT EXISTS y ON CONFLICT DO NOTHING.
-- También sirve DESPUÉS de "dotnet ef database update": en ese caso las tablas ya
-- existen y el script solo inserta los datos de prueba.
-- NO contiene contraseñas ni datos reales.
-- =============================================================================

BEGIN;

-- ---------- usuarios (RF-01) ----------
CREATE TABLE IF NOT EXISTS usuarios (
    id               uuid          NOT NULL,
    nombre_completo  varchar(150)  NOT NULL,
    correo           varchar(150)  NOT NULL,
    rol              varchar(30)   NOT NULL,
    activo           boolean       NOT NULL,
    password_hash    text,
    CONSTRAINT "PK_usuarios" PRIMARY KEY (id),
    CONSTRAINT ck_usuarios_rol CHECK (rol IN ('Solicitante','Administrador','ResponsableAmbiente'))
);
CREATE UNIQUE INDEX IF NOT EXISTS ux_usuarios_correo ON usuarios (correo);   -- [SUPUESTO] correo único

-- ---------- ambientes (RF-02) ----------
CREATE TABLE IF NOT EXISTS ambientes (
    id         uuid          NOT NULL,
    nombre     varchar(100)  NOT NULL,
    tipo       varchar(50)   NOT NULL,
    capacidad  integer       NOT NULL,
    ubicacion  varchar(150)  NOT NULL,
    estado     varchar(20)   NOT NULL,
    CONSTRAINT "PK_ambientes" PRIMARY KEY (id),
    CONSTRAINT ck_ambientes_capacidad CHECK (capacidad > 0),
    CONSTRAINT ck_ambientes_estado CHECK (estado IN ('Disponible','Mantenimiento','Inactivo'))
);

-- ---------- reservas (RF-03) ----------
CREATE TABLE IF NOT EXISTS reservas (
    id           uuid          NOT NULL,
    fecha        date          NOT NULL,
    hora_inicio  time          NOT NULL,
    hora_fin     time          NOT NULL,
    motivo       varchar(300)  NOT NULL,
    estado       varchar(20)   NOT NULL,
    usuario_id   uuid          NOT NULL,
    ambiente_id  uuid          NOT NULL,
    CONSTRAINT "PK_reservas" PRIMARY KEY (id),
    CONSTRAINT "FK_reservas_usuarios_usuario_id"   FOREIGN KEY (usuario_id)  REFERENCES usuarios (id)  ON DELETE RESTRICT,
    CONSTRAINT "FK_reservas_ambientes_ambiente_id" FOREIGN KEY (ambiente_id) REFERENCES ambientes (id) ON DELETE RESTRICT,
    CONSTRAINT ck_reservas_hora_fin CHECK (hora_fin > hora_inicio),                                        -- RN-03
    CONSTRAINT ck_reservas_horario_permitido CHECK (hora_inicio >= TIME '07:00' AND hora_fin <= TIME '22:00'), -- RN-04
    CONSTRAINT ck_reservas_estado CHECK (estado IN ('Pendiente','Aprobada','Rechazada','Cancelada'))
);
CREATE INDEX IF NOT EXISTS ix_reservas_ambiente_fecha_estado ON reservas (ambiente_id, fecha, estado);
CREATE INDEX IF NOT EXISTS "IX_reservas_usuario_id" ON reservas (usuario_id);

-- -----------------------------------------------------------------------------
-- OPCIONAL (refuerzo de RN-01 en la base de datos, descomentar si quieres):
-- impide a nivel de BD dos reservas Aprobadas que se crucen en el mismo ambiente.
-- Requiere la extensión btree_gist. La regla ya se valida en el backend; esto es un seguro extra.
--
-- CREATE EXTENSION IF NOT EXISTS btree_gist;
-- ALTER TABLE reservas ADD CONSTRAINT ex_reservas_sin_solapamiento
--   EXCLUDE USING gist (ambiente_id WITH =, tsrange(fecha + hora_inicio, fecha + hora_fin) WITH &&)
--   WHERE (estado = 'Aprobada');
-- -----------------------------------------------------------------------------

-- =============================================================================
-- DATOS DE PRUEBA (seed) - ids fijos para poder repetir el script sin duplicar
-- =============================================================================

INSERT INTO usuarios (id, nombre_completo, correo, rol, activo) VALUES
 ('10000000-0000-0000-0000-000000000001', 'Marta Quispe',                     'marta.quispe@ejemplo.edu.pe',  'Administrador',       true),
 ('10000000-0000-0000-0000-000000000002', 'Ana Torres',                    'ana.torres@ejemplo.edu.pe',    'Solicitante',         true),
 ('10000000-0000-0000-0000-000000000003', 'Luis Rojas',                    'luis.rojas@ejemplo.edu.pe',    'Solicitante',         true),
 ('10000000-0000-0000-0000-000000000004', 'Carlos Huamán',                 'carlos.huaman@ejemplo.edu.pe', 'ResponsableAmbiente', true),
 ('10000000-0000-0000-0000-000000000005', 'Pedro Salas',                   'pedro.salas@ejemplo.edu.pe',   'Solicitante',         false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO ambientes (id, nombre, tipo, capacidad, ubicacion, estado) VALUES
 ('20000000-0000-0000-0000-000000000001', 'Aula 101',                 'Aula',        40,  'Pabellón A, piso 1', 'Disponible'),
 ('20000000-0000-0000-0000-000000000002', 'Laboratorio de Cómputo 1', 'Laboratorio', 30,  'Pabellón B, piso 2', 'Disponible'),
 ('20000000-0000-0000-0000-000000000003', 'Auditorio Central',        'Auditorio',   200, 'Edificio principal',  'Disponible'),
 ('20000000-0000-0000-0000-000000000004', 'Sala de Reuniones 2',      'Sala',        12,  'Pabellón C, piso 3', 'Mantenimiento')
ON CONFLICT (id) DO NOTHING;

-- Fechas relativas a HOY para que siempre se vean reservas "próximas".
-- Resultado esperado en el dashboard: Total 11 | Aprobadas 6 | Pendientes 2 | Rechazadas 2 | (1 Cancelada)
-- Ambiente más utilizado: Aula 101 (3 reservas Aprobadas).
INSERT INTO reservas (id, fecha, hora_inicio, hora_fin, motivo, estado, usuario_id, ambiente_id) VALUES
 ('30000000-0000-0000-0000-000000000001', CURRENT_DATE + 1, TIME '08:00', TIME '10:00', 'Clase de Matemática I',          'Aprobada',  '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001'),
 ('30000000-0000-0000-0000-000000000002', CURRENT_DATE + 1, TIME '10:00', TIME '12:00', 'Asesoría de tesis',              'Aprobada',  '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001'),
 ('30000000-0000-0000-0000-000000000003', CURRENT_DATE + 1, TIME '14:00', TIME '16:00', 'Práctica de programación',       'Aprobada',  '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002'),
 ('30000000-0000-0000-0000-000000000004', CURRENT_DATE + 2, TIME '09:00', TIME '11:00', 'Taller de bases de datos',       'Pendiente', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002'),
 ('30000000-0000-0000-0000-000000000005', CURRENT_DATE + 3, TIME '18:00', TIME '21:00', 'Conferencia de bienvenida',      'Aprobada',  '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003'),
 ('30000000-0000-0000-0000-000000000006', CURRENT_DATE + 2, TIME '07:00', TIME '09:00', 'Reunión de delegados',           'Rechazada', '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001'),
 ('30000000-0000-0000-0000-000000000007', CURRENT_DATE + 4, TIME '10:00', TIME '12:00', 'Charla de egresados',            'Cancelada', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003'),
 ('30000000-0000-0000-0000-000000000008', CURRENT_DATE + 1, TIME '08:00', TIME '10:00', 'Examen de Programación',         'Aprobada',  '10000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000002'),
 ('30000000-0000-0000-0000-000000000009', CURRENT_DATE + 5, TIME '15:00', TIME '17:00', 'Clase de Estadística',           'Aprobada',  '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000001'),
 ('30000000-0000-0000-0000-000000000010', CURRENT_DATE + 3, TIME '16:00', TIME '18:00', 'Evento no autorizado',           'Rechazada', '10000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000002'),
 ('30000000-0000-0000-0000-000000000011', CURRENT_DATE + 6, TIME '09:00', TIME '11:00', 'Feria de proyectos',             'Pendiente', '10000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000003')
ON CONFLICT (id) DO NOTHING;

COMMIT;

-- Comprobación rápida (opcional):
-- SELECT estado, COUNT(*) FROM reservas GROUP BY estado ORDER BY estado;
