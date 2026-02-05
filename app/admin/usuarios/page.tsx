'use client'

/**
 * GESTIÓN DE USUARIOS - Panel de Admin
 *
 * Permite al admin ver todos los usuarios y eliminarlos
 * Solo accesible para usuarios con role='admin'
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { notify } from '@/lib/utils/notifications'
import { AppLayout } from '@/components/AppLayout'
import type { UserProfile } from '@/types/auth'

export default function UsuariosPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [users, setUsers] = useState<UserProfile[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  // Verificar permisos de admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const { data: userProfile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error

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

    if (!authLoading) {
      checkAdmin()
    }
  }, [user, authLoading, router, supabase])

  // Cargar usuarios
  useEffect(() => {
    const loadUsers = async () => {
      if (!profile || profile.role !== 'admin') return

      try {
        const { data, error } = await supabase
          .from('user_profiles')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        setUsers(data || [])
      } catch (error) {
        console.error('Error cargando usuarios:', error)
        notify.error('Error al cargar usuarios')
      } finally {
        setLoading(false)
      }
    }

    loadUsers()
  }, [profile, supabase])

  const handleDeleteUser = async (userToDelete: UserProfile) => {
    // Prevenir auto-eliminación
    if (userToDelete.id === user?.id) {
      notify.error('No puedes eliminar tu propia cuenta')
      return
    }

    if (
      !confirm(
        `¿Estás seguro de eliminar al usuario ${userToDelete.email}? Esta acción NO se puede deshacer.`
      )
    ) {
      return
    }

    setDeletingId(userToDelete.id)

    try {
      // Obtener el token de sesión
      const { data: { session } } = await supabase.auth.getSession()

      if (!session) {
        throw new Error('No hay sesión activa')
      }

      // Llamar a la API route del servidor
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ userId: userToDelete.id })
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Error al eliminar usuario')
      }

      notify.success(`Usuario ${userToDelete.email} eliminado correctamente`)

      // Actualizar lista
      setUsers((prev) => prev.filter((u) => u.id !== userToDelete.id))
    } catch (error: any) {
      console.error('Error eliminando usuario:', error)
      notify.error(error.message || 'Error al eliminar usuario')
    } finally {
      setDeletingId(null)
    }
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

  const adminUsers = users.filter((u) => u.role === 'admin')
  const regularUsers = users.filter((u) => u.role === 'user')
  const approvedUsers = users.filter((u) => u.approved)
  const pendingUsers = users.filter((u) => !u.approved)

  return (
    <AppLayout showHeader={false}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-8 mb-8 border-2 border-gray-200 animate-slide-up">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-tikin-red to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Gestión de Usuarios</h1>
                <p className="text-lg text-gray-600 mt-1">
                  Administra todos los usuarios del sistema
                </p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border-2 border-blue-200">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-3xl font-bold text-gray-900">{users.length}</p>
                  <p className="text-sm text-gray-600 font-medium">Total Usuarios</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border-2 border-green-200">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-3xl font-bold text-gray-900">{approvedUsers.length}</p>
                  <p className="text-sm text-gray-600 font-medium">Aprobados</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border-2 border-yellow-200">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-7 h-7 text-white"
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
                <div className="ml-4">
                  <p className="text-3xl font-bold text-gray-900">{pendingUsers.length}</p>
                  <p className="text-sm text-gray-600 font-medium">Pendientes</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border-2 border-purple-200">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-3xl font-bold text-gray-900">{adminUsers.length}</p>
                  <p className="text-sm text-gray-600 font-medium">Administradores</p>
                </div>
              </div>
            </div>
          </div>

          {/* Lista de usuarios */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
            <div className="bg-gradient-to-r from-gray-50 to-slate-50 p-6 border-b-2 border-gray-200">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-6 h-6 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">
                  Todos los Usuarios ({users.length})
                </h2>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Rol
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Fecha Registro
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {users.map((userItem) => (
                    <tr
                      key={userItem.id}
                      className="hover:bg-gray-50 transition-colors duration-150"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
                            <span className="text-white text-sm font-bold">
                              {userItem.email?.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div className="ml-3">
                            <p className="text-sm font-medium text-gray-900">
                              {userItem.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-600">
                          {userItem.company_name || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userItem.role === 'admin' ? (
                          <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-purple-100 to-purple-200 text-purple-800 rounded-full text-xs font-bold">
                            Admin
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 rounded-full text-xs font-bold">
                            Usuario
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {userItem.approved ? (
                          <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-green-100 to-green-200 text-green-800 rounded-full text-xs font-bold">
                            Aprobado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1 bg-gradient-to-r from-yellow-100 to-yellow-200 text-yellow-800 rounded-full text-xs font-bold">
                            Pendiente
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {new Date(userItem.created_at).toLocaleDateString('es-CO')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        {userItem.id !== user?.id ? (
                          <button
                            onClick={() => handleDeleteUser(userItem)}
                            disabled={deletingId === userItem.id}
                            className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                          >
                            {deletingId === userItem.id ? (
                              <span className="flex items-center">
                                <svg
                                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                                  xmlns="http://www.w3.org/2000/svg"
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
                                Eliminando...
                              </span>
                            ) : (
                              'Eliminar'
                            )}
                          </button>
                        ) : (
                          <span className="text-gray-400 text-xs italic">Tu cuenta</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {users.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg
                    className="w-10 h-10 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                    />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">No hay usuarios</h3>
                <p className="text-gray-600 text-lg">
                  Los usuarios aparecerán aquí cuando se registren
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
