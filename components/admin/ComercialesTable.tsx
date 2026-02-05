/**
 * Tabla de Comerciales con acciones
 */

'use client'

import { useState } from 'react'
import type { UserProfile } from '@/types/auth'
import { updateComercialApproval, deleteComercial } from '@/lib/actions/comerciales'
import { useRouter } from 'next/navigation'

interface Props {
  comerciales: UserProfile[]
}

export function ComercialesTable({ comerciales }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState<string | null>(null)

  const handleApprove = async (userId: string) => {
    if (!confirm('¿Aprobar este comercial?')) return

    setLoading(userId)
    const result = await updateComercialApproval(userId, true)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Error al aprobar')
    }

    setLoading(null)
  }

  const handleReject = async (userId: string) => {
    if (!confirm('¿Rechazar/desactivar este comercial?')) return

    setLoading(userId)
    const result = await deleteComercial(userId)

    if (result.success) {
      router.refresh()
    } else {
      alert(result.error || 'Error al rechazar')
    }

    setLoading(null)
  }

  if (comerciales.length === 0) {
    return (
      <div className="text-center py-12">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
        <p className="mt-4 text-gray-600">No hay comerciales aún</p>
        <p className="text-sm text-gray-500 mt-1">Invita al primer comercial para empezar</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Usuario</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Empresa</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Estado</th>
            <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Registro</th>
            <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Acciones</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {comerciales.map(comercial => (
            <tr key={comercial.id} className="hover:bg-gray-50 transition-colors">
              <td className="px-4 py-4">
                <div>
                  <p className="font-medium text-gray-900">
                    {comercial.full_name || 'Sin nombre'}
                  </p>
                  <p className="text-sm text-gray-600">{comercial.email}</p>
                </div>
              </td>
              <td className="px-4 py-4">
                <p className="text-gray-900">{comercial.company_name || '-'}</p>
              </td>
              <td className="px-4 py-4">
                <StatusBadge status={comercial.approval_status || (comercial.approved ? 'approved' : 'pending')} />
              </td>
              <td className="px-4 py-4">
                <p className="text-sm text-gray-600">
                  {new Date(comercial.created_at).toLocaleDateString('es-CO', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </td>
              <td className="px-4 py-4">
                <div className="flex items-center justify-end gap-2">
                  {comercial.approval_status === 'pending' && (
                    <button
                      onClick={() => handleApprove(comercial.id)}
                      disabled={loading === comercial.id}
                      className="text-green-600 hover:text-green-700 font-medium text-sm disabled:opacity-50"
                    >
                      {loading === comercial.id ? 'Aprobando...' : 'Aprobar'}
                    </button>
                  )}
                  {comercial.approval_status === 'approved' && (
                    <button
                      onClick={() => handleReject(comercial.id)}
                      disabled={loading === comercial.id}
                      className="text-red-600 hover:text-red-700 font-medium text-sm disabled:opacity-50"
                    >
                      {loading === comercial.id ? 'Desactivando...' : 'Desactivar'}
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const config = {
    approved: { label: 'Activo', bg: 'bg-green-100', text: 'text-green-800' },
    pending: { label: 'Pendiente', bg: 'bg-yellow-100', text: 'text-yellow-800' },
    rejected: { label: 'Rechazado', bg: 'bg-red-100', text: 'text-red-800' },
  }

  const { label, bg, text } = config[status as keyof typeof config] || config.pending

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${bg} ${text}`}>
      {label}
    </span>
  )
}
