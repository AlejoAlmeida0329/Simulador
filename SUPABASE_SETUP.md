# 🗄️ Configuración de Base de Datos con Supabase

El simulador ahora guarda automáticamente todas las cotizaciones generadas en Supabase. Sigue estos pasos para configurar la base de datos.

---

## 📋 Resumen de Cambios

- ✅ Cliente de Supabase instalado y configurado
- ✅ Tabla de cotizaciones diseñada con todos los campos necesarios
- ✅ Guardado automático al generar PDFs
- ✅ Sistema tolerante a fallos (si Supabase no está configurado, el PDF se genera igual)
- ✅ Consultas pre-construidas para análisis de datos

---

## 🚀 Pasos de Configuración

### 1️⃣ Crear Proyecto en Supabase

1. Ve a [https://supabase.com](https://supabase.com)
2. Crea una cuenta gratuita o inicia sesión
3. Click en **"New Project"**
4. Completa la información:
   - **Name**: `tikin-quotations` (o el nombre que prefieras)
   - **Database Password**: Crea una contraseña segura (guárdala!)
   - **Region**: Selecciona la más cercana a tus usuarios
   - **Pricing Plan**: Free tier es suficiente para empezar
5. Click en **"Create new project"** y espera ~2 minutos mientras se crea

### 2️⃣ Obtener Credenciales

1. Una vez creado el proyecto, ve a **Settings** (⚙️ en el menú lateral)
2. Click en **API** en el menú de Settings
3. Copia estos dos valores:
   - **Project URL**: `https://xxxxxxxxxx.supabase.co`
   - **anon/public key**: Una clave larga que empieza con `eyJ...`

### 3️⃣ Configurar Variables de Entorno

1. En la raíz del proyecto, edita el archivo `.env.local`
2. Reemplaza los valores placeholder con tus credenciales:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

3. **Importante**: NO compartas estas credenciales públicamente
4. El archivo `.env.local` ya está en `.gitignore` para proteger tus credenciales

### 4️⃣ Crear la Tabla en Supabase

1. En el dashboard de Supabase, ve a **SQL Editor** (ícono </> en menú lateral)
2. Click en **"New query"**
3. Copia TODO el contenido del archivo `supabase/schema.sql` y pégalo en el editor
4. Click en **"Run"** (o presiona Ctrl/Cmd + Enter)
5. Deberías ver el mensaje: "Success. No rows returned"

### 5️⃣ Verificar la Tabla

1. Ve a **Table Editor** (ícono de tabla en menú lateral)
2. Deberías ver la tabla `quotations` en la lista
3. Click en ella para ver su estructura (estará vacía por ahora)

### 6️⃣ Reiniciar el Servidor de Desarrollo

```bash
# Detén el servidor (Ctrl + C) y vuelve a iniciarlo
npm run dev
```

---

## ✅ Verificar que Funciona

1. Abre el simulador en tu navegador: `http://localhost:3000`
2. Completa el formulario de datos de empresa
3. Agrega empleados y genera una cotización
4. Click en **"Descargar Cotización PDF"**
5. Abre la consola del navegador (F12 → Console)
6. Deberías ver: `✅ Cotización guardada en Supabase`
7. Ve al **Table Editor** en Supabase → deberías ver el nuevo registro

---

## 📊 Consultar las Cotizaciones

### Desde Supabase Dashboard

1. Ve a **Table Editor** → `quotations`
2. Verás todas las cotizaciones con filtros y búsqueda

### Consultas SQL Útiles

Ejecuta estas consultas en **SQL Editor**:

#### Ver últimas 20 cotizaciones
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

#### Estadísticas generales
```sql
SELECT
  COUNT(*) as total_cotizaciones,
  COUNT(DISTINCT company_name) as empresas_unicas,
  SUM(net_monthly_savings) as ahorro_total_mensual,
  AVG(net_monthly_savings) as ahorro_promedio_mensual,
  SUM(net_annual_savings) as ahorro_total_anual
FROM quotations;
```

#### Cotizaciones por empresa
```sql
SELECT
  company_name,
  COUNT(*) as num_cotizaciones,
  AVG(net_monthly_savings) as ahorro_promedio,
  MAX(created_at) as ultima_cotizacion
FROM quotations
GROUP BY company_name
ORDER BY num_cotizaciones DESC;
```

#### Cotizaciones del último mes
```sql
SELECT *
FROM quotations
WHERE created_at >= NOW() - INTERVAL '30 days'
ORDER BY created_at DESC;
```

---

## 🔒 Seguridad (Importante para Producción)

El schema incluye una política básica que permite acceso público. **Para producción, debes ajustar esto:**

### Opción 1: Deshabilitar escritura pública (solo lectura)

```sql
-- Eliminar política pública
DROP POLICY IF EXISTS "Permitir acceso público a cotizaciones" ON quotations;

-- Permitir solo lectura
CREATE POLICY "Permitir lectura pública"
ON quotations FOR SELECT
USING (true);

-- Permitir escritura solo desde tu app (usando service role key en backend)
```

### Opción 2: Autenticación requerida

Si implementas autenticación de usuarios:

```sql
-- Solo usuarios autenticados pueden ver y crear cotizaciones
DROP POLICY IF EXISTS "Permitir acceso público a cotizaciones" ON quotations;

CREATE POLICY "Usuarios autenticados"
ON quotations
FOR ALL
USING (auth.role() = 'authenticated');
```

---

## 🛠️ Troubleshooting

### ⚠️ "Supabase not configured" en consola

**Causa**: Variables de entorno no configuradas o incorrectas

**Solución**:
- Verifica que `.env.local` existe y tiene las credenciales correctas
- Reinicia el servidor después de modificar `.env.local`
- Verifica que la URL empieza con `https://` y la key con `eyJ`

### ❌ Error al guardar en base de datos

**Causa 1**: Tabla no creada
- Ve a Table Editor y verifica que `quotations` existe
- Si no existe, ejecuta `supabase/schema.sql` nuevamente

**Causa 2**: Políticas de RLS muy restrictivas
- Ve a **Authentication** → **Policies**
- Verifica que existe la política "Permitir acceso público a cotizaciones"
- O ajusta las políticas según tu modelo de seguridad

**Causa 3**: Credenciales incorrectas
- Verifica Project URL y anon key en Settings → API
- Asegúrate de usar la **anon/public** key, no la service role key

### 📊 Datos no aparecen en Supabase

1. Abre consola del navegador (F12)
2. Busca mensajes de error de Supabase
3. Verifica que el PDF se descargó correctamente
4. Si ves "⚠️ No se pudo guardar", revisa el error específico

---

## 🎯 Estructura de Datos

Cada cotización guarda:

### Información del Cliente
- Nombre empresa, contacto, email, teléfono, NIT
- Cantidad de empleados
- Nómina total mensual
- Nivel de riesgo ARL

### Escenario Simulado
- División salario/bono (%)
- Total de bonos mensuales

### Ahorros Calculados
- Ahorro mensual en parafiscales
- Ahorro anual
- Porcentaje de reducción

### Comisión Tikin
- Nivel de comisión aplicado (1-4)
- Porcentaje de comisión
- Comisión base
- IVA
- Costo total

### Beneficio Neto
- Ahorro neto mensual (ahorro - comisión)
- Ahorro neto anual

### Metadata
- Fecha de creación
- Nombre del archivo PDF generado
- ID único (UUID)

---

## 📈 Próximos Pasos

Con los datos en Supabase puedes:

1. **Dashboard de Analytics**: Crear visualizaciones de cotizaciones, conversiones, etc.
2. **CRM Integration**: Conectar con tu CRM para seguimiento de leads
3. **Email Automation**: Enviar seguimientos automáticos usando Supabase Functions
4. **Reportes Mensuales**: Analizar tendencias de cotizaciones por mes
5. **API**: Usar Supabase Auto-generated API para acceder a los datos desde otras apps

---

## 📞 Soporte

Si tienes problemas:
1. Revisa la sección de Troubleshooting arriba
2. Consulta la [documentación oficial de Supabase](https://supabase.com/docs)
3. Revisa los logs en la consola del navegador (F12)
4. Verifica el archivo `supabase/README.md` para más detalles técnicos
