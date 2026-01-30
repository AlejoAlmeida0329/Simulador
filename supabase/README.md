# Configuración de Supabase para Simulador Tikin

## 1. Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta o inicia sesión
3. Crea un nuevo proyecto
4. Anota la **URL del proyecto** y la **anon/public key**

## 2. Ejecutar el Schema SQL

1. En el dashboard de Supabase, ve a **SQL Editor**
2. Crea un nuevo query
3. Copia y pega el contenido de `supabase/schema.sql`
4. Ejecuta el query (botón "Run")
5. Verifica que la tabla `quotations` se haya creado en **Table Editor**

## 3. Configurar Variables de Entorno

1. Copia el archivo `.env.local.example` a `.env.local`:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edita `.env.local` y reemplaza con tus credenciales:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
   ```

3. Reinicia el servidor de desarrollo:
   ```bash
   npm run dev
   ```

## 4. Verificar Funcionamiento

1. Abre el simulador en tu navegador
2. Completa el formulario y genera una cotización
3. Descarga el PDF
4. Verifica en el dashboard de Supabase (Table Editor → quotations) que el registro se haya guardado
5. Revisa la consola del navegador para mensajes de confirmación

## 5. Políticas de Seguridad (RLS)

El schema incluye una política básica que permite acceso público. **Importante**: Para producción, debes ajustar las políticas según tu modelo de autenticación.

### Ejemplo: Permitir solo lectura pública, escritura autenticada

```sql
-- Eliminar política pública
DROP POLICY IF EXISTS "Permitir acceso público a cotizaciones" ON quotations;

-- Permitir lectura a todos
CREATE POLICY "Permitir lectura pública"
ON quotations
FOR SELECT
USING (true);

-- Permitir escritura solo a usuarios autenticados
CREATE POLICY "Permitir escritura autenticada"
ON quotations
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');
```

## 6. Consultas Útiles

### Ver todas las cotizaciones recientes
```sql
SELECT
  company_name,
  contact_name,
  email,
  net_monthly_savings,
  created_at
FROM quotations
ORDER BY created_at DESC
LIMIT 20;
```

### Estadísticas de cotizaciones
```sql
SELECT
  COUNT(*) as total_cotizaciones,
  COUNT(DISTINCT company_name) as empresas_unicas,
  SUM(net_monthly_savings) as ahorro_total_mensual,
  AVG(net_monthly_savings) as ahorro_promedio
FROM quotations;
```

### Cotizaciones por empresa
```sql
SELECT
  company_name,
  COUNT(*) as num_cotizaciones,
  MAX(created_at) as ultima_cotizacion
FROM quotations
GROUP BY company_name
ORDER BY num_cotizaciones DESC;
```

## 7. Troubleshooting

### "Supabase not configured" en consola
- Verifica que las variables de entorno estén correctamente configuradas en `.env.local`
- Reinicia el servidor de desarrollo después de modificar `.env.local`

### Error al guardar en base de datos
- Verifica que el schema SQL se haya ejecutado correctamente
- Revisa las políticas de RLS en Supabase dashboard
- Verifica que la anon key tenga permisos suficientes

### Datos no aparecen en Supabase
- Revisa la consola del navegador para errores
- Verifica que la tabla `quotations` exista en Table Editor
- Comprueba que las políticas de RLS permitan escritura
