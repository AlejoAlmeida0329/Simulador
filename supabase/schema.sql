-- Tabla para almacenar las cotizaciones generadas
-- Ejecuta este SQL en tu dashboard de Supabase (SQL Editor)

CREATE TABLE IF NOT EXISTS quotations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Información del cliente
  company_name TEXT NOT NULL,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  nit TEXT,
  employee_count INTEGER NOT NULL,
  total_payroll NUMERIC NOT NULL,
  arl_risk_level TEXT NOT NULL,

  -- Datos del escenario Tikin
  salary_percentage INTEGER NOT NULL,
  bonus_percentage INTEGER NOT NULL,
  monthly_bonus_total NUMERIC NOT NULL,

  -- Ahorros
  monthly_savings NUMERIC NOT NULL,
  annual_savings NUMERIC NOT NULL,
  percentage_reduction NUMERIC NOT NULL,

  -- Comisión Tikin
  commission_level INTEGER NOT NULL,
  commission_percentage NUMERIC NOT NULL,
  base_commission NUMERIC NOT NULL,
  iva NUMERIC NOT NULL,
  total_commission NUMERIC NOT NULL,

  -- Beneficio neto
  net_monthly_savings NUMERIC NOT NULL,
  net_annual_savings NUMERIC NOT NULL,

  -- Metadata
  generated_by TEXT,
  pdf_filename TEXT
);

-- Índices para mejorar performance de búsquedas
CREATE INDEX IF NOT EXISTS idx_quotations_company_name ON quotations(company_name);
CREATE INDEX IF NOT EXISTS idx_quotations_created_at ON quotations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_quotations_email ON quotations(email);

-- Habilitar Row Level Security (RLS)
ALTER TABLE quotations ENABLE ROW LEVEL SECURITY;

-- Política para permitir lectura y escritura (ajusta según tus necesidades)
-- Esta política permite acceso público - cámbiala según tu modelo de autenticación
CREATE POLICY "Permitir acceso público a cotizaciones"
ON quotations
FOR ALL
USING (true)
WITH CHECK (true);

-- Comentarios para documentación
COMMENT ON TABLE quotations IS 'Almacena todas las cotizaciones generadas por el simulador Tikin';
COMMENT ON COLUMN quotations.company_name IS 'Nombre de la empresa cliente';
COMMENT ON COLUMN quotations.net_monthly_savings IS 'Ahorro neto mensual (ahorro - comisión Tikin)';
COMMENT ON COLUMN quotations.pdf_filename IS 'Nombre del archivo PDF generado';
