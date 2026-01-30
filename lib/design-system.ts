// Sistema de Diseño Tikin

export const colors = {
  // Colores principales
  tikin: {
    red: '#FF3333',
    black: '#000000',
    white: '#FFFFFF',
  },

  // Escala de grises
  gray: {
    50: '#F9FAFB',
    100: '#F3F4F6',
    200: '#E5E7EB',
    300: '#D1D5DB',
    400: '#9CA3AF',
    500: '#6B7280',
    600: '#4B5563',
    700: '#374151',
    800: '#1F2937',
    900: '#111827',
  },

  // Colores semánticos
  success: {
    light: '#DCFCE7',
    main: '#16A34A',
    dark: '#15803D',
  },

  error: {
    light: '#FEE2E2',
    main: '#DC2626',
    dark: '#B91C1C',
  },

  warning: {
    light: '#FEF3C7',
    main: '#F59E0B',
    dark: '#D97706',
  },

  info: {
    light: '#DBEAFE',
    main: '#3B82F6',
    dark: '#2563EB',
  },
}

export const typography = {
  // Familias de fuentes
  fontFamily: {
    primary: 'system-ui, -apple-system, sans-serif',
    mono: 'Monaco, Courier, monospace',
  },

  // Tamaños de fuente (web)
  fontSize: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '1.875rem', // 30px
    '4xl': '2.25rem',  // 36px
  },

  // Pesos de fuente
  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
  },

  // Alturas de línea
  lineHeight: {
    tight: 1.25,
    normal: 1.5,
    relaxed: 1.75,
  },
}

export const spacing = {
  // Espaciado en píxeles
  px: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    '2xl': 48,
    '3xl': 64,
  },
}

export const borderRadius = {
  none: '0',
  sm: '0.25rem',   // 4px
  md: '0.5rem',    // 8px
  lg: '0.75rem',   // 12px
  xl: '1rem',      // 16px
  full: '9999px',
}

export const shadows = {
  sm: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
  md: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
  lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
  xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
}

// Sistema de diseño para PDF
export const pdfDesign = {
  colors: {
    primary: [255, 51, 51],      // Tikin Red RGB
    black: [17, 24, 39],          // Gray 900
    darkGray: [75, 85, 99],       // Gray 600
    mediumGray: [156, 163, 175],  // Gray 400
    lightGray: [243, 244, 246],   // Gray 100
    white: [255, 255, 255],
    success: [22, 163, 74],       // Green
    successBg: [220, 252, 231],   // Light green
    errorBg: [254, 242, 242],     // Light red
  },

  fonts: {
    sizes: {
      h1: 24,
      h2: 18,
      h3: 14,
      h4: 12,
      body: 10,
      small: 9,
      tiny: 8,
    },
  },

  spacing: {
    margin: 20,
    sectionGap: 15,
    elementGap: 8,
    smallGap: 4,
  },

  layout: {
    pageWidth: 210, // A4
    pageHeight: 297, // A4
  },
}
