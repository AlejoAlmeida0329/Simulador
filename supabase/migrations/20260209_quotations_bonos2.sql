-- =============================================
-- Bonos 2.0: Quotations table
-- Run in Supabase Dashboard SQL Editor
-- =============================================

CREATE TABLE IF NOT EXISTS quotations_bonos2 (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  user_id UUID REFERENCES auth.users(id),

  -- Company data
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  nit TEXT,
  arl_risk_level TEXT DEFAULT 'III',
  obligado_parafiscales BOOLEAN DEFAULT true,

  -- Configuration
  split_salary_pct INTEGER DEFAULT 60,
  split_bonus_pct INTEGER DEFAULT 40,
  bonus_types_selected TEXT[] DEFAULT '{}',
  data_input_method TEXT DEFAULT 'lotes',

  -- Totals
  total_employees INTEGER DEFAULT 0,
  total_salary NUMERIC DEFAULT 0,
  total_bonuses NUMERIC DEFAULT 0,
  total_compensation NUMERIC DEFAULT 0,

  -- JSON columns
  financial_summary JSONB,
  tikin_commission JSONB,
  savings_estimate JSONB,
  lotes_data JSONB,

  -- Status & metadata
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft','completed','sent','accepted','rejected')),
  notes TEXT,
  pdf_filename TEXT
);

-- RLS
ALTER TABLE quotations_bonos2 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own quotations_bonos2"
  ON quotations_bonos2 FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own quotations_bonos2"
  ON quotations_bonos2 FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can view all quotations_bonos2"
  ON quotations_bonos2 FOR SELECT
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can update all quotations_bonos2"
  ON quotations_bonos2 FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- =============================================
-- Fee configuration table
-- =============================================

CREATE TABLE IF NOT EXISTS fee_config (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id),

  fee_type TEXT NOT NULL UNIQUE CHECK (fee_type IN (
    'mera_liberalidad', 'alimentacion', 'dotacion', 'viaticos', 'iva'
  )),

  fixed_rate NUMERIC,
  ranges JSONB
);

ALTER TABLE fee_config ENABLE ROW LEVEL SECURITY;

-- Anyone can read fees (public cotizador needs them)
CREATE POLICY "Anyone can read fee_config"
  ON fee_config FOR SELECT USING (true);

CREATE POLICY "Admin can update fee_config"
  ON fee_config FOR UPDATE
  USING (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin can insert fee_config"
  ON fee_config FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin'));

-- Seed with current hardcoded values
INSERT INTO fee_config (fee_type, fixed_rate, ranges) VALUES
  ('mera_liberalidad', NULL, '[
    {"min":0,"max":80000000,"fee":0.040,"label":"0 - $80M"},
    {"min":80000001,"max":150000000,"fee":0.035,"label":"$80M - $150M"},
    {"min":150000001,"max":500000000,"fee":0.025,"label":"$150M - $500M"},
    {"min":500000001,"max":1000000000,"fee":0.018,"label":"$500M - $1.000M"},
    {"min":1000000001,"max":999999999999,"fee":0.018,"label":"Más de $1.000M"}
  ]'),
  ('alimentacion', 0.0125, NULL),
  ('dotacion', 0, NULL),
  ('viaticos', 0.0125, NULL),
  ('iva', 0.19, NULL)
ON CONFLICT (fee_type) DO NOTHING;
