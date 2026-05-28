'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import {
  Briefcase,
  FileText,
  Search,
  Users,
  Coins,
  Shield,
  CheckCircle2,
  AlertTriangle,
  ChevronLeft,
  BookOpen,
  MessageSquare,
  ThumbsUp,
  Info,
  Check,
  X,
  ChevronDown,
  Clock
} from 'lucide-react'

// Step data type definition
interface HiringStep {
  number: string
  title: string
  shortDesc: string
  icon: React.ReactNode
  detailedDesc: string
  timeframe: string
  keyActions: string[]
}

export default function HiringGuidePage() {
  const [user, setUser] = useState<User | null>(null)
  const [activeStep, setActiveStep] = useState<number>(0)
  const [descTab, setDescTab] = useState<'stellar' | 'weak'>('stellar')
  const [openRuleIndex, setOpenRuleIndex] = useState<number | null>(null)

  useEffect(() => {
    // Set dynamic page metadata via document title
    document.title = 'دليل التوظيف والتعاقد | خدمة.dz'

    const checkSession = async () => {
      const { data: { user: sessionUser } } = await supabase.auth.getUser()
      if (sessionUser) {
        setUser(sessionUser)
      }
    }
    checkSession()
  }, [])

  // Interactive Hiring Steps definition
  const hiringSteps: HiringStep[] = [
    {
      number: '٠١',
      title: 'نشر المشروع وتفاصيل العقد',
      shortDesc: 'اكتب متطلباتك وحدد الميزانية والمهارات المتوقعة.',
      icon: <FileText className="w-6 h-6" />,
      detailedDesc: 'ابدأ بكتابة عنوان واضح ومحدد لمشروعك، واشرح المهام المطلوبة بدقة في الوصف. حدد الميزانية التقريبية بالدينار الجزائري (دج) واقترح نطاقاً زمنياً واقعياً للتسليم. يضمن اختيار التصنيف الصحيح (مثل برمجة، تصميم، كتابة) وصول إشعار فورياً للمستقلين المتخصصين في هذا المجال.',
      timeframe: '١٠ - ١٥ دقيقة للتحضير والنشر',
      keyActions: [
        'اختر عنواناً يعكس النتيجة النهائية المرجوة.',
        'حدد المهارات الرئيسية المطلوبة (مثل: React, Photoshop, الترجمة).',
        'اختر ميزانية واقعية تتناسب مع الجهد المبذول.'
      ]
    },
    {
      number: '٠٢',
      title: 'مراجعة العروض واختيار المستقل الأنسب',
      shortDesc: 'استقبل طلبات المستقلين وقارن بين ملفاتهم وأعمالهم السابقة.',
      icon: <Users className="w-6 h-6" />,
      detailedDesc: 'بعد نشر مشروعك، ستبدأ في تلقي عروض مخصصة من المستقلين المهتمين. لا تركز فقط على السعر؛ قم بمراجعة تقييماتهم السابقة، وتصفح معرض أعمالهم (Portfolio)، وابحث عن شارة الحساب الموثق (Verified Badge). يمكنك بدء محادثة فورية مع أي مستقل لمناقشة التفاصيل قبل الاعتماد.',
      timeframe: '١٢ - ٢٤ ساعة كحد أقصى لتلقي عروض ممتازة',
      keyActions: [
        'تحقق من شارة التوثيق والتقييمات السابقة للمستقل.',
        'تصفح معرض الأعمال للتأكد من جودة المشاريع المماثلة.',
        'أجرِ محادثة قصيرة لتحديد مدى سرعة الاستجابة والاحترافية.'
      ]
    },
    {
      number: '٠٣',
      title: 'شحن ميزانية الضمان (Escrow)',
      shortDesc: 'احمِ حقوقك وحقوق المستقل عن طريق تجميد ميزانية المشروع بأمان.',
      icon: <Coins className="w-6 h-6" />,
      detailedDesc: 'بمجرد قبول عرض المستقل، يُطلب منك شحن ميزانية الصفقة أو المرحلة الأولى (Milestone) في نظام الضمان الآمن لدينا. ندعم خيارات الدفع المحلية في الجزائر لتسهيل العملية (تحويل بريدي CCP، تطبيق بريدي موب BaridiMob، أو تحويل بنكي). تظل الأموال مجمدة ومحمية بالكامل لدى المنصة طوال فترة العمل ولا يتم تحريرها للمستقل إلا بموافقتك.',
      timeframe: 'تأكيد تلقائي أو مراجعة سريعة للحوالة خلال ساعتين',
      keyActions: [
        'اختر وسيلة الدفع المحلية الأنسب لك (CCP أو BaridiMob).',
        'اشحن القيمة المحددة بدقة لتجنب أي تأخير في معالجة الحوالة.',
        'تأكد من بدء المستقل للعمل فور ظهور حالة العقد "قيد التنفيذ".'
      ]
    },
    {
      number: '٠٤',
      title: 'استلام المشروع والموافقة والتقييم',
      shortDesc: 'راجع المخرجات النهائية، واعتمد العمل، وقدم تقييمك العادل.',
      icon: <CheckCircle2 className="w-6 h-6" />,
      detailedDesc: 'يقوم المستقل برفع تسليمات العمل الرسمية عبر العقد. ستتلقى إشعاراً لمراجعة المخرجات. لديك الحق الكامل في طلب تعديلات مجانية إذا لم تكن المخرجات مطابقة للشروط. بمجرد رضاك التام عن النتيجة، اضغط على زر "موافقة وتحرير الأموال" ليقوم النظام بتحويل الرصيد فوراً لحساب المستقل، ثم اترك تقييماً يعزز من مصداقية المجتمع.',
      timeframe: 'مراجعة المخرجات وإعطاء الموافقة خلال ٧ أيام كحد أقصى',
      keyActions: [
        'راجع جميع الملفات والتسليمات المرفوعة بدقة.',
        'اطلب التعديلات اللازمة بكل أريحية وموضوعية.',
        'قيّم المستقل بصدق (الاحترافية، المهارة، التواصل، تسليم الوقت).'
      ]
    }
  ]

  // Platform rules accordion definition
  const rules = [
    {
      title: '١. سرية وحصرية المعاملات المالية (نظام الضمان)',
      content: 'يُحظر تماماً سداد أو الاتفاق على سداد مستحقات المستقل خارج منصة خدمة.dz. هذا الإجراء يعرض حسابك للإغلاق الدائم، والأهم من ذلك أنه يحرمك تماماً من أي حماية ماليّة أو إمكانية استرجاع أموالك عبر مركز النزاعات في حال فشل المستقل في تسليم العمل. نظام الضمان يضمن الحماية المطلقة للطرفين.',
      type: 'warning'
    },
    {
      title: '٢. إبقاء جميع نقاشات المشروع داخل المنصة',
      content: 'احرص على ألا تتم محادثات العمل والاتفاقات الجانبية على تطبيقات خارجية مثل WhatsApp أو Telegram. في حال حدوث أي خلاف أو عدم تفاهم، سيقوم فريق التحكيم والإشراف لدينا بمراجعة الشات والمستندات الموجودة داخل عقد المنصة فقط كمصدر رسمي ووحيد للأدلة لفض النزاع بشكل عادل.',
      type: 'important'
    },
    {
      title: '٣. الدقة في تفاصيل ومخرجات التسليم',
      content: 'كلما كانت شروط العقد واضحة وتفصيلية، قلّت نسبة حدوث الخلافات. يرجى تفصيل الملفات المطلوبة، الصيغ (PDF, Figma, Code source)، وتواريخ معالم التسليم بوضوح تام قبل إطلاق المشروع ودفع الضمان.',
      type: 'info'
    },
    {
      title: '٤. ملكية العمل الفكرية الكاملة للمشتري',
      content: 'بمجرد تحرير ميزانية المشروع للمستقل واعتماد التسليم النهائي، تنتقل جميع حقوق الملكية الفكرية وحقوق النشر والاستخدام للملفات والبرمجيات المنتجة إلى صاحب العمل تلقائياً وبشكل كامل، ما لم يتم الاتفاق كتابياً وبشكل صريح على غير ذلك قبل بدء المشروع.',
      type: 'success'
    }
  ]

  return (
    <main className="min-h-screen flex flex-col justify-between" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      
      {/* Fallback SEO markup */}
      <noscript>
        <h1>دليل توظيف المستقلين والعمل الحر في الجزائر - خدمة.dz</h1>
        <p>تعلم كيفية توظيف أفضل الكفاءات والبرمجيات والمصممين في الجزائر، وكتابة أوصاف مشاريع احترافية وشحن الضمان بأمان.</p>
      </noscript>

      {/* ─── Sticky Navigation Header ─── */}
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

          <div className="flex items-center gap-4">
            <Link
              href="/jobs"
              className="hidden sm:inline-block text-xs font-semibold hover:text-[var(--accent)] transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              تصفح المشاريع
            </Link>
            {user ? (
              <Link href="/dashboard" className="btn btn-primary text-xs py-2 px-4">
                لوحة التحكم ←
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

      {/* ─── Hero Onboarding Surface ─── */}
      <section className="relative overflow-hidden py-16 text-center border-b border-[var(--border)]" style={{ background: 'radial-gradient(ellipse at top, rgba(15, 118, 110, 0.05), transparent 70%)' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[var(--accent-soft)] text-[var(--accent)] font-bold text-xs mb-4">
            <BookOpen size={12} />
            <span>دليل التوجيه المتكامل لأصحاب المشاريع</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--fg)] tracking-tight mb-5 leading-tight font-sans">
            من فكرة ملهمة إلى منتج ملموس:<br/>
            <span style={{ color: 'var(--accent)' }}>وظّف بأمان تام واحترافية</span>
          </h1>
          <p className="text-[var(--muted)] text-sm sm:text-base max-w-2xl mx-auto leading-relaxed mb-8">
            مرحباً بك في دليلك الشامل للتوظيف على <span className="font-bold text-[var(--accent)]">خدمة.dz</span>. اكتشف كيف تدير مشاريعك بسلاسة، وتضمن حقك المالي بنسبة 100% عبر نظام الضمان المحلي الخاص بنا، وتصل لأفضل المهارات الجزائرية.
          </p>

          <div className="flex justify-center gap-4 flex-wrap">
            {user ? (
              <Link href="/jobs/new" className="btn btn-accent px-6 py-3 rounded-xl text-sm font-bold shadow-xs">
                انشر مشروعاً جديداً الآن
              </Link>
            ) : (
              <>
                <Link href="/auth/register?role=client" className="btn btn-accent px-6 py-3 rounded-xl text-sm font-bold shadow-xs">
                  سجل كصاحب عمل
                </Link>
                <Link href="/auth/login" className="btn btn-outline px-6 py-3 rounded-xl text-sm font-bold">
                  تسجيل الدخول
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─── Section 1: Dynamic Steps Roadmap ─── */}
      <section className="py-16 max-w-[var(--container)] w-full mx-auto px-6">
        <div className="text-center mb-12">
          <span className="eyebrow">آلية العمل والتوظيف</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--fg)]">مراحل توظيف سلسة وآمنة في 4 خطوات</h2>
          <p className="text-xs text-[var(--muted)] mt-2 max-w-lg mx-auto leading-relaxed">
            اضغط على أي مرحلة من المراحل أدناه للاطلاع على التفاصيل الكاملة، وتوقيت الإجراء، والخطوات العملية لضمان النجاح.
          </p>
        </div>

        {/* Dynamic Timeline Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {hiringSteps.map((step, idx) => {
            const isSelected = activeStep === idx
            return (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveStep(idx)}
                className={`card text-right p-5 relative border transition-all duration-300 cursor-pointer rounded-2xl flex flex-col justify-between h-full group ${
                  isSelected
                    ? 'border-[var(--accent)] ring-2 ring-[var(--accent-soft)] bg-white shadow-md'
                    : 'border-[var(--border)] bg-white hover:border-[var(--accent)]/50 hover:shadow-xs'
                }`}
              >
                {/* Number Badge */}
                <div className="flex justify-between items-start mb-4">
                  <span className={`text-2xl font-mono font-bold transition-colors ${isSelected ? 'text-[var(--accent)]' : 'text-slate-300 group-hover:text-slate-400'}`}>
                    {step.number}
                  </span>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
                    isSelected ? 'bg-[var(--accent)] text-white' : 'bg-slate-50 text-[var(--accent)] group-hover:bg-[var(--accent-soft)]'
                  }`}>
                    {step.icon}
                  </div>
                </div>

                <div>
                  <h3 className={`font-bold text-[15px] mb-2 transition-colors ${isSelected ? 'text-[var(--accent)]' : 'text-[var(--fg)]'}`}>
                    {step.title}
                  </h3>
                  <p className="text-xs text-[var(--muted)] leading-relaxed line-clamp-2">
                    {step.shortDesc}
                  </p>
                </div>

                {/* Selected Indicator Pill */}
                {isSelected && (
                  <span className="absolute bottom-0 right-1/2 translate-x-1/2 translate-y-1/2 w-6 h-1 rounded-full bg-[var(--accent)]" />
                )}
              </button>
            )
          })}
        </div>

        {/* Detailed Container Block for Selected Step */}
        <div className="bg-white border border-[var(--border)] rounded-2xl p-6 sm:p-8 shadow-xs transition-all duration-500 relative overflow-hidden animate-fadeIn">
          {/* Decorative Corner Glow */}
          <div className="absolute top-0 left-0 w-32 h-32 rounded-br-full bg-[var(--accent-soft)] opacity-20 pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start relative z-10">
            {/* Step summary side */}
            <div className="lg:col-span-7 space-y-4">
              <div className="flex items-center gap-3">
                <span className="text-sm font-mono font-extrabold text-[var(--accent)] bg-[var(--accent-soft)] px-3 py-1 rounded-lg">
                  المرحلة {hiringSteps[activeStep].number}
                </span>
                <span className="text-xs text-[var(--muted)] flex items-center gap-1 font-medium">
                  <Clock size={12} className="text-[var(--accent)]" />
                  المدة المتوقعة: {hiringSteps[activeStep].timeframe}
                </span>
              </div>

              <h3 className="text-xl font-extrabold text-[var(--fg)]">
                {hiringSteps[activeStep].title}
              </h3>
              
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed font-normal">
                {hiringSteps[activeStep].detailedDesc}
              </p>
            </div>

            {/* Step Checklists actions side */}
            <div className="lg:col-span-5 bg-slate-50/70 border border-[var(--border)]/70 rounded-xl p-5">
              <h4 className="font-bold text-xs text-[var(--fg)] mb-3 flex items-center gap-2 pb-2 border-b border-[var(--border)]">
                <CheckCircle2 size={14} className="text-[var(--accent)]" />
                <span>نصائح عملية وإجراءات مطلوبة منك:</span>
              </h4>
              <ul className="space-y-2.5">
                {hiringSteps[activeStep].keyActions.map((action, actionIdx) => (
                  <li key={actionIdx} className="text-xs text-[var(--fg)] flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-[var(--accent)] mt-2 flex-shrink-0" />
                    <span>{action}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 2: Writing Stellar Descriptions (Do's & Don'ts Simulator) ─── */}
      <section className="py-16 border-t border-b border-[var(--border)]" style={{ background: 'color-mix(in oklch, var(--accent) 2%, var(--bg))' }}>
        <div className="max-w-[var(--container)] w-full mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            {/* Context Left Column */}
            <div className="lg:col-span-5 space-y-5">
              <span className="eyebrow">جذب أفضل العروض</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--fg)] leading-tight">
                كيف تكتب متطلبات مشروعك لتجذب كبار المحترفين؟
              </h2>
              <p className="text-xs sm:text-sm text-[var(--muted)] leading-relaxed">
                سر النجاح لأي مشروع يكمن في كتابة وصف واضح ودقيق. المستقل المحترف يبحث دائماً عن المشاريع التي تبين الجدية، وتفصّل التسليمات، وتحدد نطاقاً واقعياً. 
              </p>
              
              {/* Best tips list card */}
              <div className="card bg-white p-5 space-y-3 rounded-2xl border border-[var(--border)] shadow-xs">
                <h4 className="font-bold text-xs text-[var(--fg)]">💡 القواعد الذهبية الأربعة للوصف الناجح:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div className="flex gap-2 items-start">
                    <Check size={14} className="text-emerald-600 mt-1 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[var(--fg)] block">الوضوح التام</span>
                      <span className="text-[11px] text-[var(--muted)]">تحديد الهدف النهائي للمشروع بوضوح.</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Check size={14} className="text-emerald-600 mt-1 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[var(--fg)] block">التكنولوجيا المطلوبة</span>
                      <span className="text-[11px] text-[var(--muted)]">مثل Figma، Laravel، Excel.</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Check size={14} className="text-emerald-600 mt-1 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[var(--fg)] block">قائمة التسليمات</span>
                      <span className="text-[11px] text-[var(--muted)]">ما هي الملفات الدقيقة المطلوبة؟</span>
                    </div>
                  </div>
                  <div className="flex gap-2 items-start">
                    <Check size={14} className="text-emerald-600 mt-1 flex-shrink-0" />
                    <div>
                      <span className="text-xs font-bold text-[var(--fg)] block">تواصل آمن بالمنصة</span>
                      <span className="text-[11px] text-[var(--muted)]">لحفظ حقوقك وسير العمل المالي.</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Interactive Simulator Card Right Column */}
            <div className="lg:col-span-7">
              <div className="card bg-white rounded-2xl border border-[var(--border)] shadow-xs p-6 overflow-hidden">
                
                {/* Switcher Header */}
                <div className="flex justify-between items-center pb-4 border-b border-[var(--border)] mb-5">
                  <h3 className="font-extrabold text-sm sm:text-base text-[var(--fg)]">محاكي مقارنة وصف المشروع</h3>
                  <div className="flex gap-1 bg-slate-100 p-1 rounded-xl">
                    <button
                      type="button"
                      onClick={() => setDescTab('stellar')}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                        descTab === 'stellar'
                          ? 'bg-[var(--accent)] text-white shadow-xs'
                          : 'text-[var(--muted)] hover:text-[var(--fg)]'
                      }`}
                    >
                      مثال احترافي وممتاز ✅
                    </button>
                    <button
                      type="button"
                      onClick={() => setDescTab('weak')}
                      className={`text-[11px] font-bold px-3 py-1.5 rounded-lg cursor-pointer transition-all ${
                        descTab === 'weak'
                          ? 'bg-rose-600 text-white shadow-xs'
                          : 'text-[var(--muted)] hover:text-[var(--fg)]'
                      }`}
                    >
                      مثال ضعيف ومرفوض ❌
                    </button>
                  </div>
                </div>

                {/* Simulator Content Area */}
                <div className="space-y-4">
                  {descTab === 'stellar' ? (
                    <div className="space-y-4 animate-fadeIn">
                      <div>
                        <span className="text-[11px] text-[var(--muted)] font-mono block">عنوان المشروع المقترح:</span>
                        <h4 className="font-bold text-sm text-[var(--fg)] bg-slate-50 px-3 py-2 rounded-lg border border-[var(--border)] mt-1">
                          تصميم واجهة مستخدم لمتجر بيع تمور جزائرية بالتجزئة (Figma - 6 صفحات)
                        </h4>
                      </div>

                      <div>
                        <span className="text-[11px] text-[var(--muted)] font-mono block">نص وصف المشروع:</span>
                        <div className="text-[11px] sm:text-xs text-slate-700 bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-lg leading-relaxed space-y-2">
                          <p>نحن شركة جزائرية ناشئة متخصصة في تسويق التمور الفاخرة محلياً ودولياً. نبحث عن مصمم واجهات مستخدم (UI/UX) ذو خبرة لتصميم واجهات متجرنا الإلكتروني الجديد على الويب.</p>
                          <p className="font-bold text-[var(--accent)]">المطلوب تصميمه:</p>
                          <p>١. صفحة رئيسية جذابة تعكس الهوية الجزائرية العريقة للمنتج.<br/>
                             ٢. صفحة استعراض المنتجات وفلاتر التصفية.<br/>
                             ٣. صفحة تفاصيل المنتج وسلة المشتريات والدفع السريع.</p>
                          <p className="font-bold text-[var(--accent)]">الشروط والأدوات المرجوة:</p>
                          <p>- استخدام برنامج Figma بشكل حصري لتسليم ملف العمل المنظم.<br/>
                             - الالتزام بهويتنا البصرية الحالية (مرفق شعار الشركة والألوان المعتمدة).<br/>
                             - تسليم التصميم متجاوباً بالكامل مع الهواتف الذكية وأجهزة الحاسوب.</p>
                        </div>
                      </div>

                      {/* Why it is stellar box */}
                      <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-800 flex items-start gap-2.5">
                        <CheckCircle2 size={16} className="text-emerald-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold text-[11px] text-emerald-950">لماذا يعتبر هذا الوصف مثالياً؟</h5>
                          <p className="text-[10px] text-emerald-900 leading-relaxed mt-0.5">
                            يحدد الهوية وصاحب المشروع، يفصل المهام بدقة، يذكر التكنولوجيا بوضوح (Figma)، ويشرح المطلوب تسليمه والعدد بدقة (6 صفحات متجاوبة). هذا سيجلب عروضاً فائقة الجودة من مستقلين جادين.
                          </p>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 animate-fadeIn">
                      <div>
                        <span className="text-[11px] text-[var(--muted)] font-mono block">عنوان المشروع المقترح:</span>
                        <h4 className="font-bold text-sm text-[var(--fg)] bg-slate-50 px-3 py-2 rounded-lg border border-[var(--border)] mt-1">
                          تصميم موقع
                        </h4>
                      </div>

                      <div>
                        <span className="text-[11px] text-[var(--muted)] font-mono block">نص وصف المشروع:</span>
                        <div className="text-[11px] sm:text-xs text-slate-700 bg-rose-500/5 border border-rose-500/20 p-4 rounded-lg leading-relaxed space-y-2">
                          <p>مرحباً، أريد مصمم محترف يصمم لي موقع إلكتروني بأسرع وقت ممكن وبأقل تكلفة. تواصلوا معي على الواتساب على الرقم التالي: +2130000000 للاتفاق السريع وشرح بقية الفكرة.</p>
                        </div>
                      </div>

                      {/* Why it is weak box */}
                      <div className="p-3 bg-rose-500/10 rounded-xl text-rose-800 flex items-start gap-2.5">
                        <AlertTriangle size={16} className="text-rose-600 flex-shrink-0 mt-0.5" />
                        <div>
                          <h5 className="font-bold text-[11px] text-rose-950">لماذا يعتبر هذا الوصف ضعيفاً ومرفوضاً؟</h5>
                          <p className="text-[10px] text-rose-900 leading-relaxed mt-0.5">
                            لا توجد أي تفاصيل فنية، العنوان مبهم للغاية (تصميم موقع!)، لم يحدد نوع المنصة أو الهدف. والأخطر من ذلك هو طلب التواصل والدفع خارج المنصة (WhatsApp)، وهو مخالفة صارخة لسياسات المنصة تعرض حسابك للتعليق الفوري وتفقد حقوق الحماية.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── Section 3: Rules & Best Practices (Expandable Accordion) ─── */}
      <section className="py-16 max-w-[var(--container)] w-full mx-auto px-6">
        <div className="text-center mb-12">
          <span className="eyebrow">القوانين والثقة والأمان</span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-[var(--fg)]">قواعد التواصل وسياسات الضمان المالي</h2>
          <p className="text-xs text-[var(--muted)] mt-2 max-w-lg mx-auto leading-relaxed">
            للحفاظ على تجربة مستخدم آمنة وخالية من النزاعات، يلتزم جميع أصحاب المشاريع والشركات المسجلة بالقواعد المنظمة للعمل الحر على منصة خدمة.dz.
          </p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3.5">
          {rules.map((rule, idx) => {
            const isOpen = openRuleIndex === idx
            
            // Determine border and background based on severity
            let statusStyles = 'border-slate-200 bg-white'
            let iconColor = 'text-[var(--accent)]'
            
            if (rule.type === 'warning') {
              statusStyles = 'border-rose-200 bg-rose-50/10'
              iconColor = 'text-rose-600'
            } else if (rule.type === 'important') {
              statusStyles = 'border-amber-200 bg-amber-50/10'
              iconColor = 'text-amber-600'
            } else if (rule.type === 'success') {
              statusStyles = 'border-emerald-200 bg-emerald-50/10'
              iconColor = 'text-emerald-600'
            }

            return (
              <div
                key={idx}
                className={`border rounded-2xl overflow-hidden transition-all duration-300 ${statusStyles} ${isOpen ? 'shadow-xs' : ''}`}
              >
                <button
                  type="button"
                  onClick={() => setOpenRuleIndex(isOpen ? null : idx)}
                  className="w-full px-5 py-4 flex items-center justify-between text-right font-bold text-xs sm:text-sm text-[var(--fg)] hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <Info size={16} className={`${iconColor} flex-shrink-0`} />
                    <span className="leading-snug">{rule.title}</span>
                  </div>
                  <ChevronDown
                    size={16}
                    className={`text-[var(--muted)] transition-transform duration-300 flex-shrink-0 ${
                      isOpen ? 'rotate-180 text-[var(--accent)]' : ''
                    }`}
                  />
                </button>
                <div
                  className="transition-all duration-300 ease-in-out overflow-hidden"
                  style={{
                    maxHeight: isOpen ? '200px' : '0px',
                    borderTop: isOpen ? '1px solid var(--border)' : 'none'
                  }}
                >
                  <p className="p-5 text-xs text-[var(--muted)] leading-relaxed bg-white/80">
                    {rule.content}
                  </p>
                </div>
              </div>
            )
          })}
        </div>
      </section>

      {/* ─── CTA Client Engagement Section ─── */}
      <section className="pb-16 max-w-[var(--container)] w-full mx-auto px-6">
        <div className="card text-center rounded-3xl p-8 sm:p-12 relative overflow-hidden" style={{ background: 'var(--fg)', color: 'var(--surface)' }}>
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full blur-[90px] opacity-20 pointer-events-none" style={{ background: 'var(--accent)' }} />
          <div className="absolute bottom-0 left-0 w-64 h-64 rounded-full blur-[90px] opacity-15 pointer-events-none" style={{ background: 'var(--accent)' }} />

          <div className="relative z-10 max-w-2xl mx-auto space-y-6">
            <h3 className="text-xl sm:text-2xl font-extrabold text-white">هل أنت مستعد لنشر أول مشاريعك وتجربة الدفع الآمن؟</h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl mx-auto">
              نوفر لك مجتمعاً من آلاف المستقلين الجزائريين في شتى المجالات المهنية والتقنية. انضم إلينا اليوم، وابدأ التوظيف بثقة وأمان تامين.
            </p>

            <div className="flex justify-center gap-4 flex-wrap pt-2">
              {user ? (
                <Link href="/jobs/new" className="btn btn-accent px-6 py-3 rounded-xl font-bold text-xs sm:text-sm cursor-pointer shadow-xs">
                  أضف مشروعاً جديداً الآن
                </Link>
              ) : (
                <>
                  <Link href="/auth/register?role=client" className="btn btn-accent px-6 py-3 rounded-xl font-bold text-xs sm:text-sm cursor-pointer shadow-xs">
                    أنشئ حساب صاحب عمل
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

      {/* ─── Footer Surface ─── */}
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
              <Link href="/contact" className="hover:text-[var(--accent)] transition-colors hover:no-underline">الدعم الفني والاتصال</Link>
            </div>
          </div>
        </div>
      </footer>

    </main>
  )
}
