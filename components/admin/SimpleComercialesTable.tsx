'use client'

/**
 * Tabla Simplificada de Comerciales
 * Permite eliminación directa sin confirmación
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { deleteComercial } from '@/lib/actions/comerciales'
import type { UserProfile } from '@/types/auth'

interface Props {
  comerciales: UserProfile[]
}

export function SimpleComercialesTable({ comerciales }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = async (userId: string) => {
    if (deleting) return // Prevenir doble click

    setDeleting(userId)
    console.log('🔴 Frontend: Iniciando eliminación de comercial:', userId)

    try {
      console.log('🔴 Frontend: Llamando deleteComercial...')
      const result = await deleteComercial(userId)
      console.log('🔴 Frontend: Resultado recibido:', result)

      if (result.success) {
        console.log('✅ Frontend: Éxito confirmado, recargando página...')
        // Resetear estado ANTES del refresh
        setDeleting(null)
        // Forzar refresh completo de la página
        window.location.reload()
      } else {
        console.log('❌ Frontend: Error en resultado:', result.error)
        alert(`Error al eliminar: ${result.error}`)
        setDeleting(null)
      }
    } catch (error: any) {
      console.log('❌ Frontend: Exception capturada:', error)
      alert(`Error: ${error.message}`)
      setDeleting(null)
    }
  }

  if (comerciales.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay comerciales activos</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Nombre
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Email
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Fecha de Registro
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {comerciales.map((comercial) => (
            <tr key={comercial.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{comercial.full_name || 'Sin nombre'}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{comercial.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {new Date(comercial.created_at || '').toLocaleDateString('es-CO')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <button
                  onClick={() => handleDelete(comercial.id)}
                  disabled={deleting === comercial.id}
                  className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting === comercial.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
