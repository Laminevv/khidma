'use client'

import Link from 'next/link'
import { useTranslation } from 'react-i18next'
import '@/lib/i18n'
import Navbar from './components/Navbar'
import {
  Shield,
  Monitor,
  Users,
  Search,
  FileText,
  Lock,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Briefcase,
  Palette,
  PenTool,
  Film,
  Megaphone,
  Lightbulb,
  Star,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'

interface JobData {
  id: string
  title: string
  category: string
  budget_min: number
  budget_max: number
  created_at: string
  profiles: { full_name: string; username: string }[] | null
}

interface CategoryData {
  name: string
  key: string
  count: number
}

interface HomeContentProps {
  user: { id: string } | null
  latestJobs: JobData[] | null
  categories: CategoryData[]
}

const categoryIcons: Record<string, React.ReactNode> = {
  development: <Monitor className="w-6 h-6" />,
  design: <Palette className="w-6 h-6" />,
  writing: <PenTool className="w-6 h-6" />,
  video: <Film className="w-6 h-6" />,
  marketing: <Megaphone className="w-6 h-6" />,
  consulting: <Lightbulb className="w-6 h-6" />,
}

export default function HomeContent({ user, latestJobs, categories }: HomeContentProps) {
  const { t, i18n } = useTranslation()
  const isRtl = i18n.language === 'ar'
  const DirectionChevron = isRtl ? ChevronLeft : ChevronRight
  const DirectionArrow = isRtl ? ArrowLeft : ArrowRight

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) {
      const hours = Math.floor(diff / 3600000)
      if (hours === 0) return t('home.time.justNow')
      return t('home.time.hoursAgo', { count: hours })
    }
    if (days === 1) return t('home.time.yesterday')
    return t('home.time.daysAgo', { count: days })
  }

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)', color: 'var(--fg)' }}>
      {/* ─── Sticky Navigation ─── */}
      <Navbar user={user} />

      {/* ─── Hero Section ─── */}
      <section className="text-center" style={{ paddingTop: '100px', paddingBottom: '100px' }}>
        <div className="max-w-[var(--container)] mx-auto px-6">
          <span className="eyebrow">{t('home.hero.eyebrow')}</span>
          <h1
            className="mb-6 leading-[1.1]"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--fs-h1)',
              letterSpacing: '-0.02em',
              color: 'var(--fg)',
            }}
          >
            {t('home.hero.headlineMain')}
            <br />
            <span style={{ color: 'var(--accent)' }}>{t('home.hero.headlineAccent')}</span>
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
            {t('home.hero.subtitle')}
          </p>
          <div className="flex justify-center gap-4 flex-wrap">
            {user ? (
              <Link href="/dashboard" className="btn btn-primary" style={{ fontSize: '16px', padding: '14px 32px' }}>
                {t('home.hero.ctaDashboard')}
              </Link>
            ) : (
              <>
                <Link
                  href="/auth/register?role=client"
                  className="btn btn-primary"
                  style={{ fontSize: '16px', padding: '14px 32px' }}
                >
                  <FileText className="w-4 h-4" />
                  {t('home.hero.ctaPostProject')}
                </Link>
                <Link
                  href="/jobs"
                  className="btn btn-outline"
                  style={{ fontSize: '16px', padding: '14px 32px' }}
                >
                  <Search className="w-4 h-4" />
                  {t('home.hero.ctaBrowse')}
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
            {t('home.trust.label')}
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
            <span className="eyebrow">{t('home.values.eyebrow')}</span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                letterSpacing: '-0.01em',
                lineHeight: '1.2',
              }}
            >
              {t('home.values.headlineMain')}
              <br />
              {t('home.values.headlineAccent')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <div className="feature-card">
              <div className="icon-box mb-6">
                <Shield className="w-6 h-6" />
              </div>
              <h3>{t('home.values.vetted.title')}</h3>
              <p>{t('home.values.vetted.description')}</p>
            </div>
            <div className="feature-card">
              <div className="icon-box mb-6">
                <Monitor className="w-6 h-6" />
              </div>
              <h3>{t('home.values.workflow.title')}</h3>
              <p>{t('home.values.workflow.description')}</p>
            </div>
            <div className="feature-card">
              <div className="icon-box mb-6">
                <Users className="w-6 h-6" />
              </div>
              <h3>{t('home.values.diverse.title')}</h3>
              <p>{t('home.values.diverse.description')}</p>
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
              {t('home.stats.freelancers')}
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
              {t('home.stats.projects')}
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
              {t('home.stats.satisfaction')}
            </span>
          </div>
        </div>
      </section>

      {/* ─── Categories Grid ─── */}
      <section style={{ paddingBlock: 'var(--gap-2xl)' }}>
        <div className="max-w-[var(--container)] mx-auto px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-12">
            <div>
              <span className="eyebrow">{t('home.categories.eyebrow')}</span>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--fs-h2)',
                  letterSpacing: '-0.01em',
                }}
              >
                {t('home.categories.title')}
              </h2>
            </div>
            <Link
              href="/jobs"
              className="hidden sm:inline-flex items-center gap-2 text-sm font-semibold transition-colors"
              style={{ color: 'var(--accent)' }}
            >
              {t('home.categories.viewAll')}
              <DirectionChevron className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link
                key={cat.key}
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
                  {categoryIcons[cat.key] || <Briefcase className="w-6 h-6" />}
                </div>
                <h3 className="font-bold text-sm mb-1" style={{ color: 'var(--fg)' }}>
                  {t(`home.categories.${cat.key}`)}
                </h3>
                <p className="text-xs" style={{ color: 'var(--muted)' }}>
                  {cat.count} {t('home.categories.openCount')}
                </p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Latest Jobs ─── */}
      <section style={{ paddingBlock: 'var(--gap-2xl)', background: 'color-mix(in oklch, var(--accent) 4%, var(--bg))' }}>
        <div className="max-w-[var(--container)] mx-auto px-6">
          <div className="text-center mb-12">
            <span className="eyebrow">{t('home.latestJobs.eyebrow')}</span>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--fs-h2)',
                letterSpacing: '-0.01em',
              }}
            >
              {t('home.latestJobs.title')}
            </h2>
            <p className="mt-3" style={{ color: 'var(--muted)', fontSize: 'var(--fs-body)' }}>
              {t('home.latestJobs.subtitle')}
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
                      {job.budget_min} - {job.budget_max} {t('common.currency')}
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
                        {job.profiles?.[0]?.full_name?.charAt(0) || job.profiles?.[0]?.username?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium truncate max-w-[100px]" style={{ color: 'var(--fg)' }}>
                        {job.profiles?.[0]?.full_name || job.profiles?.[0]?.username}
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
              <p style={{ color: 'var(--muted)' }}>{t('home.latestJobs.noJobs')}</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/jobs" className="btn btn-outline" style={{ padding: '14px 32px' }}>
              <Search className="w-4 h-4" />
              {t('home.latestJobs.browseMore')}
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
                {t('home.cta.title')}
              </h2>
              <p
                className="mx-auto mb-8"
                style={{ maxWidth: '50ch', opacity: 0.9, fontSize: 'var(--fs-lead)', lineHeight: '1.7' }}
              >
                {t('home.cta.subtitle')}
              </p>

              {!user && (
                <div className="flex justify-center gap-4 flex-wrap">
                  <Link
                    href="/auth/register"
                    className="btn"
                    style={{ background: 'var(--surface)', color: 'var(--accent)', fontWeight: 700 }}
                  >
                    {t('home.cta.register')}
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
                    {t('home.cta.browse')}
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
                {t('home.footer.description')}
              </p>
            </div>

            <div>
              <h4 className="font-bold mb-4" style={{ color: 'var(--fg)' }}>{t('home.footer.forFreelancers')}</h4>
              <ul className="space-y-3 text-sm" style={{ color: 'var(--muted)' }}>
                <li><Link href="/jobs" className="hover:text-[var(--accent)] transition-colors">{t('home.footer.browseProjects')}</Link></li>
                <li><Link href="/auth/register?role=freelancer" className="hover:text-[var(--accent)] transition-colors">{t('home.footer.createAccount')}</Link></li>
                <li><Link href="/terms" className="hover:text-[var(--accent)] transition-colors">{t('home.footer.escrowSystem')}</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold mb-4" style={{ color: 'var(--fg)' }}>{t('home.footer.forClients')}</h4>
              <ul className="space-y-3 text-sm" style={{ color: 'var(--muted)' }}>
                <li><Link href="/auth/register?role=client" className="hover:text-[var(--accent)] transition-colors">{t('home.footer.postProject')}</Link></li>
                <li><Link href="/jobs" className="hover:text-[var(--accent)] transition-colors">{t('home.footer.howToHire')}</Link></li>
                <li><Link href="/terms" className="hover:text-[var(--accent)] transition-colors">{t('home.footer.securePay')}</Link></li>
              </ul>
            </div>
          </div>

          <div
            className="flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ borderTop: '1px solid var(--border)', paddingTop: '32px', fontSize: '14px', color: 'var(--muted)' }}
          >
            <p>{t('home.footer.copyright', { year: new Date().getFullYear() })}</p>
            <div className="flex gap-6">
              <Link href="/terms" className="hover:text-[var(--accent)] transition-colors">{t('home.footer.terms')}</Link>
              <Link href="/privacy" className="hover:text-[var(--accent)] transition-colors">{t('home.footer.privacy')}</Link>
              <Link href="/terms" className="hover:text-[var(--accent)] transition-colors">{t('home.footer.trustSafety')}</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
