-- ── Employees: separar apellidos, agregar campos nuevos ──────────────────────
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS apellido_paterno TEXT,
  ADD COLUMN IF NOT EXISTS apellido_materno TEXT,
  ADD COLUMN IF NOT EXISTS numero_empleado VARCHAR(20),
  ADD COLUMN IF NOT EXISTS genero TEXT,
  ADD COLUMN IF NOT EXISTS generacion TEXT,
  ADD COLUMN IF NOT EXISTS rfc VARCHAR(13),
  ADD COLUMN IF NOT EXISTS curp VARCHAR(18);

-- Migrar apellidos existentes a apellido_paterno (primer palabra)
UPDATE employees 
SET apellido_paterno = split_part(apellidos, ' ', 1),
    apellido_materno = NULLIF(split_part(apellidos, ' ', 2), '')
WHERE apellido_paterno IS NULL AND apellidos IS NOT NULL;

-- ── Companies: campos adicionales NOM-035 ────────────────────────────────────
ALTER TABLE companies
  ADD COLUMN IF NOT EXISTS numero_registro_imss VARCHAR(20),
  ADD COLUMN IF NOT EXISTS repse_registro TEXT,
  ADD COLUMN IF NOT EXISTS constancia_fiscal_url TEXT,
  ADD COLUMN IF NOT EXISTS repse_documento_url TEXT,
  ADD COLUMN IF NOT EXISTS mercadopago_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- ── Expediente de trabajadores en riesgo ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS expedientes (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  evaluation_id INTEGER,
  nivel_riesgo TEXT NOT NULL DEFAULT 'medio',
  estado TEXT NOT NULL DEFAULT 'abierto',
  -- Estados: abierto | en_seguimiento | canalizacion | cerrado
  fecha_apertura TIMESTAMP NOT NULL DEFAULT NOW(),
  fecha_cierre TIMESTAMP,
  motivo_apertura TEXT NOT NULL,
  resumen TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- ── Citas y seguimientos del expediente ──────────────────────────────────────
CREATE TABLE IF NOT EXISTS expediente_citas (
  id SERIAL PRIMARY KEY,
  expediente_id INTEGER NOT NULL REFERENCES expedientes(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL DEFAULT 'seguimiento',
  -- Tipos: seguimiento | canalizacion | evaluacion_medica | intervencion | cierre
  fecha_cita TIMESTAMP NOT NULL,
  responsable TEXT NOT NULL,
  notas TEXT,
  resultado TEXT,
  proxima_cita TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── Documentos/evidencias del expediente ─────────────────────────────────────
CREATE TABLE IF NOT EXISTS expediente_documentos (
  id SERIAL PRIMARY KEY,
  expediente_id INTEGER NOT NULL REFERENCES expedientes(id) ON DELETE CASCADE,
  nombre TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'evidencia',
  -- Tipos: evidencia | consentimiento | diagnostico | derivacion | cierre
  url TEXT NOT NULL,
  tamanio_bytes INTEGER,
  uploaded_by TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

-- ── Índices para búsquedas frecuentes ────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_expedientes_company ON expedientes(company_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_employee ON expedientes(employee_id);
CREATE INDEX IF NOT EXISTS idx_expedientes_estado ON expedientes(estado);
CREATE INDEX IF NOT EXISTS idx_expediente_citas_exp ON expediente_citas(expediente_id);
CREATE INDEX IF NOT EXISTS idx_expediente_docs_exp ON expediente_documentos(expediente_id);

-- ── Documentos normativos NOM-035 por empresa ─────────────────────────────────
CREATE TABLE IF NOT EXISTS documentos_normativos (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  -- Tipos: politica_prevencion | programa_intervencion | acta_difusion |
  --        constancia_capacitacion | acta_comision | resultado_evaluacion | medidas_control
  nombre TEXT NOT NULL,
  url TEXT NOT NULL,
  tamanio_bytes INTEGER,
  subido_por TEXT,
  version INTEGER DEFAULT 1,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_docs_normativos_company ON documentos_normativos(company_id);
CREATE INDEX IF NOT EXISTS idx_docs_normativos_tipo ON documentos_normativos(tipo);
-- ── 1. Exámenes médicos en expediente ────────────────────────────────────────
ALTER TABLE expediente_citas
  ADD COLUMN IF NOT EXISTS tipo_examen TEXT,
  ADD COLUMN IF NOT EXISTS medico_responsable TEXT,
  ADD COLUMN IF NOT EXISTS institucion TEXT,
  ADD COLUMN IF NOT EXISTS resultado_medico TEXT,
  ADD COLUMN IF NOT EXISTS requiere_seguimiento BOOLEAN DEFAULT FALSE;

-- ── 2. Calendario de vencimientos NOM-035 ────────────────────────────────────
CREATE TABLE IF NOT EXISTS calendario_nom035 (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  tipo TEXT NOT NULL,
  -- tipos: evaluacion_anual | evaluacion_bianual | renovacion_politica |
  --        capacitacion | difusion | revision_programa
  descripcion TEXT NOT NULL,
  fecha_ultima TIMESTAMP,
  fecha_vencimiento TIMESTAMP NOT NULL,
  estado TEXT DEFAULT 'pendiente',
  -- estados: al_dia | proximo | vencido | pendiente
  numero_trabajadores INTEGER,
  notas TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_calendario_company ON calendario_nom035(company_id);
CREATE INDEX IF NOT EXISTS idx_calendario_vencimiento ON calendario_nom035(fecha_vencimiento);

-- ── 3. Canal de denuncias ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS denuncias (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  folio TEXT NOT NULL UNIQUE,
  tipo TEXT NOT NULL,
  -- tipos: violencia_laboral | acoso | discriminacion | factor_riesgo | otro
  descripcion TEXT NOT NULL,
  area_involucrada TEXT,
  fecha_ocurrencia DATE,
  anonima BOOLEAN DEFAULT TRUE,
  nombre_denunciante TEXT,       -- NULL si es anónima
  email_denunciante TEXT,        -- NULL si es anónima, para dar seguimiento
  estado TEXT DEFAULT 'recibida',
  -- estados: recibida | en_investigacion | resuelta | cerrada
  resolucion TEXT,
  fecha_resolucion TIMESTAMP,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_denuncias_company ON denuncias(company_id);
CREATE INDEX IF NOT EXISTS idx_denuncias_estado ON denuncias(estado);

-- ── 4. Constancias de difusión individual ────────────────────────────────────
CREATE TABLE IF NOT EXISTS constancias_difusion (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  employee_id INTEGER NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'politica_prevencion',
  -- tipos: politica_prevencion | capacitacion | reglamento | programa
  fecha_difusion TIMESTAMP NOT NULL DEFAULT NOW(),
  medio TEXT DEFAULT 'plataforma',
  -- medios: plataforma | email | presencial | cartelera
  confirmado BOOLEAN DEFAULT TRUE,
  ip_confirmacion TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_constancias_company ON constancias_difusion(company_id);
CREATE INDEX IF NOT EXISTS idx_constancias_employee ON constancias_difusion(employee_id);

-- ── 5. Centros de trabajo (multi-sucursal) ───────────────────────────────────
CREATE TABLE IF NOT EXISTS centros_trabajo (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  nombre TEXT NOT NULL,
  direccion TEXT,
  municipio TEXT,
  estado_republica TEXT,
  numero_trabajadores INTEGER DEFAULT 0,
  responsable TEXT,
  registro_patronal_imss TEXT,
  activo BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_centros_company ON centros_trabajo(company_id);

-- Agregar centro_trabajo_id a employees (opcional, para multi-sucursal)
ALTER TABLE employees
  ADD COLUMN IF NOT EXISTS centro_trabajo_id INTEGER;

-- ── 6. Informe técnico oficial ────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS informes_tecnicos (
  id SERIAL PRIMARY KEY,
  company_id INTEGER NOT NULL,
  periodo TEXT NOT NULL,        -- ej: "2025", "2024-2025"
  fecha_generacion TIMESTAMP DEFAULT NOW(),
  total_trabajadores INTEGER,
  total_evaluados INTEGER,
  cobertura_pct NUMERIC(5,2),
  nivel_riesgo_global TEXT,
  puntaje_global INTEGER,
  metodologia TEXT DEFAULT 'Guía de Referencia III — NOM-035-STPS-2018',
  factores_criticos JSONB,      -- dominios con riesgo alto/muy-alto
  plan_accion JSONB,            -- acciones, responsables, plazos
  responsable_elaboracion TEXT,
  cargo_responsable TEXT,
  firmado BOOLEAN DEFAULT FALSE,
  url_pdf TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_informes_company ON informes_tecnicos(company_id);

