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
  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          )
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // Obtener usuario autenticado
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname

  // ==========================================
  // RUTAS PÚBLICAS (sin autenticación)
  // ==========================================
  const publicPaths = ['/login', '/auth/callback', '/auth/callback-hash', '/auth/accept-invitation', '/logout', '/dev-login']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // Si está en ruta pública y autenticado, redirigir según rol
  // EXCEPTO: logout y callback-hash (necesitan completar su proceso)
  if (isPublicPath && user && pathname !== '/logout' && !pathname.startsWith('/auth/callback')) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, approved, approval_status')
      .eq('id', user.id)
      .single()

    // Verificar aprobación (soporta ambas columnas)
    const isApproved = profile?.approval_status === 'approved' || profile?.approved === true

    if (isApproved) {
      const url = request.nextUrl.clone()
      url.pathname = profile.role === 'admin' ? '/admin/dashboard' : '/comercial/dashboard'
      return NextResponse.redirect(url)
    }
  }

  // ==========================================
  // RUTA LEGACY: /dashboard (redirigir según rol)
  // ==========================================
  if (pathname === '/dashboard' && user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, approved, approval_status')
      .eq('id', user.id)
      .single()

    if (profile) {
      const isApproved = profile.approval_status === 'approved' || profile.approved === true

      if (isApproved) {
        const url = request.nextUrl.clone()
        url.pathname = profile.role === 'admin' ? '/admin/dashboard' : '/comercial/dashboard'
        return NextResponse.redirect(url)
      }
    }
  }

  // ==========================================
  // RUTAS PROTEGIDAS (requieren autenticación)
  // ==========================================
  const isAdminPath = pathname.startsWith('/admin')
  const isComercialPath = pathname.startsWith('/comercial')
  const isBonosPath = pathname.startsWith('/bonos')
  const isProtectedPath = isAdminPath || isComercialPath || isBonosPath

  // Redirigir a login si no está autenticado
  if (isProtectedPath && !user) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirectTo', pathname)
    return NextResponse.redirect(url)
  }

  // Verificar rol y aprobación si está autenticado
  if (isProtectedPath && user) {
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, approved, approval_status')
      .eq('id', user.id)
      .single()

    // Si no existe el perfil, cerrar sesión
    if (!profile) {
      const url = request.nextUrl.clone()
      url.pathname = '/logout'
      return NextResponse.redirect(url)
    }

    // Verificar aprobación (soporta ambas columnas)
    const isApproved = profile.approval_status === 'approved' || profile.approved === true

    if (!isApproved) {
      const url = request.nextUrl.clone()
      url.pathname = '/pending-approval'
      return NextResponse.redirect(url)
    }

    // Verificar autorización por rol
    if (isAdminPath && profile.role !== 'admin') {
      // Comercial intenta acceder a ruta de admin
      const url = request.nextUrl.clone()
      url.pathname = '/comercial/dashboard'
      return NextResponse.redirect(url)
    }

    if (isComercialPath && profile.role !== 'comercial') {
      // Admin intenta acceder a ruta de comercial
      const url = request.nextUrl.clone()
      url.pathname = '/admin/dashboard'
      return NextResponse.redirect(url)
    }

    // /bonos es accesible para ambos roles (admin y comercial)
    // No se requiere verificación adicional
  }

  return supabaseResponse
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
