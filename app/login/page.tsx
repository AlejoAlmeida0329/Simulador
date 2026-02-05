'use client'

/**
 * PÁGINA DE LOGIN
 *
 * Autenticación mediante Magic Link
 * - Usuario ingresa su email
 * - Recibe link de acceso directo en su correo
 * - Un click para acceder sin contraseñas
 */

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { notify } from '@/lib/utils/notifications'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (error) throw error

      setEmailSent(true)
      notify.success('Link de acceso enviado a tu correo')
    } catch (error: any) {
      notify.error(error.message || 'Error al enviar el link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-88px)] flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-50 p-4">
      <div className="max-w-md w-full animate-slide-up">
        {/* Logo y título */}
        <div className="text-center mb-4">
          <div className="mb-2">
            <div className="inline-block p-2.5 bg-gradient-to-br from-tikin-red to-red-600 rounded-2xl shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">
            Simulador de Bonos Tikin
          </h1>
          <p className="text-sm text-gray-600">
            Ingresa con tu email para acceder
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-5 border-2 border-gray-200">
          {!emailSent ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                  Email corporativo
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                  className="w-full px-4 py-2 border-2 border-gray-300 rounded-xl focus:ring-4 focus:ring-tikin-red focus:ring-opacity-50 focus:border-tikin-red transition-all duration-300"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-tikin-red to-red-600 text-white py-2 rounded-xl font-semibold hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Enviando...
                  </span>
                ) : 'Enviar link de acceso'}
              </button>

              <p className="text-xs text-gray-500 text-center pt-1">
                Te enviaremos un link seguro de acceso directo sin contraseña
              </p>
            </form>
          ) : (
            <div className="text-center space-y-3 animate-fade-in">
              <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center mx-auto shadow-lg transform hover:rotate-6 transition-transform duration-300">
                <svg
                  className="w-7 h-7 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>

              <div>
                <h3 className="text-lg font-bold text-gray-900 mb-1.5">
                  ¡Revisa tu correo!
                </h3>
                <p className="text-sm text-gray-600">
                  Hemos enviado un link de acceso a<br/>
                  <strong className="text-gray-900">{email}</strong>
                </p>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 rounded-xl p-2.5">
                <p className="text-xs text-gray-700">
                  Haz click en el link para ingresar automáticamente al simulador
                </p>
              </div>

              <button
                onClick={() => {
                  setEmailSent(false)
                  setEmail('')
                }}
                className="text-tikin-red hover:text-red-700 text-sm font-semibold transition-colors duration-300"
              >
                ← Usar otro email
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="text-center mt-3 space-y-1.5">
          <p className="text-sm text-gray-600">
            ¿Primera vez? <a href="/solicitud-acceso" className="text-tikin-red hover:text-red-700 font-semibold transition-colors">Solicita acceso aquí</a>
          </p>
          <p className="text-xs text-gray-500">
            o contacta a <a href="mailto:admin@tikin.com" className="text-gray-700 hover:text-gray-900 underline transition-colors">admin@tikin.com</a>
          </p>
        </div>
      </div>
    </div>
  )
}
