'use client'

/**
 * PAGINA DE LOGIN
 *
 * Autenticacion mediante Magic Link
 * - Usuario ingresa su email
 * - Recibe link de acceso directo en su correo
 * - Un click para acceder sin contrasenas
 */

import { useState } from 'react'
import { Lock, Mail } from 'lucide-react'
import { requestLoginLink } from '@/lib/actions/auth'
import { notify } from '@/lib/utils/notifications'
import { Spinner } from '@/components/ui/spinner'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const result = await requestLoginLink(email)

      if (!result.success) {
        notify.error(result.error || 'Error al enviar el link')
        setLoading(false)
        return
      }

      setEmailSent(true)
      notify.success('Link de acceso enviado a tu correo')
    } catch (error: any) {
      notify.error(error.message || 'Error al enviar el link')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-[calc(100vh-88px)] flex items-center justify-center bg-tikin-dark-50 p-4">
      <div className="max-w-md w-full animate-slide-up">
        {/* Logo y titulo */}
        <div className="text-center mb-4">
          <div className="mb-2">
            <div className="inline-block p-2.5 bg-tikin-red rounded-lg">
              <Lock className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-tikin-dark-950 mb-1">
            Simulador de Bonos Tikin
          </h1>
          <p className="text-sm text-tikin-dark-600">
            Ingresa con tu email para acceder
          </p>
        </div>

        {/* Card de login */}
        <div className="bg-white rounded-lg shadow-soft p-6 border border-tikin-dark-200">
          {!emailSent ? (
            <form onSubmit={handleLogin} className="space-y-3">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-tikin-dark-700 mb-1.5">
                  Email corporativo
                </label>
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="tu@empresa.com"
                  required
                  aria-required="true"
                  aria-describedby="email-help"
                  className="w-full px-4 py-2.5 border border-tikin-dark-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-tikin-red transition-all duration-300"
                  disabled={loading}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-tikin-red text-white py-2.5 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <span className="flex items-center justify-center">
                    <Spinner size="sm" className="-ml-1 mr-3 border-white/25 border-t-white" />
                    Enviando...
                  </span>
                ) : 'Enviar link de acceso'}
              </button>

              <p id="email-help" className="text-xs text-tikin-dark-500 text-center pt-1">
                Te enviaremos un link seguro de acceso directo sin contrasena
              </p>
            </form>
          ) : (
            <div className="text-center space-y-3 animate-fade-in">
              <div className="w-14 h-14 bg-green-500 rounded-lg flex items-center justify-center mx-auto">
                <Mail className="w-7 h-7 text-white" />
              </div>

              <div>
                <h3 className="text-lg font-bold text-tikin-dark-950 mb-1.5">
                  Revisa tu correo!
                </h3>
                <p className="text-sm text-tikin-dark-600">
                  Hemos enviado un link de acceso a<br/>
                  <strong className="text-tikin-dark-950">{email}</strong>
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-2.5">
                <p className="text-xs text-tikin-dark-700">
                  Haz click en el link para ingresar automaticamente al simulador
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
          <p className="text-sm text-tikin-dark-600">
            Primera vez? <a href="/solicitud-acceso" className="text-tikin-red hover:text-red-700 font-semibold transition-colors">Solicita acceso aqui</a>
          </p>
          <p className="text-xs text-tikin-dark-500">
            o contacta a <a href="mailto:admin@tikin.is" className="text-tikin-dark-700 hover:text-tikin-dark-950 underline transition-colors">admin@tikin.is</a>
          </p>
        </div>
      </div>
    </div>
  )
}
