'use client'

/**
 * MIS COTIZACIONES - Página de Usuario
 *
 * Muestra las cotizaciones creadas por el usuario autenticado (Bonos 2.0)
 * con filtros y gestión de estado
 */

import { useEffect, useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateCotizacionStatus } from '@/lib/supabase/quotations'
import { notify } from '@/lib/utils/notifications'
import { AppLayout } from '@/components/AppLayout'
import type { QuotationRecord } from '@/types/quotation'
import Link from 'next/link'
import { Search, FileText, Plus } from 'lucide-react'
import { Spinner } from '@/components/ui/spinner'
import { EmptyState } from '@/components/ui/empty-state'

type StatusType = 'all' | 'pending' | 'accepted' | 'rejected'

export default function MisCotizacionesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [quotations, setQuotations] = useState<QuotationRecord[]>([])
  const [filteredQuotations, setFilteredQuotations] = useState<QuotationRecord[]>([])
  const [loading, setLoading] = useState(true)

  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<StatusType>('all')

  useEffect(() => {
    const loadQuotations = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const { data, error } = await supabase
          .from('quotations_bonos2')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setQuotations(data || [])
        setFilteredQuotations(data || [])
      } catch (error) {
        notify.error('Error al cargar cotizaciones')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadQuotations()
    }
  }, [user, authLoading, router, supabase])

  useEffect(() => {
    let filtered = [...quotations]

    if (searchTerm) {
      filtered = filtered.filter(
        (q) =>
          q.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.nit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.contact_name?.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((q) => q.status === statusFilter)
    }

    setFilteredQuotations(filtered)
  }, [searchTerm, statusFilter, quotations])

  const formatCurrency = (value: number) =>
    new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', minimumFractionDigits: 0 }).format(value)

  const formatDate = (date: string) =>
    new Date(date).toLocaleDateString('es-CO', { year: 'numeric', month: 'short', day: 'numeric' })

  const handleStatusChange = async (id: string, newStatus: QuotationRecord['status']) => {
    const result = await updateCotizacionStatus(id, newStatus)
    if (result.success) {
      setQuotations(prev => prev.map(q => q.id === id ? { ...q, status: newStatus } : q))
      notify.success('Estado actualizado')
    } else {
      notify.error(result.error || 'Error al actualizar')
    }
  }

  const statusSelectClass = (status?: string) => {
    if (status === 'accepted') return 'bg-green-100 text-green-800 border-green-300'
    if (status === 'rejected') return 'bg-red-100 text-red-800 border-red-300'
    return 'bg-yellow-100 text-yellow-800 border-yellow-300' // pending (default)
  }

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center" role="status" aria-live="polite">
            <Spinner size="lg" className="mx-auto mb-4" />
            <p className="text-tikin-dark-600 font-medium">Cargando...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-[1800px] mx-auto">
          {/* Header */}
          <div className="border-b border-tikin-dark-200 pb-6 mb-8">
            <h1 className="text-3xl font-bold text-tikin-dark-950 tracking-tight">Mis Cotizaciones</h1>
            <p className="text-tikin-dark-600 mt-1">Historial de cotizaciones generadas</p>
          </div>

          {quotations.length > 0 ? (
            <>
              {/* Filtros */}
              <div className="bg-white rounded-lg shadow-soft p-6 mb-6 border border-tikin-dark-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-tikin-dark-700 mb-2">Buscar</label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Nombre de empresa, NIT o contacto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-2.5 pl-10 border border-tikin-dark-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-tikin-red focus:outline-none transition-colors"
                      />
                      <Search className="w-5 h-5 text-tikin-dark-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-tikin-dark-700 mb-2">Estado</label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as StatusType)}
                      className="w-full px-4 py-2.5 border border-tikin-dark-300 rounded-lg focus:ring-2 focus:ring-tikin-red focus:border-tikin-red focus:outline-none transition-colors"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="pending">Pendiente</option>
                      <option value="accepted">Aprobada</option>
                      <option value="rejected">Rechazada</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabla */}
              <div className="bg-white rounded-lg shadow-soft border border-tikin-dark-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-tikin-dark-50 border-b border-tikin-dark-200">
                      <tr>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">Fecha</th>
                        <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">Empresa</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">Empleados</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">Compensación Total</th>
                        <th scope="col" className="px-4 py-3 text-right text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">Comisión Tikin</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">Split</th>
                        <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-tikin-dark-600 uppercase tracking-wider">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-tikin-dark-200">
                      {filteredQuotations.map((q) => {
                        const commission = q.tikin_commission as any
                        const comisionTotal = commission?.totalConIva || 0
                        return (
                          <tr key={q.id} className="hover:bg-tikin-dark-50 transition-colors">
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-tikin-dark-950">
                              {formatDate(q.created_at)}
                            </td>
                            <td className="px-4 py-4 text-sm text-tikin-dark-950">
                              <div className="font-semibold">{q.company_name}</div>
                              {q.nit && <div className="text-xs text-tikin-dark-500">NIT: {q.nit}</div>}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-tikin-dark-950 text-right">
                              {q.total_employees}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-tikin-dark-950 text-right">
                              {formatCurrency(q.total_compensation)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-tikin-dark-950 text-right">
                              {formatCurrency(comisionTotal)}
                            </td>
                            <td className="px-4 py-4 whitespace-nowrap text-sm text-tikin-dark-950 text-center">
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

                <div className="px-4 py-4 bg-tikin-dark-50 border-t border-tikin-dark-200">
                  <p className="text-sm text-tikin-dark-600">
                    Mostrando <span className="font-semibold">{filteredQuotations.length}</span> de{' '}
                    <span className="font-semibold">{quotations.length}</span> cotizaciones
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-lg shadow-soft p-12 text-center border border-tikin-dark-200">
              <EmptyState
                icon={FileText}
                title="No tienes cotizaciones"
                description="Genera tu primera cotización para empezar a simular escenarios"
                actionLabel="Crear Primera Cotización"
                actionHref="/bonos"
              />
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  )
}
