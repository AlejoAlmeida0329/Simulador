'use client'

/**
 * COMERCIAL - Mis Cotizaciones
 *
 * Panel para ver las cotizaciones del comercial
 * Incluye filtros por empresa y estado, botón para crear nueva cotización
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { QuotationRecord } from '@/types/quotation'
import { notify } from '@/lib/utils/notifications'
import { useRouter } from 'next/navigation'

export default function MisCotizacionesPage() {
  const router = useRouter()
  const [quotations, setQuotations] = useState<QuotationRecord[]>([])
  const [filteredQuotations, setFilteredQuotations] = useState<QuotationRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  // Filtros
  const [companyFilter, setCompanyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')

  useEffect(() => {
    loadQuotations()
  }, [])

  // Aplicar filtros cuando cambian
  useEffect(() => {
    let filtered = [...quotations]

    // Filtro por empresa
    if (companyFilter.trim()) {
      filtered = filtered.filter(q =>
        q.company_name.toLowerCase().includes(companyFilter.toLowerCase())
      )
    }

    // Filtro por estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter(q => q.status === statusFilter)
    }

    setFilteredQuotations(filtered)
  }, [quotations, companyFilter, statusFilter])

  const loadQuotations = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      // Obtener usuario actual
      const { data: { user }, error: userError } = await supabase.auth.getUser()

      if (userError || !user) {
        throw new Error('Usuario no autenticado')
      }

      setUserId(user.id)

      // Cargar cotizaciones del usuario
      const { data, error } = await supabase
        .from('quotations')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      setQuotations(data || [])
      setFilteredQuotations(data || [])
    } catch (error: any) {
      notify.error('Error al cargar las cotizaciones')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
    }).format(value)
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getStatusBadge = (status?: string) => {
    const styles = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-300',
      accepted: 'bg-green-100 text-green-800 border-green-300',
      rejected: 'bg-red-100 text-red-800 border-red-300',
    }

    const labels = {
      pending: 'Pendiente',
      accepted: 'Aceptada',
      rejected: 'Rechazada',
    }

    const statusKey = status || 'pending'
    const style = styles[statusKey as keyof typeof styles] || styles.pending
    const label = labels[statusKey as keyof typeof labels] || 'Pendiente'

    return (
      <span className={`px-2 py-1 text-xs font-semibold rounded-full border ${style}`}>
        {label}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tikin-red mx-auto"></div>
          <p className="mt-4 text-gray-600">Cargando cotizaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-[1600px] mx-auto">
        {/* Header con botón de Nueva Cotización */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Mis Cotizaciones
            </h1>
            <p className="text-gray-600">
              Todas las cotizaciones que has creado
            </p>
          </div>
          <button
            onClick={() => router.push('/bonos')}
            className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-tikin-red to-red-600 text-white font-semibold rounded-xl hover:shadow-lg transition-all duration-200 hover:scale-105"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Nueva Cotización
          </button>
        </div>

        {/* Filtros */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Filtro por empresa */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Buscar por empresa
              </label>
              <input
                type="text"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                placeholder="Nombre de la empresa..."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-tikin-red"
              />
            </div>

            {/* Filtro por estado */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Estado de cotización
              </label>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-tikin-red"
              >
                <option value="all">Todas</option>
                <option value="pending">Pendientes</option>
                <option value="accepted">Aceptadas</option>
                <option value="rejected">Rechazadas</option>
              </select>
            </div>
          </div>

          {/* Resumen de filtros */}
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-gray-600">
              Mostrando <span className="font-semibold text-gray-900">{filteredQuotations.length}</span> de{' '}
              <span className="font-semibold text-gray-900">{quotations.length}</span> cotizaciones
            </p>
            {(companyFilter || statusFilter !== 'all') && (
              <button
                onClick={() => {
                  setCompanyFilter('')
                  setStatusFilter('all')
                }}
                className="text-sm text-tikin-red hover:text-red-700 font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Tabla de Cotizaciones */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {filteredQuotations.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-500">
                {quotations.length === 0
                  ? 'No has creado cotizaciones todavía'
                  : 'No se encontraron cotizaciones con los filtros aplicados'}
              </p>
              {quotations.length === 0 && (
                <button
                  onClick={() => router.push('/bonos')}
                  className="mt-4 px-6 py-2 bg-tikin-red text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Crear primera cotización
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empresa
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Empleados
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Nómina Mensual
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                      % Comisión
                    </th>
                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredQuotations.map((quotation) => (
                    <tr key={quotation.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(quotation.created_at)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="font-medium">{quotation.company_name}</div>
                        {quotation.nit && (
                          <div className="text-xs text-gray-500">NIT: {quotation.nit}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {quotation.employee_count}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(quotation.total_payroll)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {quotation.commission_percentage}%
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                        {getStatusBadge(quotation.status)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Resumen de totales */}
        {filteredQuotations.length > 0 && (
          <div className="mt-6 bg-gradient-to-r from-tikin-red to-red-600 rounded-xl shadow-lg p-6 text-white">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-red-100 mb-1">Total Cotizaciones</p>
                <p className="text-2xl font-bold">{filteredQuotations.length}</p>
              </div>
              <div>
                <p className="text-sm text-red-100 mb-1">Empleados Total</p>
                <p className="text-2xl font-bold">
                  {filteredQuotations.reduce((sum, q) => sum + q.employee_count, 0).toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
