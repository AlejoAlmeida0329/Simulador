/**
 * SERVER ACTIONS - Aceptación de Invitaciones
 */

'use server'

import { createClient as createServerClient } from '@supabase/supabase-js'

/**
 * Procesar aceptación de invitación
 * Crea el usuario en Supabase Auth + user_profiles
 */
export async function acceptInvitation(invitationId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Usar service role para crear usuario
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

    // 1. Obtener invitación
    const { data: invitation, error: invError } = await supabaseAdmin
      .from('comercial_invitations')
      .select('*')
      .eq('id', invitationId)
      .eq('status', 'pending')
      .single()

    if (invError || !invitation) {
      return { success: false, error: 'Invitación no encontrada o ya fue utilizada' }
    }

    // 2. Verificar expiración
    if (new Date(invitation.expires_at) < new Date()) {
      return { success: false, error: 'Esta invitación ha expirado' }
    }

    // 3. Verificar si existe usuario en Auth
    const { data: authUsers } = await supabaseAdmin.auth.admin.listUsers()
    const existingAuthUser = authUsers.users.find(u => u.email === invitation.email)

    let userId: string

    // 4. Si existe en Auth, verificar si también tiene perfil
    if (existingAuthUser) {
      const { data: profileCheck } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('id', existingAuthUser.id)
        .single()

      if (profileCheck) {
        // Usuario completo ya existe
        return { success: false, error: 'Ya existe un usuario con este email' }
      }

      // Usuario huérfano - tiene Auth pero no perfil
      console.log('⚠️ Usuario huérfano detectado:', existingAuthUser.id)
      userId = existingAuthUser.id
    } else {
      // 5. No existe en Auth - crear usuario completo
      const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.createUser({
        email: invitation.email,
        email_confirm: true,
        user_metadata: {
          full_name: invitation.full_name,
          company_name: invitation.company_name,
        },
      })

      if (authError || !authUser.user) {
        console.error('Error creating auth user:', authError)
        return { success: false, error: 'Error al crear el usuario' }
      }

      userId = authUser.user.id
    }

    // 6. Crear perfil en user_profiles (usar upsert para evitar duplicados)
    const { error: profileError } = await supabaseAdmin.from('user_profiles').upsert({
      id: userId,
      email: invitation.email,
      full_name: invitation.full_name,
      company_name: invitation.company_name,
      role: 'comercial',
      approval_status: 'approved',
      approved: true,
    }, {
      onConflict: 'id',
      ignoreDuplicates: false
    })

    if (profileError) {
      console.error('❌ Error creating user profile:', profileError)
      console.error('❌ Error details:', JSON.stringify(profileError, null, 2))
      console.error('❌ User ID:', userId)
      console.error('❌ Email:', invitation.email)
      return {
        success: false,
        error: `Error al crear el perfil de usuario: ${profileError.message || profileError.code || 'desconocido'}`
      }
    }

    // 7. Marcar invitación como aceptada
    const { error: updateError } = await supabaseAdmin
      .from('comercial_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId)

    if (updateError) {
      console.error('Error updating invitation:', updateError)
    }

    console.log('✅ Usuario creado/completado exitosamente:', invitation.email)
    return { success: true }
  } catch (error: any) {
    console.error('❌ Error in acceptInvitation:', error)
    return { success: false, error: error.message || 'Error desconocido' }
  }
}

/**
 * Enviar Magic Link para login después de aceptar invitación
 */
export async function sendLoginLink(email: string, fullName: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Usar service role para crear el token
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

    // Generar token que expira en 15 minutos
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

    // Enviar email con Gmail
    const { sendMagicLinkEmail } = await import('@/lib/email/gmail')
    const emailResult = await sendMagicLinkEmail({
      to: email,
      full_name: fullName,
      loginToken: tokenData.token,
    })

    if (!emailResult.success) {
      console.error('Error sending magic link email:', emailResult.error)
      return { success: false, error: 'Error al enviar el email' }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in sendLoginLink:', error)
    return { success: false, error: error.message || 'Error desconocido' }
  }
}
