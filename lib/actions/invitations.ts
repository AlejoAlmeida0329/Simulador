/**
 * SERVER ACTIONS - Aceptación de Invitaciones
 */

'use server'

import { createClient as createServerClient } from '@supabase/supabase-js'
import { z } from 'zod'

const invitationIdSchema = z.string().uuid('ID de invitación inválido')
const emailSchema = z.string().email('Email inválido')

/**
 * Procesar aceptación de invitación
 * Crea el usuario en Supabase Auth + user_profiles
 */
export async function acceptInvitation(invitationId: string): Promise<{
  success: boolean
  error?: string
}> {
  try {
    // Validate input
    const parsed = invitationIdSchema.safeParse(invitationId)
    if (!parsed.success) {
      return { success: false, error: 'ID de invitación inválido' }
    }

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

    // 3. Try creating user in Auth (avoids loading all users with listUsers)
    const { data: newAuthUser, error: createAuthError } = await supabaseAdmin.auth.admin.createUser({
      email: invitation.email,
      email_confirm: true,
      user_metadata: {
        full_name: invitation.full_name,
        company_name: invitation.company_name,
      },
    })

    let userId: string

    if (!createAuthError && newAuthUser.user) {
      // New user created successfully
      userId = newAuthUser.user.id
    } else {
      // User might already exist in Auth - check if they also have a profile
      const { data: existingProfile } = await supabaseAdmin
        .from('user_profiles')
        .select('id')
        .eq('email', invitation.email)
        .single()

      if (existingProfile) {
        return { success: false, error: 'Ya existe un usuario con este email' }
      }

      // Orphan user (exists in Auth but no profile) - get their ID via generateLink
      const { data: linkData, error: linkError } = await supabaseAdmin.auth.admin.generateLink({
        type: 'magiclink',
        email: invitation.email,
      })

      if (linkError || !linkData.user) {
        return { success: false, error: 'Error al crear el usuario' }
      }

      userId = linkData.user.id
    }

    // 4. Crear perfil en user_profiles (usar upsert para evitar duplicados)
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
      return {
        success: false,
        error: `Error al crear el perfil de usuario: ${profileError.message || profileError.code || 'desconocido'}`
      }
    }

    // 5. Marcar invitación como aceptada
    const { error: updateError } = await supabaseAdmin
      .from('comercial_invitations')
      .update({ status: 'accepted' })
      .eq('id', invitationId)

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
    // Validate input
    const parsed = emailSchema.safeParse(email)
    if (!parsed.success) {
      return { success: false, error: 'Email inválido' }
    }
    const validEmail = parsed.data

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
        email: validEmail,
        expires_at: expiresAt.toISOString(),
      })
      .select('token')
      .single()

    if (tokenError || !tokenData) {
      return { success: false, error: 'Error al generar el token de acceso' }
    }

    // Enviar email con Gmail
    const { sendMagicLinkEmail } = await import('@/lib/email/gmail')
    const emailResult = await sendMagicLinkEmail({
      to: validEmail,
      full_name: fullName,
      loginToken: tokenData.token,
    })

    if (!emailResult.success) {
      return { success: false, error: 'Error al enviar el email' }
    }

    return { success: true }
  } catch (error: any) {
    console.error('Error in sendLoginLink:', error)
    return { success: false, error: error.message || 'Error desconocido' }
  }
}
