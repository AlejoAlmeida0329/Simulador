-- =====================================================
-- Tabla para Magic Link tokens
-- =====================================================

CREATE TABLE IF NOT EXISTS login_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  token UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  expires_at TIMESTAMPTZ NOT NULL,
  used BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índice para búsquedas rápidas por token
CREATE INDEX IF NOT EXISTS idx_login_tokens_token ON login_tokens(token);
CREATE INDEX IF NOT EXISTS idx_login_tokens_email ON login_tokens(email);

-- RLS Policies (permitir acceso público a esta tabla para validación)
ALTER TABLE login_tokens ENABLE ROW LEVEL SECURITY;

-- Permitir inserción a usuarios autenticados (para generar tokens)
CREATE POLICY "Allow authenticated to insert tokens" ON login_tokens
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Permitir lectura a cualquiera (para validar tokens)
CREATE POLICY "Allow anyone to read tokens" ON login_tokens
  FOR SELECT
  TO anon
  USING (true);

-- Permitir actualización a cualquiera (para marcar como usado)
CREATE POLICY "Allow anyone to update tokens" ON login_tokens
  FOR UPDATE
  TO anon
  USING (true);
