# Configuracion de Base de Datos con Supabase

El sistema usa Supabase (PostgreSQL) para almacenar cotizaciones, perfiles de usuario, invitaciones y configuracion de fees.

---

## Tablas del Sistema

| Tabla | Descripcion |
|-------|-------------|
| `user_profiles` | Perfiles de usuario (admin/comercial) |
| `comercial_invitations` | Invitaciones para nuevos comerciales |
| `quotations_bonos2` | Cotizaciones generadas (Bonos 2.0) |
| `fee_config` | Configuracion de tarifas por tipo de bono |
| `login_tokens` | Tokens de magic link login |

---

## Pasos de Configuracion

### 1. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea un proyecto nuevo
3. Guarda la contrasena de la base de datos

### 2. Obtener Credenciales

1. Ve a **Settings** > **API**
2. Copia:
   - **Project URL**: `https://xxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJ...`
   - **service_role key**: `eyJ...` (para operaciones admin)

### 3. Configurar Variables de Entorno

Edita `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### 4. Ejecutar Migraciones SQL

En el **SQL Editor** de Supabase, ejecuta en orden:

1. `supabase/migrations/20260209_quotations_bonos2.sql` - Tabla de cotizaciones y fee_config
2. `supabase/create-login-tokens-table.sql` - Tabla de tokens de login
3. `supabase/fix-rls-delete-policies.sql` - Politicas RLS de eliminacion

### 5. Verificar Tablas

En **Table Editor** deberias ver:
- `quotations_bonos2`
- `fee_config`
- `user_profiles`
- `login_tokens`

---

## Schema: quotations_bonos2

```sql
quotations_bonos2 (
  id UUID PRIMARY KEY,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  user_id UUID REFERENCES auth.users(id),

  -- Datos de empresa
  company_name TEXT NOT NULL,
  contact_name TEXT,
  email TEXT,
  phone TEXT,
  nit TEXT,
  arl_risk_level TEXT DEFAULT 'III',
  obligado_parafiscales BOOLEAN DEFAULT true,

  -- Configuracion
  split_salary_pct INTEGER DEFAULT 60,
  split_bonus_pct INTEGER DEFAULT 40,
  bonus_types_selected TEXT[],
  data_input_method TEXT DEFAULT 'lotes',

  -- Totales
  total_employees INTEGER,
  total_salary NUMERIC,
  total_bonuses NUMERIC,
  total_compensation NUMERIC,

  -- Datos JSON
  financial_summary JSONB,
  tikin_commission JSONB,
  savings_estimate JSONB,
  lotes_data JSONB,

  -- Estado
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','accepted','rejected')),
  notes TEXT,
  pdf_filename TEXT
)
```

## Schema: fee_config

```sql
fee_config (
  id UUID PRIMARY KEY,
  fee_type TEXT UNIQUE CHECK (fee_type IN ('mera_liberalidad','alimentacion','dotacion','viaticos','iva')),
  fixed_rate NUMERIC,
  ranges JSONB,
  updated_by UUID REFERENCES auth.users(id)
)
```

---

## Politicas RLS

### quotations_bonos2
- Usuarios ven sus propias cotizaciones (`auth.uid() = user_id`)
- Usuarios insertan sus propias cotizaciones
- Admin ve todas las cotizaciones
- Admin actualiza cualquier cotizacion

### fee_config
- Lectura publica (el cotizador publico necesita las tarifas)
- Solo admin puede modificar

---

## Consultas SQL Utiles

### Ultimas cotizaciones
```sql
SELECT company_name, total_employees, total_compensation, status, created_at
FROM quotations_bonos2
ORDER BY created_at DESC
LIMIT 20;
```

### Estadisticas generales
```sql
SELECT
  COUNT(*) as total_cotizaciones,
  COUNT(DISTINCT company_name) as empresas_unicas,
  SUM(total_employees) as total_empleados,
  SUM(total_compensation) as compensacion_total
FROM quotations_bonos2;
```

### Cotizaciones por estado
```sql
SELECT status, COUNT(*) as cantidad
FROM quotations_bonos2
GROUP BY status
ORDER BY cantidad DESC;
```

---

## Troubleshooting

### "Supabase not configured"
- Verifica que `.env.local` tiene las credenciales correctas
- Reinicia el servidor despues de modificar `.env.local`

### Error al guardar cotizacion
- Verifica que `quotations_bonos2` existe en Table Editor
- Revisa las politicas RLS (el usuario debe estar autenticado)
- Verifica que `user_id` tiene referencia valida a `auth.users`

### Datos no aparecen en comercial/cotizaciones
- El usuario debe estar autenticado
- La consulta filtra por `user_id` - solo ve sus propias cotizaciones
- Admin ve todas desde `/admin/cotizaciones`
