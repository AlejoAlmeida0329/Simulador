/**
 * TIPOS DE AUTENTICACIÓN Y PERFILES
 *
 * Define los tipos para user_profiles
 */

export type UserRole = 'comercial' | 'admin'
export type ApprovalStatus = 'pending' | 'approved' | 'rejected'

/**
 * Perfil de usuario extendido de Supabase Auth
 */
export interface UserProfile {
  /** UUID del usuario (mismo que auth.users) */
  id: string
  /** Email del usuario */
  email: string
  /** Nombre completo del usuario */
  full_name: string | null
  /** Nombre de la empresa */
  company_name: string | null
  /** Rol del usuario (comercial o admin) */
  role: UserRole
  /** Estado de aprobación del usuario (nueva columna) */
  approval_status?: ApprovalStatus
  /** DEPRECATED: Usar approval_status en su lugar */
  approved?: boolean
  /** Fecha de creación */
  created_at: string
  /** Fecha de última actualización */
  updated_at: string
}

/**
 * Sesión de usuario con perfil incluido
 */
export interface UserSession {
  user: {
    id: string
    email: string
  }
  profile: UserProfile
}
