/**
 * LANDING PAGE: Aceptar Invitación
 * El comercial llega aquí desde el link del email
 */

'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { ComercialInvitation } from '@/types/invitations'

export default function AcceptInvitationPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get('token')

  const [loading, setLoading] = useState(true)
  const [invitation, setInvitation] = useState<ComercialInvitation | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [accepting, setAccepting] = useState(false)

  // Cargar invitación
  useEffect(() => {
    if (!token) {
      setError('Token de invitación no válido')
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
        .eq('token', token!)
        .eq('status', 'pending')
        .single()

      if (error || !data) {
        setError('Invitación no encontrada o ya fue utilizada')
        setLoading(false)
        return
      }

      // Verificar expiración
      if (new Date(data.expires_at) < new Date()) {
        setError('Esta invitación ha expirado')
        setLoading(false)
        return
      }

      setInvitation(data as ComercialInvitation)
      setLoading(false)
    } catch (err) {
      console.error('Error loading invitation:', err)
      setError('Error al cargar la invitación')
      setLoading(false)
    }
  }

  const handleAccept = async () => {
    if (!invitation) return

    setAccepting(true)
    setError(null)

    try {
      const supabase = createClient()

      // Enviar Magic Link a este email
      const { error: signInError } = await supabase.auth.signInWithOtp({
        email: invitation.email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      })

      if (signInError) {
        if (signInError.message.includes('rate_limit') || signInError.message.includes('Email rate limit')) {
          setError('Demasiados intentos. Espera 1-2 minutos e intenta de nuevo.')
        } else {
          setError(signInError.message)
        }
        setAccepting(false)
        return
      }

      // Mostrar mensaje de éxito
      alert(
        `¡Invitación aceptada!\n\nHemos enviado un link de acceso a ${invitation.email}.\nRevisa tu correo y haz clic en el link para acceder.`
      )

      // Redirigir a login
      router.push('/login')
    } catch (err: any) {
      console.error('Error accepting invitation:', err)
      setError(err.message || 'Error al aceptar la invitación')
      setAccepting(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tikin-red mx-auto mb-4"></div>
          <p className="text-gray-600">Verificando invitación...</p>
        </div>
      </div>
    )
  }

  // Error state
  if (error || !invitation) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900">
        <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
          <div className="text-center mb-6">
            <div className="bg-red-100 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Invitación No Válida</h1>
            <p className="text-gray-600">{error}</p>
          </div>

          <div className="space-y-3">
            <p className="text-sm text-gray-500 text-center">
              Si crees que esto es un error, contacta al administrador que te envió la invitación.
            </p>
            <a
              href="/login"
              className="block w-full bg-gray-100 text-gray-700 py-3 rounded-xl font-medium text-center hover:bg-gray-200 transition-colors"
            >
              Ir al Login
            </a>
          </div>
        </div>
      </div>
    )
  }

  // Success state - mostrar invitación
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-2xl max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="bg-tikin-red/10 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <svg className="w-8 h-8 text-tikin-red" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">¡Has sido invitado!</h1>
          <p className="text-gray-600">Tikin Simulador de Parafiscales</p>
        </div>

        {/* Información de la invitación */}
        <div className="bg-gray-50 rounded-xl p-6 mb-6 space-y-3">
          <div>
            <p className="text-sm text-gray-600">Invitado como:</p>
            <p className="font-medium text-gray-900">{invitation.full_name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email:</p>
            <p className="font-medium text-gray-900">{invitation.email}</p>
          </div>
          {invitation.company_name && (
            <div>
              <p className="text-sm text-gray-600">Empresa:</p>
              <p className="font-medium text-gray-900">{invitation.company_name}</p>
            </div>
          )}
          <div>
            <p className="text-sm text-gray-600">Expira:</p>
            <p className="font-medium text-gray-900">
              {new Date(invitation.expires_at).toLocaleDateString('es-CO', {
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </p>
          </div>
        </div>

        {/* Información de lo que sucederá */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <h3 className="font-medium text-blue-900 mb-2">Al aceptar la invitación:</h3>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>✓ Recibirás un link de acceso por email</li>
            <li>✓ Tendrás acceso inmediato al sistema</li>
            <li>✓ Podrás crear cotizaciones de parafiscales</li>
          </ul>
        </div>

        {/* Botón de aceptar */}
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="w-full bg-gradient-to-r from-tikin-red to-red-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {accepting ? 'Aceptando invitación...' : 'Aceptar Invitación'}
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
