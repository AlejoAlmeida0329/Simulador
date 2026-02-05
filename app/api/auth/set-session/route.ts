/**
 * API ROUTE: Establecer sesión desde access_token
 *
 * Recibe access_token del cliente y establece la sesión server-side
 * para que el middleware pueda verla inmediatamente
 */

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token } = await request.json()

    if (!access_token) {
      return NextResponse.json(
        { error: 'No access_token provided' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()

    // Crear cliente de Supabase con manejo de cookies server-side
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
              cookieStore.set(name, value, options)
            })
          },
        },
      }
    )

    // Establecer sesión usando el access_token
    const { data, error } = await supabase.auth.setSession({
      access_token,
      refresh_token: refresh_token || '',
    })

    if (error) {
      console.error('❌ Error estableciendo sesión:', error)
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      )
    }

    if (!data.session) {
      return NextResponse.json(
        { error: 'No se pudo establecer la sesión' },
        { status: 500 }
      )
    }

    console.log('✅ Sesión establecida server-side para:', data.session.user.email)

    // Obtener perfil y rol
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('role, approved, approval_status')
      .eq('id', data.session.user.id)
      .single()

    let redirectPath = '/admin/dashboard'

    if (profile) {
      const isApproved = profile.approval_status === 'approved' || profile.approved === true

      if (!isApproved) {
        redirectPath = '/pending-approval'
      } else {
        redirectPath = profile.role === 'admin' ? '/admin/dashboard' : '/comercial/dashboard'
      }
    }

    return NextResponse.json({
      success: true,
      redirectPath,
      user: {
        email: data.session.user.email,
        role: profile?.role,
      },
    })
  } catch (error: any) {
    console.error('❌ Error en set-session:', error)
    return NextResponse.json(
      { error: error.message || 'Error interno' },
      { status: 500 }
    )
  }
}
