/**
 * Types for Quotation persistence in Supabase
 */

export interface QuotationRecord {
  id: string
  created_at: string
  updated_at: string
  user_id: string

  // Company data
  company_name: string
  contact_name: string | null
  email: string | null
  phone: string | null
  nit: string | null
  arl_risk_level: string
  obligado_parafiscales: boolean

  // Configuration
  split_salary_pct: number
  split_bonus_pct: number
  bonus_types_selected: string[]
  data_input_method: string

  // Totals
  total_employees: number
  total_salary: number
  total_bonuses: number
  total_compensation: number

  // JSON columns
  financial_summary: Record<string, unknown> | null
  tikin_commission: Record<string, unknown> | null
  savings_estimate: Record<string, unknown> | null
  lotes_data: Record<string, unknown>[] | null

  // Status
  status: 'pending' | 'accepted' | 'rejected'
  notes: string | null
  pdf_filename: string | null
}

export type QuotationInsert = Omit<QuotationRecord, 'id' | 'created_at' | 'updated_at'>

/**
 * Fee configuration record from Supabase
 */
export interface FeeConfigRecord {
  id: string
  created_at: string
  updated_at: string
  updated_by: string | null
  fee_type: 'mera_liberalidad' | 'alimentacion' | 'dotacion' | 'viaticos' | 'iva'
  fixed_rate: number | null
  ranges: Array<{
    min: number
    max: number
    fee: number
    label: string
  }> | null
}
