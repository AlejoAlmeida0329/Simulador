# Guia de Deployment en Vercel

Guia para desplegar el Simulador Tikin en Vercel con Supabase.

---

## Pre-requisitos

- Cuenta en [Vercel](https://vercel.com)
- Cuenta en [Supabase](https://supabase.com)
- Repositorio en GitHub
- Base de datos Supabase configurada (ver [SUPABASE_SETUP.md](SUPABASE_SETUP.md))

---

## Paso 1: Configurar Supabase

1. Crea un proyecto en [Supabase Dashboard](https://supabase.com/dashboard)
2. Ejecuta las migraciones SQL (ver SUPABASE_SETUP.md)
3. Verifica que las tablas `quotations_bonos2`, `fee_config`, `user_profiles` existan
4. Copia las credenciales desde **Settings** > **API**

---

## Paso 2: Preparar Repositorio

### Verificar que .env.local NO este en Git

```bash
git status | grep .env.local
# No debe aparecer
```

### Subir cambios

```bash
git add .
git commit -m "deploy: ready for production"
git push -u origin master
```

---

## Paso 3: Deploy en Vercel

### 3.1 Importar Proyecto

1. Ve a [vercel.com/new](https://vercel.com/new)
2. Importa tu repositorio GitHub
3. Framework: Next.js (auto-detectado)

### 3.2 Variables de Entorno

Configura antes del deploy:

| Variable | Valor |
|----------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJ...` |
| `SUPABASE_SERVICE_ROLE_KEY` | `eyJ...` |
| `GMAIL_USER` | Email para envio de magic links |
| `GMAIL_CLIENT_ID` | OAuth client ID |
| `GMAIL_CLIENT_SECRET` | OAuth client secret |
| `GMAIL_REFRESH_TOKEN` | OAuth refresh token |

### 3.3 Deploy

Click en **Deploy** y espera ~2-3 minutos.

---

## Paso 4: Verificar

1. Visita la URL de Vercel
2. Inicia sesion con magic link
3. Crea una cotizacion en `/bonos`
4. Verifica que aparezca en `/comercial/cotizaciones` o `/admin/cotizaciones`
5. Confirma en Supabase Table Editor que el registro existe en `quotations_bonos2`

---

## Deployments Futuros

Vercel hace deploy automatico en cada push a master:

```bash
git add .
git commit -m "feat: nueva funcionalidad"
git push
```

Cada branch/PR genera un preview deployment separado.

---

## Dominio Personalizado

1. Ve a Vercel > Tu Proyecto > **Settings** > **Domains**
2. Agrega tu dominio
3. Configura DNS segun instrucciones

---

## Troubleshooting

### Build falla en Vercel
```bash
# Verifica que compila localmente
npm run build
```

### "Supabase not configured"
- Verifica variables de entorno en Vercel Settings
- Nombres exactos: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Redeploy despues de agregar variables

### Error 500
- Revisa Runtime Logs en Vercel Deployments
- Causa comun: variables de entorno faltantes

---

## Seguridad

- Variables de entorno SOLO en Vercel dashboard, nunca en codigo
- `.env.local` en `.gitignore`
- RLS habilitado en todas las tablas de Supabase
- Politicas por rol (admin/comercial) en `quotations_bonos2`
