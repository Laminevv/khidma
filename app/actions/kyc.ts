'use server'

import { createClient as createAdminClient } from '@supabase/supabase-js'
import { createClient as createServerClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { sendEmail, getUserEmail, generateEmailHtml } from '@/lib/email'

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
function getAdminSupabase() {
  return createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

async function getAuthenticatedUser(): Promise<{ id: string } | null> {
  const supabase = await createServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (!user || error) return null
  return { id: user.id }
}

async function requireAdmin(): Promise<
  | { user: { id: string }; error: null }
  | { user: null; error: string }
> {
  const supabase = await createServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (!user || authError) return { user: null, error: 'Unauthorized' }

  const adminClient = getAdminSupabase()
  const { data: profile, error: profileError } = await adminClient
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (profileError || !profile?.is_admin) {
    return { user: null, error: 'Forbidden' }
  }
  return { user, error: null }
}

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export type KycSubmitResult =
  | { success: true; submissionId: string; message: string }
  | { success: false; error: string }

export type KycUploadResult =
  | { success: true; path: string }
  | { success: false; error: string }

export type KycStatusResult = {
  kycStatus: 'none' | 'pending' | 'approved' | 'rejected'
  submission: {
    id: string
    status: string
    id_type: string
    rejection_reason: string | null
    submitted_at: string
    reviewed_at: string | null
  } | null
}

export type KycAdminSubmission = {
  id: string
  user_id: string
  status: string
  id_type: string
  id_front_url: string
  id_back_url: string | null
  selfie_url: string | null
  rejection_reason: string | null
  submitted_at: string
  reviewed_at: string | null
  profiles: {
    username: string
    full_name: string | null
    avatar_url: string | null
  }
}

// ─────────────────────────────────────────────────────────────
// SHA-256 hashing utility for national ID numbers
// Uses Node.js built-in crypto (server-side only)
// ─────────────────────────────────────────────────────────────
async function hashIdNumber(raw: string): Promise<string> {
  const { createHash } = await import('crypto')
  return createHash('sha256').update(raw.trim()).digest('hex')
}

// ═════════════════════════════════════════════════════════════
// USER-FACING ACTIONS
// ═════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// Action 1: Upload a KYC document to the PRIVATE bucket
// Files go to: kyc-documents/{userId}/{type}.{ext}
// The file path is deterministic (overwrites on re-submission).
// ─────────────────────────────────────────────────────────────
export async function uploadKycDocumentAction(
  formData: FormData,
  documentType: 'front' | 'back' | 'selfie'
): Promise<KycUploadResult> {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return { success: false, error: 'يجب تسجيل الدخول أولاً' }

    const supabase = getAdminSupabase()

    const file = formData.get('document') as File | null
    if (!file || file.size === 0) {
      return { success: false, error: 'لم يتم اختيار ملف' }
    }

    // Validate MIME type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: 'نوع الملف غير مسموح. يُقبل: JPG, PNG, WebP, PDF' }
    }

    // Validate size (10MB max — KYC documents can be higher quality)
    if (file.size > 10 * 1024 * 1024) {
      return { success: false, error: 'حجم الملف يتجاوز 10MB' }
    }

    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
    // Deterministic path: always overwrite on re-submission
    const filePath = `${user.id}/${documentType}.${ext}`

    // Convert File to Buffer to avoid Node.js stream errors with Supabase JS
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    const { data, error: uploadError } = await supabase.storage
      .from('kyc-documents')
      .upload(filePath, buffer, {
        upsert: true,
        contentType: file.type,
      })

    if (uploadError) {
      console.error('[uploadKycDocumentAction] Storage error:', uploadError)
      return { success: false, error: 'فشل رفع الملف: ' + uploadError.message }
    }

    // Return the storage path (NOT a public URL — this is a private bucket)
    return { success: true, path: data.path }

  } catch (err) {
    console.error('[uploadKycDocumentAction] Unexpected error:', err)
    const msg = err instanceof Error ? err.message : 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.'
    return { success: false, error: msg }
  }
}

// ─────────────────────────────────────────────────────────────
// Action 2: Submit KYC application
// Calls the submit_kyc RPC which atomically:
//   - Blocks if already pending/approved
//   - Detects duplicate national IDs (via SHA-256 hash)
//   - Inserts submission + updates profile.kyc_status
// ─────────────────────────────────────────────────────────────
export async function submitKycAction(
  idType: 'national_id' | 'passport' | 'driving_license',
  idNumber: string,
  idFrontPath: string,
  idBackPath?: string,
  selfiePath?: string
): Promise<KycSubmitResult> {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return { success: false, error: 'يجب تسجيل الدخول أولاً' }

    const supabase = getAdminSupabase()

    // ── Server-side validation ──
    if (!idType || !['national_id', 'passport', 'driving_license'].includes(idType)) {
      return { success: false, error: 'نوع الوثيقة غير صالح' }
    }

    if (!idNumber || idNumber.trim().length < 5) {
      return { success: false, error: 'رقم الوثيقة غير صالح (5 أحرف على الأقل)' }
    }

    if (!idFrontPath) {
      return { success: false, error: 'يجب رفع صورة الوجه الأمامي للوثيقة' }
    }

    // ── Hash the ID number (never store raw) ──
    const idNumberHash = await hashIdNumber(idNumber)

    // ── Call the atomic submit_kyc RPC ──
    const { data: submissionId, error: rpcError } = await supabase.rpc('submit_kyc', {
      p_user_id: user.id,
      p_id_type: idType,
      p_id_number_hash: idNumberHash,
      p_id_front_url: idFrontPath,
      p_id_back_url: idBackPath || null,
      p_selfie_url: selfiePath || null,
    })

    if (rpcError) {
      console.error('[submitKycAction] RPC error:', rpcError)

      // Map known DB exceptions to user-friendly Arabic messages
      if (rpcError.message.includes('ALREADY_PENDING')) {
        return { success: false, error: 'لديك طلب تحقق قيد المراجعة بالفعل. يرجى الانتظار.' }
      }
      if (rpcError.message.includes('ALREADY_APPROVED')) {
        return { success: false, error: 'تم التحقق من هويتك مسبقاً.' }
      }
      if (rpcError.message.includes('DUPLICATE_ID')) {
        return { success: false, error: 'رقم الوثيقة مسجل بالفعل في حساب آخر.' }
      }

      return { success: false, error: 'فشل إرسال طلب التحقق. يرجى المحاولة مرة أخرى.' }
    }

    // ── Send notification to admins ──
    // Fetch all admin users and notify them
    const { data: admins } = await supabase
      .from('profiles')
      .select('id')
      .eq('is_admin', true)

    if (admins && admins.length > 0) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('username, full_name')
        .eq('id', user.id)
        .single()

      const displayName = profile?.full_name || profile?.username || 'مستخدم'

      for (const admin of admins) {
        await supabase.rpc('create_notification', {
          p_user_id: admin.id,
          p_type: 'kyc_submitted',
          p_title: 'طلب تحقق هوية جديد 🆔',
          p_body: `${displayName} قدّم طلب تحقق من الهوية — يرجى المراجعة.`,
          p_link: '/admin/kyc',
        })
      }
    }

    revalidatePath('/kyc')
    revalidatePath('/kyc/status')
    revalidatePath('/admin/kyc')

    return {
      success: true,
      submissionId: submissionId as string,
      message: 'تم إرسال طلب التحقق بنجاح! سيتم مراجعته خلال 48 ساعة.',
    }

  } catch (err) {
    console.error('[submitKycAction] Unexpected error:', err)
    return { success: false, error: 'حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.' }
  }
}

// ─────────────────────────────────────────────────────────────
// Action 3: Get current user's KYC status + latest submission
// ─────────────────────────────────────────────────────────────
export async function getKycStatusAction(): Promise<KycStatusResult | { error: string }> {
  try {
    const user = await getAuthenticatedUser()
    if (!user) return { error: 'يجب تسجيل الدخول أولاً' }

    const supabase = getAdminSupabase()

    // Get profile KYC status
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('kyc_status')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      return { error: 'تعذر تحميل بيانات الملف الشخصي' }
    }

    // Get the latest KYC submission (if any)
    const { data: submission } = await supabase
      .from('kyc_submissions')
      .select('id, status, id_type, rejection_reason, submitted_at, reviewed_at')
      .eq('user_id', user.id)
      .order('submitted_at', { ascending: false })
      .limit(1)
      .single()

    return {
      kycStatus: profile.kyc_status as KycStatusResult['kycStatus'],
      submission: submission || null,
    }

  } catch (err) {
    console.error('[getKycStatusAction] Unexpected error:', err)
    return { error: 'حدث خطأ غير متوقع.' }
  }
}


// ═════════════════════════════════════════════════════════════
// ADMIN-ONLY ACTIONS
// ═════════════════════════════════════════════════════════════

// ─────────────────────────────────────────────────────────────
// Action 4: Fetch pending KYC submissions (admin queue)
// Uses service-role to bypass RLS and join with profiles.
// ─────────────────────────────────────────────────────────────
export async function getKycSubmissionsAction(
  statusFilter: 'pending' | 'approved' | 'rejected' | 'all' = 'pending'
) {
  try {
    const { user, error: authError } = await requireAdmin()
    if (!user) return { submissions: [], error: authError }

    const supabase = getAdminSupabase()

    let query = supabase
      .from('kyc_submissions')
      .select(`
        id, user_id, status, id_type,
        id_front_url, id_back_url, selfie_url,
        rejection_reason, submitted_at, reviewed_at,
        profiles!kyc_submissions_user_id_fkey (
          username, full_name, avatar_url
        )
      `)
      .order('submitted_at', { ascending: false })

    if (statusFilter !== 'all') {
      query = query.eq('status', statusFilter)
    }

    const { data, error } = await query

    if (error) {
      console.error('[getKycSubmissionsAction] Query error:', error)
      return { submissions: [], error: 'فشل تحميل الطلبات' }
    }

    return { submissions: data || [], error: null }

  } catch (err) {
    console.error('[getKycSubmissionsAction] Unexpected error:', err)
    return { submissions: [], error: 'حدث خطأ غير متوقع.' }
  }
}

// ─────────────────────────────────────────────────────────────
// Action 5: Generate a short-lived signed URL for a KYC doc
// The kyc-documents bucket is PRIVATE — admin needs a signed
// URL to view each document. Expires in 60 seconds.
// ─────────────────────────────────────────────────────────────
export async function getKycDocumentUrlAction(
  storagePath: string
): Promise<{ url: string } | { error: string }> {
  try {
    const { user, error: authError } = await requireAdmin()
    if (!user) return { error: authError || 'Unauthorized' }

    if (!storagePath || storagePath.length < 5) {
      return { error: 'مسار الملف غير صالح' }
    }

    const supabase = getAdminSupabase()
    const { data, error } = await supabase.storage
      .from('kyc-documents')
      .createSignedUrl(storagePath, 60) // 60 seconds expiry

    if (error || !data?.signedUrl) {
      console.error('[getKycDocumentUrlAction] Signed URL error:', error)
      return { error: 'فشل توليد رابط الوثيقة' }
    }

    return { url: data.signedUrl }

  } catch (err) {
    console.error('[getKycDocumentUrlAction] Unexpected error:', err)
    return { error: 'حدث خطأ غير متوقع.' }
  }
}

// ─────────────────────────────────────────────────────────────
// Action 6: Approve a KYC submission
// Calls the approve_kyc SECURITY DEFINER RPC, then notifies
// the user about their verified status.
// ─────────────────────────────────────────────────────────────
export async function approveKycAction(
  submissionId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, error: authError } = await requireAdmin()
    if (!user) return { success: false, error: authError || 'Unauthorized' }

    const supabase = getAdminSupabase()

    const { error: rpcError } = await supabase.rpc('approve_kyc', {
      p_submission_id: submissionId,
      p_admin_id: user.id,
    })

    if (rpcError) {
      console.error('[approveKycAction] RPC error:', rpcError)
      if (rpcError.message.includes('SUBMISSION_NOT_FOUND_OR_NOT_PENDING')) {
        return { success: false, error: 'الطلب غير موجود أو تمت معالجته مسبقاً.' }
      }
      return { success: false, error: 'فشل قبول الطلب. حاول مجدداً.' }
    }

    // Fetch the user_id to send a notification
    const { data: submission } = await supabase
      .from('kyc_submissions')
      .select('user_id')
      .eq('id', submissionId)
      .single()

    if (submission?.user_id) {
      await supabase.rpc('create_notification', {
        p_user_id: submission.user_id,
        p_type: 'kyc_approved',
        p_title: 'تم التحقق من هويتك بنجاح! ✅',
        p_body: 'أصبح حسابك موثقاً رسمياً. يمكنك الآن الاستفادة من جميع الميزات.',
        p_link: '/kyc/status',
      })

      // Send transactional email notification
      try {
        const userEmail = await getUserEmail(submission.user_id)
        if (userEmail) {
          await sendEmail({
            to: userEmail,
            subject: '✅ تم توثيق حسابك بنجاح - خدمة.dz',
            text: 'نهانينا! تم التحقق من هويتك وتوثيق حسابك رسمياً على منصة خدمة.dz.',
            html: generateEmailHtml({
              title: '🎉 حسابك موثق ومؤكد الآن!',
              bodyText: 'نهانينا! تم مراجعة وثائق الهوية الخاصة بك من قبل الإدارة والموافقة عليها. أصبح حسابك الآن موثقاً رسمياً بشارة التحقق، مما يزيد من موثوقيتك أمام العملاء ويمكّنك من استخدام كامل ميزات المنصة.',
              buttonLabel: 'الانتقال إلى الملف الشخصي',
              buttonUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://khidma-five.vercel.app'}/profile`,
              cardItems: [
                { label: 'حالة الحساب', value: 'موثق ومعتمد ✅' },
                { label: 'تاريخ التوثيق', value: new Date().toLocaleDateString('ar-DZ') }
              ]
            })
          })
        }
      } catch (emailErr) {
        console.error('Non-blocking KYC approval email failed:', emailErr)
      }
    }

    revalidatePath('/admin/kyc')
    revalidatePath('/kyc/status')
    return { success: true }

  } catch (err) {
    console.error('[approveKycAction] Unexpected error:', err)
    return { success: false, error: 'حدث خطأ غير متوقع.' }
  }
}

// ─────────────────────────────────────────────────────────────
// Action 7: Reject a KYC submission
// Records the rejection reason and notifies the user with
// specific feedback so they know what to fix on resubmission.
// ─────────────────────────────────────────────────────────────
export async function rejectKycAction(
  submissionId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { user, error: authError } = await requireAdmin()
    if (!user) return { success: false, error: authError || 'Unauthorized' }

    if (!reason || reason.trim().length < 5) {
      return { success: false, error: 'يجب كتابة سبب الرفض (5 أحرف على الأقل)' }
    }

    const supabase = getAdminSupabase()

    const { error: rpcError } = await supabase.rpc('reject_kyc', {
      p_submission_id: submissionId,
      p_admin_id: user.id,
      p_reason: reason.trim(),
    })

    if (rpcError) {
      console.error('[rejectKycAction] RPC error:', rpcError)
      if (rpcError.message.includes('SUBMISSION_NOT_FOUND_OR_NOT_PENDING')) {
        return { success: false, error: 'الطلب غير موجود أو تمت معالجته مسبقاً.' }
      }
      return { success: false, error: 'فشل رفض الطلب. حاول مجدداً.' }
    }

    // Notify the user about the rejection with the reason
    const { data: submission } = await supabase
      .from('kyc_submissions')
      .select('user_id')
      .eq('id', submissionId)
      .single()

    if (submission?.user_id) {
      await supabase.rpc('create_notification', {
        p_user_id: submission.user_id,
        p_type: 'kyc_rejected',
        p_title: 'تم رفض طلب التحقق من الهوية ❌',
        p_body: `السبب: ${reason.trim()} — يمكنك إعادة التقديم بعد تصحيح المشكلة.`,
        p_link: '/kyc/status',
      })

      // Send transactional email notification
      try {
        const userEmail = await getUserEmail(submission.user_id)
        if (userEmail) {
          await sendEmail({
            to: userEmail,
            subject: '❌ تحديث بخصوص طلب توثيق حسابك - خدمة.dz',
            text: `تم رفض طلب التحقق من الهوية الخاص بك. السبب: ${reason.trim()}`,
            html: generateEmailHtml({
              title: '⚠️ لم يتم قبول طلب التحقق من الهوية',
              bodyText: 'نعلمك بأنه قد تم مراجعة وثائق الهوية المقدمة من طرفك، وللأسف لم نتمكن من قبول الطلب للأسباب الموضحة أدناه. يرجى تصحيح المشكلة وإعادة تقديم الطلب مجدداً.',
              buttonLabel: 'إعادة تقديم طلب التحقق',
              buttonUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://khidma-five.vercel.app'}/kyc`,
              cardItems: [
                { label: 'سبب الرفض', value: reason.trim() },
                { label: 'الإجراء المطلوب', value: 'يرجى مراجعة جودة الصور أو البيانات المقدمة والمحاولة مرة أخرى.' }
              ]
            })
          })
        }
      } catch (emailErr) {
        console.error('Non-blocking KYC rejection email failed:', emailErr)
      }
    }

    revalidatePath('/admin/kyc')
    revalidatePath('/kyc/status')
    return { success: true }

  } catch (err) {
    console.error('[rejectKycAction] Unexpected error:', err)
    return { success: false, error: 'حدث خطأ غير متوقع.' }
  }
}
