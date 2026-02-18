/**
 * Fee provider: reads fees from Supabase with fallback to hardcoded constants.
 * Includes 5-minute in-memory cache.
 */

import { getFeeConfig } from '@/lib/supabase/fee-config'
import {
  FEE_MERA_LIBERALIDAD_RANGES,
  FEE_ALIMENTACION,
  FEE_DOTACION,
  FEE_VIATICOS,
  IVA_RATE
} from './constants'
import type { FeeRange } from './constants'

export interface ActiveFees {
  meraLiberalidadRanges: FeeRange[]
  alimentacion: number
  dotacion: number
  viaticos: number
  iva: number
}

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

let cachedFees: ActiveFees | null = null
let cacheTimestamp = 0

function getDefaultFees(): ActiveFees {
  return {
    meraLiberalidadRanges: FEE_MERA_LIBERALIDAD_RANGES,
    alimentacion: FEE_ALIMENTACION,
    dotacion: FEE_DOTACION,
    viaticos: FEE_VIATICOS,
    iva: IVA_RATE
  }
}

export async function getActiveFees(): Promise<ActiveFees> {
  const now = Date.now()

  // Return cached if still valid
  if (cachedFees && (now - cacheTimestamp) < CACHE_TTL_MS) {
    return cachedFees
  }

  try {
    const result = await getFeeConfig()

    if (!result.success || !result.data || result.data.length === 0) {
      cachedFees = getDefaultFees()
      cacheTimestamp = now
      return cachedFees
    }

    const fees = getDefaultFees()

    for (const record of result.data) {
      switch (record.fee_type) {
        case 'mera_liberalidad':
          if (record.ranges && record.ranges.length > 0) {
            fees.meraLiberalidadRanges = record.ranges.map(r => ({
              min: r.min,
              max: r.max >= 999999999999 ? Infinity : r.max,
              fee: r.fee,
              label: r.label
            }))
          }
          break
        case 'alimentacion':
          if (record.fixed_rate !== null) fees.alimentacion = record.fixed_rate
          break
        case 'dotacion':
          if (record.fixed_rate !== null) fees.dotacion = record.fixed_rate
          break
        case 'viaticos':
          if (record.fixed_rate !== null) fees.viaticos = record.fixed_rate
          break
        case 'iva':
          if (record.fixed_rate !== null) fees.iva = record.fixed_rate
          break
      }
    }

    cachedFees = fees
    cacheTimestamp = now
    return fees
  } catch {
    // Fallback to hardcoded constants on any error
    cachedFees = getDefaultFees()
    cacheTimestamp = now
    return cachedFees
  }
}

/**
 * Invalidate cache (call after admin updates fees)
 */
export function invalidateFeesCache(): void {
  cachedFees = null
  cacheTimestamp = 0
}
