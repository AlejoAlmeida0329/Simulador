import { createBrowserClient } from '@supabase/ssr'
import { SupabaseClient } from '@supabase/supabase-js'

// Función para verificar si Supabase está configurado
export function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return !!(
    url &&
    key &&
    url.startsWith('http') &&
    url !== 'your_supabase_project_url' &&
    key !== 'your_supabase_anon_key'
  )
}

// Cliente lazy - solo se crea cuando se accede
let _supabase: SupabaseClient | null = null

function getSupabaseClient(): SupabaseClient {
  if (_supabase) return _supabase

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''

  if (!isSupabaseConfigured()) {
    console.warn('⚠️ Supabase credentials not configured. Database features will be disabled.')
  }

  // Usar createBrowserClient para correcto manejo de cookies en el navegador
  _supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)
  return _supabase
}

// Exportar como proxy para acceso lazy
export const supabase = new Proxy({} as SupabaseClient, {
  get: (target, prop) => {
    const client = getSupabaseClient()
    return (client as any)[prop]
  }
})

// Exportar función createClient para compatibilidad con AuthContext y componentes
// IMPORTANTE: createBrowserClient maneja cookies correctamente en Next.js App Router
export function createClient(): SupabaseClient {
  return getSupabaseClient()
}
