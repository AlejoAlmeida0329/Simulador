'use client'

/**
 * MIS COTIZACIONES - Página de Usuario
 *
 * Muestra las cotizaciones creadas por el usuario autenticado en formato tabla
 * con filtros y gestión de estado (pendiente/aceptada/rechazada)
 */

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateQuotationStatus } from '@/lib/supabase/quotations'
import { notify } from '@/lib/utils/notifications'
import { AppLayout } from '@/components/AppLayout'
import type { QuotationRecord } from '@/types/quotation'
import Link from 'next/link'

export default function MisCotizacionesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [quotations, setQuotations] = useState<QuotationRecord[]>([])
  const [filteredQuotations, setFilteredQuotations] = useState<QuotationRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Estados de filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('all')

  // Estado para controlar qué dropdown está abierto
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Cargar cotizaciones del usuario
  useEffect(() => {
    const loadQuotations = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const { data, error } = await supabase
          .from('quotations')
          .select('*')
          .eq('generated_by', user.id)
          .order('created_at', { ascending: false })

        if (error) throw error

        setQuotations(data || [])
        setFilteredQuotations(data || [])
      } catch (error) {
        console.error('Error cargando cotizaciones:', error)
        notify.error('Error al cargar cotizaciones')
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading) {
      loadQuotations()
    }
  }, [user, authLoading, router, supabase])

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...quotations]

    // Filtro de búsqueda
    if (searchTerm) {
      filtered = filtered.filter(
        (q) =>
          q.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.nit?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          q.contact_name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    // Filtro de estado
    if (statusFilter !== 'all') {
      filtered = filtered.filter((q) => (q.status || 'pending') === statusFilter)
    }

    setFilteredQuotations(filtered)
  }, [searchTerm, statusFilter, quotations])

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement
      if (openDropdownId && !target.closest('.relative')) {
        setOpenDropdownId(null)
      }
    }

    if (openDropdownId) {
      document.addEventListener('click', handleClickOutside)
    }

    return () => {
      document.removeEventListener('click', handleClickOutside)
    }
  }, [openDropdownId])

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const handleStatusChange = async (quotationId: string, newStatus: 'pending' | 'accepted' | 'rejected') => {
    try {
      console.log('Intentando actualizar cotización:', quotationId, 'a estado:', newStatus)
      const result = await updateQuotationStatus(quotationId, newStatus)

      console.log('Resultado de actualización:', result)

      if (result.success) {
        // Actualizar el estado local
        setQuotations((prev) =>
          prev.map((q) => (q.id === quotationId ? { ...q, status: newStatus } : q))
        )
        notify.success('Estado actualizado correctamente')
        // Cerrar el dropdown
        setOpenDropdownId(null)
      } else {
        console.error('Error del servidor:', result.error)
        notify.error(`Error: ${result.error || 'No se pudo actualizar'}`)
      }
    } catch (error) {
      console.error('Error actualizando estado:', error)
      notify.error(`Error: ${error instanceof Error ? error.message : 'Error desconocido'}`)
    }
  }

  const toggleDropdown = (quotationId: string, buttonElement: HTMLButtonElement) => {
    if (openDropdownId === quotationId) {
      setOpenDropdownId(null)
      setDropdownPosition(null)
    } else {
      const rect = buttonElement.getBoundingClientRect()
      setDropdownPosition({
        top: rect.bottom + 4, // 4px de margen debajo del botón
        left: rect.right - 192 // 192px = ancho del dropdown (w-48)
      })
      setOpenDropdownId(quotationId)
    }
  }

  const getStatusBadge = (status?: string) => {
    const currentStatus = status || 'pending'

    const statusConfig = {
      pending: {
        label: 'Pendiente',
        bgColor: 'bg-yellow-100',
        textColor: 'text-yellow-800',
        borderColor: 'border-yellow-300'
      },
      accepted: {
        label: 'Aceptada',
        bgColor: 'bg-green-100',
        textColor: 'text-green-800',
        borderColor: 'border-green-300'
      },
      rejected: {
        label: 'Rechazada',
        bgColor: 'bg-red-100',
        textColor: 'text-red-800',
        borderColor: 'border-red-300'
      }
    }

    const config = statusConfig[currentStatus as keyof typeof statusConfig] || statusConfig.pending

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${config.bgColor} ${config.textColor} ${config.borderColor}`}>
        {config.label}
      </span>
    )
  }

  if (authLoading || loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-full">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-tikin-red mx-auto mb-4"></div>
            <p className="text-gray-600 font-medium">Cargando...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-8 mb-8 border-2 border-gray-200 animate-slide-up">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 bg-gradient-to-br from-tikin-red to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg
                  className="w-8 h-8 text-white"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Mis Cotizaciones</h1>
                <p className="text-lg text-gray-600 mt-1">
                  Historial de cotizaciones generadas
                </p>
              </div>
            </div>
          </div>

          {quotations.length > 0 ? (
            <>
              {/* Filtros */}
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 mb-6 border-2 border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Búsqueda */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Buscar
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        placeholder="Nombre de empresa, NIT o contacto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full px-4 py-3 pl-10 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-tikin-red transition-colors"
                      />
                      <svg
                        className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                      </svg>
                    </div>
                  </div>

                  {/* Filtro de estado */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Estado
                    </label>
                    <select
                      value={statusFilter}
                      onChange={(e) => setStatusFilter(e.target.value as any)}
                      className="w-full px-4 py-3 border-2 border-gray-300 rounded-xl focus:outline-none focus:border-tikin-red transition-colors"
                    >
                      <option value="all">Todos los estados</option>
                      <option value="pending">Pendiente</option>
                      <option value="accepted">Aceptada</option>
                      <option value="rejected">Rechazada</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Tabla de cotizaciones */}
              <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl border-2 border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b-2 border-gray-200">
                      <tr>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Empresa
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          NIT
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Empleados
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Nómina Total
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Total Bonos
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Comisión Tikin
                        </th>
                        <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                          Estado
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredQuotations.map((quotation) => (
                        <tr
                          key={quotation.id}
                          className="hover:bg-gray-50 transition-colors"
                        >
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {quotation.company_name}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-700">
                            {quotation.nit || 'N/A'}
                          </td>
                          <td className="px-6 py-4 text-sm font-medium text-gray-900">
                            {quotation.employee_count}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-gray-900">
                            {formatCurrency(quotation.total_payroll)}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-green-700">
                            {formatCurrency(quotation.monthly_bonus_total)}
                          </td>
                          <td className="px-6 py-4 text-sm font-semibold text-tikin-red">
                            {formatCurrency(quotation.total_commission)}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              {getStatusBadge(quotation.status)}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleDropdown(quotation.id!, e.currentTarget)
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition-colors"
                              >
                                <svg
                                  className="w-5 h-5 text-gray-600"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                                  />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Resultados */}
                <div className="px-6 py-4 bg-gray-50 border-t-2 border-gray-200">
                  <p className="text-sm text-gray-600">
                    Mostrando <span className="font-semibold">{filteredQuotations.length}</span> de{' '}
                    <span className="font-semibold">{quotations.length}</span> cotizaciones
                  </p>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-12 text-center border-2 border-gray-200 animate-fade-in">
              <div className="w-24 h-24 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                <svg
                  className="w-12 h-12 text-gray-400"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <h3 className="text-3xl font-bold text-gray-900 mb-3">
                No tienes cotizaciones
              </h3>
              <p className="text-gray-600 text-lg mb-8">
                Genera tu primera cotización para empezar a ver ahorros en parafiscales
              </p>
              <Link
                href="/bonos"
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-tikin-red to-red-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold"
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 4v16m8-8H4"
                  />
                </svg>
                Crear Primera Cotización
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Dropdown Portal */}
      {mounted && openDropdownId && dropdownPosition && createPortal(
        <div
          className="fixed w-48 bg-white rounded-xl shadow-2xl border-2 border-gray-200 py-2"
          style={{
            top: `${dropdownPosition.top}px`,
            left: `${dropdownPosition.left}px`,
            zIndex: 99999
          }}
        >
          {filteredQuotations.map((q) => {
            if (q.id === openDropdownId) {
              return (
                <div key={q.id}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange(q.id!, 'pending')
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-50 transition-colors flex items-center gap-2"
                  >
                    <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                    Pendiente
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange(q.id!, 'accepted')
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 transition-colors flex items-center gap-2"
                  >
                    <span className="w-3 h-3 rounded-full bg-green-500"></span>
                    Aceptada
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleStatusChange(q.id!, 'rejected')
                    }}
                    className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 transition-colors flex items-center gap-2"
                  >
                    <span className="w-3 h-3 rounded-full bg-red-500"></span>
                    Rechazada
                  </button>
                </div>
              )
            }
            return null
          })}
        </div>,
        document.body
      )}
    </AppLayout>
  )
}
