'use client'

/**
 * ADMIN - Gestión de Cotizaciones
 *
 * Panel para ver todas las cotizaciones Bonos 2.0 del sistema
 * Incluye filtros por empresa y estado
 */

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { QuotationRecord } from '@/types/quotation'
import { notify } from '@/lib/utils/notifications'
import { updateCotizacionStatus } from '@/lib/supabase/quotations'
import { Search } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'

type StatusType = 'all' | 'pending' | 'accepted' | 'rejected'

export default function CotizacionesPage() {
  const [quotations, setQuotations] = useState<(QuotationRecord & { user_name?: string; user_email?: string })[]>([])
  const [filteredQuotations, setFilteredQuotations] = useState<(QuotationRecord & { user_name?: string; user_email?: string })[]>([])

  const [loading, setLoading] = useState(true)
  const [companyFilter, setCompanyFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusType>('all')

  useEffect(() => {
    loadQuotations()
  }, [])

  useEffect(() => {
    let filtered = [...quotations]

    if (companyFilter.trim()) {
      filtered = filtered.filter(q =>
        q.company_name.toLowerCase().includes(companyFilter.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(q => q.status === statusFilter)
    }

    setFilteredQuotations(filtered)
  }, [quotations, companyFilter, statusFilter])

  const loadQuotations = async () => {
    try {
      setLoading(true)
      const supabase = createClient()

      const { data, error } = await supabase
        .from('quotations_bonos2')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      const userIds = [...new Set(data?.map(q => q.user_id).filter(Boolean) || [])]

      const { data: usersData } = await supabase
        .from('user_profiles')
        .select('id, email, full_name')
        .in('id', userIds.length > 0 ? userIds : ['__none__'])

      const usersMap = new Map(usersData?.map(u => [u.id, u]) || [])

      const withUsers = data?.map(q => ({
        ...q,
        user_name: usersMap.get(q.user_id)?.full_name || null,
        user_email: usersMap.get(q.user_id)?.email || null
      })) || []

      setQuotations(withUsers)
      setFilteredQuotations(withUsers)
    } catch (error: any) {
      notify.error('Error al cargar las cotizaciones')
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })

  const handleStatusChange = async (id: string, newStatus: QuotationRecord['status']) => {
    const result = await updateCotizacionStatus(id, newStatus)
    if (result.success) {
      notify.success('Estado actualizado')
      setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q))
    } else {
      notify.error(result.error || 'Error al actualizar')
    }
  }

  const statusSelectClass = (status?: string) => {
    if (status === 'accepted') return 'bg-green-100 text-green-800 border-green-300'
    if (status === 'rejected') return 'bg-red-100 text-red-800 border-red-300'
    return 'bg-yellow-100 text-yellow-800 border-yellow-300' // pending (default)
  }

  if (loading) {
    return (
      <div className="min-h-[400px] flex items-center justify-center">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-4" />
          <p className="text-tikin-dark-600">Cargando cotizaciones...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8 max-w-[1800px]">
        {/* Header */}
        <div className="mb-8 border-b border-tikin-dark-200 pb-6">
          <h1 className="text-3xl font-bold text-tikin-dark-950 mb-2 tracking-tight">
            Gestion de Cotizaciones
          </h1>
          <p className="text-tikin-dark-600">
            Panel de administracion de cotizaciones generadas
          </p>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-soft border border-tikin-dark-200 p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="company-filter" className="block text-sm font-medium text-tikin-dark-700 mb-2">
                Buscar por empresa
              </label>
              <input
                type="text"
                id="company-filter"
                value={companyFilter}
                onChange={(e) => setCompanyFilter(e.target.value)}
                placeholder="Nombre de la empresa..."
                aria-label="Buscar por nombre de empresa"
                className="w-full px-4 py-2 border border-tikin-dark-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-tikin-red"
              />
            </div>
            <div>
              <label htmlFor="status-filter" className="block text-sm font-medium text-tikin-dark-700 mb-2">
                Estado
              </label>
              <select
                id="status-filter"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusType)}
                aria-label="Filtrar por estado"
                className="w-full px-4 py-2 border border-tikin-dark-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-tikin-red"
              >
                <option value="all">Todas</option>
                <option value="pending">Pendiente</option>
                <option value="accepted">Aprobada</option>
                <option value="rejected">Rechazada</option>
              </select>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between">
            <p className="text-sm text-tikin-dark-600">
              Mostrando <span className="font-semibold text-tikin-dark-950">{filteredQuotations.length}</span> de{' '}
              <span className="font-semibold text-tikin-dark-950">{quotations.length}</span> cotizaciones
            </p>
            {(companyFilter || statusFilter !== 'all') && (
              <button
                onClick={() => { setCompanyFilter(''); setStatusFilter('all') }}
                className="text-sm text-tikin-red hover:text-tikin-red-700 font-medium"
              >
                Limpiar filtros
              </button>
            )}
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-soft border border-tikin-dark-200 overflow-hidden">
          {filteredQuotations.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-tikin-dark-500">
                {quotations.length === 0
                  ? 'No hay cotizaciones registradas'
                  : 'No se encontraron cotizaciones con los filtros aplicados'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-tikin-dark-50 border-b border-tikin-dark-200">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">Fecha</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">Empresa</th>
                    <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">Comercial</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">Empleados</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">Total Compensacion</th>
                    <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">Comision Tikin</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">Split</th>
                    <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">Estado</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-tikin-dark-200">
                  {filteredQuotations.map((q) => {
                    const commission = q.tikin_commission as any
                    const comisionTotal = commission?.totalConIva || 0
                    return (
                      <tr key={q.id} className="hover:bg-tikin-dark-50 transition-colors">
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-tikin-dark-900">{formatDate(q.created_at)}</td>
                        <td className="px-4 py-4 text-sm text-tikin-dark-900">
                          <div className="font-medium">{q.company_name}</div>
                          {q.nit && <div className="text-xs text-tikin-dark-500">NIT: {q.nit}</div>}
                        </td>
                        <td className="px-4 py-4 text-sm text-tikin-dark-900">
                          <div className="font-medium">{q.user_name || q.user_email || 'N/A'}</div>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-tikin-dark-900 text-right">{q.total_employees}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-tikin-dark-900 text-right font-medium">{formatCurrency(q.total_compensation)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-tikin-dark-900 text-right font-medium">{formatCurrency(comisionTotal)}</td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-tikin-dark-900 text-center">
                          <span className="text-xs bg-tikin-dark-100 px-2 py-1 rounded">{q.split_salary_pct}/{q.split_bonus_pct}</span>
                        </td>
                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center">
                          <select
                            value={q.status}
                            onChange={(e) => handleStatusChange(q.id, e.target.value as any)}
                            aria-label={`Cambiar estado de ${q.company_name}`}
                            className={`px-3 py-1.5 text-xs font-semibold rounded-lg border-2 focus:outline-none focus:ring-2 focus:ring-tikin-red transition-all ${statusSelectClass(q.status)}`}
                          >
                            <option value="pending">Pendiente</option>
                            <option value="accepted">Aprobada</option>
                            <option value="rejected">Rechazada</option>
                          </select>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Summary */}
        {filteredQuotations.length > 0 && (
          <div className="mt-6 bg-tikin-red-50 border border-tikin-red-200 rounded-lg shadow-soft p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <p className="text-sm text-tikin-red-700 mb-1 font-medium">Total Cotizaciones</p>
                <p className="text-2xl font-bold text-tikin-red">{filteredQuotations.length}</p>
              </div>
              <div>
                <p className="text-sm text-tikin-red-700 mb-1 font-medium">Empleados Total</p>
                <p className="text-2xl font-bold text-tikin-red">
                  {filteredQuotations.reduce((sum, q) => sum + q.total_employees, 0).toLocaleString('es-CO')}
                </p>
              </div>
            </div>
          </div>
        )}
    </div>
  )
}
