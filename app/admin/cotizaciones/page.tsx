'use client'

/**
 * TODAS LAS COTIZACIONES - Panel de Admin
 *
 * Permite al admin ver todas las cotizaciones con filtros y descarga
 * Solo accesible para usuarios con role='admin'
 */

import { useEffect, useState, useRef } from 'react'
import { createPortal } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { updateQuotationStatus } from '@/lib/supabase/quotations'
import { notify } from '@/lib/utils/notifications'
import { AppLayout } from '@/components/AppLayout'
import type { UserProfile } from '@/types/auth'
import type { QuotationRecord } from '@/types/quotation'

export default function AdminCotizacionesPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const supabase = createClient()

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [quotations, setQuotations] = useState<QuotationRecord[]>([])
  const [filteredQuotations, setFilteredQuotations] = useState<QuotationRecord[]>([])
  const [loading, setLoading] = useState(true)

  // Filtros
  const [searchTerm, setSearchTerm] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  // Estado para dropdown
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null)
  const [dropdownPosition, setDropdownPosition] = useState<{ top: number; left: number } | null>(null)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Verificar permisos de admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (!user) {
        router.push('/login')
        return
      }

      try {
        const { data: userProfile, error } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (error) throw error

        if (!userProfile || userProfile.role !== 'admin') {
          notify.error('No tienes permisos para acceder a esta página')
          router.push('/dashboard')
          return
        }

        setProfile(userProfile)
      } catch (error) {
        console.error('Error verificando admin:', error)
        notify.error('Error al verificar permisos')
        router.push('/dashboard')
      }
    }

    if (!authLoading) {
      checkAdmin()
    }
  }, [user, authLoading, router, supabase])

  // Cargar todas las cotizaciones
  useEffect(() => {
    const loadQuotations = async () => {
      if (!profile || profile.role !== 'admin') return

      try {
        const { data, error } = await supabase
          .from('quotations')
          .select('*')
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

    loadQuotations()
  }, [profile, supabase])

  // Aplicar filtros
  useEffect(() => {
    let filtered = [...quotations]

    // Filtro de búsqueda (empresa, contacto, email)
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(
        (q) =>
          q.company_name?.toLowerCase().includes(term) ||
          q.contact_name?.toLowerCase().includes(term) ||
          q.email?.toLowerCase().includes(term) ||
          q.nit?.toLowerCase().includes(term)
      )
    }

    // Filtro de fecha desde
    if (dateFrom) {
      filtered = filtered.filter((q) => {
        const quotationDate = new Date(q.created_at || '')
        return quotationDate >= new Date(dateFrom)
      })
    }

    // Filtro de fecha hasta
    if (dateTo) {
      filtered = filtered.filter((q) => {
        const quotationDate = new Date(q.created_at || '')
        return quotationDate <= new Date(dateTo)
      })
    }

    setFilteredQuotations(filtered)
  }, [searchTerm, dateFrom, dateTo, quotations])

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

  const handleStatusChange = async (quotationId: string, newStatus: 'pending' | 'accepted' | 'rejected') => {
    try {
      const result = await updateQuotationStatus(quotationId, newStatus)

      if (result.success) {
        setQuotations((prev) =>
          prev.map((q) => (q.id === quotationId ? { ...q, status: newStatus } : q))
        )
        notify.success('Estado actualizado correctamente')
        setOpenDropdownId(null)
      } else {
        notify.error(`Error: ${result.error || 'No se pudo actualizar'}`)
      }
    } catch (error) {
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

  const handleDownloadCSV = () => {
    if (filteredQuotations.length === 0) {
      notify.error('No hay cotizaciones para descargar')
      return
    }

    // Crear CSV
    const headers = [
      'Fecha',
      'Empresa',
      'Contacto',
      'Email',
      'Teléfono',
      'NIT',
      'Empleados',
      'Nómina Total',
      'Ahorro Mensual',
      'Ahorro Anual',
      '% Reducción',
      'Comisión Tikin',
      'Ahorro Neto Mensual',
      'Ahorro Neto Anual',
    ]

    const csvContent = [
      headers.join(','),
      ...filteredQuotations.map((q) =>
        [
          new Date(q.created_at || '').toLocaleDateString('es-CO'),
          `"${q.company_name}"`,
          `"${q.contact_name}"`,
          q.email,
          q.phone,
          q.nit || '',
          q.employee_count,
          q.total_payroll,
          q.monthly_savings,
          q.annual_savings,
          q.percentage_reduction,
          q.total_commission,
          q.net_monthly_savings,
          q.net_annual_savings,
        ].join(',')
      ),
    ].join('\n')

    // Descargar
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute(
      'download',
      `cotizaciones_${new Date().toISOString().split('T')[0]}.csv`
    )
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    notify.success('CSV descargado correctamente')
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  if (authLoading || loading || !profile) {
    return (
      <AppLayout showHeader={false}>
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
    <AppLayout showHeader={false}>
      <div className="p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl p-8 mb-8 border-2 border-gray-200 animate-slide-up">
            <div className="flex items-center justify-between">
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
                  <h1 className="text-4xl font-bold text-gray-900">
                    Todas las Cotizaciones
                  </h1>
                  <p className="text-lg text-gray-600 mt-1">
                    Gestiona y descarga todas las cotizaciones del sistema
                  </p>
                </div>
              </div>
              <button
                onClick={handleDownloadCSV}
                className="px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-300 font-semibold flex items-center gap-2"
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
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
                Descargar CSV
              </button>
            </div>
          </div>

          {/* Filtros */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 mb-8 border-2 border-gray-200">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Búsqueda */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Buscar
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Empresa, contacto, email, NIT..."
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-tikin-red transition-colors"
                />
              </div>

              {/* Fecha desde */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Desde
                </label>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-tikin-red transition-colors"
                />
              </div>

              {/* Fecha hasta */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Hasta
                </label>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full px-4 py-2 border-2 border-gray-200 rounded-xl focus:outline-none focus:border-tikin-red transition-colors"
                />
              </div>
            </div>

            {/* Botón limpiar filtros */}
            {(searchTerm || dateFrom || dateTo) && (
              <div className="mt-4 flex justify-end">
                <button
                  onClick={() => {
                    setSearchTerm('')
                    setDateFrom('')
                    setDateTo('')
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium"
                >
                  Limpiar filtros
                </button>
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border-2 border-blue-200">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-7 h-7 text-white"
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
                <div className="ml-4">
                  <p className="text-3xl font-bold text-gray-900">
                    {filteredQuotations.length}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">Cotizaciones</p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border-2 border-green-200">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(
                      filteredQuotations.reduce(
                        (sum, q) => sum + (q.net_annual_savings || 0),
                        0
                      )
                    )}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    Ahorro Total Anual
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-xl p-6 border-2 border-purple-200">
              <div className="flex items-center">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg
                    className="w-7 h-7 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                    />
                  </svg>
                </div>
                <div className="ml-4">
                  <p className="text-3xl font-bold text-gray-900">
                    {filteredQuotations.reduce(
                      (sum, q) => sum + (q.employee_count || 0),
                      0
                    )}
                  </p>
                  <p className="text-sm text-gray-600 font-medium">
                    Total Empleados
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Tabla de cotizaciones */}
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl border-2 border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-100">
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

            {filteredQuotations.length === 0 && (
              <div className="p-12 text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                  <svg
                    className="w-10 h-10 text-gray-400"
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
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  No hay cotizaciones
                </h3>
                <p className="text-gray-600 text-lg">
                  {quotations.length === 0
                    ? 'Las cotizaciones aparecerán aquí cuando se generen'
                    : 'No hay cotizaciones que coincidan con los filtros'}
                </p>
              </div>
            )}
          </div>
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
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleStatusChange(openDropdownId, 'pending')
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-yellow-50 transition-colors flex items-center gap-2"
          >
            <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
            Pendiente
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleStatusChange(openDropdownId, 'accepted')
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 transition-colors flex items-center gap-2"
          >
            <span className="w-3 h-3 rounded-full bg-green-500"></span>
            Aceptada
          </button>
          <button
            onClick={(e) => {
              e.stopPropagation()
              handleStatusChange(openDropdownId, 'rejected')
            }}
            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 transition-colors flex items-center gap-2"
          >
            <span className="w-3 h-3 rounded-full bg-red-500"></span>
            Rechazada
          </button>
        </div>,
        document.body
      )}
    </AppLayout>
  )
}
