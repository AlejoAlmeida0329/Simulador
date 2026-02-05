/**
 * Magic Link Login Handler
 * Procesa el token del Magic Link y hace login del usuario
 */

import { createServerClient } from '@supabase/ssr'
import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/login?error=Token no válido', request.url))
  }

  try {
    // Usar anon client para leer tokens (permitido por RLS)
    const { createClient: createAnonClient } = await import('@supabase/supabase-js')
    const supabaseAnon = createAnonClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // 1. Buscar el token en la base de datos
    const { data: tokenData, error: tokenError } = await supabaseAnon
      .from('login_tokens')
      .select('*')
      .eq('token', token)
      .eq('used', false)
      .single()

    if (tokenError || !tokenData) {
      return NextResponse.redirect(new URL('/login?error=Token inválido o ya usado', request.url))
    }

    // 2. Verificar expiración
    if (new Date(tokenData.expires_at) < new Date()) {
      return NextResponse.redirect(new URL('/login?error=Token expirado', request.url))
    }

    // 3. Marcar token como usado
    await supabaseAnon
      .from('login_tokens')
      .update({ used: true })
      .eq('token', token)

    // 4. Crear cliente con service role para operaciones admin
    const { createClient: createServiceClient } = await import('@supabase/supabase-js')
    const supabaseAdmin = createServiceClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 5. Buscar el usuario por email
    const { data: userData, error: userError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('email', tokenData.email)
      .single()

    if (userError || !userData) {
      return NextResponse.redirect(new URL('/login?error=Usuario no encontrado', request.url))
    }

    // 6. Obtener el auth user ID
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authUsers.users.find(u => u.email === tokenData.email)

    if (!authUser) {
      return NextResponse.redirect(new URL('/login?error=Usuario no encontrado en Auth', request.url))
    }

    // 7. Usar signInWithPassword con una función helper del admin
    // En lugar de password, usamos el admin.generateLink con recovery
    const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
      type: 'recovery',
      email: tokenData.email,
    })

    if (linkError || !linkData) {
      console.error('Error generating recovery link:', linkError)
      return NextResponse.redirect(new URL('/login?error=Error al generar sesión', request.url))
    }

    // 8. El hashed_token es lo que necesitamos para hacer login
    const hashedToken = linkData.properties?.hashed_token

    if (!hashedToken) {
      console.error('No hashed token in response')
      return NextResponse.redirect(new URL('/login?error=Error al obtener token de sesión', request.url))
    }

    // 9. Usar el hashed token para verificar y obtener la sesión
    const { data: sessionData, error: sessionError } = await supabaseAdmin.auth.verifyOtp({
      type: 'recovery',
      token_hash: hashedToken,
    })

    if (sessionError || !sessionData.session) {
      console.error('Error verifying OTP:', sessionError)
      return NextResponse.redirect(new URL('/login?error=Error al crear sesión', request.url))
    }

    // 10. Crear respuesta y establecer cookies usando @supabase/ssr
    const cookieStore = await cookies()
    const response = NextResponse.redirect(new URL('/dashboard', request.url))

    // Usar createServerClient para establecer las cookies correctamente
    const supabaseResponse = createServerClient(
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

    // Establecer la sesión en el cliente SSR
    await supabaseResponse.auth.setSession({
      access_token: sessionData.session.access_token,
      refresh_token: sessionData.session.refresh_token,
    })

    return response
  } catch (error: any) {
    console.error('Error processing magic link:', error)
    return NextResponse.redirect(new URL('/login?error=Error al procesar el link', request.url))
  }
}
