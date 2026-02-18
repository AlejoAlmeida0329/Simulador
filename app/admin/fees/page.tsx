'use client'

/**
 * ADMIN - Fees / Comisiones
 *
 * Panel para gestionar las tarifas de comisiones Tikin.
 * Lee de la tabla fee_config y permite editar valores.
 */

import { useEffect, useState } from 'react'
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

export default function FeesPage() {
  const [records, setRecords] = useState<FeeConfigRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState<string | null>(null)

  // Editable states per fee type
  const [alimentacionRate, setAlimentacionRate] = useState<string>('')
  const [viaticosRate, setViaticosRate] = useState<string>('')
  const [ivaRate, setIvaRate] = useState<string>('')
  const [mlRanges, setMlRanges] = useState<RangeRow[]>([])

  useEffect(() => {
    loadFees()
  }, [])

  async function loadFees() {
    setLoading(true)
    const result = await getFeeConfig()
    if (result.success && result.data) {
      setRecords(result.data)
      // Populate editable states
      for (const r of result.data) {
        switch (r.fee_type) {
          case 'alimentacion':
            setAlimentacionRate(r.fixed_rate !== null ? String(r.fixed_rate * 100) : '1.25')
            break
          case 'viaticos':
            setViaticosRate(r.fixed_rate !== null ? String(r.fixed_rate * 100) : '1.25')
            break
          case 'iva':
            setIvaRate(r.fixed_rate !== null ? String(r.fixed_rate * 100) : '19')
            break
          case 'mera_liberalidad':
            if (r.ranges && r.ranges.length > 0) {
              setMlRanges(r.ranges.map(rng => ({ ...rng })))
            }
            break
        }
      }
    } else {
      notify.error('No se pudieron cargar los fees. Verifica que la tabla fee_config existe en Supabase.')
    }
    setLoading(false)
  }

  function getRecord(feeType: string): FeeConfigRecord | undefined {
    return records.find(r => r.fee_type === feeType)
  }

  function formatDate(dateStr: string): string {
    return new Date(dateStr).toLocaleDateString('es-CO', {
      year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit'
    })
  }

  async function handleSaveFixed(feeType: string, rateStr: string) {
    const rate = parseFloat(rateStr)
    if (isNaN(rate) || rate < 0 || rate > 100) {
      notify.error('Porcentaje debe estar entre 0 y 100')
      return
    }
    setSaving(feeType)
    const result = await updateFeeConfig(feeType, { fixed_rate: rate / 100 })
    if (result.success) {
      notify.success('Tarifa actualizada')
      invalidateFeesCache()
      await loadFees()
    } else {
      notify.error(result.error || 'Error al guardar')
    }
    setSaving(null)
  }

  async function handleSaveRanges() {
    // Validate ranges
    for (const range of mlRanges) {
      if (range.fee < 0 || range.fee > 100) {
        notify.error('Los porcentajes deben estar entre 0 y 100')
        return
      }
    }
    setSaving('mera_liberalidad')
    const rangesForDB = mlRanges.map(r => ({
      min: r.min,
      max: r.max >= 999999999998 ? 999999999999 : r.max,
      fee: r.fee,
      label: r.label
    }))
    const result = await updateFeeConfig('mera_liberalidad', { ranges: rangesForDB })
    if (result.success) {
      notify.success('Rangos actualizados')
      invalidateFeesCache()
      await loadFees()
    } else {
      notify.error(result.error || 'Error al guardar')
    }
    setSaving(null)
  }

  function updateRange(idx: number, field: keyof RangeRow, value: string) {
    setMlRanges(prev => prev.map((r, i) => {
      if (i !== idx) return r
      if (field === 'fee') return { ...r, fee: parseFloat(value) || 0 }
      if (field === 'min' || field === 'max') return { ...r, [field]: parseInt(value) || 0 }
      return { ...r, [field]: value }
    }))
  }

  function formatCurrency(n: number): string {
    if (n >= 999999999998) return 'Infinito'
    return '$' + n.toLocaleString('es-CO')
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
      {/* Header */}
      <PageHeader title="Fees / Comisiones" description="Configuracion de tarifas de comision Tikin. Los cambios se aplican inmediatamente a nuevas cotizaciones." />

      {/* Mera Liberalidad - Ranges */}
      <div className="bg-white rounded-lg shadow-soft border border-tikin-dark-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold text-tikin-dark-950">Mera Liberalidad</h2>
            <p className="text-tikin-dark-500 text-sm">Fee variable por rangos de monto total dispersado</p>
          </div>
          {getRecord('mera_liberalidad')?.updated_at && (
            <span className="text-xs text-tikin-dark-500">
              Actualizado: {formatDate(getRecord('mera_liberalidad')!.updated_at)}
            </span>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm" role="table">
            <thead>
              <tr className="text-left text-tikin-dark-500 border-b border-tikin-dark-200">
                <th className="pb-2 pr-4">Rango</th>
                <th className="pb-2 pr-4">Desde</th>
                <th className="pb-2 pr-4">Hasta</th>
                <th className="pb-2 pr-4">Fee (%)</th>
              </tr>
            </thead>
            <tbody>
              {mlRanges.map((range, idx) => (
                <tr key={idx} className="border-b border-tikin-dark-200">
                  <td className="py-3 pr-4 text-tikin-dark-600">{range.label}</td>
                  <td className="py-3 pr-4 text-tikin-dark-600">{formatCurrency(range.min)}</td>
                  <td className="py-3 pr-4 text-tikin-dark-600">{formatCurrency(range.max)}</td>
                  <td className="py-3 pr-4">
                    <input
                      type="number"
                      step="0.1"
                      value={range.fee * 100}
                      onChange={(e) => updateRange(idx, 'fee', String(parseFloat(e.target.value) / 100))}
                      className="w-20 bg-white border border-tikin-dark-300 rounded px-2 py-1 text-tikin-dark-950 text-sm focus:outline-none focus:ring-2 focus:ring-tikin-red focus:border-tikin-red"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 flex justify-end">
          <button
            onClick={handleSaveRanges}
            disabled={saving === 'mera_liberalidad'}
            className="px-4 py-2 bg-tikin-red text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {saving === 'mera_liberalidad' ? 'Guardando...' : 'Guardar Rangos'}
          </button>
        </div>
      </div>

      {/* Fixed fee cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Alimentacion */}
        <FeeCard
          title="Alimentacion"
          description="Fee fijo para bonos de alimentacion"
          value={alimentacionRate}
          onChange={setAlimentacionRate}
          onSave={() => handleSaveFixed('alimentacion', alimentacionRate)}
          saving={saving === 'alimentacion'}
          updatedAt={getRecord('alimentacion')?.updated_at}
          formatDate={formatDate}
        />

        {/* Viaticos */}
        <FeeCard
          title="Viaticos"
          description="Fee fijo para bonos de viaticos"
          value={viaticosRate}
          onChange={setViaticosRate}
          onSave={() => handleSaveFixed('viaticos', viaticosRate)}
          saving={saving === 'viaticos'}
          updatedAt={getRecord('viaticos')?.updated_at}
          formatDate={formatDate}
        />

        {/* Dotacion */}
        <div className="bg-white rounded-lg shadow-soft border border-tikin-dark-200 p-6">
          <h3 className="text-base font-semibold text-tikin-dark-950">Dotacion</h3>
          <p className="text-tikin-dark-500 text-sm mt-1">Obligatoria por ley, sin fee de comision</p>
          <div className="mt-4">
            <div className="bg-tikin-dark-50 border border-tikin-dark-200 rounded px-3 py-2 text-tikin-dark-500 text-sm">
              0% (no editable)
            </div>
          </div>
        </div>

        {/* IVA */}
        <FeeCard
          title="IVA"
          description="Impuesto al valor agregado sobre fees"
          value={ivaRate}
          onChange={setIvaRate}
          onSave={() => handleSaveFixed('iva', ivaRate)}
          saving={saving === 'iva'}
          updatedAt={getRecord('iva')?.updated_at}
          formatDate={formatDate}
        />
      </div>
    </div>
  )
}

function FeeCard({
  title,
  description,
  value,
  onChange,
  onSave,
  saving,
  updatedAt,
  formatDate
}: {
  title: string
  description: string
  value: string
  onChange: (val: string) => void
  onSave: () => void
  saving: boolean
  updatedAt?: string
  formatDate: (d: string) => string
}) {
  return (
    <div className="bg-white rounded-lg shadow-soft border border-tikin-dark-200 p-6">
      <div className="flex items-center justify-between mb-1">
        <h3 className="text-base font-semibold text-tikin-dark-950">{title}</h3>
        {updatedAt && (
          <span className="text-xs text-tikin-dark-500">
            {formatDate(updatedAt)}
          </span>
        )}
      </div>
      <p className="text-tikin-dark-500 text-sm">{description}</p>
      <div className="mt-4 flex items-center gap-3">
        <div className="relative flex-1">
          <input
            type="number"
            step="0.01"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-full bg-white border border-tikin-dark-300 rounded px-3 py-2 text-tikin-dark-950 text-sm focus:outline-none focus:ring-2 focus:ring-tikin-red focus:border-tikin-red pr-8"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-tikin-dark-500 text-sm">%</span>
        </div>
        <button
          onClick={onSave}
          disabled={saving}
          className="px-4 py-2 bg-tikin-red text-white rounded-lg text-sm font-medium hover:bg-red-700 disabled:opacity-50 transition-colors whitespace-nowrap"
        >
          {saving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  )
}
