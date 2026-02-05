/**
 * AUTH CALLBACK ROUTE HANDLER
 *
 * Maneja el redirect después del Magic Link
 * Intercambia el código de autenticación por una sesión
 * Redirige al usuario al dashboard según su rol
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: Request) {
  const { searchParams, origin, hash } = new URL(request.url)
  const code = searchParams.get('code')
  const token_hash = searchParams.get('token_hash')
  const type = searchParams.get('type')

  // Supabase puede enviar el token en diferentes formatos
  // Si no hay code, redirigir a una página client-side que maneje el hash
  if (!code && !token_hash && type !== 'recovery') {
    // Redirigir a una página que maneje el hash fragment
    return NextResponse.redirect(`${origin}/auth/callback-hash`)
  }

  if (!code) {
    console.error('❌ No se recibió código de autenticación')
    return NextResponse.redirect(`${origin}/login?error=no_code`)
  }

  // Crear response con headers para escribir cookies
  let response = NextResponse.next({
    request,
  })

  const cookieStore = await cookies()

  // Crear cliente de Supabase con manejo correcto de cookies para Route Handler
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  // Intercambiar código por sesión
  const { data: sessionData, error: sessionError } = await supabase.auth.exchangeCodeForSession(code)

  if (sessionError) {
    console.error('❌ Error en exchangeCodeForSession:', sessionError)
    return NextResponse.redirect(`${origin}/login?error=session_failed`)
  }

  if (!sessionData.session) {
    console.error('❌ No se obtuvo sesión después de exchangeCodeForSession')
    return NextResponse.redirect(`${origin}/login?error=no_session`)
  }

  // Obtener el perfil del usuario para saber su rol
  const { data: { user } } = await supabase.auth.getUser()

  let redirectPath = '/admin/dashboard' // Default

  if (user) {
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('role, approved, approval_status')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ Error obteniendo perfil:', profileError)
    }

    if (profile) {
      // Verificar aprobación
      const isApproved = profile.approval_status === 'approved' || profile.approved === true

      if (!isApproved) {
        redirectPath = '/pending-approval'
      } else {
        // Redirigir según rol
        redirectPath = profile.role === 'admin' ? '/admin/dashboard' : '/comercial/dashboard'
        console.log(`✅ Usuario autenticado: ${user.email} | Rol: ${profile.role} | Redirect: ${redirectPath}`)
      }
    }
  }

  // Crear redirect response con las cookies establecidas
  const forwardedHost = request.headers.get('x-forwarded-host')
  const isLocalEnv = process.env.NODE_ENV === 'development'

  let redirectUrl: string
  if (isLocalEnv) {
    redirectUrl = `${origin}${redirectPath}`
  } else if (forwardedHost) {
    redirectUrl = `https://${forwardedHost}${redirectPath}`
  } else {
    redirectUrl = `${origin}${redirectPath}`
  }

  // Crear nuevo response con redirect manteniendo las cookies
  response = NextResponse.redirect(redirectUrl)

  // Re-aplicar cookies al response de redirect
  cookieStore.getAll().forEach(cookie => {
    response.cookies.set(cookie.name, cookie.value)
  })

  return response
}
