'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import LanguageSwitcher from '@/app/components/LanguageSwitcher'
import { submitContactAction } from '@/app/actions/contact'
import {
  Mail,
  Phone,
  Clock,
  MapPin,
  Send,
  HelpCircle,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Globe,
  Briefcase
} from 'lucide-react'

interface FAQItem {
  question: string
  answer: string
}

const FAQS: FAQItem[] = [
  {
    question: 'ما هو نظام الضمان (Escrow) وكيف يحميني؟',
    answer: 'عند بدء أي مشروع، يقوم صاحب العمل بشحن ميزانية الصفقة وتجميدها في نظام الضمان الآمن لدينا. بمجرد قيام المستقل بتسليم المهام وموافقة صاحب العمل عليها، يتم تحرير الأموال تلقائياً إلى حساب المستقل. هذا يحمي مجهود المستقل ويضمن لصاحب العمل عدم تسليم الأموال إلا بعد استلام العمل المطابق للشروط.'
  },
  {
    question: 'كيف يمكنني شحن محفظتي أو سحب أرباحي في الجزائر؟',
    answer: 'ندعم خيارات الدفع المحلية في الجزائر لتسهيل التعامل المالي. يمكنك شحن رصيد محفظتك عبر التحويل البريدي أو البنكي، بينما تتم عملية سحب الأرباح للمستقلين مباشرة إلى حساباتهم الجارية عبر الحساب البريدي الجاري (CCP) أو رمز التعرف البريدي (RIP) أو عن طريق تطبيق بريدي موب (BaridiMob).'
  },
  {
    question: 'ماذا أفعل في حال حدوث خلاف بيني وبين الطرف الآخر؟',
    answer: 'المنصة تدعم مركزاً متطوراً لفض النزاعات المالية. في حال واجهت أي مشكلة، يمكنك رفع "طلب نزاع" من تفاصيل العقد. سيقوم فريق الإشراف المختص لدينا بمراجعة محادثات المشروع والأدلة وتوزيع الأموال بين الطرفين بنسب عادلة طبقاً لجودة ما تم تسليمه.'
  },
  {
    question: 'كيف يمكنني الحصول على شارة الحساب الموثق (Verified Badge)؟',
    answer: 'لتحسين مصداقية حسابك وزيادة فرص توظيفك، ننصح بطلب التوثيق من خلال رفع صورة بطاقة التعريف الوطنية البيومترية أو جواز السفر عبر صفحة "توثيق الهوية" (KYC). نقوم بمراجعة الأوراق وتفعيل الشارة الزرقاء لحسابك مجاناً خلال 24 ساعة.'
  }
]

export default function ContactPage() {
  // Pre-fill user information if logged in
  const [user, setUser] = useState<User | null>(null)
  
  // Form states
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [subject, setSubject] = useState('')
  const [category, setCategory] = useState('general')
  const [message, setMessage] = useState('')
  
  // Interaction & visual states
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null)

  useEffect(() => {
    // Set dynamic page metadata via document title
    document.title = 'اتصل بنا | خدمة.dz — الدعم الفني والمساعدة'

    const checkSession = async () => {
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      if (sessionUser) {
        setUser(sessionUser)
        setEmail(sessionUser.email || '')
        
        // Fetch full name from profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('full_name, username')
          .eq('id', sessionUser.id)
          .single()
        
        if (profile) {
          setName(profile.full_name || profile.username || '')
        }
      }
    }
    checkSession()
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError(null)
    setSuccess(false)

    // Form inputs validation checks
    if (name.trim().length < 3) {
      setError('يرجى كتابة الاسم الكامل (3 أحرف على الأقل).')
      setIsSubmitting(false)
      return
    }
    if (!email.includes('@')) {
      setError('يرجى إدخال عنوان بريد إلكتروني صحيح.')
      setIsSubmitting(false)
      return
    }
    if (subject.trim().length < 4) {
      setError('يرجى إدخال عنوان موضوع الاستفسار.')
      setIsSubmitting(false)
      return
    }
    if (message.trim().length < 10) {
      setError('يرجى كتابة تفاصيل الاستفسار (10 أحرف على الأقل).')
      setIsSubmitting(false)
      return
    }

    const res = await submitContactAction({
      name,
      email,
      subject,
      category,
      message
    })

    setIsSubmitting(false)

    if (res.error) {
      setError(res.error)
    } else {
      setSuccess(true)
      // Reset non-user fields
      setSubject('')
      setMessage('')
    }
  }

  return (
    <main className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      
      {/* Page SEO Meta Tags for fallback support */}
      <noscript>
        <h1>اتصل بنا - خدمة.dz</h1>
        <p>تواصل مع فريق الدعم الفني لمنصة خدمة.dz للاستفسار عن المعاملات المالية، الضمان، أو توثيق الحسابات في الجزائر.</p>
      </noscript>

      {/* ─── Navigation Header ─── */}
      <header className="topnav">
        <div className="max-w-[var(--container)] mx-auto px-6 flex items-center justify-between h-[72px]">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 hover:no-underline">
            <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center shadow-xs">
              <Briefcase size={16} className="text-white" />
            </div>
            <span
              className="text-[22px] font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)' }}
            >
              خدمة<span style={{ color: 'var(--accent)' }}>.dz</span>
            </span>
          </Link>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {user ? (
              <Link href="/dashboard" className="btn btn-primary">
                لوحة التحكم ←
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="btn btn-outline">دخول</Link>
                <Link href="/auth/register" className="btn btn-primary">حساب جديد</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Heading ─── */}
      <div className="relative overflow-hidden py-12 sm:py-16 text-center border-b border-[var(--border)]" style={{ background: 'radial-gradient(ellipse at top, rgba(15, 118, 110, 0.04), transparent 70%)' }}>
        <div className="max-w-3xl mx-auto px-6">
          <span className="eyebrow">تواصل معنا</span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[var(--fg)] tracking-tight mb-4 font-sans leading-tight">
            نحن هنا لمساعدتك في كل خطوة
          </h1>
          <p className="text-[var(--muted)] text-sm sm:text-base max-w-xl mx-auto leading-relaxed">
            هل لديك سؤال حول نظام الضمان؟ أو بحاجة لمساعدة في سحب أرباحك؟ فريق دعم <span className="font-bold text-[var(--accent)]">خدمة.dz</span> مستعد للرد على كافة استفساراتك.
          </p>
        </div>
      </div>

      {/* ─── Core Contact Container ─── */}
      <div className="max-w-[var(--container)] w-full mx-auto px-6 py-12 flex-1">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* COLUMN 1: FORM WORKSPACE (Lg: 7 cols) */}
          <div className="lg:col-span-7">
            <div className="card shadow-xs bg-white border border-[var(--border)] rounded-2xl p-6 sm:p-8 relative">
              
              {/* Form header */}
              <div className="mb-6">
                <h2 className="text-lg sm:text-xl font-bold text-[var(--fg)]">أرسل استفسارك مباشرة</h2>
                <p className="text-xs text-[var(--muted)] mt-1">يرجى تعبئة النموذج أدناه بدقة، وسنرد على بريدك الإلكتروني خلال بضع ساعات.</p>
              </div>

              {/* Success Alert Dialog */}
              {success && (
                <div className="mb-6 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-800 flex items-start gap-3 animate-fadeIn">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-emerald-950">تم إرسال رسالتك بنجاح!</h4>
                    <p className="text-xs text-emerald-800/90 mt-1 leading-relaxed">
                      نشكرك على تواصلك. لقد تم إرسال رسالتك إلى فريق الدعم، وقمنا بإرسال رسالة تأكيد إلكترونية تلقائية إلى بريدك المستهدف لمتابعة التحديثات.
                    </p>
                  </div>
                </div>
              )}

              {/* Error Alert Dialog */}
              {error && (
                <div className="mb-6 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-800 flex items-start gap-3 animate-fadeIn">
                  <AlertTriangle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-rose-950">فشل في الإرسال</h4>
                    <p className="text-xs text-rose-800/90 mt-0.5">{error}</p>
                  </div>
                </div>
              )}

              {/* Contact Form */}
              <form id="contact-form" onSubmit={handleSubmit} className="space-y-5">
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name field */}
                  <div className="field">
                    <label htmlFor="contact-name">الاسم الكامل <span className="text-rose-500">*</span></label>
                    <input
                      type="text"
                      id="contact-name"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="مثال: محمد بن علي"
                      required
                      disabled={isSubmitting}
                      className="border-[var(--border)] text-[#111827] focus:border-[var(--accent)] rounded-lg text-sm transition-all"
                    />
                  </div>

                  {/* Email field */}
                  <div className="field">
                    <label htmlFor="contact-email">البريد الإلكتروني المعتمد <span className="text-rose-500">*</span></label>
                    <input
                      type="email"
                      id="contact-email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="name@example.dz"
                      required
                      disabled={isSubmitting}
                      className="border-[var(--border)] text-[#111827] focus:border-[var(--accent)] rounded-lg text-sm transition-all ltr text-right"
                    />
                  </div>
                </div>

                {/* Inquiry Category selector */}
                <div className="field">
                  <label htmlFor="contact-category">قسم الاستفسار والموضوع الفرعي <span className="text-rose-500">*</span></label>
                  <select
                    id="contact-category"
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    disabled={isSubmitting}
                    className="border-[var(--border)] text-[#111827] focus:border-[var(--accent)] rounded-lg text-sm py-2.5 transition-all bg-white"
                  >
                    <option value="general">استفسار عام حول المنصة</option>
                    <option value="technical">مساعدة في الحساب أو مشاكل فنية</option>
                    <option value="financial">استفسار مالي (الإيداع، سحب CCP/RIP، والضمان)</option>
                    <option value="dispute">النزاعات المالية وشكاوى العقود</option>
                    <option value="partnership">طلبات الشراكة التجارية والتعاون</option>
                  </select>
                </div>

                {/* Subject field */}
                <div className="field">
                  <label htmlFor="contact-subject">عنوان الموضوع <span className="text-rose-500">*</span></label>
                  <input
                    type="text"
                    id="contact-subject"
                    value={subject}
                    onChange={e => setSubject(e.target.value)}
                    placeholder="مثال: استفسار بخصوص شحن المحفظة عبر بريدي موب"
                    required
                    disabled={isSubmitting}
                    className="border-[var(--border)] text-[#111827] focus:border-[var(--accent)] rounded-lg text-sm transition-all"
                  />
                </div>

                {/* Message Box field */}
                <div className="field">
                  <label htmlFor="contact-message">نص الرسالة بالتفصيل <span className="text-rose-500">*</span></label>
                  <textarea
                    id="contact-message"
                    value={message}
                    onChange={e => setMessage(e.target.value)}
                    placeholder="اكتب هنا تفاصيل طلبك أو المشكلة التي تواجهها بالتفصيل وسيقوم أحد ممثلي الدعم الفني بالرد المباشر عليك..."
                    rows={6}
                    required
                    disabled={isSubmitting}
                    className="border-[var(--border)] text-[#111827] focus:border-[var(--accent)] rounded-lg text-sm resize-none transition-all leading-relaxed"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  id="contact-submit"
                  disabled={isSubmitting}
                  className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-bold py-3 px-6 rounded-xl transition-all shadow-xs flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>جاري إرسال طلبك الآن...</span>
                    </>
                  ) : (
                    <>
                      <Send size={16} />
                      <span>إرسال الرسالة إلى الدعم الفني</span>
                    </>
                  )}
                </button>

              </form>
            </div>
          </div>

          {/* COLUMN 2: COORDINATES & FAQS (Lg: 5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            
            {/* Quick Contact Coordinates Info */}
            <div className="card shadow-xs bg-white border border-[var(--border)] rounded-2xl p-6 space-y-5">
              <h3 className="font-bold text-base text-[var(--fg)] border-b border-[var(--border)] pb-3">
                تفاصيل الاتصال المباشر
              </h3>

              <div className="space-y-4">
                
                {/* Email Info */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
                    <Mail size={16} />
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted)] font-medium block">البريد الإلكتروني المعتمد</span>
                    <a href="mailto:support@khidma.dz" className="text-sm font-bold text-[var(--fg)] hover:text-[var(--accent)] transition-colors ltr inline-block">
                      support@khidma.dz
                    </a>
                  </div>
                </div>

                {/* Phone Info */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
                    <Phone size={16} />
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted)] font-medium block">الرقم الموحد للدعم الفني</span>
                    <span className="text-sm font-bold text-[var(--fg)] font-mono">
                      +213 (0) 23 45 67 89
                    </span>
                  </div>
                </div>

                {/* Hours Info */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
                    <Clock size={16} />
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted)] font-medium block">أوقات وساعات العمل</span>
                    <span className="text-sm font-bold text-[var(--fg)]">
                      الأحد - الخميس (09:00 صباحاً - 17:00 مساءً)
                    </span>
                  </div>
                </div>

                {/* Address Info */}
                <div className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[var(--accent-soft)] text-[var(--accent)] flex items-center justify-center flex-shrink-0">
                    <MapPin size={16} />
                  </div>
                  <div>
                    <span className="text-xs text-[var(--muted)] font-medium block">المقر الرئيسي للشركة</span>
                    <span className="text-sm font-bold text-[var(--fg)]">
                      الجزائر العاصمة، الجزائر
                    </span>
                  </div>
                </div>

              </div>

              {/* Social Channels badges */}
              <div className="pt-4 border-t border-[var(--border)] flex items-center gap-3">
                <span className="text-xs text-[var(--muted)] font-medium">تابعونا:</span>
                <div className="flex gap-2">
                  {['Facebook', 'Twitter', 'LinkedIn'].map((network, idx) => (
                    <span
                      key={idx}
                      className="text-[11px] bg-[var(--bg)] border border-[var(--border)] text-[var(--fg)] font-bold px-2.5 py-1 rounded-lg hover:border-[var(--accent)] transition-all cursor-pointer flex items-center gap-1"
                    >
                      <Globe size={10} />
                      {network}
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Interactive FAQs Accordion */}
            <div className="card shadow-xs bg-white border border-[var(--border)] rounded-2xl p-6">
              <div className="flex items-center gap-2 border-b border-[var(--border)] pb-3 mb-4">
                <HelpCircle className="w-4 text-[var(--accent)]" />
                <h3 className="font-bold text-base text-[var(--fg)]">
                  أسئلة شائعة قد تهمك
                </h3>
              </div>

              <div className="space-y-3">
                {FAQS.map((faq, index) => {
                  const isOpen = openFaqIndex === index
                  return (
                    <div key={index} className="border border-[var(--border)] rounded-xl overflow-hidden transition-all duration-200 bg-[var(--bg)]/30">
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? null : index)}
                        className="w-full px-4 py-3 flex items-center justify-between text-right font-bold text-xs text-[var(--fg)] hover:bg-[var(--bg)] transition-colors cursor-pointer"
                      >
                        <span className="leading-snug">{faq.question}</span>
                        <ChevronDown size={14} className={`text-[var(--muted)] transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 text-[var(--accent)]' : ''}`} />
                      </button>
                      <div
                        className="transition-all duration-300 ease-in-out overflow-hidden"
                        style={{
                          maxHeight: isOpen ? '250px' : '0px',
                          borderTop: isOpen ? '1px solid var(--border)' : 'none'
                        }}
                      >
                        <p className="p-4 text-xs text-[var(--muted)] leading-relaxed bg-white">
                          {faq.answer}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

        </div>
      </div>

      {/* ─── Footer ─── */}
      <footer style={{ paddingBlock: '40px', borderTop: '1px solid var(--border)', background: 'white' }}>
        <div className="max-w-[var(--container)] mx-auto px-6">
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
            style={{ color: 'var(--muted)' }}
          >
            <p>جميع الحقوق محفوظة © {new Date().getFullYear()} خدمة.dz</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-[var(--accent)] transition-colors hover:no-underline">شروط الاستخدام</Link>
              <Link href="/privacy" className="hover:text-[var(--accent)] transition-colors hover:no-underline">سياسة الخصوصية</Link>
              <Link href="/terms" className="hover:text-[var(--accent)] transition-colors hover:no-underline">الثقة والأمان</Link>
            </div>
          </div>
        </div>
      </footer>

    </main>
  )
}
