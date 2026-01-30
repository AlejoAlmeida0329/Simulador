export interface QuotationRecord {
  id?: string
  created_at?: string
  company_name: string
  contact_name: string
  email: string
  phone: string
  nit?: string
  employee_count: number
  total_payroll: number
  arl_risk_level: string

  // Datos del escenario Tikin
  salary_percentage: number
  bonus_percentage: number
  monthly_bonus_total: number

  // Ahorros
  monthly_savings: number
  annual_savings: number
  percentage_reduction: number

  // Comisión Tikin
  commission_level: number
  commission_percentage: number
  base_commission: number
  iva: number
  total_commission: number

  // Beneficio neto
  net_monthly_savings: number
  net_annual_savings: number

  // Metadata
  generated_by?: string
  pdf_filename?: string
}

export type QuotationInsert = Omit<QuotationRecord, 'id' | 'created_at'>
