'use client'

/**
 * AUTH CALLBACK HASH - Client-side hash handler
 *
 * Maneja autenticación cuando Supabase envía el token en el hash fragment
 * (formato implicit flow en lugar de PKCE)
 *
 * FLUJO:
 * 1. Lee access_token del hash fragment (solo disponible en cliente)
 * 2. Envía token a API route para establecer sesión server-side
 * 3. API route establece cookies que el middleware puede ver
 * 4. Redirige al dashboard correspondiente
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export default function CallbackHashPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const handleCallback = async () => {
      try {
        const supabase = createClient()

        // Supabase automáticamente detecta y maneja el hash con el access_token
        const { data: { session }, error: sessionError } = await supabase.auth.getSession()

        if (sessionError) {
          console.error('❌ Error obteniendo sesión:', sessionError)
          setError(sessionError.message)
          setTimeout(() => router.push('/login?error=session_failed'), 2000)
          return
        }

        if (!session) {
          console.error('❌ No se obtuvo sesión')
          setError('No se pudo establecer la sesión')
          setTimeout(() => router.push('/login?error=no_session'), 2000)
          return
        }

        console.log('✅ Sesión obtenida desde hash en cliente')

        // IMPORTANTE: Establecer la sesión en el servidor para que el middleware la vea
        const response = await fetch('/api/auth/set-session', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            access_token: session.access_token,
            refresh_token: session.refresh_token,
          }),
        })

        const result = await response.json()

        if (!response.ok || !result.success) {
          console.error('❌ Error estableciendo sesión server-side:', result.error)
          setError(result.error || 'Error estableciendo sesión')
          setTimeout(() => router.push('/login?error=session_failed'), 2000)
          return
        }

        console.log(`✅ Sesión establecida server-side | Usuario: ${result.user.email} | Rol: ${result.user.role}`)

        // Ahora sí redirigir - el middleware verá las cookies
        window.location.href = result.redirectPath
      } catch (err: any) {
        console.error('❌ Error en callback:', err)
        setError(err.message)
        setTimeout(() => router.push('/login?error=callback_failed'), 2000)
      }
    }

    handleCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="inline-block p-4 bg-gradient-to-br from-tikin-red to-red-600 rounded-2xl shadow-lg mb-4">
          <svg
            className="w-12 h-12 text-white animate-spin"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        </div>
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          {error ? 'Error de autenticación' : 'Iniciando sesión...'}
        </h1>
        <p className="text-gray-600">
          {error || 'Verificando tu identidad y redirigiendo al dashboard'}
        </p>
      </div>
    </div>
  )
}
