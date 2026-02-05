# Simulador Tikin - Sistema de Gestión y Cotización

Plataforma web profesional para el equipo comercial de Tikin que calcula ahorros en parafiscales mediante flexibilización salarial y gestiona el proceso completo de cotización.

## 🎯 Propósito

Sistema integral que permite:
- Gestionar equipo comercial mediante sistema de invitaciones
- Calcular y cotizar ahorros en parafiscales usando el modelo Tikin
- Generar cotizaciones profesionales en PDF con branding completo
- Administrar usuarios y cotizaciones desde panel de administración

## ✨ Características Principales

### 🔐 Sistema de Autenticación
- **Magic Link Authentication**: Login sin contraseña mediante enlaces de un solo uso
- **Gestión de Invitaciones**: Sistema completo de invitación para comerciales
- **Roles y Permisos**: Admin y Comercial con permisos diferenciados
- **Middleware de Protección**: Rutas protegidas según rol de usuario

### 👥 Panel de Administración
- **Gestión de Comerciales**: Ver, aprobar, rechazar y eliminar comerciales
- **Sistema de Invitaciones**: Invitar nuevos comerciales por email
- **Gestión de Cotizaciones**: Ver todas las cotizaciones generadas
- **Dashboard**: Estadísticas y métricas del sistema

### 💼 Sistema de Cotización
- **Modal de Captura**: Datos del cliente (empresa, contacto, NIT, etc.)
- **PDF Profesional**: Generación con branding Tikin completo
- **Almacenamiento**: Registro automático en Supabase
- **Comisión Tikin**: Cálculo automático en 4 niveles según volumen
- **Beneficio Neto**: Ahorro - comisión Tikin

### 🧮 Motor de Cálculo
- **6 Contribuciones Parafiscales**:
  - Salud (8.5%), Pensión (12%)
  - ARL (0.522% - 6.960% según nivel I-V)
  - SENA (2%), ICBF (3%), Caja (4%)
- **Sistema de Comisión Tikin**:
  - Nivel 1 (< $80M): 4%
  - Nivel 2 ($80M-$150M): 3.5%
  - Nivel 3 ($150M-$500M): 2.5%
  - Nivel 4 ($500M-$1000M+): 1.8%

### 👨‍💼 Portal Comercial
- **Dashboard Personal**: Vista de cotizaciones propias
- **Acceso a Simulador**: Calculadora de parafiscales
- **Generación de PDF**: Cotizaciones para clientes
- **Historial**: Cotizaciones generadas anteriormente

### 📊 Características de Cálculo
- **Gestión de Empleados**: Agregar, editar, eliminar empleados
- **Slider Interactivo**: División salario/bono (60%-100%)
- **Selector ARL**: Nivel de riesgo (Clase I-V)
- **Actualización en Tiempo Real**: Cálculos instantáneos
- **Comparación Visual**: Escenario tradicional vs. Tikin

## 🛠 Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + TypeScript 5.9
- **Styling**: Tailwind CSS 3.4
- **Auth**: Supabase Auth + Magic Links
- **Email**: Gmail API (nodemailer)
- **Database**: Supabase (PostgreSQL)
- **PDF Generation**: pdfmake
- **Deployment**: Vercel
- **Validation**: Zod 4.3

## 📁 Estructura del Proyecto

```
/app
├── /admin              # Panel de administración
│   ├── /comerciales    # Gestión de comerciales
│   ├── /cotizaciones   # Ver cotizaciones
│   ├── /dashboard      # Dashboard admin
│   └── /usuarios       # Gestión de usuarios
├── /auth               # Rutas de autenticación
│   ├── /callback       # Callbacks de Supabase
│   ├── /accept-invitation  # Aceptar invitación
│   └── /magic-login    # Procesamiento magic link
├── /bonos              # Simulador de bonos (calculadora)
├── /dashboard          # Dashboard comercial
├── /login              # Página de login
└── /pending-approval   # Espera de aprobación

/lib
├── /actions            # Server Actions
│   ├── auth.ts         # Autenticación
│   ├── comerciales.ts  # Gestión comerciales
│   └── invitations.ts  # Sistema de invitaciones
├── /auth               # Utilidades de autenticación
├── /calculations       # Motor de cálculo parafiscales
├── /email              # Sistema de emails (Gmail)
└── /supabase          # Cliente Supabase

/supabase
├── /migrations         # Migraciones SQL
└── /rls-policies      # Políticas de seguridad
```

## 🚀 Quick Start

### Requisitos Previos
- Node.js 18+ (recomendado v24)
- Cuenta en Supabase
- Credenciales de Gmail API (opcional para emails)

### Instalación

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/simulador-tikin.git
cd simulador-tikin

# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.local.example .env.local
# Edita .env.local con tus credenciales
```

### Variables de Entorno Requeridas

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# Gmail API (opcional)
GMAIL_USER=tu-email@gmail.com
GMAIL_CLIENT_ID=xxx.apps.googleusercontent.com
GMAIL_CLIENT_SECRET=xxx
GMAIL_REFRESH_TOKEN=xxx
```

### Configuración de Supabase

Ver guía completa: **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)**

1. Crear proyecto en Supabase
2. Ejecutar migraciones SQL
3. Configurar políticas RLS
4. Crear primer usuario admin

### Ejecutar en Desarrollo

```bash
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📚 Guías de Configuración

- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Configuración completa de Supabase
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment en Vercel paso a paso

## 🔐 Sistema de Autenticación

### Flujo de Invitación

1. **Admin invita comercial** → Email con link de invitación
2. **Comercial acepta** → Cuenta creada automáticamente
3. **Magic link enviado** → Login sin contraseña
4. **Acceso al dashboard** → Según rol asignado

### Magic Link Login

- Sin contraseñas, más seguro
- Tokens de un solo uso (15 min expiración)
- Links enviados por Gmail
- Sesión persistente

## 👥 Roles y Permisos

| Funcionalidad | Admin | Comercial |
|---------------|-------|-----------|
| Panel Admin | ✅ | ❌ |
| Gestionar Comerciales | ✅ | ❌ |
| Ver Todas las Cotizaciones | ✅ | ❌ |
| Usar Simulador | ✅ | ✅ |
| Ver Propias Cotizaciones | ✅ | ✅ |
| Generar PDF | ✅ | ✅ |

## 📊 Base de Datos

### Tablas Principales

- **user_profiles**: Usuarios (admin/comercial)
- **comercial_invitations**: Invitaciones pendientes
- **quotations**: Cotizaciones generadas
- **login_tokens**: Tokens de magic link

Ver schema: `supabase/schema.sql`

## 🎨 Branding

- Logo Tikin oficial en SVG
- Paleta de colores corporativa
- Diseño profesional responsive
- PDF con branding completo

## 📈 Estado del Proyecto

**Versión Actual: 2.0** ✅

- ✅ Sistema de autenticación con Magic Links
- ✅ Gestión completa de comerciales e invitaciones
- ✅ Panel de administración
- ✅ Dashboard comercial
- ✅ Calculadora de parafiscales
- ✅ Generación de PDF profesional
- ✅ Sistema de emails con Gmail
- ✅ Integración completa con Supabase
- ✅ Ready for production

## 🔧 Desarrollo

### Scripts Disponibles

```bash
npm run dev          # Desarrollo
npm run build        # Build producción
npm run start        # Servidor producción
npm run lint         # Linter
```

### Testing

```bash
# Probar flujo completo
1. Login con magic link
2. Crear invitación
3. Aceptar invitación
4. Generar cotización
5. Verificar en Supabase
```

## 🐛 Troubleshooting

Ver sección de troubleshooting en:
- [SUPABASE_SETUP.md](SUPABASE_SETUP.md#troubleshooting)
- [DEPLOYMENT.md](DEPLOYMENT.md#troubleshooting)

## 📝 Licencia

Proyecto interno de Tikin

---

💼 Desarrollado para Tikin - Plataforma de Flexibilidad Salarial
