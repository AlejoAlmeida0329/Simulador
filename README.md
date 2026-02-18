# Simulador Tikin - Sistema de Gestion y Cotizacion

Plataforma web para el equipo comercial de Tikin que calcula ahorros en parafiscales mediante flexibilizacion salarial y gestiona el proceso completo de cotizacion.

## Proposito

Sistema integral que permite:
- Gestionar equipo comercial mediante sistema de invitaciones
- Calcular y cotizar ahorros en parafiscales usando el modelo Tikin
- Generar cotizaciones profesionales en PDF
- Administrar usuarios y cotizaciones desde panel de administracion

## Caracteristicas Principales

### Sistema de Autenticacion
- **Magic Link Authentication**: Login sin contrasena
- **Gestion de Invitaciones**: Sistema de invitacion para comerciales
- **Roles y Permisos**: Admin y Comercial con permisos diferenciados
- **Middleware de Proteccion**: Rutas protegidas segun rol

### Panel de Administracion
- **Gestion de Comerciales**: Ver, aprobar, rechazar y eliminar
- **Gestion de Cotizaciones**: Ver todas las cotizaciones del sistema
- **Configuracion de Fees**: Tarifas por tipo de bono (admin)
- **Dashboard**: Estadisticas y metricas

### Cotizador Bonos 2.0 (Wizard)
- **Wizard de 4 pasos**: Datos empresa > Configuracion > Carga datos > Resultados
- **Multiples tipos de bonos**: Mera liberalidad, alimentacion, dotacion, viaticos
- **Carga por lotes**: Input manual o carga masiva
- **PDF profesional**: Generacion con branding Tikin
- **Guardado en Supabase**: Registro automatico con usuario asociado

### Motor de Calculo
- **6 Contribuciones Parafiscales**: Salud, Pension, ARL, SENA, ICBF, Caja
- **Comision Tikin configurable**: Tarifas por tipo de bono desde admin
- **Ahorros estimados**: Calculo mensual y anual

### Portal Comercial
- **Dashboard Personal**: Metricas de cotizaciones propias
- **Mis Cotizaciones**: Historial con filtros y gestion de estado
- **Acceso a Cotizador**: Crear nuevas cotizaciones

## Stack Tecnologico

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + TypeScript
- **Styling**: Tailwind CSS
- **Auth**: Supabase Auth + Magic Links
- **Database**: Supabase (PostgreSQL)
- **PDF**: pdfmake
- **State**: Zustand (wizard)
- **Email**: Gmail API (nodemailer)
- **Deployment**: Vercel

## Estructura del Proyecto

```
/app
├── /admin              # Panel de administracion
│   ├── /comerciales    # Gestion de comerciales
│   ├── /cotizaciones   # Todas las cotizaciones
│   ├── /dashboard      # Dashboard admin
│   ├── /fees           # Configuracion de tarifas
│   └── /usuarios       # Gestion de usuarios
├── /auth               # Rutas de autenticacion
├── /bonos             # Cotizador Bonos 2.0 (wizard)
├── /comercial          # Portal comercial
│   ├── /cotizaciones   # Mis cotizaciones
│   └── /dashboard      # Dashboard comercial
├── /cotizaciones       # Mis cotizaciones (usuario)
├── /login              # Pagina de login
└── /pending-approval   # Espera de aprobacion

/components
├── /bonos             # Componentes del wizard Bonos 2.0
│   └── /wizard         # Steps del wizard
├── AppLayout.tsx       # Layout principal
├── Sidebar.tsx         # Navegacion lateral
└── Header.tsx          # Header con branding

/lib
├── /actions            # Server Actions
├── /auth               # Utilidades de autenticacion
├── /bonos             # Calculos Bonos 2.0
├── /calculations       # Motor de calculo parafiscales
├── /email              # Sistema de emails
├── /pdf                # Generacion de PDF
├── /supabase           # Cliente y queries Supabase
└── /utils              # Utilidades generales

/store
└── bonos2Store.ts      # Estado del wizard (Zustand)

/supabase
└── /migrations         # Migraciones SQL
```

## Quick Start

### Requisitos
- Node.js 18+
- Cuenta en Supabase

### Instalacion

```bash
git clone <repo-url>
cd simulador
npm install
cp .env.local.example .env.local
# Edita .env.local con tus credenciales
```

### Variables de Entorno

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

### Configuracion de Supabase

Ver guia completa: **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)**

### Ejecutar

```bash
npm run dev
```

Disponible en [http://localhost:3000](http://localhost:3000)

## Base de Datos

### Tablas Principales

| Tabla | Descripcion |
|-------|-------------|
| `user_profiles` | Perfiles de usuario (admin/comercial) |
| `comercial_invitations` | Invitaciones para comerciales |
| `quotations_bonos2` | Cotizaciones generadas |
| `fee_config` | Tarifas por tipo de bono |
| `login_tokens` | Tokens de magic link |

Ver schema completo: `supabase/migrations/20260209_quotations_bonos2.sql`

## Roles y Permisos

| Funcionalidad | Admin | Comercial |
|---------------|-------|-----------|
| Panel Admin | Si | No |
| Gestionar Comerciales | Si | No |
| Ver Todas las Cotizaciones | Si | No |
| Configurar Fees | Si | No |
| Usar Cotizador | Si | Si |
| Ver Propias Cotizaciones | Si | Si |
| Generar PDF | Si | Si |

## Guias

- **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)** - Configuracion de base de datos
- **[DEPLOYMENT.md](DEPLOYMENT.md)** - Deployment en Vercel

## Scripts

```bash
npm run dev          # Desarrollo
npm run build        # Build produccion
npm run start        # Servidor produccion
npm run lint         # Linter
```

---

Desarrollado para Tikin - Plataforma de Flexibilidad Salarial
