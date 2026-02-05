'use client'

/**
 * PANEL DE ADMINISTRACIÓN
 *
 * Gestión de solicitudes de acceso de usuarios
 * Solo accesible para usuarios con role='admin'
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { notify } from '@/lib/utils/notifications'
import type { AccessRequest, UserProfile } from '@/types/auth'
import { AppLayout } from '@/components/AppLayout'

export default function AdminPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [requests, setRequests] = useState<AccessRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)

  // Verificar autenticación y permisos de admin
  useEffect(() => {
    const checkAdmin = async () => {
      // Verificar que el usuario esté autenticado
      if (!user) {
        router.push('/login')
        return
      }

      try {
        // Obtener perfil del usuario autenticado
        const { data: userProfile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error

        // Verificar que sea admin
        if (!userProfile || userProfile.role !== 'admin') {
          notify.error('No tienes permisos para acceder a esta página')
          router.push('/dashboard')
          return
        }

        setProfile(userProfile)
      } catch (error) {
        console.error('Error verificando admin:', error)
        notify.error('Error al verificar permisos')
        router.push('/dashboard')
      }
    }

    // Solo ejecutar cuando authLoading termine
    if (!authLoading) {
      checkAdmin()
    }
  }, [user, authLoading, router, supabase])

  // Cargar solicitudes pendientes
  useEffect(() => {
    const loadRequests = async () => {
      // Solo cargar si hay perfil y es admin
      if (!profile || profile.role !== 'admin') return

      try {
        const { data, error } = await supabase
          .from('access_requests')
          .select('*')
          .order('requested_at', { ascending: false })

        if (error) throw error

        setRequests(data || [])
      } catch (error) {
        console.error('Error cargando solicitudes:', error)
        notify.error('Error al cargar solicitudes')
      } finally {
        setLoading(false)
      }
    }

    loadRequests()
  }, [profile, supabase])

  const handleApprove = async (request: AccessRequest) => {
    setProcessingId(request.id)

    try {
      // 1. Actualizar la solicitud
      const { error: requestError } = await supabase
        .from('access_requests')
        .update({
          status: 'approved',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', request.id)

      if (requestError) throw requestError

      // 2. Verificar si el usuario ya tiene perfil
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('email', request.email)
        .maybeSingle()

      if (existingProfile) {
        // Actualizar perfil existente
        const { error: profileError } = await supabase
          .from('user_profiles')
          .update({
            approved: true,
            company_name: request.company_name,
            updated_at: new Date().toISOString(),
          })
          .eq('email', request.email)

        if (profileError) {
          console.error('Error actualizando perfil:', profileError)
          throw profileError
        }

        console.log(`Perfil actualizado para ${request.email}`)
      } else {
        // Usuario no ha hecho login todavía
        // El perfil se creará cuando haga login por primera vez
        // y será aprobado automáticamente si la solicitud está aprobada
        notify.info(
          'Usuario aprobado. El perfil se aprobará automáticamente cuando inicie sesión.'
        )
        console.log(`Usuario ${request.email} aprobado pero aún no tiene perfil (no ha hecho login)`)
      }

      notify.success(`Solicitud aprobada para ${request.email}`)

      // Recargar solicitudes
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? {
                ...r,
                status: 'approved',
                reviewed_at: new Date().toISOString(),
                reviewed_by: user?.id || null,
              }
            : r
        )
      )
    } catch (error: any) {
      console.error('Error aprobando solicitud:', error)
      notify.error(error.message || 'Error al aprobar solicitud')
    } finally {
      setProcessingId(null)
    }
  }

  const handleReject = async (request: AccessRequest) => {
    if (!confirm(`¿Estás seguro de rechazar la solicitud de ${request.email}?`)) {
      return
    }

    setProcessingId(request.id)

    try {
      const { error } = await supabase
        .from('access_requests')
        .update({
          status: 'rejected',
          reviewed_at: new Date().toISOString(),
          reviewed_by: user?.id,
        })
        .eq('id', request.id)

      if (error) throw error

      notify.success(`Solicitud rechazada para ${request.email}`)

      // Actualizar lista
      setRequests((prev) =>
        prev.map((r) =>
          r.id === request.id
            ? {
                ...r,
                status: 'rejected',
                reviewed_at: new Date().toISOString(),
                reviewed_by: user?.id || null,
              }
            : r
        )
      )
    } catch (error: any) {
      console.error('Error rechazando solicitud:', error)
      notify.error(error.message || 'Error al rechazar solicitud')
    } finally {
      setProcessingId(null)
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return (
          <span className="inline-flex items-center px-4 py-1.5 bg-gradient-to-r from-yellow-100 to-amber-100 text-yellow-800 rounded-full text-xs font-bold shadow-sm border border-yellow-200">
            🟡 Pendiente
          </span>
        )
      case 'approved':
        return (
          <span className="inline-flex items-center px-4 py-1.5 bg-gradient-to-r from-green-100 to-emerald-100 text-green-800 rounded-full text-xs font-bold shadow-sm border border-green-200">
            🟢 Aprobada
          </span>
        )
      case 'rejected':
        return (
          <span className="inline-flex items-center px-4 py-1.5 bg-gradient-to-r from-red-100 to-rose-100 text-red-800 rounded-full text-xs font-bold shadow-sm border border-red-200">
            🔴 Rechazada
          </span>
        )
      default:
        return null
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  if (authLoading || loading || !profile) {
    return (
      <AppLayout showHeader={false}>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tikin-red mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Cargando...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  const pendingRequests = requests.filter((r) => r.status === 'pending')
  const reviewedRequests = requests.filter((r) => r.status !== 'pending')

  return (
    <AppLayout showHeader={false}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-8 mb-8 border-2 border-gray-200 animate-slide-up">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-gradient-to-br from-tikin-red to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div>
              <h1 className="text-4xl font-bold text-gray-900">Panel de Administración</h1>
              <p className="text-lg text-gray-600 mt-1">
                Gestiona las solicitudes de acceso de usuarios
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {/* Pendientes */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border-2 border-yellow-200 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-3xl font-bold text-gray-900">
                  {pendingRequests.length}
                </p>
                <p className="text-sm text-gray-600 font-medium">Pendientes</p>
              </div>
            </div>
          </div>

          {/* Aprobadas */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border-2 border-green-200 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-3xl font-bold text-gray-900">
                  {requests.filter((r) => r.status === 'approved').length}
                </p>
                <p className="text-sm text-gray-600 font-medium">Aprobadas</p>
              </div>
            </div>
          </div>

          {/* Rechazadas */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border-2 border-red-200 hover:shadow-2xl hover:scale-105 transition-all duration-300">
            <div className="flex items-center">
              <div className="w-16 h-16 bg-gradient-to-br from-red-400 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-3xl font-bold text-gray-900">
                  {requests.filter((r) => r.status === 'rejected').length}
                </p>
                <p className="text-sm text-gray-600 font-medium">Rechazadas</p>
              </div>
            </div>
          </div>
        </div>

        {/* Solicitudes pendientes */}
        {pendingRequests.length > 0 && (
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl mb-8 border-2 border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-6 border-b-2 border-yellow-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Solicitudes Pendientes ({pendingRequests.length})
                </h2>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {pendingRequests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-12 h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-md">
                          <svg className="w-6 h-6 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-gray-900">
                            {request.email}
                          </h3>
                          <span className="inline-block mt-1">{getStatusBadge(request.status)}</span>
                        </div>
                      </div>
                      <div className="ml-15 space-y-2 text-sm text-gray-600">
                        <p className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                          <span className="font-medium">Empresa:</span> {request.company_name}
                        </p>
                        {request.phone && (
                          <p className="flex items-center gap-2">
                            <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                            </svg>
                            <span className="font-medium">Teléfono:</span> {request.phone}
                          </p>
                        )}
                        {request.message && (
                          <p className="flex items-start gap-2">
                            <svg className="w-4 h-4 text-gray-400 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                            </svg>
                            <span><span className="font-medium">Mensaje:</span> {request.message}</span>
                          </p>
                        )}
                        <p className="flex items-center gap-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                          <span className="font-medium">Solicitado:</span> {formatDate(request.requested_at)}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 md:ml-6">
                      <button
                        onClick={() => handleApprove(request)}
                        disabled={processingId === request.id}
                        className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                      >
                        {processingId === request.id ? (
                          <span className="flex items-center justify-center">
                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Procesando...
                          </span>
                        ) : 'Aprobar'}
                      </button>
                      <button
                        onClick={() => handleReject(request)}
                        disabled={processingId === request.id}
                        className="px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 disabled:hover:shadow-none"
                      >
                        Rechazar
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Solicitudes revisadas */}
        {reviewedRequests.length > 0 && (
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 border-b-2 border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Solicitudes Revisadas ({reviewedRequests.length})
                </h2>
              </div>
            </div>
            <div className="divide-y divide-gray-200">
              {reviewedRequests.map((request) => (
                <div key={request.id} className="p-6 hover:bg-gray-50 transition-colors duration-200">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 bg-gradient-to-br from-gray-100 to-gray-200 rounded-xl flex items-center justify-center shadow-md">
                      <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-bold text-gray-900">
                        {request.email}
                      </h3>
                      <span className="inline-block mt-1">{getStatusBadge(request.status)}</span>
                    </div>
                  </div>
                  <div className="ml-13 space-y-2 text-sm text-gray-600">
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                      </svg>
                      <span className="font-medium">Empresa:</span> {request.company_name}
                    </p>
                    <p className="flex items-center gap-2">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="font-medium">Revisado:</span>{' '}
                      {request.reviewed_at ? formatDate(request.reviewed_at) : 'N/A'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Mensaje si no hay solicitudes */}
        {requests.length === 0 && (
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-12 text-center border-2 border-gray-200 animate-fade-in">
            <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-2">
              No hay solicitudes
            </h3>
            <p className="text-gray-600 text-lg">
              Las solicitudes de acceso aparecerán aquí cuando los usuarios las envíen
            </p>
          </div>
        )}
        </div>
      </div>
    </AppLayout>
  )
}
