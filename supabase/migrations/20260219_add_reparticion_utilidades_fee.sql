-- Add reparticion_utilidades to fee_config CHECK constraint and seed data

-- 1. Drop the old CHECK constraint and create a new one including reparticion_utilidades
ALTER TABLE fee_config DROP CONSTRAINT IF EXISTS fee_config_fee_type_check;
ALTER TABLE fee_config ADD CONSTRAINT fee_config_fee_type_check
  CHECK (fee_type IN ('mera_liberalidad', 'alimentacion', 'dotacion', 'viaticos', 'reparticion_utilidades', 'iva'));

-- 2. Seed reparticion_utilidades with same ranges as mera_liberalidad
INSERT INTO fee_config (fee_type, fixed_rate, ranges) VALUES
  ('reparticion_utilidades', NULL, '[
    {"min":0,"max":80000000,"fee":0.040,"label":"0 - $80M"},
    {"min":80000001,"max":150000000,"fee":0.035,"label":"$80M - $150M"},
    {"min":150000001,"max":500000000,"fee":0.025,"label":"$150M - $500M"},
    {"min":500000001,"max":1000000000,"fee":0.018,"label":"$500M - $1.000M"},
    {"min":1000000001,"max":999999999999,"fee":0.018,"label":"Más de $1.000M"}
  ]')
ON CONFLICT (fee_type) DO NOTHING;
