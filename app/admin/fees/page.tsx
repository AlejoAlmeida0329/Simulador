'use client'

/**
 * ADMIN - Fees / Comisiones
 *
 * Panel para gestionar las tarifas de comisiones Tikin.
 * Todos los tipos de bonos usan rangos editables con collapsible sections.
 * UX: formatted currency inputs, dirty tracking, collapsible sections, row numbers.
 * IVA (19%) es fijo — se aplica automaticamente.
 */

import { useEffect, useState, useCallback, useRef } from 'react'
import { getFeeConfig, updateFeeConfig } from '@/lib/supabase/fee-config'
import { invalidateFeesCache } from '@/lib/bonos/fee-provider'
import type { FeeConfigRecord } from '@/types/quotation'
import { notify } from '@/lib/utils/notifications'
import { Spinner } from '@/components/ui/spinner'
import { PageHeader } from '@/components/ui/page-header'

interface RangeRow {
  min: number
  max: number
  fee: number
  label: string
}

type FeeType = 'mera_liberalidad' | 'alimentacion' | 'dotacion' | 'viaticos' | 'reparticion_utilidades'

const FEE_SECTIONS: {
  key: FeeType
  title: string
  description: string
}[] = [
  {
    key: 'mera_liberalidad',
    title: 'Mera Liberalidad',
    description: 'Incentivos, Navidad, Cumpleanos, Movilidad, Salud, Recreacion, Vivienda, Conectividad.'
  },
  {
    key: 'reparticion_utilidades',
    title: 'Reparticion de Utilidades',
    description: 'Bonos de participacion en utilidades de la empresa.'
  },
  {
    key: 'alimentacion',
    title: 'Alimentacion',
    description: 'Bonos de alimentacion (Sodexo, tarjetas, etc.).'
  },
  {
    key: 'viaticos',
    title: 'Viaticos',
    description: 'Bonos para gastos de viaje y transporte.'
  },
  {
    key: 'dotacion',
    title: 'Dotacion',
    description: 'Obligatoria por ley (Art. 230 CST).'
  }
]

export default function FeesPage() {
  const [records, setRecords] = useState<FeeConfigRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // All fee types use ranges
  const [allRanges, setAllRanges] = useState<Record<FeeType, RangeRow[]>>({
    mera_liberalidad: [],
    reparticion_utilidades: [],
    alimentacion: [],
    viaticos: [],
    dotacion: []
  })

  // Track original state for dirty detection
  const originalRanges = useRef<Record<FeeType, string>>({
    mera_liberalidad: '',
    reparticion_utilidades: '',
    alimentacion: '',
    viaticos: '',
    dotacion: ''
  })

  // Collapsible state — ML open by default
  const [expanded, setExpanded] = useState<Record<FeeType, boolean>>({
    mera_liberalidad: true,
    reparticion_utilidades: false,
    alimentacion: false,
    viaticos: false,
    dotacion: false
  })

  const isDirty = (feeType: FeeType) => {
    return JSON.stringify(allRanges[feeType]) !== originalRanges.current[feeType]
  }

  const loadFees = useCallback(async () => {
    setLoading(true)
    const result = await getFeeConfig()
    if (result.success && result.data) {
      setRecords(result.data)
      const newRanges: Record<FeeType, RangeRow[]> = {
        mera_liberalidad: [],
        reparticion_utilidades: [],
        alimentacion: [],
        viaticos: [],
        dotacion: []
      }

      for (const r of result.data) {
        const feeType = r.fee_type as FeeType
        if (!(feeType in newRanges)) continue

        if (r.ranges && r.ranges.length > 0) {
          newRanges[feeType] = r.ranges.map(rng => ({ ...rng }))
        } else if (r.fixed_rate !== null && r.fixed_rate !== undefined) {
          newRanges[feeType] = [{
            min: 0,
            max: 999999999999,
            fee: r.fixed_rate,
            label: 'Tarifa base'
          }]
        }
      }

      setAllRanges(newRanges)
      // Store original for dirty tracking
      for (const key of Object.keys(newRanges) as FeeType[]) {
        originalRanges.current[key] = JSON.stringify(newRanges[key])
      }
    } else {
      notify.error('No se pudieron cargar los fees. Verifica que la tabla fee_config existe en Supabase.')
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    loadFees()
  }, [loadFees])

  function getRecord(feeType: string): FeeConfigRecord | undefined {
    return records.find(r => r.fee_type === feeType)
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  async function handleSaveRanges(feeType: FeeType) {
    const ranges = allRanges[feeType]
    if (ranges.length === 0) {
      notify.error('Debe haber al menos un rango')
      return
    }
    for (const range of ranges) {
      if (range.fee < 0 || range.fee > 1) {
        notify.error('Los porcentajes deben estar entre 0% y 100%')
        return
      }
      if (range.min > range.max && range.max < 999999999998) {
        notify.error(`Rango "${range.label}": "Desde" no puede ser mayor que "Hasta"`)
        return
      }
      if (!range.label.trim()) {
        notify.error('Todos los rangos deben tener un nombre')
        return
      }
    }
    setSaving(feeType)
    const rangesForDB = ranges.map(r => ({
      min: r.min,
      max: r.max >= 999999999998 ? 999999999999 : r.max,
      fee: r.fee,
      label: r.label
    }))
    const result = await updateFeeConfig(feeType, { ranges: rangesForDB, fixed_rate: null })
    if (result.success) {
      notify.success('Rangos actualizados')
      invalidateFeesCache()
      await loadFees()
    } else {
      notify.error(result.error || 'Error al guardar')
    }
    setSaving(null)
  }

  function handleDiscard(feeType: FeeType) {
    const original = JSON.parse(originalRanges.current[feeType]) as RangeRow[]
    setAllRanges(prev => ({ ...prev, [feeType]: original }))
  }

  function updateRangeField(feeType: FeeType, idx: number, field: keyof RangeRow, value: string) {
    setAllRanges(prev => ({
      ...prev,
      [feeType]: prev[feeType].map((r, i) => {
        if (i !== idx) return r
        if (field === 'fee') return { ...r, fee: parseFloat(value) || 0 }
        if (field === 'min' || field === 'max') return { ...r, [field]: parseInt(value) || 0 }
        return { ...r, [field]: value }
      })
    }))
  }

  function addRange(feeType: FeeType) {
    setAllRanges(prev => {
      const current = prev[feeType]
      const lastMax = current.length > 0 ? current[current.length - 1].max : 0
      return {
        ...prev,
        [feeType]: [...current, {
          min: lastMax >= 999999999998 ? 0 : lastMax + 1,
          max: 999999999999,
          fee: 0.02,
          label: `Rango ${current.length + 1}`
        }]
      }
    })
  }

  function removeRange(feeType: FeeType, idx: number) {
    setAllRanges(prev => ({
      ...prev,
      [feeType]: prev[feeType].filter((_, i) => i !== idx)
    }))
  }

  function toggleSection(feeType: FeeType) {
    setExpanded(prev => ({ ...prev, [feeType]: !prev[feeType] }))
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <Spinner size="lg" className="mx-auto mb-3" />
          <p className="text-tikin-dark-500 text-sm">Cargando configuracion de fees...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Comisiones Tikin"
        description="Configura los rangos y tarifas de comision por tipo de bono. El IVA (19%) se aplica automaticamente."
      />

      <div className="space-y-3">
        {FEE_SECTIONS.map(section => (
          <RangesSection
            key={section.key}
            title={section.title}
            description={section.description}
            ranges={allRanges[section.key]}
            isExpanded={expanded[section.key]}
            onToggle={() => toggleSection(section.key)}
            dirty={isDirty(section.key)}
            onUpdateRange={(idx, field, value) => updateRangeField(section.key, idx, field, value)}
            onAddRange={() => addRange(section.key)}
            onRemoveRange={(idx) => removeRange(section.key, idx)}
            onSave={() => handleSaveRanges(section.key)}
            onDiscard={() => handleDiscard(section.key)}
            saving={saving === section.key}
            updatedAt={getRecord(section.key)?.updated_at}
            formatDate={formatDate}
          />
        ))}
      </div>
    </div>
  )
}

// ============================================================
// Helper: format number as COP currency for display
// ============================================================
function formatCOP(n: number): string {
  if (n >= 999999999998) return 'Infinito'
  return '$' + n.toLocaleString('es-CO')
}

// ============================================================
// COLLAPSIBLE RANGES SECTION
// ============================================================

function RangesSection({
  title,
  description,
  ranges,
  isExpanded,
  onToggle,
  dirty,
  onUpdateRange,
  onAddRange,
  onRemoveRange,
  onSave,
  onDiscard,
  saving,
  updatedAt,
  formatDate
}: {
  title: string
  description: string
  ranges: RangeRow[]
  isExpanded: boolean
  onToggle: () => void
  dirty: boolean
  onUpdateRange: (idx: number, field: keyof RangeRow, value: string) => void
  onAddRange: () => void
  onRemoveRange: (idx: number) => void
  onSave: () => void
  onDiscard: () => void
  saving: boolean
  updatedAt?: string
  formatDate: (d: string) => string
}) {
  // Summary text for collapsed state
  const summary = ranges.length === 0
    ? 'Sin rangos'
    : ranges.length === 1
      ? `1 rango — ${(ranges[0].fee * 100).toFixed(2)}%`
      : `${ranges.length} rangos — ${(ranges[0].fee * 100).toFixed(1)}% a ${(ranges[ranges.length - 1].fee * 100).toFixed(1)}%`

  return (
    <div className={`bg-white rounded-lg shadow-soft border transition-colors ${dirty ? 'border-amber-300' : 'border-tikin-dark-200'}`}>
      {/* Collapsible header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-tikin-dark-50/50 transition-colors rounded-lg"
      >
        <div className="flex items-center gap-3 min-w-0">
          {/* Chevron */}
          <svg
            className={`w-4 h-4 text-tikin-dark-400 flex-shrink-0 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
            fill="none" stroke="currentColor" viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold text-tikin-dark-950">{title}</h3>
              {dirty && (
                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium bg-amber-100 text-amber-700 rounded">
                  Sin guardar
                </span>
              )}
            </div>
            {!isExpanded && (
              <p className="text-sm text-tikin-dark-500 mt-0.5">{summary}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3 flex-shrink-0 ml-4">
          {updatedAt && (
            <span className="text-xs text-tikin-dark-400 hidden sm:inline">
              {formatDate(updatedAt)}
            </span>
          )}
          <span className="text-xs font-medium text-tikin-dark-400 bg-tikin-dark-100 px-2 py-0.5 rounded">
            {ranges.length} {ranges.length === 1 ? 'rango' : 'rangos'}
          </span>
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-5 pb-5 border-t border-tikin-dark-100">
          <p className="text-tikin-dark-500 text-sm mt-3 mb-4">{description}</p>

          {ranges.length === 0 ? (
            <div className="bg-tikin-dark-50 border border-tikin-dark-200 rounded-lg p-4 mb-4 text-center">
              <p className="text-sm text-tikin-dark-500">
                No hay rangos configurados. Agrega el primer rango para definir la tarifa.
              </p>
            </div>
          ) : (
            <div className="mb-4">
              {/* Table header */}
              <div className="grid grid-cols-[32px_1fr_1fr_1fr_90px_36px] gap-2 text-[11px] font-medium text-tikin-dark-400 uppercase tracking-wider mb-2 px-0.5">
                <span>#</span>
                <span>Nombre</span>
                <span>Monto minimo</span>
                <span>Monto maximo</span>
                <span>Fee</span>
                <span></span>
              </div>

              {/* Range rows */}
              <div className="space-y-2">
                {ranges.map((range, idx) => (
                  <div key={idx} className="grid grid-cols-[32px_1fr_1fr_1fr_90px_36px] gap-2 items-center group">
                    {/* Row number */}
                    <span className="text-xs text-tikin-dark-400 font-medium text-center tabular-nums">
                      {idx + 1}
                    </span>

                    {/* Label */}
                    <input
                      type="text"
                      value={range.label}
                      onChange={(e) => onUpdateRange(idx, 'label', e.target.value)}
                      placeholder="Ej: 0 - $80M"
                      className="w-full bg-white border border-tikin-dark-200 rounded-md px-2.5 py-1.5 text-tikin-dark-950 text-sm focus:outline-none focus:ring-2 focus:ring-tikin-red/30 focus:border-tikin-red"
                    />

                    {/* Min — formatted display */}
                    <CurrencyInput
                      value={range.min}
                      onChange={(val) => onUpdateRange(idx, 'min', String(val))}
                    />

                    {/* Max — formatted display */}
                    <CurrencyInput
                      value={range.max}
                      onChange={(val) => onUpdateRange(idx, 'max', String(val))}
                    />

                    {/* Fee */}
                    <div className="relative">
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        value={Math.round(range.fee * 10000) / 100}
                        onChange={(e) => onUpdateRange(idx, 'fee', String(parseFloat(e.target.value) / 100))}
                        className="w-full bg-white border border-tikin-dark-200 rounded-md px-2.5 py-1.5 text-tikin-dark-950 text-sm focus:outline-none focus:ring-2 focus:ring-tikin-red/30 focus:border-tikin-red pr-6 tabular-nums"
                      />
                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-tikin-dark-400 text-xs">%</span>
                    </div>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => {
                        if (ranges.length <= 1) {
                          notify.error('Debe haber al menos un rango')
                          return
                        }
                        onRemoveRange(idx)
                      }}
                      className="flex items-center justify-center w-8 h-8 rounded-md text-tikin-dark-300 hover:text-red-600 hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 focus:opacity-100"
                      aria-label={`Eliminar rango ${range.label}`}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action bar */}
          <div className="flex items-center justify-between pt-3 border-t border-tikin-dark-100">
            <button
              type="button"
              onClick={onAddRange}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-tikin-dark-600 hover:text-tikin-red hover:bg-red-50 rounded-md transition-colors"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Agregar rango
            </button>

            <div className="flex items-center gap-2">
              {dirty && (
                <button
                  type="button"
                  onClick={onDiscard}
                  className="px-3 py-1.5 text-sm font-medium text-tikin-dark-500 hover:text-tikin-dark-700 hover:bg-tikin-dark-100 rounded-md transition-colors"
                >
                  Descartar
                </button>
              )}
              <button
                onClick={onSave}
                disabled={saving || !dirty}
                className={`px-5 py-1.5 rounded-md text-sm font-medium transition-colors ${
                  dirty
                    ? 'bg-tikin-red text-white hover:bg-red-700 disabled:opacity-50'
                    : 'bg-tikin-dark-100 text-tikin-dark-400 cursor-not-allowed'
                }`}
              >
                {saving ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// ============================================================
// CURRENCY INPUT — shows formatted value when not focused
// ============================================================

function CurrencyInput({ value, onChange }: { value: number; onChange: (val: number) => void }) {
  const [focused, setFocused] = useState(false)
  const [editValue, setEditValue] = useState(String(value))

  // Sync when value changes externally
  useEffect(() => {
    if (!focused) {
      setEditValue(String(value))
    }
  }, [value, focused])

  return (
    <div className="relative">
      {focused ? (
        <input
          type="number"
          min="0"
          value={editValue}
          onChange={(e) => {
            setEditValue(e.target.value)
            onChange(parseInt(e.target.value) || 0)
          }}
          onBlur={() => setFocused(false)}
          autoFocus
          className="w-full bg-white border border-tikin-red rounded-md px-2.5 py-1.5 text-tikin-dark-950 text-sm focus:outline-none focus:ring-2 focus:ring-tikin-red/30 tabular-nums"
        />
      ) : (
        <button
          type="button"
          onClick={() => setFocused(true)}
          className="w-full text-left bg-white border border-tikin-dark-200 rounded-md px-2.5 py-1.5 text-tikin-dark-950 text-sm hover:border-tikin-dark-400 transition-colors tabular-nums truncate"
        >
          {formatCOP(value)}
        </button>
      )}
    </div>
  )
}
