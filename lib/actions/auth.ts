/**
 * SERVER ACTIONS - Autenticación
 */

'use server'

import { createClient as createServerClient } from '@supabase/supabase-js'

/**
 * Solicitar Magic Link para login
 * Genera un token y envía el email con Gmail
 */
export async function requestLoginLink(email: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Usar service role para operaciones admin
    const supabaseAdmin = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    )

    // 1. Verificar que el usuario existe en user_profiles
    const { data: userProfile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id, full_name, approved')
      .eq('email', email)
      .single()

    if (profileError || !userProfile) {
      return {
        success: false,
        error: 'No existe una cuenta con este email. Por favor contacta al administrador.'
      }
    }

    // 2. Verificar que el usuario está aprobado
    if (!userProfile.approved) {
      return {
        success: false,
        error: 'Tu cuenta está pendiente de aprobación. Por favor espera a que un administrador apruebe tu acceso.'
      }
    }

    // 3. Verificar que existe en Supabase Auth
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const authUser = authUsers.users.find(u => u.email === email)

    if (!authUser) {
      return {
        success: false,
        error: 'Error de configuración de cuenta. Por favor contacta al administrador.'
      }
    }

    // 4. Generar token que expira en 15 minutos
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000)

    const { data: tokenData, error: tokenError } = await supabaseAdmin
      .from('login_tokens')
      .insert({
        email,
        expires_at: expiresAt.toISOString(),
      })
      .select('token')
      .single()

    if (tokenError || !tokenData) {
      console.error('Error creating login token:', tokenError)
      return { success: false, error: 'Error al generar el token de acceso' }
    }

    // 5. Enviar email con Gmail
    const { sendMagicLinkEmail } = await import('@/lib/email/gmail')
    const emailResult = await sendMagicLinkEmail({
      to: email,
      full_name: userProfile.full_name,
      loginToken: tokenData.token,
    })

    if (!emailResult.success) {
      console.error('Error sending magic link email:', emailResult.error)
      return { success: false, error: 'Error al enviar el email' }
    }

    console.log('✅ Magic link sent to:', email)
    return { success: true }
  } catch (error: any) {
    console.error('Error in requestLoginLink:', error)
    return { success: false, error: error.message || 'Error desconocido' }
  }
}
