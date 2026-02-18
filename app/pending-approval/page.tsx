'use client'

/**
 * PAGINA DE APROBACION PENDIENTE
 *
 * Mostrada cuando un usuario se registra pero aun no ha sido aprobado por un admin
 */

import { signOut } from '@/lib/auth/client'
import { useEffect, useState } from 'react'
import { Clock, Info } from 'lucide-react'
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
    <div className="min-h-screen bg-tikin-dark-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-lg shadow-soft p-8 border border-tikin-dark-200">
          {/* Icono de espera */}
          <div className="text-center mb-6">
            <div className="inline-block p-4 bg-yellow-50 border border-yellow-200 rounded-lg mb-4">
              <Clock className="w-12 h-12 text-yellow-600" />
            </div>
            <h1 className="text-2xl font-bold text-tikin-dark-950 mb-2">
              Aprobacion Pendiente
            </h1>
            <p className="text-sm text-tikin-dark-600">
              Tu cuenta esta siendo revisada
            </p>
          </div>

          {/* Informacion */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-yellow-900 text-sm mb-2">
                  Que significa esto?
                </p>
                <ul className="space-y-1.5 text-xs text-yellow-800">
                  <li className="flex items-start gap-2">
                    <span>&#8226;</span>
                    <span>
                      Tu cuenta ha sido creada exitosamente con el email:{' '}
                      <strong>{email}</strong>
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>&#8226;</span>
                    <span>
                      Un administrador debe aprobar tu acceso antes de que puedas
                      usar la plataforma
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>&#8226;</span>
                    <span>
                      Recibiras un email cuando tu cuenta sea aprobada
                    </span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span>&#8226;</span>
                    <span>
                      Este proceso normalmente toma menos de 24 horas
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* Contacto */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
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

          {/* Boton de cerrar sesion */}
          <button
            onClick={signOut}
            className="w-full px-6 py-3 bg-tikin-dark-100 text-tikin-dark-700 rounded-lg hover:bg-tikin-dark-200 transition-colors font-semibold"
          >
            Cerrar Sesion
          </button>
        </div>
      </div>
    </div>
  )
}
