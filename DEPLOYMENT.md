# 🚀 Guía de Deployment en Vercel

Guía paso a paso para desplegar el Simulador Tikin en Vercel con Supabase.

---

## 📋 Pre-requisitos

Antes de empezar, asegúrate de tener:

- ✅ Cuenta en [Vercel](https://vercel.com)
- ✅ Cuenta en [Supabase](https://supabase.com)
- ✅ Repositorio en GitHub/GitLab/Bitbucket
- ✅ Base de datos Supabase configurada (tabla `quotations` creada)

---

## 🗄️ Paso 1: Configurar Supabase

### 1.1 Crear/Verificar Proyecto Supabase

Si aún no lo has hecho:

1. Ve a [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Crea un nuevo proyecto o selecciona el existente
3. Espera a que el proyecto esté listo (~2 minutos)

### 1.2 Ejecutar Schema SQL

1. En el dashboard de Supabase, ve a **SQL Editor**
2. Click en **"New query"**
3. Copia el contenido de `supabase/schema.sql`
4. Pega en el editor y click en **"Run"**
5. Verifica que la tabla `quotations` aparezca en **Table Editor**

### 1.3 Obtener Credenciales

1. Ve a **Settings** → **API**
2. Copia estos valores (los necesitarás en Vercel):
   - **Project URL**: `https://xxxxxxxxxx.supabase.co`
   - **anon/public key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`

---

## 📦 Paso 2: Preparar el Repositorio Git

### 2.1 Verificar que .env.local NO esté en Git

```bash
# Esto NO debe aparecer en la lista
git status | grep .env.local
```

Si aparece, significa que está siendo trackeado (¡peligro!). Ejecuta:

```bash
git rm --cached .env.local
```

### 2.2 Hacer Commit de los Cambios

```bash
# Ver archivos modificados
git status

# Agregar todos los archivos nuevos y modificados
git add .

# Crear commit
git commit -m "feat: add Tikin quotation system with Supabase integration

- Company data modal for quotation generation
- Tikin commission calculation with 4 levels
- Professional PDF generation with enhanced branding
- Supabase integration for quotation storage
- Design system with unified Tikin branding
- Ready for Vercel deployment"

# Verificar que .env.local NO está en el commit
git log -1 --name-only | grep .env.local
# (No debe aparecer nada)
```

### 2.3 Subir a Repositorio Remoto

```bash
# Si aún no tienes remote configurado
git remote add origin https://github.com/tu-usuario/simulador-tikin.git

# Subir cambios
git push -u origin master
```

---

## ☁️ Paso 3: Deploy en Vercel

### 3.1 Importar Proyecto

1. Ve a [https://vercel.com/new](https://vercel.com/new)
2. Click en **"Import Git Repository"**
3. Selecciona tu repositorio (GitHub/GitLab/Bitbucket)
4. Si no aparece, click en **"Adjust GitHub App Permissions"** y autoriza el repositorio

### 3.2 Configurar Proyecto

En la pantalla de configuración:

**Project Name**: `simulador-tikin` (o el nombre que prefieras)

**Framework Preset**: Next.js (se detecta automáticamente)

**Root Directory**: `./` (dejar por defecto)

**Build Settings**:
- Build Command: `npm run build` (por defecto)
- Output Directory: `.next` (por defecto)
- Install Command: `npm install` (por defecto)

### 3.3 Configurar Variables de Entorno

**MUY IMPORTANTE**: Antes de hacer deploy, configura las variables de entorno:

1. Expande la sección **"Environment Variables"**
2. Agrega estas 2 variables:

| Name | Value |
|------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxxxxxxxxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |

3. Asegúrate de que estén disponibles para **Production, Preview y Development**

### 3.4 Iniciar Deployment

1. Click en **"Deploy"**
2. Espera ~2-3 minutos mientras Vercel construye y despliega
3. Verás el progreso en tiempo real

---

## ✅ Paso 4: Verificar Deployment

### 4.1 Visitar la Aplicación

Una vez completado el deployment:

1. Click en **"Visit"** o abre la URL: `https://simulador-tikin.vercel.app`
2. Deberías ver el simulador funcionando

### 4.2 Probar Funcionalidad Completa

**Test Básico:**
1. Completa el formulario de datos de empresa
2. Agrega empleados
3. Genera una cotización
4. Descarga el PDF

**Test de Supabase:**
1. Abre la consola del navegador (F12 → Console)
2. Descarga una cotización
3. Deberías ver: `✅ Cotización guardada en Supabase`
4. Ve a Supabase → Table Editor → `quotations`
5. Verifica que el registro se guardó

### 4.3 Verificar Variables de Entorno

Si ves errores:

1. Ve a Vercel → Tu Proyecto → **Settings** → **Environment Variables**
2. Verifica que ambas variables estén configuradas
3. Si las modificaste, haz un nuevo deploy:
   - Ve a **Deployments**
   - Click en el último deployment
   - Click en **⋯** → **Redeploy**

---

## 🔄 Paso 5: Deployments Futuros

### 5.1 Deployments Automáticos

Vercel está configurado para deployment automático:

```bash
# Haz cambios en tu código
git add .
git commit -m "feat: nueva funcionalidad"
git push

# Vercel automáticamente:
# 1. Detecta el push
# 2. Construye el proyecto
# 3. Despliega si el build es exitoso
```

### 5.2 Preview Deployments

Cada branch y PR genera un preview deployment:

1. Crea un nuevo branch:
   ```bash
   git checkout -b feature/nueva-funcionalidad
   ```

2. Haz cambios y push:
   ```bash
   git add .
   git commit -m "feat: working on new feature"
   git push -u origin feature/nueva-funcionalidad
   ```

3. Vercel crea un preview deployment con URL única
4. Prueba sin afectar producción
5. Merge a master para deploy a producción

---

## 🔧 Configuración Avanzada

### Dominio Personalizado

1. Ve a Vercel → Tu Proyecto → **Settings** → **Domains**
2. Click en **"Add"**
3. Ingresa tu dominio: `simulador.tikin.co`
4. Sigue las instrucciones para configurar DNS

### Variables de Entorno por Ambiente

Puedes tener diferentes valores según el ambiente:

1. Ve a **Settings** → **Environment Variables**
2. Al agregar una variable, selecciona el ambiente:
   - **Production**: Solo para producción
   - **Preview**: Branches y PRs
   - **Development**: Local (raramente usado)

### Analytics y Monitoring

Vercel incluye analytics gratis:

1. Ve a **Analytics** en tu proyecto
2. Verás visitas, performance, errores
3. Configura alerts para errores críticos

---

## 🐛 Troubleshooting

### Error: "Failed to build"

**Síntoma**: El build falla en Vercel

**Solución**:
1. Verifica que el build funciona localmente:
   ```bash
   npm run build
   ```
2. Si falla localmente, arregla los errores
3. Si solo falla en Vercel, revisa:
   - Variables de entorno configuradas correctamente
   - Versión de Node.js (Vercel usa la última LTS por defecto)

### Error: "Supabase not configured"

**Síntoma**: En consola del navegador ves warnings de Supabase

**Solución**:
1. Verifica variables de entorno en Vercel
2. Asegúrate que los nombres sean exactos:
   - `NEXT_PUBLIC_SUPABASE_URL` (no `SUPABASE_URL`)
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (no `SUPABASE_KEY`)
3. Haz redeploy después de agregar variables

### Error 500 en producción

**Síntoma**: La app funciona local pero da error 500 en Vercel

**Solución**:
1. Ve a Vercel → Tu Proyecto → **Deployments**
2. Click en el deployment con error
3. Ve a **Runtime Logs**
4. Busca el error específico
5. Común: Variables de entorno faltantes

### PDF no se genera

**Síntoma**: El botón de descarga no funciona

**Solución**:
1. Verifica la consola del navegador
2. Común: Error de imports dinámicos de pdfmake
3. La app maneja esto con dynamic imports - debería funcionar
4. Si persiste, revisa los logs de Vercel

---

## 📊 Monitoreo Post-Deployment

### Verificar Salud de la Aplicación

**Checklist Diario**:
- [ ] Visitar `https://tu-proyecto.vercel.app`
- [ ] Probar generación de cotización
- [ ] Revisar Table Editor en Supabase (nuevas cotizaciones)
- [ ] Verificar Analytics en Vercel (tráfico, errores)

**Checklist Semanal**:
- [ ] Revisar logs de errores en Vercel
- [ ] Verificar uso de base de datos en Supabase
- [ ] Revisar performance metrics
- [ ] Backup de base de datos Supabase (automático pero verificar)

### Configurar Alertas

**Vercel Notifications**:
1. Ve a tu perfil → **Settings** → **Notifications**
2. Activa notificaciones para:
   - Failed deployments
   - Comments on deployments
   - Alerts (si usas Vercel Analytics)

**Supabase Notifications**:
1. Ve a tu proyecto Supabase → **Settings** → **Integrations**
2. Configura webhooks para eventos importantes

---

## 🔐 Seguridad en Producción

### Variables de Entorno

✅ **Correcto**:
- Variables configuradas en Vercel dashboard
- Nunca en código
- `.env.local` en `.gitignore`

❌ **Incorrecto**:
- Variables hardcodeadas en código
- `.env.local` en Git
- Credenciales en comentarios

### Políticas de Supabase RLS

Revisa `supabase/README.md` sección de seguridad:

Para producción, considera restringir las políticas:

```sql
-- Ejemplo: Solo lectura pública, escritura desde servidor
DROP POLICY IF EXISTS "Permitir acceso público a cotizaciones" ON quotations;

CREATE POLICY "Permitir lectura pública"
ON quotations FOR SELECT
USING (true);
```

### CORS y Headers de Seguridad

Vercel maneja esto automáticamente, pero puedes personalizar en `next.config.js` si necesitas.

---

## 📈 Optimizaciones Opcionales

### Edge Runtime (Avanzado)

Para mejor performance global, considera usar Edge Runtime:

1. Agrega en `app/page.tsx`:
   ```typescript
   export const runtime = 'edge'
   ```

2. **Nota**: Algunas funcionalidades pueden requerir ajustes

### Image Optimization

Si agregas imágenes al simulador:

1. Usa `next/image` en lugar de `<img>`
2. Vercel optimiza automáticamente

### Caching

Vercel cachea automáticamente assets estáticos. Para custom caching:

```typescript
// En tus API routes (si las agregas)
export const revalidate = 3600 // 1 hora
```

---

## 📞 Soporte y Recursos

**Vercel Docs**: [https://vercel.com/docs](https://vercel.com/docs)
**Next.js Docs**: [https://nextjs.org/docs](https://nextjs.org/docs)
**Supabase Docs**: [https://supabase.com/docs](https://supabase.com/docs)

**Vercel Status**: [https://www.vercel-status.com](https://www.vercel-status.com)
**Supabase Status**: [https://status.supabase.com](https://status.supabase.com)

---

## ✨ Próximos Pasos

Con el deployment exitoso, puedes:

1. **Compartir la URL** con tu equipo comercial
2. **Configurar dominio personalizado**: `simulador.tikin.co`
3. **Agregar analytics avanzados**: Google Analytics, Mixpanel, etc.
4. **Implementar autenticación**: Para acceso restringido
5. **Dashboard de cotizaciones**: Ver todas las cotizaciones generadas
6. **CRM Integration**: Conectar con Salesforce, HubSpot, etc.

¡Tu simulador Tikin ya está en producción! 🎉
