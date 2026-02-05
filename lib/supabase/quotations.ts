import { supabase, isSupabaseConfigured } from './client'
import { QuotationInsert, QuotationRecord } from '@/types/quotation'

export async function saveQuotation(quotation: QuotationInsert): Promise<{ success: boolean; data?: QuotationRecord; error?: string }> {
  try {
    // Verificar si Supabase está configurado
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured, skipping database save')
      return { success: false, error: 'Supabase not configured' }
    }

    const { data, error } = await supabase
      .from('quotations')
      .insert(quotation)
      .select()
      .single()

    if (error) {
      console.error('Error saving quotation to Supabase:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Quotation saved to Supabase:', data.id)
    return { success: true, data }
  } catch (error) {
    console.error('Exception saving quotation:', error)
    return { success: false, error: String(error) }
  }
}

export async function getQuotations(limit = 50): Promise<{ success: boolean; data?: QuotationRecord[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('Error fetching quotations:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Exception fetching quotations:', error)
    return { success: false, error: String(error) }
  }
}

export async function getQuotationsByCompany(companyName: string): Promise<{ success: boolean; data?: QuotationRecord[]; error?: string }> {
  try {
    const { data, error } = await supabase
      .from('quotations')
      .select('*')
      .ilike('company_name', `%${companyName}%`)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching quotations by company:', error)
      return { success: false, error: error.message }
    }

    return { success: true, data: data || [] }
  } catch (error) {
    console.error('Exception fetching quotations by company:', error)
    return { success: false, error: String(error) }
  }
}

export async function updateQuotationStatus(
  quotationId: string,
  status: 'pending' | 'accepted' | 'rejected'
): Promise<{ success: boolean; error?: string }> {
  try {
    if (!isSupabaseConfigured()) {
      console.warn('⚠️ Supabase not configured')
      return { success: false, error: 'Supabase not configured' }
    }

    const { error } = await supabase
      .from('quotations')
      .update({ status })
      .eq('id', quotationId)

    if (error) {
      console.error('Error updating quotation status:', error)
      return { success: false, error: error.message }
    }

    console.log('✅ Quotation status updated:', quotationId, status)
    return { success: true }
  } catch (error) {
    console.error('Exception updating quotation status:', error)
    return { success: false, error: String(error) }
  }
}
