import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { Metadata } from 'next'
import {
  Shield,
  Monitor,
  Users,
  Search,
  FileText,
  Lock,
  CheckCircle2,
  ArrowLeft,
  Briefcase,
  Palette,
  PenTool,
  Film,
  Megaphone,
  Lightbulb,
  Star,
  ChevronLeft,
} from 'lucide-react'

export const metadata: Metadata = {
  title: 'خدمة.dz | أكبر منصة للعمل الحر في الجزائر',
  description: 'وظّف أفضل المستقلين الجزائريين أو ابدأ عملك الحر. منصة خدمة.dz توفر نظام ضمان مالي متكامل لحماية حقوق الطرفين بأسعار تنافسية وطرق دفع محلية.',
  keywords: 'عمل حر، مستقلين، الجزائر، برمجة، تصميم، كتابة، تسويق، منصة عمل حر جزائرية، بريدي موب، خدمة.dz',
}

function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) {
    const hours = Math.floor(diff / 3600000)
    if (hours === 0) return 'منذ لحظات'
    return `منذ ${hours} ساعة`
  }
  if (days === 1) return 'أمس'
  return `منذ ${days} يوم`
}

const categoryIcons: Record<string, React.ReactNode> = {
  'برمجة وتطوير': <Monitor className="w-6 h-6" />,
  'تصميم جرافيك': <Palette className="w-6 h-6" />,
  'ترجمة وكتابة': <PenTool className="w-6 h-6" />,
  'مونتاج وفيديو': <Film className="w-6 h-6" />,
  'تسويق رقمي': <Megaphone className="w-6 h-6" />,
  'استشارات': <Lightbulb className="w-6 h-6" />,
}

export default async function Home() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Fetch latest open jobs
  const { data: latestJobs } = await supabase
    .from('jobs')
    .select(`
      id,
      title,
      category,
      budget_min,
      budget_max,
      created_at,
      profiles:client_id(full_name, username)
    `)
    .eq('status', 'open')
    .order('created_at', { ascending: false })
    .limit(6)

  // Fetch accurate category counts
  const categoryTemplates = [
    { name: 'برمجة وتطوير' },
    { name: 'تصميم جرافيك' },
    { name: 'ترجمة وكتابة' },
    { name: 'مونتاج وفيديو' },
    { name: 'تسويق رقمي' },
    { name: 'استشارات' },
  ]

  const categoryPromises = categoryTemplates.map(async (cat) => {
    const { count } = await supabase
      .from('jobs')
      .select('id', { count: 'exact', head: true })
      .eq('category', cat.name)
      .eq('status', 'open')
    return { ...cat, count: count || 0 }
  })

  const categories = await Promise.all(categoryPromises)

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      {/* ─── Sticky Navigation ─── */}
      <header className="topnav">
        <div className="max-w-[var(--container)] mx-auto px-6 flex items-center justify-between h-[72px]">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <span
              className="text-[22px] font-bold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)' }}
            >
              خدمة<span style={{ color: 'var(--accent)' }}>.dz</span>
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/jobs"
              className="text-[14px] font-medium transition-colors duration-200 hover:text-[var(--fg)]"
              style={{ color: 'var(--muted)' }}
            >
              تصفح المشاريع
            </Link>
            <Link
              href="/jobs"
              className="text-[14px] font-medium transition-colors duration-200 hover:text-[var(--fg)]"
              style={{ color: 'var(--muted)' }}
            >
              ابحث عن مستقل
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            {user ? (
              <Link href="/dashboard" className="btn btn-primary">
                لوحة التحكم
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="btn btn-outline"
                >
                  دخول
                </Link>
                <Link
                  href="/auth/register"
                  className="btn btn-primary"
                >
                  حساب جديد
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ─── Hero Section ─── */}
      <section className="text-center" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
        <div className="max-w-[var(--container)] mx-auto px-6">
          <span className="eyebrow">منصة العمل الحر الرائدة في الجزائر</span>
          <h1
            className="mb-6 leading-[1.1]"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h1)',
              letterSpacing: '-0.02em',
              color: 'var(--fg)',
            }}
          >
            وظّف الأفضل.
            <br />
            <span style={{ color: 'var(--accent)' }}>حقّق المستحيل.</span>
          </h1>
          <p
            className="mx-auto mb-10"
            style={{
              fontSize: 'var(--fs-lead)',
              color: 'var(--muted)',
              maxWidth: '55ch',
              lineHeight: '1.7',
            }}
          >
            منصة متميزة تجمع المستقلين المحترفين وأصحاب المشاريع الطموحين.
            نضمن الجودة والتنوع والمصداقية في كل عقد.
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            {user ? (
              <Link href="/dashboard" className="btn btn-primary" style={{ fontSize: '16px', padding: '14px 32px' }}>
                الذهاب للوحة التحكم
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/register?role=client"
                  className="btn btn-primary"
                  style={{ fontSize: '16px', padding: '14px 32px' }}
                >
                  <FileText className="w-4 h-4" />
                  انشر مشروعاً
                </Link>
                <Link
                  href="/jobs"
                  className="btn btn-outline"
                  style={{ fontSize: '16px', padding: '14px 32px' }}
                >
                  <Search className="w-4 h-4" />
                  تصفح المشاريع
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* ─── Trust Logos Bar ─── */}
      <section style={{ paddingBlock: 'var(--gap-xl)' }}>
        <div
          className="max-w-[var(--container)] mx-auto px-6 text-center"
          style={{ borderBottom: '1px solid var(--border)', paddingBottom: '60px' }}
        >
          <p
            className="mb-8 uppercase tracking-widest"
            style={{ fontSize: '14px', color: 'var(--muted)', letterSpacing: '0.1em' }}
          >
            موثوق من فرق عالية الأداء
          </p>
          <div
            className="flex justify-center gap-16 flex-wrap"
            style={{ opacity: 0.35, filter: 'grayscale(1)' }}
          >
            <span className="text-xl font-extrabold">SONATRACH</span>
            <span className="text-xl font-extrabold">DJEZZY</span>
            <span className="text-xl font-extrabold">MOBILIS</span>
            <span className="text-xl font-extrabold">CEVITAL</span>
          </div>
        </div>
      </section>

      {/* ─── How It Works (Values) ─── */}
      <section style={{ paddingBlock: 'var(--gap-2xl)' }}>
        <div className="max-w-[var(--container)] mx-auto px-6">
          <div className="mb-16" style={{ maxWidth: '600px' }}>
            <span className="eyebrow">قيمنا</span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                letterSpacing: '-0.01em',
                lineHeight: '1.2',
              }}
            >
              الجودة أولاً.
              <br />
              المصداقية مضمونة.
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="feature-card">
              <div className="icon-box mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3>كفاءات معتمدة</h3>
              <p>كل مستقل في منصتنا يخضع لعملية فحص دقيقة متعددة المراحل لضمان التميز التقني والمصداقية المهنية.</p>
            </div>
            <div className="feature-card">
              <div className="icon-box mb-6">
                <Monitor className="w-6 h-6" />
              </div>
              <h3>سير عمل سلس</h3>
              <p>من المدفوعات القائمة على المعالم إلى أدوات التواصل المتكاملة، نوفر كل ما تحتاجه لإدارة مشاريعك بفعالية.</p>
            </div>
            <div className="feature-card">
              <div className="icon-box mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3>خبرات متنوعة</h3>
              <p>وصول إلى مجموعة كبيرة من الخبراء في البرمجة والتصميم والتسويق والاستشارات. التنوع هو قوتنا.</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ─── */}
      <section style={{ background: 'var(--fg)', color: 'var(--surface)', paddingBlock: '80px' }}>
        <div className="max-w-[var(--container)] mx-auto px-6 grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="text-center">
            <span
              className="block mb-2"
              style={{ fontFamily: 'var(--font-display)', fontSize: '56px', fontWeight: 600 }}
            >
              +1000
            </span>
            <span
              className="uppercase"
              style={{ fontSize: '14px', letterSpacing: '0.1em', color: 'var(--muted)' }}
            >
              مستقل معتمد
            </span>
          </div>
          <div className="text-center">
            <span
              className="block mb-2"
              style={{ fontFamily: 'var(--font-display)', fontSize: '56px', fontWeight: 600 }}
            >
              +5000
            </span>
            <span
              className="uppercase"
              style={{ fontSize: '14px', letterSpacing: '0.1em', color: 'var(--muted)' }}
            >
              مشروع مكتمل
            </span>
          </div>
          <div className="text-center">
            <span
              className="block mb-2"
              style={{ fontFamily: 'var(--font-display)', fontSize: '56px', fontWeight: 600 }}
            >
              98%
            </span>
            <span
              className="uppercase"
              style={{ fontSize: '14px', letterSpacing: '0.1em', color: 'var(--muted)' }}
            >
              رضا العملاء
            </span>
          </div>
        </div>
      </section>

      {/* ─── Categories Grid ─── */}
      <section style={{ paddingBlock: 'var(--gap-2xl)' }}>
        <div className="max-w-[var(--container)] mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-12">
            <div>
              <span className="eyebrow">التصنيفات</span>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--fs-h2)',
                  letterSpacing: '-0.01em',
                }}
              >
                تصفح حسب التصنيف
              </h2>
            </div>
            <Link
              href="/jobs"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              عرض كل المشاريع
              <ChevronLeft className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.name}
                href={`/jobs?category=${cat.name}`}
                className="group text-center p-6 rounded-2xl border transition-all duration-200 hover:shadow-md"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'var(--border)',
                }}
              >
                <div
                  className="w-14 h-14 rounded-xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform"
                  style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                >
                  {categoryIcons[cat.name] || <Briefcase className="w-6 h-6" />}
                </div>
                <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--fg)' }}>{cat.name}</h3>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>{cat.count} مشروع مفتوح</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Latest Jobs ─── */}
      <section style={{ paddingBlock: 'var(--gap-2xl)', background: 'color-mix(in oklch, var(--accent) 4%, var(--bg))' }}>
        <div className="max-w-[var(--container)] mx-auto px-6">
          <div className="text-center mb-12">
            <span className="eyebrow">فرص جديدة</span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                letterSpacing: '-0.01em',
              }}
            >
              أحدث المشاريع المتاحة
            </h2>
            <p className="mt-3" style={{ color: 'var(--muted)', fontSize: 'var(--fs-body)' }}>
              فرص عمل جديدة تضاف يومياً
            </p>
          </div>

          {latestJobs && latestJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestJobs.map((job: any) => (
                <Link
                  key={job.id}
                  href={`/jobs/${job.id}`}
                  className="group flex flex-col h-full p-6 rounded-2xl border transition-all duration-200 hover:shadow-lg"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="flex justify-between items-start mb-4">
                    <span
                      className="text-xs font-semibold px-3 py-1 rounded-lg"
                      style={{ background: 'var(--bg)', color: 'var(--muted)', border: '1px solid var(--border)' }}
                    >
                      {job.category}
                    </span>
                    <span
                      className="font-bold text-sm px-3 py-1 rounded-lg"
                      style={{ background: 'var(--accent-soft)', color: 'var(--accent)' }}
                    >
                      {job.budget_min} - {job.budget_max} دج
                    </span>
                  </div>
                  <h3
                    className="font-bold text-lg mb-2 leading-snug line-clamp-2 transition-colors"
                    style={{ color: 'var(--fg)' }}
                  >
                    {job.title}
                  </h3>
                  <div
                    className="mt-auto pt-4 flex items-center justify-between"
                    style={{ borderTop: '1px solid var(--border)' }}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className="avatar text-xs"
                        style={{ width: '28px', height: '28px', background: 'var(--accent-soft)', color: 'var(--accent)' }}
                      >
                        {job.profiles?.full_name?.charAt(0) || job.profiles?.username?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium truncate max-w-[100px]" style={{ color: 'var(--fg)' }}>
                        {job.profiles?.full_name || job.profiles?.username}
                      </span>
                    </div>
                    <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
                      {timeAgo(job.created_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div
              className="text-center py-10 rounded-2xl border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <p style={{ color: 'var(--muted)' }}>لا توجد مشاريع مفتوحة حالياً.</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/jobs" className="btn btn-outline" style={{ padding: '14px 32px' }}>
              <Search className="w-4 h-4" />
              تصفح المزيد من المشاريع
            </Link>
          </div>
        </div>
      </section>

      {/* ─── CTA Banner ─── */}
      <section style={{ paddingBlock: 'var(--gap-2xl)' }}>
        <div className="max-w-[var(--container)] mx-auto px-6">
          <div
            className="text-center rounded-2xl overflow-hidden relative"
            style={{ background: 'var(--accent)', color: 'var(--surface)', padding: '80px 40px' }}
          >
            {/* Radial glow effect */}
            <div
              className="absolute top-0 right-0 w-64 h-64 rounded-full blur-[80px] opacity-30"
              style={{ background: 'white' }}
            />
            <div
              className="absolute bottom-0 left-0 w-48 h-48 rounded-full blur-[60px] opacity-20"
              style={{ background: 'white' }}
            />

            <div className="relative z-10">
              <h2
                className="mb-4"
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--fs-h2)',
                  color: 'var(--surface)',
                }}
              >
                مستعد لتحويل قوة عملك؟
              </h2>
              <p
                className="mx-auto mb-8"
                style={{ maxWidth: '50ch', opacity: 0.9, fontSize: 'var(--fs-lead)', lineHeight: '1.7' }}
              >
                انضم إلى آلاف الشركات التي توظف أفضل الكفاءات اليوم.
              </p>

              {!user && (
                <div className="flex justify-center gap-4 flex-wrap">
                  <Link
                    href="/auth/register"
                    className="btn"
                    style={{ background: 'var(--surface)', color: 'var(--accent)', fontWeight: 700 }}
                  >
                    إنشاء حساب
                  </Link>
                  <Link
                    href="/jobs"
                    className="btn"
                    style={{
                      background: 'transparent',
                      color: 'white',
                      borderColor: 'rgba(255,255,255,0.3)',
                      borderWidth: '1px',
                    }}
                  >
                    تصفح المشاريع
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer style={{ paddingBlock: '60px', borderTop: '1px solid var(--border)' }}>
        <div className="max-w-[var(--container)] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <span
                  className="text-xl font-bold"
                  style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)' }}
                >
                  خدمة<span style={{ color: 'var(--accent)' }}>.dz</span>
                </span>
              </Link>
              <p
                className="max-w-sm leading-relaxed"
                style={{ color: 'var(--muted)', fontSize: '14px' }}
              >
                المنصة الجزائرية الأولى التي تجمع بين الكفاءات المحلية وأصحاب المشاريع بنظام دفع آمن 100%.
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4" style={{ color: 'var(--fg)' }}>للمستقلين</h4>
              <ul className="space-y-3 text-sm" style={{ color: 'var(--muted)' }}>
                <li><Link href="/jobs" className="hover:text-[var(--accent)] transition-colors">تصفح المشاريع</Link></li>
                <li><Link href="/auth/register?role=freelancer" className="hover:text-[var(--accent)] transition-colors">إنشاء حساب</Link></li>
                <li><Link href="/terms" className="hover:text-[var(--accent)] transition-colors">نظام الضمان</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4" style={{ color: 'var(--fg)' }}>لأصحاب العمل</h4>
              <ul className="space-y-3 text-sm" style={{ color: 'var(--muted)' }}>
                <li><Link href="/auth/register?role=client" className="hover:text-[var(--accent)] transition-colors">نشر مشروع</Link></li>
                <li><Link href="/jobs" className="hover:text-[var(--accent)] transition-colors">كيفية التوظيف</Link></li>
                <li><Link href="/terms" className="hover:text-[var(--accent)] transition-colors">الدفع الآمن</Link></li>
              </ul>
            </div>
          </div>

          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderTop: '1px solid var(--border)', paddingTop: '32px', fontSize: '14px', color: 'var(--muted)' }}
          >
            <p>جميع الحقوق محفوظة © {new Date().getFullYear()} خدمة.dz</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-[var(--accent)] transition-colors">شروط الاستخدام</Link>
              <Link href="/privacy" className="hover:text-[var(--accent)] transition-colors">سياسة الخصوصية</Link>
              <Link href="/terms" className="hover:text-[var(--accent)] transition-colors">الثقة والأمان</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
