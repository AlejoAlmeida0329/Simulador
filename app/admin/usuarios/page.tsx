'use client'

/**
 * GESTION DE USUARIOS - Panel de Admin
 *
 * Permite al admin ver todos los usuarios y eliminarlos
 * Solo accesible para usuarios con role='admin'
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { notify } from '@/lib/utils/notifications'
import type { UserProfile } from '@/types/auth'
import { Users, Check, Clock, ShieldCheck } from 'lucide-react'
import { MetricCard } from '@/components/ui/metric-card'
import { EmptyState } from '@/components/ui/empty-state'
import { Spinner } from '@/components/ui/spinner'

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
      } catch {
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
      } catch {
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
      // Obtener el usuario autenticado (validado contra el servidor)
      const { data: { user: currentUser } } = await supabase.auth.getUser()

      if (!currentUser) {
        throw new Error('No hay sesión activa')
      }

      // Obtener el token de acceso de la sesión para el header Authorization
      const { data: { session } } = await supabase.auth.getSession()

      // Llamar a la API route del servidor
      const response = await fetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
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
      notify.error(error.message || 'Error al eliminar usuario')
    } finally {
      setDeletingId(null)
    }
  }

  if (authLoading || loading || !profile) {
    return (
      <>
        <div className="flex items-center justify-center h-full">
          <div className="text-center" role="status" aria-live="polite">
            <Spinner size="lg" />
            <p className="text-tikin-dark-600 font-medium mt-4">Cargando...</p>
          </div>
        </div>
      </>
    )
  }

  const adminUsers = users.filter((u) => u.role === 'admin')
  const regularUsers = users.filter((u) => u.role === 'comercial')
  const approvedUsers = users.filter((u) => u.approved)
  const pendingUsers = users.filter((u) => !u.approved)

  return (
    <>
      <div className="space-y-8 max-w-[1800px]">
        {/* Header */}
        <div className="border-b border-tikin-dark-200 pb-6">
          <h1 className="text-3xl font-bold text-tikin-dark-950 tracking-tight">Gestion de Usuarios</h1>
          <p className="text-tikin-dark-600 mt-2">
            Administra todos los usuarios del sistema
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <MetricCard title="Total Usuarios" value={users.length} icon={Users} iconBgColor="bg-blue-50 border-blue-200" iconColor="text-blue-600" />
          <MetricCard title="Aprobados" value={approvedUsers.length} icon={Check} iconBgColor="bg-green-50 border-green-200" iconColor="text-green-600" />
          <MetricCard title="Pendientes" value={pendingUsers.length} icon={Clock} iconBgColor="bg-yellow-50 border-yellow-200" iconColor="text-yellow-600" />
          <MetricCard title="Administradores" value={adminUsers.length} icon={ShieldCheck} iconBgColor="bg-purple-50 border-purple-200" iconColor="text-purple-600" />
        </div>

        {/* Lista de usuarios */}
        <div className="bg-white rounded-lg shadow-soft border border-tikin-dark-200 overflow-hidden">
          <div className="px-6 py-5 border-b border-tikin-dark-200">
            <h2 className="text-xl font-semibold text-tikin-dark-950 tracking-tight">
              Todos los Usuarios ({users.length})
            </h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-tikin-dark-50 border-b border-tikin-dark-200">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">
                    Empresa
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">
                    Rol
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">
                    Estado
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">
                    Fecha Registro
                  </th>
                  <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-tikin-dark-200">
                {users.map((userItem) => (
                  <tr
                    key={userItem.id}
                    className="hover:bg-tikin-dark-50 transition-colors"
                  >
                    <td className="px-4 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-tikin-dark-200 rounded-lg flex items-center justify-center">
                          <span className="text-tikin-dark-700 text-sm font-bold">
                            {userItem.email?.charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <div className="ml-3">
                          <p className="text-sm font-medium text-tikin-dark-950">
                            {userItem.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      <p className="text-sm text-tikin-dark-600">
                        {userItem.company_name || '-'}
                      </p>
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {userItem.role === 'admin' ? (
                        <span className="inline-flex items-center px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                          Admin
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                          Usuario
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap">
                      {userItem.approved ? (
                        <span className="inline-flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-medium">
                          Aprobado
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs font-medium">
                          Pendiente
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-sm text-tikin-dark-600">
                      {new Date(userItem.created_at).toLocaleDateString('es-CO')}
                    </td>
                    <td className="px-4 py-4 whitespace-nowrap text-right text-sm font-medium">
                      {userItem.id !== user?.id ? (
                        <button
                          onClick={() => handleDeleteUser(userItem)}
                          disabled={deletingId === userItem.id}
                          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {deletingId === userItem.id ? (
                            <span className="flex items-center">
                              <Spinner size="sm" className="mr-2" />
                              Eliminando...
                            </span>
                          ) : (
                            'Eliminar'
                          )}
                        </button>
                      ) : (
                        <span className="text-tikin-dark-400 text-xs italic">Tu cuenta</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {users.length === 0 && (
            <EmptyState icon={Users} title="No hay usuarios" description="Los usuarios aparecerán aquí cuando se registren" />
          )}
        </div>
      </div>
    </>
  )
}
