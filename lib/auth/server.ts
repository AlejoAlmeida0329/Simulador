/**
 * AUTH HELPERS - SERVER SIDE
 *
 * Funciones de autenticación y autorización para Server Components y API Routes
 */

import { createClient } from '@/lib/supabase/server'
import { UserProfile, UserRole } from '@/types/auth'
import { cache } from 'react'

/**
 * Obtiene la sesión actual del usuario autenticado (con cache)
 */
export const getSession = cache(async () => {
  const supabase = await createClient()
  const {
    data: { session },
  } = await supabase.auth.getSession()
  return session
})

/**
 * Obtiene el usuario autenticado actual (con cache)
 */
export const getUser = cache(async () => {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return user
})

/**
 * Obtiene el perfil completo del usuario autenticado (con cache)
 */
export const getUserProfile = cache(async (): Promise<UserProfile | null> => {
  const user = await getUser()
  if (!user) return null

  const supabase = await createClient()
  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) return null
  return profile as UserProfile
})

/**
 * Verifica si el usuario tiene un rol específico
 */
export async function hasRole(role: UserRole): Promise<boolean> {
  const profile = await getUserProfile()
  return profile?.role === role
}

/**
 * Verifica si el usuario es admin
 */
export async function isAdmin(): Promise<boolean> {
  return hasRole('admin')
}

/**
 * Verifica si el usuario es comercial
 */
export async function isComercial(): Promise<boolean> {
  return hasRole('comercial')
}

/**
 * Verifica si el usuario está aprobado (soporta ambas columnas)
 */
export async function isApproved(): Promise<boolean> {
  const profile = await getUserProfile()
  return profile?.approval_status === 'approved' || profile?.approved === true
}

/**
 * Requiere autenticación - lanza error si no está autenticado
 */
export async function requireAuth(): Promise<UserProfile> {
  const profile = await getUserProfile()
  if (!profile) {
    throw new Error('No autenticado')
  }
  return profile
}

/**
 * Requiere rol específico - lanza error si no tiene el rol
 */
export async function requireRole(role: UserRole): Promise<UserProfile> {
  const profile = await requireAuth()
  if (profile.role !== role) {
    throw new Error(`Acceso denegado. Se requiere rol: ${role}`)
  }
  return profile
}

/**
 * Requiere que el usuario esté aprobado (soporta ambas columnas)
 */
export async function requireApproved(): Promise<UserProfile> {
  const profile = await requireAuth()
  const isUserApproved = profile.approval_status === 'approved' || profile.approved === true
  if (!isUserApproved) {
    throw new Error('Usuario no aprobado')
  }
  return profile
}

/**
 * Requiere rol admin
 */
export async function requireAdmin(): Promise<UserProfile> {
  return requireRole('admin')
}

/**
 * Requiere rol comercial
 */
export async function requireComercial(): Promise<UserProfile> {
  return requireRole('comercial')
}
