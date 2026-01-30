import { COMMISSION_LEVELS, IVA_RATE, TikinCommission } from '@/types/company'

export function calculateTikinCommission(monthlyBonusTotal: number): TikinCommission {
  // Determinar el nivel según el total de bonos
  // Nota: Nivel 5 (1.25%) existe pero solo para clientes con +1 año en Tikin
  // Para cotizaciones nuevas, el máximo es Nivel 4
  let level: 1 | 2 | 3 | 4 | 5 = 1
  let percentage = 0.04

  if (monthlyBonusTotal >= COMMISSION_LEVELS[4].min) {
    // Para cotizaciones nuevas, aplica Nivel 4 (1.8%) incluso si superan $1000M
    level = 4
    percentage = COMMISSION_LEVELS[4].percentage
  } else if (monthlyBonusTotal >= COMMISSION_LEVELS[3].min && monthlyBonusTotal < COMMISSION_LEVELS[3].max) {
    level = 3
    percentage = COMMISSION_LEVELS[3].percentage
  } else if (monthlyBonusTotal >= COMMISSION_LEVELS[2].min && monthlyBonusTotal < COMMISSION_LEVELS[2].max) {
    level = 2
    percentage = COMMISSION_LEVELS[2].percentage
  } else {
    level = 1
    percentage = COMMISSION_LEVELS[1].percentage
  }

  // Calcular comisión base
  const baseCommission = monthlyBonusTotal * percentage

  // Calcular IVA
  const iva = baseCommission * IVA_RATE

  // Costo total
  const totalCost = baseCommission + iva

  return {
    level,
    percentage,
    monthlyBonusTotal,
    baseCommission,
    iva,
    totalCost,
  }
}
