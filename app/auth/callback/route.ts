/**
 * AUTH CALLBACK ROUTE HANDLER
 *
 * Maneja el redirect después del Magic Link
 * Intercambia el código de autenticación por una sesión
 * Redirige al usuario al dashboard
 */

import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')

  if (code) {
    const supabase = await createClient()
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      // Obtener el perfil del usuario para saber su rol
      const {
        data: { user },
      } = await supabase.auth.getUser()

      let redirectPath = '/admin/dashboard' // Default to admin

      if (user) {
        const { data: profile } = await supabase
          .from('user_profiles')
          .select('role, approved, approval_status')
          .eq('id', user.id)
          .single()

        if (profile) {
          // Verificar aprobación
          const isApproved = profile.approval_status === 'approved' || profile.approved === true

          if (!isApproved) {
            redirectPath = '/pending-approval'
          } else {
            // Redirigir según rol - DIRECTO al dashboard correcto
            redirectPath = profile.role === 'admin' ? '/admin/dashboard' : '/comercial/dashboard'
          }
        }
      }

      // IGNORAR parámetro next/redirectTo - SIEMPRE usar lógica basada en roles
      const finalPath = redirectPath // SIEMPRE usar redirectPath, nunca nextParam de Supabase

      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      if (isLocalEnv) {
        return NextResponse.redirect(`${origin}${finalPath}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${finalPath}`)
      } else {
        return NextResponse.redirect(`${origin}${finalPath}`)
      }
    }
  }

  // Error en autenticación - redirigir a login con mensaje
  return NextResponse.redirect(`${origin}/login?error=auth_failed`)
}
