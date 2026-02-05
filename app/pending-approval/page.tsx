'use client'

/**
 * PÁGINA DE APROBACIÓN PENDIENTE
 *
 * Mostrada cuando un usuario se registra pero aún no ha sido aprobado por un admin
 */

import { signOut } from '@/lib/auth/client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

export default function PendingApprovalPage() {
  const [email, setEmail] = useState<string>('')

  useEffect(() => {
    async function loadUserEmail() {
      const supabase = createClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        setEmail(user.email || '')
      }
    }
    loadUserEmail()
  }, [])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-2xl p-8 border-2 border-yellow-200">
          {/* Icono de espera */}
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl shadow-lg mb-4">
              <svg
                className="w-12 h-12 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              Aprobación Pendiente
            </h1>
            <p className="text-sm text-gray-600">
              Tu cuenta está siendo revisada
            </p>
          </div>

          {/* Información */}
          <div className="bg-yellow-50 border-2 border-yellow-200 rounded-xl p-4 mb-6">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div>
                <p className="font-semibold text-yellow-900 text-sm mb-2">
                  ¿Qué significa esto?
                </p>
                <ul className="space-y-1.5 text-xs text-yellow-800">
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>
                      Tu cuenta ha sido creada exitosamente con el email:{' '}
                      <strong>{email}</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>
                      Un administrador debe aprobar tu acceso antes de que puedas
                      usar la plataforma
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>
                      Recibirás un email cuando tu cuenta sea aprobada
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>•</span>
                    <span>
                      Este proceso normalmente toma menos de 24 horas
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
            <p className="text-xs text-blue-900 text-center">
              Si tienes alguna pregunta o necesitas acceso urgente, contacta a:{' '}
              <a
                href="mailto:admin@tikin.is"
                className="font-bold underline hover:text-blue-700"
              >
                admin@tikin.is
              </a>
            </p>
          </div>

          {/* Botón de cerrar sesión */}
          <button
            onClick={signOut}
            className="w-full px-6 py-3 bg-gradient-to-r from-gray-100 to-gray-200 text-gray-700 rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>
    </div>
  )
}
