'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

// ─────────────────────────────────────────────────────────────
// Helper — Admin Supabase client to bypass RLS
// ─────────────────────────────────────────────────────────────
function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

// ─────────────────────────────────────────────────────────────
// BUG-03 FIX: Helper — derive userId from the server-side
// session, NEVER trusting the userId passed from the client.
// ─────────────────────────────────────────────────────────────
async function getAuthenticatedUserId(): Promise<string | null> {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user || error) return null
  return user.id
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
// BUG-03 FIX: userId parameter removed — derived from server session.
// ─────────────────────────────────────────────────────────────
export async function uploadReceiptAction(formData: FormData): Promise<UploadReceiptResult> {
  try {
    // BUG-03 FIX: Get userId server-side; reject if not authenticated
    const userId = await getAuthenticatedUserId()
    if (!userId) return { success: false, error: 'يجب تسجيل الدخول أولاً' }

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
// BUG-03 FIX: userId parameter removed — derived from server session.
// BUG-10 FIX: sender_name + sender_account passed atomically via
//             p_metadata to request_deposit RPC (single INSERT).
//             Requires updated RPC — see supabase/fixes/security_fixes.sql
// ─────────────────────────────────────────────────────────────
export async function submitManualDepositAction(
  amount: number,
  method: string,
  receiptUrl: string,
  senderName: string,
  senderAccount: string
): Promise<DepositResult> {
  try {
    // BUG-03 FIX: Get userId server-side
    const userId = await getAuthenticatedUserId()
    if (!userId) return { success: false, error: 'يجب تسجيل الدخول أولاً' }

    const supabase = getAdminSupabase()

    // Rate Limiting: Check pending deposits
    const { count, error: countError } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('from_user_id', userId)
      .eq('type', 'deposit')
      .eq('status', 'pending')

    if (countError) {
      console.error('[submitManualDepositAction] Rate limit check error:', countError)
      return { success: false, error: 'حدث خطأ أثناء التحقق من الطلبات المعلقة.' }
    }

    if (count !== null && count >= 3) {
      return { success: false, error: 'لديك بالفعل 3 طلبات إيداع معلقة. يرجى الانتظار حتى يتم معالجتها.' }
    }

    // Server-side validation
    if (!amount || amount < 1000) {
      return { success: false, error: 'المبلغ الأدنى للإيداع هو 1,000 دج' }
    }
    if (!receiptUrl) {
      return { success: false, error: 'يجب رفع إيصال الدفع' }
    }
    if (!senderName || senderName.length < 3) {
      return { success: false, error: 'يجب إدخال الاسم الكامل للمرسل' }
    }
    if (!senderAccount || senderAccount.length < 5) {
      return { success: false, error: 'يجب إدخال رقم الحساب/CCP الخاص بالمرسل' }
    }

    // BUG-10 FIX: Pass metadata atomically inside the RPC call so sender info
    // is written in the same INSERT as the transaction — no second round-trip.
    const { data, error: rpcError } = await supabase.rpc('request_deposit', {
      p_user_id: userId,
      p_amount: amount,
      p_method: method,
      p_receipt_url: receiptUrl,
      p_metadata: {
        sender_name: senderName,
        sender_account: senderAccount,
      },
    })

    if (rpcError) {
      console.error('[submitManualDepositAction] RPC error:', rpcError)
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
// BUG-03 FIX: userId parameter removed — derived from server session.
// ─────────────────────────────────────────────────────────────
export async function initiateChargilyDepositAction(
  amount: number
): Promise<DepositResult & { checkoutUrl?: string }> {
  try {
    // BUG-03 FIX: Get userId server-side
    const userId = await getAuthenticatedUserId()
    if (!userId) return { success: false, error: 'يجب تسجيل الدخول أولاً' }

    const supabase = getAdminSupabase()

    // Rate Limiting: Check pending deposits
    const { count, error: countError } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('from_user_id', userId)
      .eq('type', 'deposit')
      .eq('status', 'pending')

    if (countError) {
      console.error('[initiateChargilyDepositAction] Rate limit check error:', countError)
      return { success: false, error: 'حدث خطأ أثناء التحقق من الطلبات المعلقة.' }
    }

    if (count !== null && count >= 3) {
      return { success: false, error: 'لديك بالفعل 3 طلبات إيداع معلقة. يرجى الانتظار حتى يتم معالجتها قبل تقديم طلب جديد.' }
    }

    if (!amount || amount < 1000) {
      return { success: false, error: 'المبلغ الأدنى للإيداع هو 1,000 دج' }
    }

    const chargilyApiKey = process.env.CHARGILY_SECRET_KEY
    if (!chargilyApiKey) {
      console.error('Chargily API Error: Missing CHARGILY_SECRET_KEY environment variable')
      return { success: false, error: 'بوابة الدفع غير متاحة حالياً' }
    }

    // Create pending transaction first
    const { data: txnId, error: rpcError } = await supabase.rpc('request_deposit', {
      p_user_id: userId,
      p_amount: amount,
      p_method: 'edahabia',
      p_receipt_url: null,
      p_metadata: null,
    })

    if (rpcError) {
      console.error('[initiateChargilyDepositAction] RPC error:', rpcError)
      return { success: false, error: rpcError.message || 'فشل إنشاء طلب الدفع' }
    }

    // Call Chargily API v2
    // NOTE: Change to https://pay.chargily.net/api/v2/checkouts before going live
    const chargilyRes = await fetch('https://pay.chargily.net/test/api/v2/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.CHARGILY_SECRET_KEY}`,
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
