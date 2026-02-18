/**
 * LANDING PAGE: Aceptar Invitacion
 * El comercial llega aqui desde el link del email
 */

'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { XCircle, Mail } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { acceptInvitation, sendLoginLink } from '@/lib/actions/invitations'
import type { ComercialInvitation } from '@/types/invitations'
import { notify } from '@/lib/utils/notifications'
import { Spinner } from '@/components/ui/spinner'

function AcceptInvitationContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<ComercialInvitation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  // Cargar invitacion
  useEffect(() => {
    if (!token) {
      setError('Token de invitacion no valido')
      setLoading(false)
      return
    }

    loadInvitation()
  }, [token])

  const loadInvitation = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase
        .from('comercial_invitations')
        .select('*')
        .eq('id', token!)
        .eq('status', 'pending')
        .single()

      if (error || !data) {
        setError('Invitacion no encontrada o ya fue utilizada')
        setLoading(false)
        return
      }

      // Verificar expiracion
      if (new Date(data.expires_at) < new Date()) {
        setError('Esta invitacion ha expirado')
        setLoading(false)
        return
      }

      setInvitation(data as ComercialInvitation)
      setLoading(false)
    } catch (err) {
      setError('Error al cargar la invitacion')
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!invitation) return

    setAccepting(true)
    setError(null)

    try {
      // 1. Crear usuario y aceptar invitacion
      const result = await acceptInvitation(invitation.id)

      if (!result.success) {
        setError(result.error || 'Error al procesar la invitacion')
        setAccepting(false)
        return
      }

      // 2. Enviar Magic Link para login
      const linkResult = await sendLoginLink(invitation.email, invitation.full_name)

      if (!linkResult.success) {
        // Usuario creado pero fallo el envio del link
        notify.success(`Usuario creado exitosamente. Ve a la pagina de login e ingresa tu email: ${invitation.email}`)
        router.push('/login')
        return
      }

      // 3. Todo exitoso
      notify.success(`Bienvenido a Tikin. Tu cuenta ha sido creada y hemos enviado un link de acceso a ${invitation.email}`)
      router.push('/login')
    } catch (err: any) {
      setError(err.message || 'Error al aceptar la invitacion')
      setAccepting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tikin-dark-50">
        <div className="bg-white p-8 rounded-lg shadow-soft border border-tikin-dark-200 max-w-md w-full text-center" role="status" aria-live="polite">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-tikin-dark-600">Verificando invitacion...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-tikin-dark-50">
        <div className="bg-white p-8 rounded-lg shadow-soft border border-tikin-dark-200 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="bg-red-50 border border-red-200 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <XCircle className="w-8 h-8 text-red-600" />
            </div>
            <h1 className="text-2xl font-bold text-tikin-dark-950 mb-2">Invitacion No Valida</h1>
            <p className="text-tikin-dark-600">{error}</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-tikin-dark-500 text-center">
              Si crees que esto es un error, contacta al administrador que te envio la invitacion.
            </p>
            <a
              href="/login"
              className="block w-full bg-tikin-dark-100 text-tikin-dark-700 py-3 rounded-lg font-medium text-center hover:bg-tikin-dark-200 transition-colors"
            >
              Ir al Login
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Success state - mostrar invitacion
  return (
    <div className="min-h-screen flex items-center justify-center bg-tikin-dark-50 p-4">
      <div className="bg-white p-8 rounded-lg shadow-soft border border-tikin-dark-200 max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-tikin-red-50 border border-tikin-red-200 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Mail className="w-8 h-8 text-tikin-red" />
          </div>
          <h1 className="text-2xl font-bold text-tikin-dark-950 mb-2">Has sido invitado!</h1>
          <p className="text-tikin-dark-600">Tikin Simulador de Parafiscales</p>
        </div>

        {/* Informacion de la invitacion */}
        <div className="bg-tikin-dark-50 rounded-lg p-6 mb-6 space-y-3">
          <div>
            <p className="text-sm text-tikin-dark-600">Invitado como:</p>
            <p className="font-medium text-tikin-dark-950">{invitation.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-tikin-dark-600">Email:</p>
            <p className="font-medium text-tikin-dark-950">{invitation.email}</p>
          </div>
          {invitation.company_name && (
            <div>
              <p className="text-sm text-tikin-dark-600">Empresa:</p>
              <p className="font-medium text-tikin-dark-950">{invitation.company_name}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-tikin-dark-600">Expira:</p>
            <p className="font-medium text-tikin-dark-950">
              {new Date(invitation.expires_at).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Informacion de lo que sucedera */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">Al aceptar la invitacion:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>&#10003; Tu cuenta sera creada automaticamente</li>
            <li>&#10003; Recibiras un link de acceso por email</li>
            <li>&#10003; Podras ingresar al sistema con un solo clic</li>
            <li>&#10003; Tendras acceso para crear cotizaciones de parafiscales</li>
          </ul>
        </div>

        {/* Boton de aceptar */}
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full bg-tikin-red text-white py-3 rounded-lg font-medium hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {accepting ? 'Aceptando invitacion...' : 'Aceptar Invitacion'}
        </button>

        {error && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-tikin-dark-50">
          <div className="bg-white p-8 rounded-lg shadow-soft border border-tikin-dark-200 max-w-md w-full text-center" role="status" aria-live="polite">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-tikin-dark-600">Cargando...</p>
          </div>
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  )
}
