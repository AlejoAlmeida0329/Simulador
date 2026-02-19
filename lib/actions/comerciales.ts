/**
 * SERVER ACTIONS - Gestión de Comerciales e Invitaciones
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import { sendComercialInvitation } from '@/lib/email/resend'
import { z } from 'zod'
import type {
  ComercialInvitation,
  ComercialInvitationWithAdmin,
  CreateInvitationInput,
  CreateInvitationResult,
} from '@/types/invitations'
import type { UserProfile } from '@/types/auth'

const uuidSchema = z.string().uuid('ID inválido')

/**
 * Obtener todos los comerciales
 */
export async function getAllComerciales(): Promise<UserProfile[]> {
  await requireAdmin()

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('role', 'comercial')
    .order('created_at', { ascending: false })

  if (error) {
    return []
  }

  return data as UserProfile[]
}

/**
 * Obtener todas las invitaciones pendientes
 */
export async function getPendingInvitations(): Promise<ComercialInvitationWithAdmin[]> {
  await requireAdmin()

  const supabase = await createClient()

  // Obtener invitaciones
  const { data: invitations, error } = await supabase
    .from('comercial_invitations')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    return []
  }

  if (!invitations || invitations.length === 0) {
    return []
  }

  // Obtener IDs únicos de admins
  const adminIds = [...new Set(invitations.map(inv => inv.invited_by).filter(Boolean))]

  // Obtener información de admins en una sola consulta
  const { data: admins } = await supabase
    .from('user_profiles')
    .select('id, email, full_name')
    .in('id', adminIds)

  // Crear un mapa de admins para acceso rápido
  const adminMap = new Map(admins?.map(admin => [admin.id, admin]) || [])

  // Combinar datos
  return invitations.map(inv => {
    const admin = inv.invited_by ? adminMap.get(inv.invited_by) : null
    return {
      ...inv,
      admin: admin ? {
        email: admin.email,
        full_name: admin.full_name || null,
      } : null,
    }
  }) as ComercialInvitationWithAdmin[]
}

/**
 * Crear nueva invitación
 */
export async function createInvitation(
  input: CreateInvitationInput
): Promise<CreateInvitationResult> {
  try {
    const admin = await requireAdmin()
    const supabase = await createClient()

    // Validar email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(input.email)) {
      return { success: false, error: 'Email inválido' }
    }

    // Verificar que no existe ya un usuario con ese email
    const { data: existingUser } = await supabase
      .from('user_profiles')
      .select('id')
      .eq('email', input.email)
      .single()

    if (existingUser) {
      return { success: false, error: 'Ya existe un usuario con ese email' }
    }

    // Verificar que no hay invitación pendiente para ese email
    const { data: existingInvitation } = await supabase
      .from('comercial_invitations')
      .select('id')
      .eq('email', input.email)
      .eq('status', 'pending')
      .single()

    if (existingInvitation) {
      return { success: false, error: 'Ya existe una invitación pendiente para ese email' }
    }

    // Crear invitación
    const { data: invitation, error } = await supabase
      .from('comercial_invitations')
      .insert({
        email: input.email.toLowerCase().trim(),
        full_name: input.full_name.trim(),
        company_name: input.company_name?.trim() || null,
        invited_by: admin.id,
      })
      .select()
      .single()

    if (error) {
      return { success: false, error: 'Error al crear la invitación' }
    }

    // Enviar email de invitación
    const emailResult = await sendComercialInvitation({
      to: invitation.email,
      full_name: invitation.full_name,
      invitationId: invitation.id!,
    })

    if (!emailResult.success && !emailResult.warning) {
      // Email failed but invitation was created
    } else if (emailResult.warning) {
      // Email not configured
    }

    revalidatePath('/admin/comerciales')

    return { success: true, invitation: invitation as ComercialInvitation }
  } catch (error: any) {
    console.error('Error in createInvitation:', error)
    return { success: false, error: error.message || 'Error desconocido' }
  }
}

/**
 * Eliminar invitación (hard delete)
 */
export async function cancelInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = uuidSchema.safeParse(invitationId)
    if (!parsed.success) return { success: false, error: 'ID de invitación inválido' }

    await requireAdmin()

    // Usar service role para bypassear RLS en eliminaciones
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

    // Primero verificar que la invitación existe
    const { data: existingInv, error: checkError } = await supabaseAdmin
      .from('comercial_invitations')
      .select('id, email, status')
      .eq('id', invitationId)
      .single()

    if (checkError || !existingInv) {
      return { success: false, error: 'Invitación no encontrada' }
    }

    // Eliminar sin filtro de status (permitir eliminar cualquier invitación)
    const { error } = await supabaseAdmin
      .from('comercial_invitations')
      .delete()
      .eq('id', invitationId)

    if (error) {
      return { success: false, error: 'Error al eliminar la invitación' }
    }

    revalidatePath('/admin/comerciales')
    return { success: true }
  } catch (error: any) {
    console.error('❌ Error in cancelInvitation:', error)
    return { success: false, error: error.message || 'Error desconocido' }
  }
}

/**
 * Reenviar invitación
 */
export async function resendInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = uuidSchema.safeParse(invitationId)
    if (!parsed.success) return { success: false, error: 'ID de invitación inválido' }

    await requireAdmin()
    const supabase = await createClient()

    // Obtener la invitación
    const { data: invitation, error: fetchError } = await supabase
      .from('comercial_invitations')
      .select('id, email, full_name')
      .eq('id', invitationId)
      .eq('status', 'pending')
      .single()

    if (fetchError || !invitation) {
      return { success: false, error: 'Invitación no encontrada' }
    }

    // Extender expiración
    const { error: updateError } = await supabase
      .from('comercial_invitations')
      .update({
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .eq('id', invitationId)

    if (updateError) {
      return { success: false, error: 'Error al actualizar la invitación' }
    }

    // Reenviar email
    const emailResult = await sendComercialInvitation({
      to: invitation.email,
      full_name: invitation.full_name,
      invitationId: invitation.id!,
    })

    if (!emailResult.success) {
      return { success: false, error: 'Error al reenviar el email' }
    }

    revalidatePath('/admin/comerciales')

    return { success: true }
  } catch (error: any) {
    console.error('Error in resendInvitation:', error)
    return { success: false, error: error.message || 'Error desconocido' }
  }
}

/**
 * Actualizar estado de aprobación de un comercial
 */
export async function updateComercialApproval(
  userId: string,
  approved: boolean
): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = uuidSchema.safeParse(userId)
    if (!parsed.success) return { success: false, error: 'ID de usuario inválido' }

    await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('user_profiles')
      .update({
        approved,
        approval_status: approved ? 'approved' : 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .eq('role', 'comercial')

    if (error) {
      return { success: false, error: 'Error al actualizar el estado' }
    }

    revalidatePath('/admin/comerciales')

    return { success: true }
  } catch (error: any) {
    console.error('Error in updateComercialApproval:', error)
    return { success: false, error: error.message || 'Error desconocido' }
  }
}

/**
 * Eliminar comercial (hard delete - elimina completamente)
 */
export async function deleteComercial(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const parsed = uuidSchema.safeParse(userId)
    if (!parsed.success) return { success: false, error: 'ID de usuario inválido' }

    await requireAdmin()

    // Usar service role para bypassear RLS en eliminaciones
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

    // 1. Obtener el email del comercial antes de eliminarlo
    const { data: userProfile, error: fetchError } = await supabaseAdmin
      .from('user_profiles')
      .select('email')
      .eq('id', userId)
      .eq('role', 'comercial')
      .single()

    if (fetchError || !userProfile) {
      return { success: false, error: 'Comercial no encontrado' }
    }

    // 2. Eliminar el usuario de user_profiles
    const { error: deleteUserError } = await supabaseAdmin
      .from('user_profiles')
      .delete()
      .eq('id', userId)
      .eq('role', 'comercial')

    if (deleteUserError) {
      return { success: false, error: 'Error al eliminar el comercial' }
    }

    // 3. Eliminar la invitación asociada de comercial_invitations
    const { error: deleteInvError } = await supabaseAdmin
      .from('comercial_invitations')
      .delete()
      .eq('email', userProfile.email)

    if (deleteInvError) {
      // Non-critical: user already deleted from user_profiles
    }

    revalidatePath('/admin/comerciales')
    return { success: true }
  } catch (error: any) {
    console.error('❌ Error in deleteComercial:', error)
    return { success: false, error: error.message || 'Error desconocido' }
  }
}

/**
 * Obtener estadísticas de comerciales
 */
export async function getComercialesStats(): Promise<{
  total: number
  active: number
  pending: number
  rejected: number
  pendingInvitations: number
}> {
  await requireAdmin()
  const supabase = await createClient()

  // Fetch all comerciales approval_status + pending invitations count in parallel
  const [comercialesResult, invitationsResult] = await Promise.all([
    supabase
      .from('user_profiles')
      .select('approval_status')
      .eq('role', 'comercial'),
    supabase
      .from('comercial_invitations')
      .select('id', { count: 'exact', head: true })
      .eq('status', 'pending'),
  ])

  const comerciales = comercialesResult.data || []
  const total = comerciales.length
  const active = comerciales.filter(c => c.approval_status === 'approved').length
  const pending = comerciales.filter(c => c.approval_status === 'pending').length
  const rejected = comerciales.filter(c => c.approval_status === 'rejected').length

  return {
    total,
    active,
    pending,
    rejected,
    pendingInvitations: invitationsResult.count || 0,
  }
}
