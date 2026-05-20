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

    // Convert File to Buffer to avoid Node.js stream errors with Supabase JS
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data, error: uploadError } = await supabase.storage
      .from('receipts')
      .upload(filePath, buffer, { 
        upsert: false,
        contentType: file.type 
      })

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
    const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
    return { success: false, error: msg }
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

    // BUG-10 FIX: Insert transaction directly via Admin client, bypassing 
    // any buggy or overloaded request_deposit RPCs that might incorrectly 
    // update the balance or throw ambiguity errors.
    const { data: txn, error: insertError } = await supabase
      .from('transactions')
      .insert({
        to_user_id: userId,
        from_user_id: null,
        amount: amount,
        type: 'deposit',
        status: 'pending',
        payment_method: method,
        receipt_url: receiptUrl,
        note: 'طلب إيداع — بانتظار التأكيد',
        metadata: {
          sender_name: senderName,
          sender_account: senderAccount,
        }
      })
      .select('id')
      .single()

    if (insertError || !txn) {
      console.error('[submitManualDepositAction] Insert error:', insertError)
      return { success: false, error: 'فشل إنشاء طلب الإيداع' }
    }
    
    const data = txn.id

    revalidatePath('/wallet')
    revalidatePath('/admin/payments')

    return {
      success: true,
      transactionId: data as string,
      message: 'تم إرسال طلب الإيداع بنجاح! سيتم تأكيده خلال 24 ساعة.',
    }

  } catch (err) {
    console.error('[submitManualDepositAction] Unexpected error:', err)
    const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
    return { success: false, error: msg }
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

    // Create pending transaction directly via Admin client, bypassing 
    // any buggy or overloaded request_deposit RPCs that might incorrectly 
    // update the balance or throw ambiguity errors.
    const { data: txn, error: insertError } = await supabase
      .from('transactions')
      .insert({
        to_user_id: userId,
        from_user_id: null,
        amount: amount,
        type: 'deposit',
        status: 'pending',
        payment_method: 'edahabia',
        receipt_url: null,
        note: 'طلب إيداع — بانتظار التأكيد',
        metadata: {}
      })
      .select('id')
      .single()

    if (insertError || !txn) {
      console.error('[initiateChargilyDepositAction] Insert error:', insertError)
      return { success: false, error: 'فشل إنشاء طلب الدفع' }
    }
    
    const txnId = txn.id

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
    const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
    return { success: false, error: msg }
  }
}
