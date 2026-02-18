import { createClient, isSupabaseConfigured } from './client'
import type { QuotationRecord, QuotationInsert } from '@/types/quotation'

const TABLE = 'quotations_bonos2'

export async function saveCotizacion(
  data: Omit<QuotationInsert, 'user_id'>
): Promise<{ success: boolean; data?: QuotationRecord; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase no configurado' }
    }

    const supabaseClient = createClient()
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser()

    if (userError || !user) {
      return { success: false, error: 'Usuario no autenticado. Inicia sesión para guardar.' }
    }

    const record: QuotationInsert = {
      ...data,
      user_id: user.id
    }

    const { data: inserted, error } = await supabaseClient
      .from(TABLE)
      .insert(record)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: inserted }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function getCotizaciones(
  limit = 50
): Promise<{ success: boolean; data?: QuotationRecord[]; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase no configurado' }
    }

    const supabaseClient = createClient()

    const { data, error } = await supabaseClient
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}

export async function updateCotizacionStatus(
  quotationId: string,
  status: 'pending' | 'accepted' | 'rejected'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase no configurado' }
    }

    const supabaseClient = createClient()

    const { error } = await supabaseClient
      .from(TABLE)
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', quotationId)

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
