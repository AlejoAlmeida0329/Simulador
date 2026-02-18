/**
 * AUTH HELPERS - CLIENT SIDE
 *
 * Funciones de autenticación para Client Components
 */

import { createClient } from '@/lib/supabase/client'
import { UserProfile } from '@/types/auth'

/**
 * Hook personalizado para obtener el perfil del usuario
 * Debe usarse dentro de un Client Component
 */
export async function getCurrentUserProfile(): Promise<UserProfile | null> {
  const supabase = createClient()
  
  const {
    data: { user },
  } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !profile) return null
  return profile as UserProfile
}

/**
 * Cierra la sesión del usuario
 * Redirige al route handler /logout que maneja la limpieza server-side
 */
export async function signOut(): Promise<void> {
  // Limpiar datos de cotizador persistidos en localStorage
  localStorage.removeItem('bonos-storage')

  // Cerrar sesión client-side (limpia tokens en memoria del SDK)
  const supabase = createClient()
  await supabase.auth.signOut()

  // POST al route handler que maneja logout server-side
  // Esto asegura limpieza completa de cookies y sesión
  await fetch('/logout', { method: 'POST' })
  window.location.href = '/login'
}

/**
 * Envía Magic Link de autenticación
 */
export async function sendMagicLink(email: string): Promise<{ error: Error | null }> {
  const supabase = createClient()
  
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  })

  return { error }
}
