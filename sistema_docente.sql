-- =============================================================
-- Sistema de información docente – Jefatura de Investigación ITC
-- Base de datos (MySQL / MariaDB)
-- Ejecutar completo: crea la base, las tablas, las vistas y los catálogos iniciales.
-- =============================================================

DROP DATABASE IF EXISTS sistema_docente;
CREATE DATABASE sistema_docente CHARACTER SET utf8mb4 COLLATE utf8mb4_spanish_ci;
USE sistema_docente;

-- -------------------------------------------------------------
-- 1. Catálogos (V23)
-- -------------------------------------------------------------
CREATE TABLE rol (
  id_rol      INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE jefatura (
  id_jefatura INT AUTO_INCREMENT PRIMARY KEY,
  nombre      VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE departamento (
  id_departamento INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE carrera (
  id_carrera      INT AUTO_INCREMENT PRIMARY KEY,
  nombre          VARCHAR(100) NOT NULL UNIQUE,
  id_departamento INT NOT NULL,
  FOREIGN KEY (id_departamento) REFERENCES departamento(id_departamento)
);

CREATE TABLE categoria (
  id_categoria INT AUTO_INCREMENT PRIMARY KEY,
  nombre       VARCHAR(100) NOT NULL UNIQUE
);

CREATE TABLE tipo_articulo (
  id_tipo_articulo INT AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(50) NOT NULL UNIQUE
);

-- -------------------------------------------------------------
-- 2. Perfil del profesor
-- -------------------------------------------------------------
-- V4 Datos generales. La edad no se guarda: se calcula en la vista v_profesor.
CREATE TABLE profesor (
  id_profesor      INT AUTO_INCREMENT PRIMARY KEY,
  nombre           VARCHAR(80)  NOT NULL,
  apellido_paterno VARCHAR(60)  NOT NULL,
  apellido_materno VARCHAR(60),
  sexo             ENUM('Mujer','Hombre') NOT NULL,
  fecha_nacimiento DATE,
  correo           VARCHAR(120) NOT NULL UNIQUE,
  id_departamento  INT NOT NULL,
  id_carrera       INT,
  FOREIGN KEY (id_departamento) REFERENCES departamento(id_departamento),
  FOREIGN KEY (id_carrera)      REFERENCES carrera(id_carrera)
);

-- -------------------------------------------------------------
-- 3. Acceso (V1, V22)
-- -------------------------------------------------------------
-- id_profesor: solo para rol Profesor.
-- id_jefatura: para Jefatura de Investigación / Docencia.
-- id_departamento: para Jefe de Departamento (solo ve su departamento).
CREATE TABLE usuario (
  id_usuario      INT AUTO_INCREMENT PRIMARY KEY,
  correo          VARCHAR(120) NOT NULL UNIQUE,
  contrasena_hash VARCHAR(255) NOT NULL,          -- guardar con password_hash(), nunca en texto plano
  id_rol          INT NOT NULL,
  id_profesor     INT UNIQUE,
  id_jefatura     INT,
  id_departamento INT,
  activo          BOOLEAN NOT NULL DEFAULT TRUE,
  fecha_alta      DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (id_rol)          REFERENCES rol(id_rol),
  FOREIGN KEY (id_profesor)     REFERENCES profesor(id_profesor) ON DELETE CASCADE,
  FOREIGN KEY (id_jefatura)     REFERENCES jefatura(id_jefatura),
  FOREIGN KEY (id_departamento) REFERENCES departamento(id_departamento)
);

-- -------------------------------------------------------------
-- 4. Evidencias (V15, V20, V21)
-- Cada PDF que sube el profesor es un registro aquí.
-- Los apartados del perfil apuntan a su documento con id_documento.
-- -------------------------------------------------------------
CREATE TABLE documento (
  id_documento   INT AUTO_INCREMENT PRIMARY KEY,
  id_profesor    INT NOT NULL,
  apartado       ENUM('nombramiento','formacion','capacitacion','actualizacion','gestion',
                      'articulo','experiencia','logro','asociacion','sni','prodep','proyecto') NOT NULL,
  nombre_archivo VARCHAR(255) NOT NULL,
  ruta           VARCHAR(500) NOT NULL,            -- ruta del PDF en el servidor
  estado         ENUM('pendiente','validado','rechazado') NOT NULL DEFAULT 'pendiente',
  fecha_carga    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  id_validador   INT,                              -- usuario de jefatura que lo revisó
  fecha_revision DATETIME,
  observaciones  TEXT,                             -- motivo del rechazo
  FOREIGN KEY (id_profesor)  REFERENCES profesor(id_profesor) ON DELETE CASCADE,
  FOREIGN KEY (id_validador) REFERENCES usuario(id_usuario),
  CHECK (ruta LIKE '%.pdf')
);

-- V5 Nombramiento actual (uno por profesor)
CREATE TABLE nombramiento (
  id_nombramiento INT AUTO_INCREMENT PRIMARY KEY,
  id_profesor     INT NOT NULL UNIQUE,
  plaza           VARCHAR(100) NOT NULL,
  id_categoria    INT NOT NULL,
  antiguedad      TINYINT UNSIGNED NOT NULL,       -- años
  id_documento    INT,
  FOREIGN KEY (id_profesor)  REFERENCES profesor(id_profesor) ON DELETE CASCADE,
  FOREIGN KEY (id_categoria) REFERENCES categoria(id_categoria),
  FOREIGN KEY (id_documento) REFERENCES documento(id_documento) ON DELETE SET NULL
);

-- V6 Formación académica
CREATE TABLE formacion_academica (
  id_formacion INT AUTO_INCREMENT PRIMARY KEY,
  id_profesor  INT NOT NULL,
  grado        ENUM('Licenciatura','Maestría','Doctorado') NOT NULL,
  institucion  VARCHAR(150) NOT NULL,
  anio         YEAR NOT NULL,
  titulado     BOOLEAN NOT NULL,
  id_documento INT,
  FOREIGN KEY (id_profesor)  REFERENCES profesor(id_profesor) ON DELETE CASCADE,
  FOREIGN KEY (id_documento) REFERENCES documento(id_documento) ON DELETE SET NULL
);

-- V7 Capacitación docente
CREATE TABLE capacitacion (
  id_capacitacion INT AUTO_INCREMENT PRIMARY KEY,
  id_profesor     INT NOT NULL,
  curso           VARCHAR(150) NOT NULL,
  institucion     VARCHAR(150) NOT NULL,
  fecha           DATE NOT NULL,
  horas           SMALLINT UNSIGNED NOT NULL,
  id_documento    INT,
  FOREIGN KEY (id_profesor)  REFERENCES profesor(id_profesor) ON DELETE CASCADE,
  FOREIGN KEY (id_documento) REFERENCES documento(id_documento) ON DELETE SET NULL
);

-- V8 Actualización disciplinar (mismos campos que V7)
CREATE TABLE actualizacion_disciplinar (
  id_actualizacion INT AUTO_INCREMENT PRIMARY KEY,
  id_profesor      INT NOT NULL,
  curso            VARCHAR(150) NOT NULL,
  institucion      VARCHAR(150) NOT NULL,
  fecha            DATE NOT NULL,
  horas            SMALLINT UNSIGNED NOT NULL,
  id_documento     INT,
  FOREIGN KEY (id_profesor)  REFERENCES profesor(id_profesor) ON DELETE CASCADE,
  FOREIGN KEY (id_documento) REFERENCES documento(id_documento) ON DELETE SET NULL
);

-- V9 Gestión académica
CREATE TABLE gestion_academica (
  id_gestion   INT AUTO_INCREMENT PRIMARY KEY,
  id_profesor  INT NOT NULL,
  cargo        VARCHAR(150) NOT NULL,
  periodo      VARCHAR(50)  NOT NULL,
  id_documento INT,
  FOREIGN KEY (id_profesor)  REFERENCES profesor(id_profesor) ON DELETE CASCADE,
  FOREIGN KEY (id_documento) REFERENCES documento(id_documento) ON DELETE SET NULL
);

-- V10 Productos académicos (artículos)
CREATE TABLE articulo (
  id_articulo      INT AUTO_INCREMENT PRIMARY KEY,
  id_profesor      INT NOT NULL,
  titulo           VARCHAR(255) NOT NULL,
  revista          VARCHAR(150) NOT NULL,
  anio             YEAR NOT NULL,
  id_tipo_articulo INT NOT NULL,
  id_documento     INT,
  FOREIGN KEY (id_profesor)      REFERENCES profesor(id_profesor) ON DELETE CASCADE,
  FOREIGN KEY (id_tipo_articulo) REFERENCES tipo_articulo(id_tipo_articulo),
  FOREIGN KEY (id_documento)     REFERENCES documento(id_documento) ON DELETE SET NULL
);

-- V11 Experiencia profesional no académica
CREATE TABLE experiencia_profesional (
  id_experiencia INT AUTO_INCREMENT PRIMARY KEY,
  id_profesor    INT NOT NULL,
  empresa        VARCHAR(150) NOT NULL,
  puesto         VARCHAR(100) NOT NULL,
  periodo        VARCHAR(50)  NOT NULL,
  id_documento   INT,
  FOREIGN KEY (id_profesor)  REFERENCES profesor(id_profesor) ON DELETE CASCADE,
  FOREIGN KEY (id_documento) REFERENCES documento(id_documento) ON DELETE SET NULL
);

-- V12 Logros profesionales no académicos
CREATE TABLE logro (
  id_logro     INT AUTO_INCREMENT PRIMARY KEY,
  id_profesor  INT NOT NULL,
  descripcion  VARCHAR(255) NOT NULL,
  fecha        DATE NOT NULL,
  id_documento INT,
  FOREIGN KEY (id_profesor)  REFERENCES profesor(id_profesor) ON DELETE CASCADE,
  FOREIGN KEY (id_documento) REFERENCES documento(id_documento) ON DELETE SET NULL
);

-- V13 Colegios, cámaras y asociaciones
CREATE TABLE participacion_asociacion (
  id_participacion INT AUTO_INCREMENT PRIMARY KEY,
  id_profesor      INT NOT NULL,
  organizacion     VARCHAR(150) NOT NULL,
  tipo             VARCHAR(100) NOT NULL,
  periodo          VARCHAR(50)  NOT NULL,
  id_documento     INT,
  FOREIGN KEY (id_profesor)  REFERENCES profesor(id_profesor) ON DELETE CASCADE,
  FOREIGN KEY (id_documento) REFERENCES documento(id_documento) ON DELETE SET NULL
);

-- -------------------------------------------------------------
-- 5. Indicadores (V14)
-- Si el profesor contesta "No", simplemente no tiene registro.
-- -------------------------------------------------------------
CREATE TABLE indicador_sni (
  id_sni          INT AUTO_INCREMENT PRIMARY KEY,
  id_profesor     INT NOT NULL,
  nivel           ENUM('Candidato','Nivel I','Nivel II','Nivel III','Emérito') NOT NULL,
  vigencia_inicio DATE NOT NULL,
  vigencia_fin    DATE NOT NULL,
  id_documento    INT,
  FOREIGN KEY (id_profesor)  REFERENCES profesor(id_profesor) ON DELETE CASCADE,
  FOREIGN KEY (id_documento) REFERENCES documento(id_documento) ON DELETE SET NULL,
  CHECK (vigencia_fin > vigencia_inicio)
);

CREATE TABLE indicador_prodep (
  id_prodep       INT AUTO_INCREMENT PRIMARY KEY,
  id_profesor     INT NOT NULL,
  vigencia_inicio DATE NOT NULL,
  vigencia_fin    DATE NOT NULL,
  id_documento    INT,
  FOREIGN KEY (id_profesor)  REFERENCES profesor(id_profesor) ON DELETE CASCADE,
  FOREIGN KEY (id_documento) REFERENCES documento(id_documento) ON DELETE SET NULL,
  CHECK (vigencia_fin > vigencia_inicio)
);

CREATE TABLE proyecto_tecnm (
  id_proyecto INT AUTO_INCREMENT PRIMARY KEY,
  id_profesor INT NOT NULL,
  nombre      VARCHAR(255) NOT NULL,
  clave       VARCHAR(50)  NOT NULL,
  FOREIGN KEY (id_profesor) REFERENCES profesor(id_profesor) ON DELETE CASCADE
);

-- El proyecto TecNM puede tener varios PDF
CREATE TABLE proyecto_documento (
  id_proyecto  INT NOT NULL,
  id_documento INT NOT NULL,
  PRIMARY KEY (id_proyecto, id_documento),
  FOREIGN KEY (id_proyecto)  REFERENCES proyecto_tecnm(id_proyecto) ON DELETE CASCADE,
  FOREIGN KEY (id_documento) REFERENCES documento(id_documento) ON DELETE CASCADE
);

-- -------------------------------------------------------------
-- 6. Regla: los documentos validados no se pueden editar
-- -------------------------------------------------------------
DELIMITER //
CREATE TRIGGER trg_documento_bloqueado
BEFORE UPDATE ON documento
FOR EACH ROW
BEGIN
  IF OLD.estado = 'validado'
     AND (NEW.ruta <> OLD.ruta OR NEW.nombre_archivo <> OLD.nombre_archivo OR NEW.apartado <> OLD.apartado) THEN
    SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'El documento ya fue validado y no se puede modificar';
  END IF;
END//
DELIMITER ;

-- -------------------------------------------------------------
-- 7. Vistas para la jefatura (V16, V17, V19)
-- -------------------------------------------------------------
-- Profesor con edad calculada y grado máximo
CREATE VIEW v_profesor AS
SELECT p.id_profesor,
       CONCAT_WS(' ', p.nombre, p.apellido_paterno, p.apellido_materno) AS nombre_completo,
       p.sexo,
       p.fecha_nacimiento,
       TIMESTAMPDIFF(YEAR, p.fecha_nacimiento, CURDATE()) AS edad,
       p.correo,
       d.nombre AS departamento,
       c.nombre AS carrera,
       COALESCE((SELECT ELT(MAX(f.grado + 0), 'Licenciatura', 'Maestría', 'Doctorado') FROM formacion_academica f WHERE f.id_profesor = p.id_profesor),
                'Sin registro') AS grado_maximo
FROM profesor p
JOIN departamento d ON d.id_departamento = p.id_departamento
LEFT JOIN carrera c ON c.id_carrera = p.id_carrera;

-- Tabla de consulta: una fila por profesor con sus indicadores (V17)
CREATE VIEW v_indicadores AS
SELECT v.id_profesor, v.nombre_completo, v.sexo, v.departamento, v.carrera, v.grado_maximo,
       cat.nombre AS categoria,
       (SELECT MAX(s.vigencia_fin) FROM indicador_sni s WHERE s.id_profesor = v.id_profesor) AS sni_vigencia,
       EXISTS(SELECT 1 FROM indicador_sni s WHERE s.id_profesor = v.id_profesor
              AND CURDATE() BETWEEN s.vigencia_inicio AND s.vigencia_fin) AS sni_vigente,
       (SELECT MAX(r.vigencia_fin) FROM indicador_prodep r WHERE r.id_profesor = v.id_profesor) AS prodep_vigencia,
       EXISTS(SELECT 1 FROM indicador_prodep r WHERE r.id_profesor = v.id_profesor
              AND CURDATE() BETWEEN r.vigencia_inicio AND r.vigencia_fin) AS prodep_vigente,
       EXISTS(SELECT 1 FROM proyecto_tecnm t WHERE t.id_profesor = v.id_profesor) AS tiene_proyecto,
       (SELECT COUNT(*) FROM articulo a WHERE a.id_profesor = v.id_profesor
              AND a.anio >= YEAR(CURDATE()) - 5) AS articulos_5_anios
FROM v_profesor v
LEFT JOIN nombramiento n ON n.id_profesor = v.id_profesor
LEFT JOIN categoria cat  ON cat.id_categoria = n.id_categoria;

-- Documentos pendientes de validar (V20)
CREATE VIEW v_documentos_pendientes AS
SELECT doc.id_documento, v.nombre_completo AS profesor, v.departamento,
       doc.apartado, doc.nombre_archivo, doc.fecha_carga
FROM documento doc
JOIN v_profesor v ON v.id_profesor = doc.id_profesor
WHERE doc.estado = 'pendiente'
ORDER BY doc.fecha_carga;

-- Vigencias que vencen en los próximos 6 meses (alertas del V3)
CREATE VIEW v_vigencias_por_vencer AS
SELECT id_profesor, 'SNI' AS indicador, vigencia_fin FROM indicador_sni
WHERE vigencia_fin BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 MONTH)
UNION ALL
SELECT id_profesor, 'PRODEP', vigencia_fin FROM indicador_prodep
WHERE vigencia_fin BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 6 MONTH);

-- -------------------------------------------------------------
-- 8. Datos iniciales de catálogos
-- (Departamentos y carreras son de ejemplo: reemplazar con los reales)
-- -------------------------------------------------------------
INSERT INTO rol (nombre) VALUES
 ('Profesor'), ('Jefatura de Investigación'), ('Jefatura de Docencia'),
 ('Jefe de Departamento'), ('Administrador');

INSERT INTO jefatura (nombre) VALUES ('Investigación'), ('Docencia');

INSERT INTO departamento (nombre) VALUES
 ('Sistemas y Computación'), ('Ingeniería Industrial'), ('Ciencias Básicas');

INSERT INTO carrera (nombre, id_departamento) VALUES
 ('Ing. en Sistemas Computacionales', 1),
 ('Ing. Industrial', 2),
 ('Ing. en Gestión Empresarial', 2);

INSERT INTO tipo_articulo (nombre) VALUES ('Divulgación'), ('Difusión'), ('JCR');
