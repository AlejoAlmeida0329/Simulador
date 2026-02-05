/**
 * DEV LOGIN - Solo para desarrollo
 * ELIMINAR EN PRODUCCIÓN
 */

'use client'

import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useState } from 'react'

export default function DevLoginPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleDevLogin = async () => {
    setLoading(true)
    setMessage('')

    try {
      const supabase = createClient()

      // Buscar el usuario admin en user_profiles
      const { data: profile, error: profileError } = await supabase
        .from('user_profiles')
        .select('id, email')
        .eq('email', 'alejandro@tikin.is')
        .single()

      if (profileError || !profile) {
        setMessage('❌ No se encontró el perfil de admin')
        setLoading(false)
        return
      }

      // Intentar login sin password (solo para desarrollo)
      // Esto funciona porque Supabase permite signInWithPassword con email vacío en dev
      const { data, error } = await supabase.auth.signInWithOtp({
        email: 'alejandro@tikin.is',
        options: {
          shouldCreateUser: false,
        },
      })

      if (error) {
        if (error.message.includes('rate_limit') || error.message.includes('Email rate limit')) {
          setMessage('⏳ Rate limit activo. Espera 1-2 minutos e intenta de nuevo.')
        } else {
          setMessage(`❌ Error: ${error.message}`)
        }
        setLoading(false)
        return
      }

      setMessage('✅ Email enviado. Revisa tu correo.')
      setLoading(false)
    } catch (err: any) {
      setMessage(`❌ Error: ${err.message}`)
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">🔧 Dev Login</h1>
          <p className="text-gray-600 text-sm">Solo para desarrollo - Eliminar en producción</p>
        </div>

        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Rate Limit Activo</strong>
              <br />
              Espera 1-2 minutos entre intentos de login.
            </p>
          </div>

          <button
            onClick={handleDevLogin}
            disabled={loading}
            className="w-full bg-gradient-to-r from-tikin-red to-red-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? '⏳ Enviando...' : '📧 Enviar Magic Link'}
          </button>

          {message && (
            <div
              className={`p-4 rounded-lg ${
                message.includes('✅')
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : message.includes('⏳')
                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}
            >
              <p className="text-sm">{message}</p>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-500 text-center">
              Usuario: alejandro@tikin.is
              <br />
              Revisa tu correo después de hacer clic
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
