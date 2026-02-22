/**
 * NEXT.JS MIDDLEWARE - Protección de Rutas y Autorización
 *
 * Intercepta todas las requests y maneja:
 * - Autenticación con Supabase
 * - Autorización basada en roles (admin/comercial)
 * - Verificación de aprobación de usuarios
 * - Refresh automático de tokens
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import type { UserProfile } from '@/types/auth'

export async function middleware(request: NextRequest) {
  // ==========================================
  // DEVELOP: Auth deshabilitado para desarrollo
  // Al mergear a master, revertir este archivo
  // ==========================================
  return NextResponse.next({ request })
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
