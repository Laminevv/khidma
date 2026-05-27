'use client'

import { useState, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import {
  uploadKycDocumentAction,
  submitKycAction,
  getKycStatusAction,
} from '@/app/actions/kyc'
import { compressImage } from '@/lib/compress-image'
import {
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  Lock,
  Trash2,
  Camera,
  Clock,
  ArrowLeft,
  Briefcase
} from 'lucide-react'

type IdType = 'national_id' | 'passport' | 'driving_license'

const ID_TYPES: { id: IdType; label: string; icon: string; desc: string }[] = [
  {
    id: 'national_id',
    label: 'بطاقة التعريف الوطنية',
    icon: '🪪',
    desc: 'البطاقة البيومترية الجزائرية الجديدة',
  },
  {
    id: 'passport',
    label: 'جواز السفر',
    icon: '📕',
    desc: 'جواز السفر الجزائري البيومتري',
  },
  {
    id: 'driving_license',
    label: 'رخصة السياقة',
    icon: '🚗',
    desc: 'رخصة السياقة البيومترية الجزائرية',
  },
]

interface UploadSlot {
  file: File | null
  path: string | null
  uploading: boolean
  compressing: boolean
  error: string | null
}

export default function KycSubmissionPage() {
  const router = useRouter()

  // State
  const [loading, setLoading] = useState(true)
  const [currentKycStatus, setCurrentKycStatus] = useState<string | null>(null)
  const [rejectionReason, setRejectionReason] = useState<string | null>(null)
  const [submittedAt, setSubmittedAt] = useState<string | null>(null)
  
  const [idType, setIdType] = useState<IdType>('national_id')
  const [idNumber, setIdNumber] = useState('')
  const [front, setFront] = useState<UploadSlot>({ file: null, path: null, uploading: false, compressing: false, error: null })
  const [back, setBack] = useState<UploadSlot>({ file: null, path: null, uploading: false, compressing: false, error: null })
  const [selfie, setSelfie] = useState<UploadSlot>({ file: null, path: null, uploading: false, compressing: false, error: null })

  const frontRef = useRef<HTMLInputElement>(null)
  const backRef = useRef<HTMLInputElement>(null)
  const selfieRef = useRef<HTMLInputElement>(null)

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const result = await getKycStatusAction()
      
      if ('error' in result) {
        setLoading(false)
        return
      }

      setTimeout(() => {
        setCurrentKycStatus(result.kycStatus)
        if (result.submission) {
          setRejectionReason(result.submission.rejection_reason)
          setSubmittedAt(result.submission.submitted_at)
          setIdType((result.submission.id_type as IdType) || 'national_id')
        }
      }, 0)
      
      setLoading(false)
    }
    init()
  }, [router])

  // Secure server-side private file uploader
  const handleFileUpload = async (
    file: File,
    documentType: 'front' | 'back' | 'selfie',
    setter: React.Dispatch<React.SetStateAction<UploadSlot>>
  ) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif', 'application/pdf']
    const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0] || ''
    const isHeic = ['.heic', '.heif'].includes(ext) || ['image/heic', 'image/heif'].includes(file.type.toLowerCase())
    
    if (!allowedTypes.includes(file.type) && !isHeic) {
      setter(prev => ({ ...prev, error: 'نوع الملف غير مدعوم (JPG, PNG, WebP, HEIC, PDF فقط)' }))
      return
    }
    if (file.size > 25 * 1024 * 1024) {
      setter(prev => ({ ...prev, error: 'حجم الملف كبير جداً (الأقصى 25MB)' }))
      return
    }

    let fileToUpload = file
    const isImage = file.type.startsWith('image/') || isHeic
    if (isImage && (file.size > 3.5 * 1024 * 1024 || isHeic)) {
      setter({ file, path: null, uploading: false, compressing: true, error: null })
      try {
        fileToUpload = await compressImage(file, {
          maxWidth: 1920,
          maxHeight: 1920,
          quality: 0.82,
          maxSizeBytes: 3.5 * 1024 * 1024,
        })
      } catch (err: unknown) {
        const message = err instanceof Error
          ? err.message
          : 'حدث خطأ أثناء معالجة الصورة واختزال حجمها.'
        setter({ file: null, path: null, uploading: false, compressing: false, error: message })
        return
      }
    }

    setter({ file: fileToUpload, path: null, uploading: true, compressing: false, error: null })

    try {
      const fd = new FormData()
      fd.append('document', fileToUpload)
      const result = await uploadKycDocumentAction(fd, documentType)

      if (result.success) {
        setter({ file: fileToUpload, path: result.path, uploading: false, compressing: false, error: null })
      } else {
        setter({ file: null, path: null, uploading: false, compressing: false, error: result.error })
      }
    } catch {
      setter({
        file: null, path: null, uploading: false, compressing: false,
        error: 'فشل الرفع — تحقق من اتصال شبكة الإنترنت وأعد المحاولة.'
      })
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!idNumber || idNumber.trim().length < 5) {
      setError('رقم الوثيقة غير مكتمل أو غير صحيح')
      return
    }

    if (!front.path) {
      setError('يرجى رفع الجهة الأمامية للوثيقة الرسمية')
      return
    }

    if (idType !== 'passport' && !back.path) {
      setError('يرجى رفع الجهة الخلفية للوثيقة الرسمية')
      return
    }

    setSubmitting(true)

    try {
      const result = await submitKycAction(
        idType,
        idNumber.trim(),
        front.path,
        back.path || undefined,
        selfie.path || undefined
      )

      if (result.success) {
        setSuccess(result.message || 'تم إرسال مستندات التحقق بنجاح!')
        setTimeout(() => {
          router.push('/kyc/status')
        }, 3000)
      } else {
        setError(result.error)
      }
    } catch {
      setError('حدث خطأ فني غير متوقع أثناء إرسال طلبك.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-accent animate-spin" />
          <span className="text-sm font-semibold text-slate-500 font-sans">جاري تحميل حالة التحقق...</span>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // STATE: Approved / Verified
  // ─────────────────────────────────────────────────────────────
  if (currentKycStatus === 'approved') {
    return (
      <div className="min-h-screen pb-12 flex flex-col" dir="rtl" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
        <nav className="topnav sticky top-0 z-50 shadow-xs">
          <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 hover:no-underline" style={{ textDecoration: 'none' }}>
              <ArrowLeft size={16} />
              <span>العودة للوحة التحكم</span>
            </Link>
            <span className="text-lg font-bold text-slate-950">خدمة<span className="text-accent">.dz</span></span>
          </div>
        </nav>

        <div className="max-w-2xl w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-sm text-center relative overflow-hidden">
            {/* Glowing background shapes */}
            <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
              <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-500 rounded-full blur-3xl"></div>
            </div>

            <div className="w-20 h-20 bg-emerald-50 border-2 border-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm relative">
              <ShieldCheck className="w-10 h-10 text-emerald-500" />
              <span className="absolute -bottom-1 -left-1 bg-white rounded-full p-0.5 border border-slate-100 shadow-2xs">
                <CheckCircle2 size={18} className="text-emerald-500" />
              </span>
            </div>

            <h2 className="text-2xl font-extrabold text-slate-950 font-sans tracking-tight mb-3">حسابك موثق بالكامل!</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed mb-8">
              تهانينا! لقد تم التحقق من هويتك بنجاح بواسطة فريق المنصة. حسابك الآن يحمل شارة التوثيق البرونزية ويتمتع بكافة الميزات الاحترافية.
            </p>

            {/* Premium Benefits Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8 text-right">
              <div className="bg-emerald-50/55 border border-emerald-100/60 p-4 rounded-2xl">
                <div className="text-lg mb-2">💸</div>
                <h4 className="text-xs font-bold text-emerald-950 mb-1">سحب غير محدود</h4>
                <p className="text-[10px] text-emerald-700/80 leading-relaxed">تجاوز قيود سحب المبالغ التي تفوق 50,000 دج في المعاملة.</p>
              </div>
              <div className="bg-teal-50/55 border border-teal-100/60 p-4 rounded-2xl">
                <div className="text-lg mb-2">🛡️</div>
                <h4 className="text-xs font-bold text-teal-950 mb-1">شارة التوثيق ✓</h4>
                <p className="text-[10px] text-teal-700/80 leading-relaxed">شارة زرقاء تظهر بجانب اسمك في العروض لتزيد ثقة العملاء بك.</p>
              </div>
              <div className="bg-indigo-50/55 border border-indigo-100/60 p-4 rounded-2xl">
                <div className="text-lg mb-2">⭐</div>
                <h4 className="text-xs font-bold text-indigo-950 mb-1">أولوية الظهور</h4>
                <p className="text-[10px] text-indigo-700/80 leading-relaxed">يتم منح ملفك الشخصي الأفضلية في الظهور بمحركات البحث.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/dashboard" className="btn btn-accent px-6 py-3 text-sm font-bold shadow-md shadow-accent/15 hover:no-underline flex items-center justify-center gap-1.5" style={{ textDecoration: 'none' }}>
                <span>لوحة التحكم</span>
              </Link>
              <Link href="/settings" className="btn btn-outline px-6 py-3 text-sm font-semibold hover:no-underline flex items-center justify-center gap-1.5" style={{ textDecoration: 'none' }}>
                <span>إعدادات الحساب</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // STATE: Pending Review
  // ─────────────────────────────────────────────────────────────
  if (currentKycStatus === 'pending') {
    return (
      <div className="min-h-screen pb-12 flex flex-col" dir="rtl" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
        <nav className="topnav sticky top-0 z-50 shadow-xs">
          <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
            <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 hover:no-underline" style={{ textDecoration: 'none' }}>
              <ArrowLeft size={16} />
              <span>العودة للوحة التحكم</span>
            </Link>
            <span className="text-lg font-bold text-slate-950">خدمة<span className="text-accent">.dz</span></span>
          </div>
        </nav>

        <div className="max-w-2xl w-full mx-auto px-6 py-12 flex-1 flex flex-col justify-center">
          <div className="bg-white border border-slate-200/80 rounded-3xl p-8 sm:p-10 shadow-sm text-center relative overflow-hidden">
            
            <div className="w-16 h-16 bg-amber-50 border border-amber-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-2xs">
              <Clock className="w-8 h-8 text-amber-600 animate-pulse" />
            </div>

            <h2 className="text-2xl font-extrabold text-slate-950 font-sans tracking-tight mb-2">طلبك قيد المراجعة والتدقيق</h2>
            <p className="text-slate-500 text-sm max-w-md mx-auto leading-relaxed mb-8">
              يقوم فريق التحقق لدينا حالياً بمراجعة وتدقيق المستندات الوطنية التي قمت برفعها. يستغرق هذا الإجراء عادةً أقل من 24 ساعة عمل.
            </p>

            {/* Timeline Progress */}
            <div className="max-w-md mx-auto bg-slate-50 border border-slate-100 p-6 rounded-2xl text-right space-y-5 mb-8">
              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-accent text-white flex items-center justify-center text-xs font-bold">✓</div>
                  <div className="w-0.5 h-10 bg-accent"></div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">تم إرسال البيانات والمستندات بنجاح</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">
                    {submittedAt ? `بتاريخ: ${new Date(submittedAt).toLocaleDateString('ar-DZ')}` : 'جاري التحقق من المرفقات'}
                  </p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center text-xs font-bold animate-pulse">⏳</div>
                  <div className="w-0.5 h-10 bg-slate-200"></div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-amber-700">التدقيق ومطابقة البيانات الجارية</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">يقوم المسؤول بمطابقة رقم الهوية والاسم واللقب وصحة الإرفاق.</p>
                </div>
              </div>

              <div className="flex gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-6 h-6 rounded-full bg-slate-200 text-slate-400 flex items-center justify-center text-xs font-bold">3</div>
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-400">تفعيل الشارة ورفع القيود</h4>
                  <p className="text-[10px] text-slate-400 mt-0.5">بعد التأكيد مباشرة، سيتم إرسال إشعار تفعيل الحساب.</p>
                </div>
              </div>
            </div>

            <div className="flex justify-center">
              <Link href="/dashboard" className="btn btn-accent px-8 py-3 text-sm font-bold shadow-md shadow-accent/10 hover:no-underline" style={{ textDecoration: 'none' }}>
                لوحة التحكم الرئيسية
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────
  // STATE: Not Submitted / Rejected (Form View)
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen pb-16" dir="rtl" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      {/* Navbar */}
      <nav className="topnav sticky top-0 z-50 shadow-xs">
        <div className="max-w-[1200px] mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors flex items-center gap-1 hover:no-underline" style={{ textDecoration: 'none' }}>
            <ArrowLeft size={16} />
            <span>لوحة التحكم</span>
          </Link>
          <Link href="/dashboard" className="flex items-center gap-2 group hover:no-underline" style={{ textDecoration: 'none' }}>
            <div className="w-8 h-8 bg-accent rounded-lg flex items-center justify-center shadow-md shadow-accent/15 transition-all group-hover:scale-105">
              <Briefcase size={16} className="text-white" />
            </div>
            <span className="text-lg font-bold text-slate-950">خدمة<span className="text-accent">.dz</span></span>
          </Link>
        </div>
      </nav>

      {/* Main Container */}
      <div className="max-w-4xl w-full mx-auto px-6 py-8">
        
        {/* Success submission notification */}
        {success && (
          <div className="mb-6 bg-emerald-50 border border-emerald-200 text-emerald-800 p-5 rounded-2xl flex items-center gap-3.5 shadow-xs animate-fadeIn">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <CheckCircle2 className="w-6 h-6 text-emerald-500 animate-bounce" />
            </div>
            <div>
              <p className="font-extrabold text-sm">تم استلام المستندات بنجاح!</p>
              <p className="text-xs text-emerald-600/90 mt-0.5">{success}</p>
            </div>
          </div>
        )}

        {/* Rejection Warning Banner */}
        {currentKycStatus === 'rejected' && (
          <div className="mb-8 bg-rose-50 border border-rose-200 text-rose-800 p-5 rounded-3xl flex items-start gap-4 shadow-2xs animate-fadeIn">
            <AlertCircle className="w-6 h-6 text-rose-500 mt-0.5 flex-shrink-0" />
            <div>
              <h3 className="text-sm font-extrabold text-rose-950">تم رفض طلب التوثيق السابق</h3>
              <p className="text-xs text-rose-700 leading-relaxed mt-1.5">
                يمكنك مراجعة الأخطاء الموضحة وتحديث المرفقات المطلوبة لإعادة التقديم.
              </p>
              {rejectionReason && (
                <div className="mt-3 bg-white/70 border border-rose-100/60 p-3 rounded-xl">
                  <span className="text-[10px] font-bold text-rose-900 uppercase tracking-wider block">سبب الرفض المدون:</span>
                  <span className="text-xs text-rose-800 font-semibold mt-0.5 block leading-relaxed">{rejectionReason}</span>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* 1. Instructional Reassuring UI Panel (Column 1) */}
          <div className="lg:col-span-1 space-y-6">
            
            {/* Benefits of Badge */}
            <div className="bg-[#0f172a] rounded-3xl p-6 text-white relative overflow-hidden shadow-md border border-slate-800">
              <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
                <div className="absolute -top-12 -left-12 w-32 h-32 bg-accent rounded-full blur-2xl"></div>
              </div>
              
              <div className="relative">
                <div className="inline-flex items-center gap-1.5 bg-accent-soft text-accent px-3 py-1 rounded-full text-xs font-semibold mb-3">
                  <ShieldCheck size={13} />
                  <span>تأكيد الحساب والهوية</span>
                </div>
                <h3 className="text-base font-extrabold text-slate-100 mb-2">لماذا أحتاج للتوثيق؟</h3>
                <p className="text-slate-400 text-[11px] leading-relaxed mb-5">
                  يتطلب القانون المالي وميثاق الأمان لدينا التحقق الفعلي من الهوية قبل سحب أرباح المشاريع الكبرى لضمان موثوقية وجودة التعاملات بالمنصة.
                </p>

                <ul className="space-y-3.5 text-xs text-slate-300">
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <div>
                      <strong className="block text-slate-100 text-[11px]">شارة التوثيق الزرقاء</strong>
                      <span className="text-slate-400 text-[10px]">تظهر بجانب اسمك في جميع العروض لتعزيز جاذبيتك للعملاء.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <div>
                      <strong className="block text-slate-100 text-[11px]">سحب أرباح بلا حدود</strong>
                      <span className="text-slate-400 text-[10px]">إمكانية سحب المبالغ التي تفوق 50,000 دج بسلاسة تامة.</span>
                    </div>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-emerald-400 font-bold mt-0.5">✓</span>
                    <div>
                      <strong className="block text-slate-100 text-[11px]">أولوية محرك البحث</strong>
                      <span className="text-slate-400 text-[10px]">تفضيل ملفات الأعضاء الموثقين وتصدرهم نتائج استعلام المشاريع.</span>
                    </div>
                  </li>
                </ul>
              </div>
            </div>

            {/* Reassurance/Security Shield Card */}
            <div className="bg-white border border-slate-200/80 rounded-3xl p-5 shadow-2xs">
              <div className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-600 flex-shrink-0">
                  <Lock size={16} />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900 mb-1">أمن وسرية البيانات مكفولة</h4>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    يتم تشفير أرقام الهوية مباشرة بخوارزمية SHA-256 لحماية خصوصيتك. كما يتم حفظ المرفقات الضوئية في مساحة تخزين سحابية مغلقة ومحمية ببروتوكولات التشفير المتطورة، ولا يمكن لأي جهة الاطلاع عليها عدا إدارة التدقيق المصرح لها.
                  </p>
                </div>
              </div>
            </div>

          </div>

          {/* 2. Interactive Secure Submission Form (Column 2) */}
          <div className="lg:col-span-2 space-y-6">
            
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {/* Step 1: Select ID Type */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 bg-accent-soft rounded-lg flex items-center justify-center text-accent text-xs font-extrabold">1</div>
                  <h3 className="font-extrabold text-slate-950 text-sm">نوع الوثيقة الرسمية</h3>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {ID_TYPES.map((type) => {
                    const isSelected = idType === type.id
                    return (
                      <button
                        key={type.id}
                        type="button"
                        onClick={() => setIdType(type.id)}
                        className={`p-4 rounded-2xl border-2 text-right transition-all flex flex-col justify-between min-h-[110px] cursor-pointer ${
                          isSelected
                            ? 'border-accent bg-accent-soft/20 text-accent font-semibold scale-[1.01]'
                            : 'border-slate-100 bg-slate-50/50 text-slate-600 hover:border-slate-200 hover:bg-slate-50'
                        }`}
                      >
                        <div className="text-xl">{type.icon}</div>
                        <div>
                          <div className={`text-xs font-bold ${isSelected ? 'text-accent' : 'text-slate-900'}`}>{type.label}</div>
                          <div className="text-[9px] text-slate-400 mt-0.5 leading-snug">{type.desc}</div>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>

              {/* Step 2: Input ID Number */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 bg-accent-soft rounded-lg flex items-center justify-center text-accent text-xs font-extrabold">2</div>
                  <h3 className="font-extrabold text-slate-950 text-sm">رقم وثيقة الهوية الرسمية</h3>
                </div>
                
                <input
                  type="text"
                  value={idNumber}
                  onChange={(e) => setIdNumber(e.target.value)}
                  placeholder={
                    idType === 'national_id' ? 'أدخل رقم التعريف الوطني المكون من 18 رقماً'
                      : idType === 'passport' ? 'مثال: A12345678'
                        : 'مثال: 1234567890'
                  }
                  required
                  minLength={5}
                  className="w-full px-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent-soft transition-all font-mono"
                  style={{ color: '#111827', backgroundColor: '#ffffff' }}
                  dir="ltr"
                />
                
                <div className="flex items-start gap-2.5 mt-3.5 bg-blue-50/60 border border-blue-100 rounded-2xl p-3.5">
                  <Lock className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                  <p className="text-[10px] text-blue-700 leading-relaxed">
                    يتم تشفير وتعمية رقم الهوية الوطني تلقائياً بنظام الهاش المتقدم قبل حفظه بالخوادم لتأمين خصوصيتك وحظر أي استخدام مكرر لنفس الوثيقة.
                  </p>
                </div>
              </div>

              {/* Step 3: Secure Distinct Dropzones (Modernized drag-and-drop look) */}
              <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-7 h-7 bg-accent-soft rounded-lg flex items-center justify-center text-accent text-xs font-extrabold">3</div>
                  <h3 className="font-extrabold text-slate-950 text-sm">المرفقات والوثائق الضوئية</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Dropzone 1: Front ID (Required) */}
                  <KycUploadZone
                    label="الجهة الأمامية للوثيقة"
                    required
                    icon={<Camera className="w-5 h-5" />}
                    slot={front}
                    inputRef={frontRef}
                    onFileChange={(file) => handleFileUpload(file, 'front', setFront)}
                    onClear={() => setFront({ file: null, path: null, uploading: false, compressing: false, error: null })}
                  />

                  {/* Dropzone 2: Back ID (Required for non-passport) */}
                  {idType !== 'passport' ? (
                    <KycUploadZone
                      label="الجهة الخلفية للوثيقة"
                      required
                      icon={<Camera className="w-5 h-5" />}
                      slot={back}
                      inputRef={backRef}
                      onFileChange={(file) => handleFileUpload(file, 'back', setBack)}
                      onClear={() => setBack({ file: null, path: null, uploading: false, compressing: false, error: null })}
                    />
                  ) : (
                    // Placeholder when Passport selected
                    <div className="border border-slate-100 rounded-2xl p-5 flex flex-col justify-center items-center text-center bg-slate-50 opacity-40">
                      <div className="text-xl mb-1.5">📕</div>
                      <h4 className="text-xs font-bold text-slate-400">الجهة الخلفية غير مطلوبة</h4>
                      <p className="text-[9px] text-slate-400 mt-1 max-w-[150px] leading-relaxed">
                        عند اختيار جواز السفر، يكتفى برفع صفحة البيانات الأمامية فقط.
                      </p>
                    </div>
                  )}
                </div>

                {/* Dropzone 3: Selfie (Highly Recommended) */}
                <div className="mt-4">
                  <KycUploadZone
                    label="صورة سيلفي واضحة لحامل الوثيقة"
                    icon={<Camera className="w-5 h-5" />}
                    slot={selfie}
                    inputRef={selfieRef}
                    onFileChange={(file) => handleFileUpload(file, 'selfie', setSelfie)}
                    onClear={() => setSelfie({ file: null, path: null, uploading: false, compressing: false, error: null })}
                  />
                  <p className="text-[10px] text-slate-400 mt-2.5 leading-relaxed bg-slate-50 border border-slate-100 p-2.5 rounded-xl">
                    💡 **نصيحة لصورة السيلفي**: احمل وثيقة هويتك بيدك قريباً من وجهك والتقط صورة واضحة في إضاءة جيدة لتسريع عملية المراجعة التلقائية وتنشيط الحساب فوراً.
                  </p>
                </div>

                <div className="text-[10px] text-slate-400 mt-4 text-center sm:text-right">
                  الامتدادات المقبولة: JPG, PNG, WebP, PDF. الحجم الأقصى للمستند: 25MB (يتم اختزاله وتصغيره تلقائياً).
                </div>
              </div>

              {/* Form Submission Error Display */}
              {error && (
                <div className="bg-rose-50 border border-rose-100 text-rose-700 text-xs rounded-2xl p-4 flex items-center gap-2 animate-fadeIn">
                  <AlertCircle size={16} className="text-rose-500 flex-shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={submitting || !front.path || front.uploading || back.uploading || selfie.uploading || !idNumber.trim()}
                className="w-full bg-accent text-white hover:bg-accent-hover font-bold py-3.5 rounded-2xl text-xs sm:text-sm hover:no-underline shadow-md shadow-accent/15 flex items-center justify-center gap-1.5 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>جاري إرسال المستندات بأمان...</span>
                  </>
                ) : (
                  <>
                    <ShieldCheck size={16} />
                    <span>إرسال طلب التحقق للمراجعة</span>
                  </>
                )}
              </button>

              <div className="text-center text-[10px] text-slate-400 leading-relaxed max-w-xs mx-auto">
                بإرسال هذا الطلب فإنك توافق على{' '}
                <Link href="/privacy" className="text-accent hover:underline font-semibold">سياسة حماية البيانات</Link>
                {' '}وأن جميع الوثائق المرفقة رسمية وتخص حسابك الشخصي.
              </div>

            </form>

          </div>

        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
// Reusable Modernized Dropzone Component (Local UI styling)
// ─────────────────────────────────────────────────────────────
function KycUploadZone({
  label,
  required,
  icon,
  slot,
  inputRef,
  onFileChange,
  onClear,
}: {
  label: string
  required?: boolean
  icon: React.ReactNode
  slot: UploadSlot
  inputRef: React.RefObject<HTMLInputElement | null>
  onFileChange: (file: File) => void
  onClear: () => void
}) {
  return (
    <div className="flex-1">
      <label className="block text-xs font-bold text-slate-700 mb-1.5">
        {label} {required && <span className="text-rose-500">*</span>}
      </label>
      
      <div
        onClick={() => !slot.uploading && !slot.path && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all min-h-[140px] flex flex-col items-center justify-center ${
          slot.path
            ? 'border-emerald-400 bg-emerald-50/40 cursor-default shadow-xs'
            : slot.uploading
            ? 'border-slate-200 bg-slate-50 cursor-wait'
            : slot.error
            ? 'border-rose-300 bg-rose-50 cursor-pointer animate-shake'
            : 'border-slate-200 hover:border-accent hover:bg-accent-soft/10 cursor-pointer shadow-2xs'
        }`}
      >
        {slot.compressing ? (
          <div className="flex flex-col items-center gap-2 animate-fadeIn">
            <Loader2 className="w-5 h-5 text-amber-500 animate-spin" />
            <p className="text-[10px] text-amber-600 font-bold">جاري ضغط وتصغير حجم الملف...</p>
          </div>
        ) : slot.uploading ? (
          <div className="flex flex-col items-center gap-2 animate-fadeIn">
            <Loader2 className="w-5 h-5 text-accent animate-spin" />
            <p className="text-[10px] text-slate-500 font-semibold">جاري تشفير ورفع الملف...</p>
          </div>
        ) : slot.path ? (
          <div className="flex flex-col items-center gap-1.5 animate-fadeIn">
            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            <p className="text-[10px] text-emerald-700 font-bold truncate max-w-[150px]" dir="ltr">{slot.file?.name}</p>
            <p className="text-[9px] text-slate-400 font-semibold">{slot.file ? `${(slot.file.size / 1024).toFixed(0)} KB` : ''}</p>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onClear() }}
              className="mt-1 text-[10px] text-rose-500 hover:text-rose-700 hover:underline transition-all bg-white border border-rose-100 rounded-lg px-2.5 py-1 flex items-center gap-1 cursor-pointer font-bold shadow-2xs"
            >
              <Trash2 size={10} />
              <span>إزالة المرفق</span>
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 animate-fadeIn cursor-pointer">
            <div className="w-9 h-9 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center text-slate-400">
              {icon}
            </div>
            <div>
              <p className="text-xs text-slate-700 font-bold">اضغط أو اسحب لرفع الوثيقة</p>
              <p className="text-[9px] text-slate-400 mt-0.5">الحد الأقصى للمستند: 25MB</p>
            </div>
          </div>
        )}
      </div>

      {slot.error && (
        <p className="text-[10px] text-rose-500 font-semibold mt-1.5 flex items-center gap-1 animate-fadeIn">
          <AlertCircle size={12} className="text-rose-500 flex-shrink-0" />
          <span>{slot.error}</span>
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.heif,application/pdf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0]
          if (f) onFileChange(f)
          e.target.value = '' // Reset so re-selecting works
        }}
      />
    </div>
  )
}
