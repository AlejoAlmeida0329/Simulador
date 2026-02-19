-- Convert alimentacion, viaticos, dotacion from fixed_rate to ranges
-- This allows all fee types to support range-based pricing

-- Alimentacion: convert fixed_rate 0.0125 to a single range
UPDATE fee_config
SET ranges = '[{"min":0,"max":999999999999,"fee":0.0125,"label":"Tarifa base"}]'::jsonb,
    fixed_rate = NULL,
    updated_at = now()
WHERE fee_type = 'alimentacion'
  AND ranges IS NULL;

-- Viaticos: convert fixed_rate 0.0125 to a single range
UPDATE fee_config
SET ranges = '[{"min":0,"max":999999999999,"fee":0.0125,"label":"Tarifa base"}]'::jsonb,
    fixed_rate = NULL,
    updated_at = now()
WHERE fee_type = 'viaticos'
  AND ranges IS NULL;

-- Dotacion: convert fixed_rate 0 to a single range
UPDATE fee_config
SET ranges = '[{"min":0,"max":999999999999,"fee":0,"label":"Tarifa base"}]'::jsonb,
    fixed_rate = NULL,
    updated_at = now()
WHERE fee_type = 'dotacion'
  AND ranges IS NULL;
