'use server'

import { createClient } from '@supabase/supabase-js'
import { revalidatePath } from 'next/cache'
// ─────────────────────────────────────────────────────────────
// Helper — Admin Supabase client to bypass RLS since we removed cookies auth
// ─────────────────────────────────────────────────────────────
function getAdminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export type DepositResult =
  | { success: true; transactionId: string; message: string }
  | { success: false; error: string }

export type UploadReceiptResult =
  | { success: true; url: string; path: string }
  | { success: false; error: string }

// ─────────────────────────────────────────────────────────────
// Action 1: Upload receipt file to Supabase Storage
// ─────────────────────────────────────────────────────────────
export async function uploadReceiptAction(userId: string, formData: FormData) {
  try {
    const supabase = getAdminSupabase()


    const file = formData.get('receipt') as File | null
    if (!file || file.size === 0) {
      return { success: false, error: 'لم يتم اختيار ملف' }
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'نوع الملف غير مسموح. يُقبل: JPG, PNG, PDF فقط' }
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      return { success: false, error: 'حجم الملف يتجاوز 5MB' }
    }

    const ext = file.name.split('.').pop()
    const filePath = `${userId}/${Date.now()}.${ext}`

    const { data, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, file, { upsert: false })

    if (uploadError) {
      console.error('[uploadReceiptAction] Storage error:', uploadError)
      return { success: false, error: 'فشل رفع الملف: ' + uploadError.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('receipts')
      .getPublicUrl(data.path)

    return { success: true, url: publicUrl, path: data.path }

  } catch (err) {
    console.error('[uploadReceiptAction] Unexpected error:', err)
    return { success: false, error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.' }
  }
}

// ─────────────────────────────────────────────────────────────
// Action 2: Submit deposit request (CCP / BaridiMob)
// ─────────────────────────────────────────────────────────────
export async function submitManualDepositAction(userId: string, amount: number, method: string, receiptUrl: string) {
  try {
    const supabase = getAdminSupabase()


    // Validate inputs
    if (!amount || amount < 1000) {
      return { success: false, error: 'المبلغ الأدنى للإيداع هو 1,000 دج' }
    }
    if (!receiptUrl) {
      return { success: false, error: 'يجب رفع إيصال الدفع' }
    }

    // Call secure RPC
    const { data, error: rpcError } = await supabase.rpc('request_deposit', {
      p_user_id: userId,
      p_amount: amount,
      p_method: method,
      p_receipt_url: receiptUrl,
    })

    if (rpcError) {
      console.error('[submitManualDepositAction] RPC error:', rpcError)
      // Return user-friendly Arabic error from PostgreSQL RAISE EXCEPTION
      return { success: false, error: rpcError.message || 'فشل إنشاء طلب الإيداع' }
    }

    revalidatePath('/wallet')
    revalidatePath('/admin/payments')

    return {
      success: true,
      transactionId: data as string,
      message: 'تم إرسال طلب الإيداع بنجاح! سيتم تأكيده خلال 24 ساعة.',
    }

  } catch (err) {
    console.error('[submitManualDepositAction] Unexpected error:', err)
    return { success: false, error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.' }
  }
}

// ─────────────────────────────────────────────────────────────
// Action 3: Initiate Chargily (Edahabia) checkout
// ─────────────────────────────────────────────────────────────
export async function initiateChargilyDepositAction(userId: string, amount: number) {
  try {
    const supabase = getAdminSupabase()


    if (!amount || amount < 1000) {
      return { success: false, error: 'المبلغ الأدنى للإيداع هو 1,000 دج' }
    }

    const chargilyApiKey = process.env.CHARGILY_SECRET_KEY
    if (!chargilyApiKey) {
      return { success: false, error: 'بوابة الدفع غير متاحة حالياً' }
    }

    // Create pending transaction first
    const { data: txnId, error: rpcError } = await supabase.rpc('request_deposit', {
      p_user_id: userId,
      p_amount: amount,
      p_method: 'edahabia',
      p_receipt_url: null,
    })

    if (rpcError) {
      console.error('[initiateChargilyDepositAction] RPC error:', rpcError)
      return { success: false, error: rpcError.message || 'فشل إنشاء طلب الدفع' }
    }

    // Call Chargily API v2
    const chargilyRes = await fetch('https://pay.chargily.net/api/v2/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${chargilyApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amount: amount,
        currency: 'dzd',
        success_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet?deposit=success`,
        failure_url: `${process.env.NEXT_PUBLIC_APP_URL}/wallet/deposit?error=payment_failed`,
        webhook_endpoint: `${process.env.NEXT_PUBLIC_APP_URL}/api/webhooks/chargily`,
        metadata: {
          user_id: userId,
          transaction_id: txnId,
        },
        description: `إيداع رصيد — خدمة.dz`,
        locale: 'ar',
        pass_fees_to_customer: true,
      }),
    })

    if (!chargilyRes.ok) {
      const errBody = await chargilyRes.text()
      console.error('[initiateChargilyDepositAction] Chargily error:', errBody)
      return { success: false, error: 'فشل الاتصال ببوابة الدفع. حاول مجدداً.' }
    }

    const checkout = await chargilyRes.json()

    return {
      success: true,
      transactionId: txnId as string,
      message: 'جارٍ التحويل لبوابة الدفع...',
      checkoutUrl: checkout.checkout_url,
    }

  } catch (err) {
    console.error('[initiateChargilyDepositAction] Unexpected error:', err)
    return { success: false, error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.' }
  }
}
