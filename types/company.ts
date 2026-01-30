export interface CompanyData {
  companyName: string
  contactName: string
  email: string
  phone: string
  nit?: string
  employeeCount?: number
}

export interface TikinCommission {
  level: 1 | 2 | 3 | 4 | 5
  percentage: number
  monthlyBonusTotal: number
  baseCommission: number
  iva: number
  totalCost: number
}

export const COMMISSION_LEVELS = {
  1: { min: 0, max: 80_000_000, percentage: 0.04, label: 'Nivel 1' },
  2: { min: 80_000_000, max: 150_000_000, percentage: 0.035, label: 'Nivel 2' },
  3: { min: 150_000_000, max: 500_000_000, percentage: 0.025, label: 'Nivel 3' },
  4: { min: 500_000_000, max: 1_000_000_000, percentage: 0.018, label: 'Nivel 4' },
} as const

export const IVA_RATE = 0.19
