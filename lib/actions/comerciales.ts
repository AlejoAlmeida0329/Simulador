/**
 * SERVER ACTIONS - Gestión de Comerciales e Invitaciones
 */

'use server'

import { createClient } from '@/lib/supabase/server'
import { requireAdmin } from '@/lib/auth/server'
import { revalidatePath } from 'next/cache'
import type {
  ComercialInvitation,
  ComercialInvitationWithAdmin,
  CreateInvitationInput,
  CreateInvitationResult,
} from '@/types/invitations'
import type { UserProfile } from '@/types/auth'

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
    console.error('Error fetching comerciales:', error)
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
  const { data, error } = await supabase
    .from('comercial_invitations')
    .select(`
      *,
      admin:invited_by (
        email,
        full_name
      )
    `)
    .eq('status', 'pending')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching invitations:', error)
    return []
  }

  return data.map(inv => ({
    ...inv,
    admin: {
      email: inv.admin.email,
      full_name: inv.admin.full_name || null,
    },
  })) as ComercialInvitationWithAdmin[]
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
      console.error('Error creating invitation:', error)
      return { success: false, error: 'Error al crear la invitación' }
    }

    // TODO: Enviar email de invitación
    // await sendInvitationEmail(invitation)

    revalidatePath('/admin/comerciales')

    return { success: true, invitation: invitation as ComercialInvitation }
  } catch (error: any) {
    console.error('Error in createInvitation:', error)
    return { success: false, error: error.message || 'Error desconocido' }
  }
}

/**
 * Cancelar invitación
 */
export async function cancelInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()
    const supabase = await createClient()

    const { error } = await supabase
      .from('comercial_invitations')
      .update({ status: 'cancelled' })
      .eq('id', invitationId)
      .eq('status', 'pending')

    if (error) {
      console.error('Error cancelling invitation:', error)
      return { success: false, error: 'Error al cancelar la invitación' }
    }

    revalidatePath('/admin/comerciales')

    return { success: true }
  } catch (error: any) {
    console.error('Error in cancelInvitation:', error)
    return { success: false, error: error.message || 'Error desconocido' }
  }
}

/**
 * Reenviar invitación
 */
export async function resendInvitation(invitationId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // Obtener la invitación
    const { data: invitation, error: fetchError } = await supabase
      .from('comercial_invitations')
      .select('*')
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
      console.error('Error updating invitation:', updateError)
      return { success: false, error: 'Error al actualizar la invitación' }
    }

    // TODO: Reenviar email
    // await sendInvitationEmail(invitation)

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
      console.error('Error updating comercial approval:', error)
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
 * Eliminar comercial (soft delete - marca como inactivo)
 */
export async function deleteComercial(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin()
    const supabase = await createClient()

    // En lugar de eliminar, marcamos como rechazado/desactivado
    const { error } = await supabase
      .from('user_profiles')
      .update({
        approved: false,
        approval_status: 'rejected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .eq('role', 'comercial')

    if (error) {
      console.error('Error deleting comercial:', error)
      return { success: false, error: 'Error al eliminar el comercial' }
    }

    revalidatePath('/admin/comerciales')

    return { success: true }
  } catch (error: any) {
    console.error('Error in deleteComercial:', error)
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

  // Contar comerciales por estado
  const { count: total } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'comercial')

  const { count: active } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'comercial')
    .eq('approval_status', 'approved')

  const { count: pending } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'comercial')
    .eq('approval_status', 'pending')

  const { count: rejected } = await supabase
    .from('user_profiles')
    .select('*', { count: 'exact', head: true })
    .eq('role', 'comercial')
    .eq('approval_status', 'rejected')

  const { count: pendingInvitations } = await supabase
    .from('comercial_invitations')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'pending')

  return {
    total: total || 0,
    active: active || 0,
    pending: pending || 0,
    rejected: rejected || 0,
    pendingInvitations: pendingInvitations || 0,
  }
}
