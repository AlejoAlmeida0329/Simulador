# Simulador Tikin - Calculadora de Ahorros en Parafiscales

Herramienta profesional para el equipo comercial de Tikin que calcula y cotiza ahorros en parafiscales mediante flexibilización salarial.

## 🎯 Propósito

Sistema completo de cotización que permite al equipo comercial:
- Capturar datos del cliente y generar cotizaciones profesionales en PDF
- Demostrar ahorros instantáneos en parafiscales usando el modelo Tikin
- Calcular automáticamente la comisión Tikin según volumen
- Almacenar todas las cotizaciones en base de datos
- Presentar comparaciones visuales profesionales entre escenario tradicional y Tikin

## ✨ Características Principales

### 💼 Sistema de Cotización
- ✅ Modal de captura de datos del cliente (empresa, contacto, NIT, etc.)
- ✅ Generación de PDF profesional con branding Tikin completo
- ✅ Almacenamiento automático en Supabase de todas las cotizaciones
- ✅ Cálculo inteligente de comisión Tikin (4 niveles según volumen)
- ✅ Beneficio neto calculado (ahorro - comisión Tikin)

### 👥 Gestión de Empleados
- ✅ Agregar empleados individuales o en grupos
- ✅ Editar y eliminar empleados de la nómina
- ✅ Visualización de totales agregados
- ✅ Vista agrupada por rango salarial

### 🧮 Motor de Cálculo
- ✅ Cálculo preciso de 6 contribuciones parafiscales:
  - Salud (8.5%), Pensión (12%)
  - ARL (0.522% - 6.960% según nivel I-V)
  - SENA (2%), ICBF (3%), Caja (4%)
- ✅ Sistema de comisión Tikin por niveles:
  - Nivel 1 (< $80M): 4%
  - Nivel 2 ($80M-$150M): 3.5%
  - Nivel 3 ($150M-$500M): 2.5%
  - Nivel 4 ($500M-$1000M+): 1.8%

### 🎨 Experiencia de Usuario
- ✅ Slider interactivo de división salario/bono (60%-100%)
- ✅ Selector de nivel de riesgo ARL (Clase I-V)
- ✅ Actualizaciones en tiempo real
- ✅ Diseño profesional con branding Tikin
- ✅ Responsive (desktop, tablet, móvil)

### 📊 Comparación de Escenarios
- ✅ Escenario Tradicional (100% salario) vs. Tikin
- ✅ Visualización lado a lado con desglose completo
- ✅ Métricas de ahorro destacadas
- ✅ Proyección de beneficio neto anual

## 🛠 Stack Tecnológico

- **Framework**: Next.js 14 (App Router)
- **UI**: React 18 + TypeScript 5.9
- **Styling**: Tailwind CSS 3.4
- **PDF Generation**: pdfmake
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Vercel
- **Validation**: Zod 4.3

## 🚀 Quick Start

### Desarrollo Local

```bash
# Clonar repositorio
git clone https://github.com/tu-usuario/simulador-tikin.git
cd simulador-tikin

# Instalar dependencias
npm install

# Configurar Supabase
cp .env.local.example .env.local
# Edita .env.local con tus credenciales de Supabase

# Ejecutar en desarrollo
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

### Configuración de Supabase

Ver guía completa: **[SUPABASE_SETUP.md](SUPABASE_SETUP.md)**

### Deployment en Vercel

Ver guía paso a paso: **[DEPLOYMENT.md](DEPLOYMENT.md)**

## 📊 Flujo de Uso

1. **Captura de datos**: Completa información del cliente en el modal inicial
2. **Agregar empleados**: Ingresa salarios individuales o en grupos
3. **Configurar escenario**: Ajusta división salario/bono y nivel ARL
4. **Revisar comparación**: Ve ahorros entre escenario tradicional y Tikin
5. **Generar cotización**: Descarga PDF profesional con toda la información
6. **Registro automático**: La cotización se guarda en Supabase

## 🗄️ Base de Datos

Cada cotización almacena:
- Información del cliente
- Configuración de salario/bono
- Ahorros calculados
- Comisión Tikin
- Beneficio neto
- Metadata (fecha, PDF filename)

Ver schema: `supabase/schema.sql`

## 📈 Estado del Proyecto

**Versión 1.0 - Fase 1 Completa** ✅

- ✅ Calculadora de parafiscales
- ✅ Sistema de cotización con captura de datos
- ✅ Generación de PDF profesional con branding Tikin
- ✅ Integración con Supabase
- ✅ Cálculo automático de comisión Tikin
- ✅ Ready for production deployment

## 📝 Requisitos del Sistema

- Node.js 18+ (recomendado v24)
- npm 9+
- Navegadores modernos (Chrome, Firefox, Safari, Edge)

## 📄 Licencia

Proyecto interno de Tikin

---

💼 Desarrollado para Tikin - Plataforma de Flexibilidad Salarial
