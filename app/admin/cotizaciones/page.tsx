'use client'

/**
 * ADMIN - Gestión de Cotizaciones
 *
 * Panel para ver todas las cotizaciones generadas
 * Incluye filtros por empresa y estado
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { QuotationRecord } from '@/types/quotation'
import { notify } from '@/lib/utils/notifications'
import { updateQuotationStatus } from '@/lib/supabase/quotations'

export default function CotizacionesPage() {
  const [quotations, setQuotations] = useState<QuotationRecord[]>([])
  const [filteredQuotations, setFilteredQuotations] = useState<QuotationRecord[]>([])
  const [loading, setLoading] = useState(true)

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

      // Cargar cotizaciones
      const { data: quotationsData, error: quotationsError } = await supabase
        .from('quotations')
        .select('*')
        .order('created_at', { ascending: false })

      if (quotationsError) {
        throw quotationsError
      }

      // Obtener IDs únicos de usuarios
      const userIds = [...new Set(quotationsData?.map(q => q.user_id).filter(Boolean))]

      // Cargar información de usuarios
      const { data: usersData, error: usersError } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .in('id', userIds)

      if (usersError) {
        console.error('Error loading users:', usersError)
      }

      // Crear mapa de usuarios para búsqueda rápida
      const usersMap = new Map(usersData?.map(u => [u.id, u]) || [])

      // Combinar datos
      const quotationsWithUsers = quotationsData?.map(q => ({
        ...q,
        user_name: usersMap.get(q.user_id)?.full_name || null,
        user_email: usersMap.get(q.user_id)?.email || null
      })) || []

      setQuotations(quotationsWithUsers)
      setFilteredQuotations(quotationsWithUsers)
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

  const handleStatusChange = async (quotationId: string, newStatus: 'pending' | 'accepted' | 'rejected') => {
    try {
      const result = await updateQuotationStatus(quotationId, newStatus)

      if (result.success) {
        notify.success('Estado actualizado correctamente')
        // Actualizar la cotización en el estado local
        setQuotations(prev =>
          prev.map(q => q.id === quotationId ? { ...q, status: newStatus } : q)
        )
      } else {
        notify.error(result.error || 'Error al actualizar el estado')
      }
    } catch (error) {
      notify.error('Error al actualizar el estado')
      console.error(error)
    }
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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Gestión de Cotizaciones
          </h1>
          <p className="text-gray-600">
            Panel de administración de cotizaciones generadas
          </p>
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
                  ? 'No hay cotizaciones registradas'
                  : 'No se encontraron cotizaciones con los filtros aplicados'}
              </p>
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
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Comercial
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
                      <td className="px-4 py-4 text-sm text-gray-900">
                        <div className="font-medium">{(quotation as any).user_name || (quotation as any).user_email || 'N/A'}</div>
                        {((quotation as any).user_name && (quotation as any).user_email) && (
                          <div className="text-xs text-gray-500">{(quotation as any).user_email}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                        {quotation.employee_count}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {formatCurrency(quotation.total_payroll)}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-medium">
                        {(quotation.commission_percentage * 100).toFixed(2)}%
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                        <select
                          value={quotation.status || 'pending'}
                          onChange={(e) => handleStatusChange(quotation.id!, e.target.value as 'pending' | 'accepted' | 'rejected')}
                          className={`px-3 py-1.5 text-xs font-semibold rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-tikin-red transition-all ${
                            quotation.status === 'accepted'
                              ? 'bg-green-100 text-green-800 border-green-300'
                              : quotation.status === 'rejected'
                              ? 'bg-red-100 text-red-800 border-red-300'
                              : 'bg-yellow-100 text-yellow-800 border-yellow-300'
                          }`}
                        >
                          <option value="pending">Pendiente</option>
                          <option value="accepted">Aceptada</option>
                          <option value="rejected">Rechazada</option>
                        </select>
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
