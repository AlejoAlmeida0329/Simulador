-- Agregar columna user_id a la tabla quotations
-- Esta columna almacena el ID del usuario que creó la cotización

ALTER TABLE quotations
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Crear índice para mejorar performance de consultas filtradas por user_id
CREATE INDEX IF NOT EXISTS idx_quotations_user_id ON quotations(user_id);

-- Comentario en la columna para documentación
COMMENT ON COLUMN quotations.user_id IS 'ID del usuario (comercial o admin) que creó la cotización';
