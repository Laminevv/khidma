'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import {
  Shield,
  Coins,
  Lock,
  FileCheck,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  ArrowLeft,
  ChevronDown,
  Info,
  Clock,
  Briefcase,
  HelpCircle,
  TrendingUp,
  UserCheck,
  Check,
  ChevronLeft
} from 'lucide-react'

// Step in Escrow lifecycle definition
interface EscrowStage {
  step: string
  title: string
  statusText: string
  statusColor: string
  icon: React.ReactNode
  detailedDesc: string
  clientAction: string
  freelancerAction: string
}

export default function EscrowGuidePage() {
  const [user, setUser] = useState<User | null>(null)
  const [activeStage, setActiveStage] = useState<number>(0)
  const [openLocalFaqIndex, setOpenLocalFaqIndex] = useState<number | null>(null)

  useEffect(() => {
    // Set dynamic page metadata via document title
    document.title = 'كيف يعمل نظام الضمان والمدفوعات؟ | خدمة.dz'

    const checkSession = async () => {
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      if (sessionUser) {
        setUser(sessionUser)
      }
    }
    checkSession()
  }, [])

  // 5-Stage Escrow Lifecycle Data
  const escrowStages: EscrowStage[] = [
    {
      step: '٠١',
      title: 'إيداع وشحن ميزانية العقد',
      statusText: 'قيد الإيداع / Deposit',
      statusColor: 'bg-blue-500/10 text-blue-700 border-blue-200',
      icon: <CreditCard className="w-6 h-6" />,
      detailedDesc: 'قبل بدء أي عمل، يقوم صاحب المشروع بشحن محفظته بالمبلغ المطلوب للمشروع أو المرحلة الأولى (Milestone) عبر خيارات الدفع الجزائرية المحلية (BaridiMob أو CCP). بمجرد إتمام الإيداع، يضغط صاحب العمل على زر توظيف المستقل وبدء العقد.',
      clientAction: 'شحن المحفظة وإطلاق العقد عبر اختيار المستقل المناسب.',
      freelancerAction: 'مراجعة شروط العقد والانتظار حتى يتم إخطاره بتأمين الدفع.'
    },
    {
      step: '٠٢',
      title: 'تجميد الأموال في الضمان',
      statusText: 'مُجمّد وآمن / Escrow Locked',
      statusColor: 'bg-amber-500/10 text-amber-700 border-amber-200',
      icon: <Lock className="w-6 h-6" />,
      detailedDesc: 'فور بدء العقد، يقوم نظام الضمان الذكي في منصة خدمة.dz بسحب ميزانية الاتفاق وتجميدها بالكامل في حساب وسيط آمن. لا يستطيع صاحب العمل استردادها بدون سبب وجيه، كما لا يستطيع المستقل استلامها فوراً. تظل الأموال معلقة لضمان حقوق الطرفين.',
      clientAction: 'الاطمئنان أن أتعاب المشروع قد تم حجزها بأمان ولا يمكن التصرف فيها إلا طبقاً للتسليمات.',
      freelancerAction: 'استلام إشعار رسمي بأن "الأموال مجمدة في نظام الضمان"، وهو الضوء الأخضر للبدء الفوري.'
    },
    {
      step: '٠٣',
      title: 'العمل والتنفيذ الفعلي',
      statusText: 'قيد التنفيذ / Work in Progress',
      statusColor: 'bg-purple-500/10 text-purple-700 border-purple-200',
      icon: <Clock className="w-6 h-6" />,
      detailedDesc: 'يقوم المستقل بالعمل وتطوير المخرجات المتفق عليها، مع تقديم تقارير دورية عبر شات المنصة. ميزة الضمان تتيح للمستقل العمل بأعلى مستويات التركيز والإبداع لأن مستحقاته المالية مؤمنة ومضمونة بنسبة 100% فور التسليم.',
      clientAction: 'متابعة سير العمل وتقديم ملاحظات توجيهية مستمرة لضمان الجودة.',
      freelancerAction: 'التنفيذ والالتزام بالجدول الزمني والتحضير لتسليم الملفات النهائية.'
    },
    {
      step: '٠٤',
      title: 'تسليم المخرجات والمراجعة',
      statusText: 'قيد المراجعة / Under Review',
      statusColor: 'bg-emerald-500/10 text-emerald-700 border-emerald-200',
      icon: <FileCheck className="w-6 h-6" />,
      detailedDesc: 'يرفع المستقل الملفات النهائية الرسمية (كود المصدر، تصميم Figma، نصوص مترجمة، إلخ) عبر زر "تسليم المشروع" داخل صفحة العقد. يتلقى صاحب العمل إشعاراً فورياً للتحقق من جودة العمل ومطابقتها للشروط المتفق عليها.',
      clientAction: 'مراجعة المخرجات بعناية، وطلب تعديلات مجانية إن لزم الأمر وفقاً للاتفاق الأصلي.',
      freelancerAction: 'تلبية أي تعديلات يطلبها العميل باحترافية وسرعة لإنهاء العقد.'
    },
    {
      step: '٠٥',
      title: 'تحرير الضمان ونقل الأرباح',
      statusText: 'تم التحرير / Released',
      statusColor: 'bg-emerald-600/20 text-emerald-800 border-emerald-300',
      icon: <CheckCircle2 className="w-6 h-6" />,
      detailedDesc: 'بمجرد رضا صاحب العمل التام عن جودة التسليم، يضغط على زر "الموافقة وتحرير الأموال". في تلك اللحظة بالذات، يقوم النظام بتحرير الأموال فوراً من الضمان ونقلها إلى محفظة المستقل المتاحة للسحب المباشر. يُغلق العقد ويتبادل الطرفان التقييم.',
      clientAction: 'اعتماد العمل، تحرير الأموال، وترك تقييم إيجابي يعكس تجربته.',
      freelancerAction: 'تلقي الأرباح فوراً في المحفظة، وطلب سحبها عبر الحساب الجاري CCP أو BaridiMob.'
    }
  ]

  // Localized Payment FAQs definition
  const localPaymentFaqs = [
    {
      q: 'كيف يمكنني شحن محفظتي محلياً داخل الجزائر؟',
      a: 'تسهيلاً للتعاملات المالية، ندعم شحن المحفظة بطريقتين أساسيتين: ١) تطبيق بريدي موب (BaridiMob) عن طريق إرسال حوالة مباشرة إلى الـ RIP المخصص لحسابك بالمنصة لتتم المعالجة فورياً. ٢) التحويل البريدي التقليدي (CCP) عبر مكاتب بريد الجزائر، حيث تقوم برفع صورة وصل الدفع ليقوم فريق المحاسبة لدينا بمراجعة الرصيد وتفعيله في حسابك خلال أقل من ساعتين.'
    },
    {
      q: 'ما هي مدة معالجة طلبات سحب الأرباح للمستقلين الجزائريين؟',
      a: 'تتم معالجة كافة عمليات سحب الأرباح يدوياً من قبل فريق الحسابات لضمان الأمان ومكافحة الاحتيال. تُرسل الأموال مباشرة إلى حسابك الجاري CCP أو عبر تطبيق بريدي موب. تستغرق العملية عادةً من ٢٤ إلى ٤٨ ساعة عمل كحد أقصى (باستثناء عطلات نهاية الأسبوع الرسمية لمكتب البريد).'
    },
    {
      q: 'هل توجد رسوم خفية على تجميد الضمان أو الإيداع؟',
      a: 'لا توجد أي رسوم خفية على الإطلاق. إيداع ميزانية المشروع وتجميدها في الضمان مجاني 100%. تتقاضى المنصة عمولة تشغيلية ثابتة وتنافسية تُخصم من أرباح المستقل عند إتمام المشروع بنجاح فقط، لتغطية تكاليف التحويلات البريدية والصيانة ودعم مركز النزاعات.'
    },
    {
      q: 'ما هو الحد الأدنى لشحن المحفظة وسحب الأرباح؟',
      a: 'الحد الأدنى لشحن المحفظة هو ١,٠٠٠ دج (ألف دينار جزائري)، والحد الأدنى لطلب السحب للمستقلين هو ٢,٠٠٠ دج لضمان تغطية تكاليف الحوالات البريدية وسهولة المعاملات.'
    }
  ]

  return (
    <main className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      
      {/* Fallback SEO markup */}
      <noscript>
        <h1>نظام الضمان الآمن والدفع المحلي في الجزائر - خدمة.dz</h1>
        <p>اكتشف كيف يعمل نظام الضمان (Escrow) لحماية حقوق العملاء والمستقلين، والشحن والسحب عبر CCP وبريدي موب BaridiMob بأمان تام.</p>
      </noscript>

      {/* ─── Sticky Header Navigation ─── */}
      <header className="topnav">
        <div className="max-w-[var(--container)] mx-auto px-6 flex items-center justify-between h-[72px]">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2 hover:no-underline">
            <div className="w-8 h-8 bg-[var(--accent)] rounded-lg flex items-center justify-center shadow-xs">
              <Shield size={16} className="text-white" />
            </div>
            <span
              className="text-[22px] font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)' }}
            >
              خدمة<span style={{ color: 'var(--accent)' }}>.dz</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link
              href="/guides/hiring"
              className="hidden sm:inline-block text-xs font-semibold hover:text-[var(--accent)] transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              دليل التوظيف ←
            </Link>
            {user ? (
              <Link href="/dashboard" className="btn btn-primary text-xs py-2 px-4">
                لوحة التحكم
              </Link>
            ) : (
              <>
                <Link href="/auth/login" className="btn btn-outline text-xs py-2 px-4">دخول</Link>
                <Link href="/auth/register" className="btn btn-primary text-xs py-2 px-4">حساب جديد</Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Trust Title Section ─── */}
      <section className="relative overflow-hidden py-16 text-center border-b border-[var(--border)]" style={{ background: 'radial-gradient(ellipse at top, rgba(15, 118, 110, 0.05), transparent 70%)' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-3  py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-bold text-xs mb-4">
            <Shield size={12} />
            <span>نظام الضمان المالي الآمن (Escrow) 100%</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--fg)] tracking-tight mb-5 leading-tight font-sans">
            حقوقك الماليّة محفوظة بقوة القانون<br/>
            <span style={{ color: 'var(--accent)' }}>ولا مجال للمخاطرة بأموالك</span>
          </h1>
          <p className="text-[var(--muted)] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-8">
            في منصة <span className="font-bold text-[var(--accent)]">خدمة.dz</span>، لا داعي للقلق بشأن استلام مستحقاتك أو ضياع أموالك. يحمي نظام الضمان المتطور حقوق الطرفين بشكل مطلق، مع ربط كامل بأسهل قنوات الدفع البريدية الجزائرية.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            <Link href="/wallet" className="btn btn-accent px-6 py-3 rounded-xl text-sm font-bold shadow-xs">
              <Coins size={14} />
              <span>إدارة محفظتك المالية</span>
            </Link>
            <Link href="/contact" className="btn btn-outline px-6 py-3 rounded-xl text-sm font-bold">
              استفسر من الدعم المالي
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Section 1: Interactive Escrow Step Explainer ─── */}
      <section className="py-16 max-w-[var(--container)] w-full mx-auto px-6">
        <div className="text-center mb-12">
          <span className="eyebrow">دورة حياة الأموال</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--fg)]">رحلة مستحقاتك من الإيداع إلى السحب</h2>
          <p className="text-xs text-[var(--muted)] mt-2 max-w-lg mx-auto leading-relaxed">
            تتبع الخطوات التفاعلية الـ 5 الموضحة أدناه لفهم آلية الحماية وجدولة المعاملات المالية المعتمدة في عقودنا.
          </p>
        </div>

        {/* Horizontal Navigation for Escrow stages */}
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 mb-8">
          {escrowStages.map((stage, idx) => {
            const isSelected = activeStage === idx
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveStage(idx)}
                className={`card text-right p-4 relative border transition-all duration-300 cursor-pointer rounded-2xl flex flex-col justify-between h-full group ${
                  isSelected
                    ? 'border-[var(--accent)] ring-2 ring-[var(--accent-soft)] bg-white shadow-md'
                    : 'border-[var(--border)] bg-white hover:border-[var(--accent)]/50 hover:shadow-xs'
                }`}
              >
                <div className="flex justify-between items-start mb-3">
                  <span className={`text-[20px] font-mono font-bold transition-colors ${isSelected ? 'text-[var(--accent)]' : 'text-slate-300'}`}>
                    {stage.step}
                  </span>
                  <div className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
                    isSelected ? 'bg-[var(--accent)] text-white' : 'bg-slate-50 text-[var(--accent)] group-hover:bg-[var(--accent-soft)]'
                  }`}>
                    {stage.icon}
                  </div>
                </div>

                <h3 className={`font-bold text-xs sm:text-[13px] transition-colors leading-tight ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--fg)]'}`}>
                  {stage.title}
                </h3>
              </button>
            )
          })}
        </div>

        {/* Detailed Drawer Box for Selected Stage */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-xs transition-all duration-500 relative overflow-hidden animate-fadeIn">
          {/* Accent glow banner */}
          <div className="absolute top-0 right-0 w-4 h-full bg-[var(--accent)]" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10 pr-2">
            
            {/* Left Col: Step Definition */}
            <div className="lg:col-span-6 space-y-4">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[11px] font-mono font-extrabold text-[var(--accent)] bg-[var(--accent-soft)] px-2.5 py-1 rounded-lg">
                  الخطوة {escrowStages[activeStage].step}
                </span>
                <span className={`text-[10px] font-semibold border px-2.5 py-0.5 rounded-lg ${escrowStages[activeStage].statusColor}`}>
                  {escrowStages[activeStage].statusText}
                </span>
              </div>

              <h3 className="text-lg sm:text-xl font-extrabold text-[var(--fg)]">
                {escrowStages[activeStage].title}
              </h3>
              
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed font-normal">
                {escrowStages[activeStage].detailedDesc}
              </p>
            </div>

            {/* Right Col: Specific roles action sheets */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Client Action Card */}
              <div className="bg-slate-50 border border-[var(--border)] rounded-xl p-4.5">
                <div className="flex items-center gap-2 mb-2">
                  <UserCheck size={14} className="text-[var(--accent)]" />
                  <h4 className="font-extrabold text-xs text-[var(--fg)]">دور صاحب العمل:</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                  {escrowStages[activeStage].clientAction}
                </p>
              </div>

              {/* Freelancer Action Card */}
              <div className="bg-slate-50 border border-[var(--border)] rounded-xl p-4.5">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp size={14} className="text-emerald-600" />
                  <h4 className="font-extrabold text-xs text-[var(--fg)]">دور المستقل:</h4>
                </div>
                <p className="text-[11px] text-slate-600 leading-relaxed font-normal">
                  {escrowStages[activeStage].freelancerAction}
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Section 2: Localized Algerian Payments (BaridiMob/CCP) Reassurance ─── */}
      <section className="py-16 border-t border-b border-[var(--border)]" style={{ background: 'color-mix(in oklch, var(--accent) 3%, var(--bg))' }}>
        <div className="max-w-[var(--container)] w-full mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* Visual Reassurance Badges Column */}
            <div className="lg:col-span-5 space-y-6">
              <span className="eyebrow">المدفوعات البريدية المحلية</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--fg)] leading-tight">
                تكامل تام مع بريد الجزائر وتطبيق بريدي موب
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                ندرك في منصة خدمة.dz أهمية توفير وسائل سحب وإيداع سلسة وموثوقة محلياً في الجزائر دون تعقيدات العملات الأجنبية. لذلك تم بناء نظام المحفظة المالي ليتوافق تماماً مع حسابات CCP وBaridiMob الخاصة بك.
              </p>

              {/* Algerian specifics badges grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="card bg-white p-4 text-center rounded-xl border border-[var(--border)]">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-700 flex items-center justify-center mx-auto mb-3">
                    <CheckCircle2 size={20} />
                  </div>
                  <h4 className="font-extrabold text-xs text-[var(--fg)]">سحوبات بريدي موب</h4>
                  <span className="text-[10px] text-[var(--muted)] mt-1 block">خلال ٢٤ - ٤٨ ساعة فقط</span>
                </div>

                <div className="card bg-white p-4 text-center rounded-xl border border-[var(--border)]">
                  <div className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-700 flex items-center justify-center mx-auto mb-3">
                    <Shield size={20} />
                  </div>
                  <h4 className="font-extrabold text-xs text-[var(--fg)]">تأمين CCP / RIP</h4>
                  <span className="text-[10px] text-[var(--muted)] mt-1 block">مطابقة الحساب والاسم</span>
                </div>
              </div>
            </div>

            {/* Localized FAQ Accordion Column */}
            <div className="lg:col-span-7">
              <div className="card bg-white p-6 rounded-2xl border border-[var(--border)] shadow-xs">
                <h3 className="font-extrabold text-sm sm:text-base text-[var(--fg)] border-b border-[var(--border)] pb-3 mb-4 flex items-center gap-2">
                  <HelpCircle className="w-4 text-[var(--accent)]" />
                  <span>الأسئلة الشائعة حول شحن وسحب الرصيد في الجزائر</span>
                </h3>

                <div className="space-y-3">
                  {localPaymentFaqs.map((item, index) => {
                    const isOpen = openLocalFaqIndex === index
                    return (
                      <div key={index} className="border border-[var(--border)] rounded-xl overflow-hidden bg-slate-50/50">
                        <button
                          type="button"
                          onClick={() => setOpenLocalFaqIndex(isOpen ? null : index)}
                          className="w-full px-4 py-3 flex items-center justify-between text-right font-bold text-xs text-[var(--fg)] hover:bg-slate-50 transition-colors cursor-pointer"
                        >
                          <span className="leading-snug pr-2">{item.q}</span>
                          <ChevronDown size={14} className={`text-[var(--muted)] transition-transform duration-300 flex-shrink-0 ${isOpen ? 'rotate-180 text-[var(--accent)]' : ''}`} />
                        </button>
                        <div
                          className="transition-all duration-300 ease-in-out overflow-hidden"
                          style={{
                            maxHeight: isOpen ? '250px' : '0px',
                            borderTop: isOpen ? '1px solid var(--border)' : 'none'
                          }}
                        >
                          <p className="p-4 text-xs text-[var(--muted)] leading-relaxed bg-white font-normal">
                            {item.a}
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
      </section>

      {/* ─── Section 3: Dispute Resolution & Impartial Arbitration ─── */}
      <section className="py-16 max-w-[var(--container)] w-full mx-auto px-6">
        <div className="text-center mb-12">
          <span className="eyebrow">الأمان والتحكيم</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--fg)]">مركز فض النزاعات: حماية عادلة للجميع</h2>
          <p className="text-xs text-[var(--muted)] mt-2 max-w-lg mx-auto leading-relaxed">
            في حالات نادرة من عدم التفاهم أو حدوث خلاف فني حول المخرجات، يوفر خدمة.dz بيئة تحكيم مستقلة ونزيهة تفصل في النزاع خلال وقت وجيز.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* Policy 1: How to raise a dispute */}
          <div className="card bg-white p-6 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-700 flex items-center justify-center mb-4">
                <AlertTriangle size={18} />
              </div>
              <h3 className="font-extrabold text-[15px] text-[var(--fg)] mb-2">تقديم طلب النزاع</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed font-normal">
                إذا تعذر الوصول لحل ودي، يستطيع صاحب العمل أو المستقل الضغط على زر "رفع نزاع" من خيارات العقد الجاري. سيؤدي هذا لتجميد كامل قيمة الضمان فوراً ومنع أي تصرف فيها حتى مراجعة الإدارة.
              </p>
            </div>
            <span className="text-[10px] text-rose-600 font-mono font-bold mt-4">الإجراء: فوري وتلقائي</span>
          </div>

          {/* Policy 2: Impartial evaluation */}
          <div className="card bg-white p-6 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 flex items-center justify-center mb-4">
                <Shield size={18} />
              </div>
              <h3 className="font-extrabold text-[15px] text-[var(--fg)] mb-2">التحقيق والمراجعة النزيهة</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed font-normal">
                يقوم محققونا بالاطلاع على: ١) بنود العقد المتفق عليها، ٢) المحادثات والمستندات والملفات المرفوعة داخل شات المنصة، ٣) جودة ومدى اكتمال التسليمات مقارنة بالشروط. لا ننظر أبداً لاتفاقات تمت خارج شات المنصة.
              </p>
            </div>
            <span className="text-[10px] text-amber-600 font-mono font-bold mt-4">المعيار: الشفافية التامة والحياد</span>
          </div>

          {/* Policy 3: Fair division of funds */}
          <div className="card bg-white p-6 rounded-2xl border border-[var(--border)] shadow-xs flex flex-col justify-between">
            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-700 flex items-center justify-center mb-4">
                <CheckCircle2 size={18} />
              </div>
              <h3 className="font-extrabold text-[15px] text-[var(--fg)] mb-2">تقسيم الميزانية العادل</h3>
              <p className="text-xs text-[var(--muted)] leading-relaxed font-normal">
                بعد دراسة القضية، تصدر اللجنة قراراً بتوزيع ميزانية الضمان بنسب مئوية عادلة طبقاً لحجم الجهد المبذول وجودة ما تم تسليمه فعلياً، أو بإعادة الأموال بالكامل لصاحب العمل في حال عدم التسليم المطلق.
              </p>
            </div>
            <span className="text-[10px] text-emerald-600 font-mono font-bold mt-4">القرار: نهائي ونافذ خلال ٤٨ ساعة</span>
          </div>
        </div>

        {/* Friendly Safety Notice Card */}
        <div className="max-w-2xl mx-auto mt-10 p-5 rounded-2xl bg-slate-50 border border-[var(--border)] flex items-start gap-4">
          <Info size={20} className="text-[var(--accent)] flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-xs text-[var(--fg)]">ملاحظة أمان هامة للغاية:</h4>
            <p className="text-[11px] text-[var(--muted)] leading-relaxed font-normal">
              ٩٧% من مشاريع خدمة.dz تنتهي بنجاح تام وسرور متبادل دون الحاجة لمركز النزاعات. الالتزام بالأمان، وكتابة شروط واضحة، وإبقاء التواصل داخل شات المنصة هو الضمان الحقيقي لتجربة عمل حر استثنائية.
            </p>
          </div>
        </div>
      </section>

      {/* ─── CTA Wallet/Start Section ─── */}
      <section className="pb-16 max-w-[var(--container)] w-full mx-auto px-6">
        <div className="card text-center rounded-3xl p-8 sm:p-12 relative overflow-hidden" style={{ background: 'var(--fg)', color: 'var(--surface)' }}>
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[90px] opacity-20 pointer-events-none" style={{ background: 'var(--accent)' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[90px] opacity-15 pointer-events-none" style={{ background: 'var(--accent)' }} />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">ابدأ العمل الآن وراحة البال ترافقك في كل دينار</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
              سواء كنت صاحب عمل تريد تصميم متجر أو مبرمج جزائري يسعى لتطوير مهاراته، نظام الضمان يحفظ حقوقك ويسهل معاملاتك المالية محلياً.
            </p>

            <div className="flex justify-center gap-4 flex-wrap pt-2">
              {user ? (
                <Link href="/wallet" className="btn btn-accent px-6 py-3 rounded-xl font-bold text-xs sm:text-sm cursor-pointer shadow-xs">
                  زيارة محفظتك المالية
                </Link>
              ) : (
                <>
                  <Link href="/auth/register" className="btn btn-accent px-6 py-3 rounded-xl font-bold text-xs sm:text-sm cursor-pointer shadow-xs">
                    أنشئ حسابك الآمن اليوم
                  </Link>
                  <Link href="/auth/login" className="btn text-white border border-white/20 hover:border-white px-6 py-3 rounded-xl font-bold text-xs sm:text-sm cursor-pointer">
                    تسجيل دخول
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer Section ─── */}
      <footer style={{ paddingBlock: '40px', borderTop: '1px solid var(--border)', background: 'white' }}>
        <div className="max-w-[var(--container)] mx-auto px-6">
          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs"
            style={{ color: 'var(--muted)' }}
          >
            <p>جميع الحقوق محفوظة © {new Date().getFullYear()} خدمة.dz</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-[var(--accent)] transition-colors hover:no-underline">شروط الضمان والتعاقد</Link>
              <Link href="/privacy" className="hover:text-[var(--accent)] transition-colors hover:no-underline">سياسة الخصوصية</Link>
              <Link href="/contact" className="hover:text-[var(--accent)] transition-colors hover:no-underline">مركز المساعدة والدعم</Link>
            </div>
          </div>
        </div>
      </footer>

    </main>
  )
}
