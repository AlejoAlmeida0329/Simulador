import { createClient, isSupabaseConfigured } from './client'
import type { FeeConfigRecord } from '@/types/quotation'

const TABLE = 'fee_config'

export async function getFeeConfig(): Promise<{
  success: boolean
  data?: FeeConfigRecord[]
  error?: string
}> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase no configurado' }
    }

    const supabaseClient = createClient()

    const { data, error } = await supabaseClient
      .from(TABLE)
      .select('*')

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function updateFeeConfig(
  feeType: string,
  updates: { fixed_rate?: number | null; ranges?: Array<{ min: number; max: number; fee: number; label: string }> | null }
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase no configurado' }
    }

    const supabaseClient = createClient()
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'No autenticado' }
    }

    const { error } = await supabaseClient
      .from(TABLE)
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
        updated_by: user.id
      })
      .eq('fee_type', feeType)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
