/**
 * Tabla de Invitaciones Pendientes
 */

'use client'

import { useState } from 'react'
import type { ComercialInvitationWithAdmin } from '@/types/invitations'
import { cancelInvitation, resendInvitation } from '@/lib/actions/comerciales'
import { useRouter } from 'next/navigation'

interface Props {
  invitations: ComercialInvitationWithAdmin[]
}

export function InvitationsTable({ invitations }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleCancel = async (invitationId: string) => {
    if (!confirm('¿Cancelar esta invitación?')) return

    setLoading(invitationId)
    const result = await cancelInvitation(invitationId)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Error al cancelar')
    }

    setLoading(null)
  }

  const handleResend = async (invitationId: string) => {
    setLoading(invitationId)
    const result = await resendInvitation(invitationId)

    if (result.success) {
      alert('Invitación reenviada correctamente')
      router.refresh()
    } else {
      alert(result.error || 'Error al reenviar')
    }

    setLoading(null)
  }

  const copyInvitationLink = (token: string) => {
    const link = `${window.location.origin}/auth/accept-invitation?token=${token}`
    navigator.clipboard.writeText(link)
    alert('Link copiado al portapapeles')
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Invitado</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Empresa</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Invitado por</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Enviada</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Expira</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {invitations.map(invitation => {
            const isExpiringSoon = new Date(invitation.expires_at) < new Date(Date.now() + 24 * 60 * 60 * 1000)

            return (
              <tr key={invitation.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-4">
                  <div>
                    <p className="font-medium text-gray-900">{invitation.full_name}</p>
                    <p className="text-sm text-gray-600">{invitation.email}</p>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <p className="text-gray-900">{invitation.company_name || '-'}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-gray-600">{invitation.admin.email}</p>
                </td>
                <td className="px-4 py-4">
                  <p className="text-sm text-gray-600">
                    {new Date(invitation.created_at).toLocaleDateString('es-CO', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p className={`text-sm ${isExpiringSoon ? 'text-red-600 font-medium' : 'text-gray-600'}`}>
                    {new Date(invitation.expires_at).toLocaleDateString('es-CO', {
                      month: 'short',
                      day: 'numeric',
                    })}
                  </p>
                  {isExpiringSoon && <p className="text-xs text-red-600">¡Expira pronto!</p>}
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      onClick={() => copyInvitationLink(invitation.token)}
                      className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                      title="Copiar link"
                    >
                      📋
                    </button>
                    <button
                      onClick={() => handleResend(invitation.id)}
                      disabled={loading === invitation.id}
                      className="text-blue-600 hover:text-blue-700 font-medium text-sm disabled:opacity-50"
                    >
                      {loading === invitation.id ? 'Reenviando...' : 'Reenviar'}
                    </button>
                    <button
                      onClick={() => handleCancel(invitation.id)}
                      disabled={loading === invitation.id}
                      className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                    >
                      Cancelar
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
