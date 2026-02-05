/**
 * ADMIN: Invitar Comercial
 */

'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createInvitation } from '@/lib/actions/comerciales'
import type { CreateInvitationInput } from '@/types/invitations'

export default function InvitarComercialPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState({
    email: '',
    full_name: '',
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    // Validaciones básicas
    if (!form.email || !form.full_name) {
      setError('Email y nombre son obligatorios')
      setLoading(false)
      return
    }

    // Todos los comerciales son de Tikin
    const result = await createInvitation({
      ...form,
      company_name: 'Tikin',
    })

    if (result.success) {
      alert('¡Invitación enviada correctamente!')
      router.push('/admin/comerciales')
    } else {
      setError(result.error || 'Error al enviar invitación')
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <Link
          href="/admin/comerciales"
          className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 mb-4"
        >
          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Volver a Comerciales
        </Link>
        <h1 className="text-3xl font-bold text-gray-900">Invitar Comercial</h1>
        <p className="text-gray-600 mt-2">Envía una invitación por email a un nuevo comercial</p>
      </div>

      {/* Formulario */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Email */}
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Email *
            </label>
            <input
              type="email"
              id="email"
              required
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-tikin-red focus:border-transparent"
              placeholder="comercial@empresa.com"
            />
            <p className="text-xs text-gray-500 mt-1">Se enviará un link de invitación a este correo</p>
          </div>

          {/* Nombre Completo */}
          <div>
            <label htmlFor="full_name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre Completo *
            </label>
            <input
              type="text"
              id="full_name"
              required
              value={form.full_name}
              onChange={e => setForm({ ...form, full_name: e.target.value })}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-tikin-red focus:border-transparent"
              placeholder="Juan Pérez"
            />
            <p className="text-xs text-gray-500 mt-1">Todos los comerciales pertenecen a Tikin</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {/* Información */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-medium text-blue-900 mb-2">¿Qué sucede después?</h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Se enviará un email con un link de invitación</li>
              <li>• El link expira en 7 días</li>
              <li>• Al aceptar, el comercial tendrá acceso inmediato</li>
              <li>• No necesitas crear una contraseña</li>
            </ul>
          </div>

          {/* Botones */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-tikin-red to-red-600 text-white py-3 rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Enviando invitación...' : 'Enviar Invitación'}
            </button>
            <Link
              href="/admin/comerciales"
              className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
            >
              Cancelar
            </Link>
          </div>
        </form>
      </div>
    </div>
  )
}
