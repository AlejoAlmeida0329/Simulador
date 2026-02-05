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
 */
export async function signOut(): Promise<void> {
  const supabase = createClient()
  await supabase.auth.signOut()
  
  // Limpiar storage
  localStorage.clear()
  sessionStorage.clear()
  
  // Redirigir al login
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
