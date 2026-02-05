'use client'

/**
 * Tabla Simplificada de Invitaciones
 * Permite eliminación directa sin confirmación y resend
 */

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { cancelInvitation, resendInvitation } from '@/lib/actions/comerciales'
import type { ComercialInvitation } from '@/types/invitations'

interface Props {
  invitations: ComercialInvitation[]
}

export function SimpleInvitationsTable({ invitations }: Props) {
  const router = useRouter()
  const [deleting, setDeleting] = useState<string | null>(null)
  const [resending, setResending] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const handleDelete = async (invitationId: string) => {
    if (deleting) return // Prevenir doble click

    setDeleting(invitationId)
    console.log('🔴 Frontend: Iniciando eliminación de invitación:', invitationId)

    try {
      console.log('🔴 Frontend: Llamando cancelInvitation...')
      const result = await cancelInvitation(invitationId)
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

  const handleResend = async (invitationId: string) => {
    if (resending) return // Prevenir doble click

    setResending(invitationId)

    try {
      const result = await resendInvitation(invitationId)

      if (result.success) {
        alert('Invitación reenviada correctamente')
        setResending(null)
      } else {
        alert(`Error al reenviar: ${result.error}`)
        setResending(null)
      }
    } catch (error: any) {
      alert(`Error: ${error.message}`)
      setResending(null)
    }
  }

  if (invitations.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">No hay invitaciones pendientes</p>
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
              Fecha
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Acciones
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {invitations.map((invitation) => (
            <tr key={invitation.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm font-medium text-gray-900">{invitation.full_name}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">{invitation.email}</div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-500">
                  {new Date(invitation.created_at || '').toLocaleDateString('es-CO')}
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => handleResend(invitation.id!)}
                    disabled={resending === invitation.id || deleting === invitation.id}
                    className="text-blue-600 hover:text-blue-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {resending === invitation.id ? 'Reenviando...' : 'Reenviar'}
                  </button>
                  <button
                    onClick={() => handleDelete(invitation.id!)}
                    disabled={deleting === invitation.id || resending === invitation.id}
                    className="text-red-600 hover:text-red-900 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === invitation.id ? 'Eliminando...' : 'Eliminar'}
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
