/**
 * TIPOS PARA SISTEMA DE INVITACIONES
 */

export type InvitationStatus = 'pending' | 'accepted' | 'expired' | 'cancelled'

/**
 * Invitación a comercial
 */
export interface ComercialInvitation {
  /** UUID de la invitación */
  id: string
  /** Email del invitado */
  email: string
  /** Nombre completo del invitado */
  full_name: string
  /** Nombre de la empresa (opcional) */
  company_name: string | null
  /** UUID del admin que invitó */
  invited_by: string
  /** Estado de la invitación */
  status: InvitationStatus
  /** Token único para el link de invitación */
  token: string
  /** Fecha de creación */
  created_at: string
  /** Fecha de expiración */
  expires_at: string
  /** Fecha de aceptación (si fue aceptada) */
  accepted_at: string | null
}

/**
 * Invitación con información del admin que invitó
 */
export interface ComercialInvitationWithAdmin extends ComercialInvitation {
  admin: {
    email: string
    full_name: string | null
  }
}

/**
 * Formulario para crear invitación
 */
export interface CreateInvitationInput {
  email: string
  full_name: string
  company_name?: string
}

/**
 * Resultado de crear invitación
 */
export interface CreateInvitationResult {
  success: boolean
  invitation?: ComercialInvitation
  error?: string
}

/**
 * Resultado de aceptar invitación
 */
export interface AcceptInvitationResult {
  success: boolean
  redirectTo?: string
  error?: string
}
