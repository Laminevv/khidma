'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { ArrowRight, AlertCircle, Loader2, CheckCircle2, Briefcase, Code } from 'lucide-react'

type Role = 'client' | 'freelancer'

function RegisterForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const defaultRole = (searchParams.get('role') as Role) || 'client'

  const [role, setRole] = useState<Role>(defaultRole)
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    // Strict password validation
    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      setLoading(false)
      return
    }
    if (!/[A-Z]/.test(password)) {
      setError('كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل (A-Z)')
      setLoading(false)
      return
    }
    if (!/[a-z]/.test(password)) {
      setError('كلمة المرور يجب أن تحتوي على حرف صغير واحد على الأقل (a-z)')
      setLoading(false)
      return
    }
    if (!/[0-9]/.test(password)) {
      setError('كلمة المرور يجب أن تحتوي على رقم واحد على الأقل')
      setLoading(false)
      return
    }
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
      setError('كلمة المرور يجب أن تحتوي على رمز خاص واحد على الأقل (!@#$%^&*...)')
      setLoading(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username.toLowerCase().trim(),
          role,
          active_role: role,
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setError('هذا البريد الإلكتروني مسجّل مسبقاً')
      } else {
        setError(error.message)
      }
      setLoading(false)
      return
    }

    if (data.session === null) {
      // Email confirmation required
      setSuccess(true)
      setLoading(false)
      return
    }

    // Fallback automatic login if confirmation is disabled
    const { error: loginError } = await supabase.auth.signInWithPassword({ email, password })
    if (loginError) {
      setSuccess(true)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  // ─── Success State ───
  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center" dir="rtl" style={{ background: 'var(--bg)' }}>
        <div className="text-center max-w-md px-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'var(--accent-soft)' }}
          >
            <CheckCircle2 className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>
          <h2
            className="mb-3"
            style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--fg)' }}
          >
            تم إنشاء حسابك!
          </h2>
          <p className="mb-8 text-sm" style={{ color: 'var(--muted)' }}>
            تحقق من بريدك الإلكتروني وانقر على رابط التفعيل لتأكيد حسابك.
          </p>
          <Link
            href="/auth/login"
            className="btn btn-primary"
            style={{ padding: '14px 32px', fontSize: '16px' }}
          >
            الذهاب لتسجيل الدخول
          </Link>
        </div>
      </div>
    )
  }

  // ─── Main Register Form ───
  return (
    <div className="flex min-h-screen" dir="rtl">
      {/* ─── Visual Panel ─── */}
      <div
        className="hidden lg:flex flex-1 flex-col justify-center relative overflow-hidden"
        style={{
          background: 'var(--fg)',
          color: 'var(--surface)',
          padding: '80px',
        }}
      >
        {/* Radial teal glow */}
        <div
          className="absolute"
          style={{
            top: '-50%',
            left: '-50%',
            width: '200%',
            height: '200%',
            background: 'radial-gradient(circle, var(--accent) 0%, transparent 70%)',
            opacity: 0.1,
          }}
        />

        <Link
          href="/"
          className="absolute top-10 right-10 flex items-center gap-2 text-sm font-semibold transition-opacity hover:opacity-100"
          style={{ color: 'white', opacity: 0.6 }}
        >
          <ArrowRight className="w-4 h-4" />
          العودة للرئيسية
        </Link>

        <div className="relative z-10">
          <h1
            className="mb-6"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '48px',
              lineHeight: 1.1,
            }}
          >
            ابدأ رحلتك المهنية.
          </h1>
          <p
            className="leading-relaxed"
            style={{
              fontSize: '18px',
              color: 'var(--muted)',
              maxWidth: '400px',
              lineHeight: 1.7,
            }}
          >
            انضم إلى أكثر منصة مصداقية للخدمات المهنية عالية الجودة في الجزائر.
            حساب واحد، فرص بلا حدود.
          </p>
        </div>
      </div>

      {/* ─── Form Panel ─── */}
      <div
        className="w-full lg:w-[560px] flex flex-col justify-center overflow-y-auto"
        style={{
          background: 'var(--surface)',
          padding: '60px 80px',
        }}
      >
        <div className="w-full max-w-[400px] mx-auto">
          {/* Logo */}
          <div className="mb-10">
            <Link
              href="/"
              className="inline-block text-[24px] font-extrabold"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)', textDecoration: 'none' }}
            >
              خدمة<span style={{ color: 'var(--accent)' }}>.dz</span>
            </Link>
          </div>

          <h2
            className="mb-2"
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: '32px',
              color: 'var(--fg)',
            }}
          >
            أنشئ حسابك.
          </h2>
          <p className="mb-8" style={{ color: 'var(--muted)', fontSize: '15px' }}>
            لديك حساب بالفعل؟{' '}
            <Link
              href="/auth/login"
              className="font-semibold hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              تسجيل الدخول
            </Link>
          </p>

          {/* ─── Role Toggle ─── */}
          <div
            className="grid grid-cols-2 gap-1 mb-8"
            style={{
              background: 'var(--bg)',
              padding: '4px',
              borderRadius: 'var(--radius)',
            }}
          >
            <button
              type="button"
              onClick={() => setRole('client')}
              className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-md transition-all"
              style={{
                background: role === 'client' ? 'var(--surface)' : 'transparent',
                color: role === 'client' ? 'var(--fg)' : 'var(--muted)',
                boxShadow: role === 'client' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Briefcase className="w-4 h-4" />
              صاحب عمل
            </button>
            <button
              type="button"
              onClick={() => setRole('freelancer')}
              className="flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-md transition-all"
              style={{
                background: role === 'freelancer' ? 'var(--surface)' : 'transparent',
                color: role === 'freelancer' ? 'var(--fg)' : 'var(--muted)',
                boxShadow: role === 'freelancer' ? '0 2px 4px rgba(0,0,0,0.05)' : 'none',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              <Code className="w-4 h-4" />
              مستقل
            </button>
          </div>

          <form onSubmit={handleRegister}>
            {/* Error Message */}
            {error && (
              <div
                className="flex items-center gap-2 mb-5 text-sm px-4 py-3 rounded-lg"
                style={{
                  background: 'color-mix(in oklch, var(--error) 10%, var(--surface))',
                  color: 'var(--error)',
                  border: '1px solid color-mix(in oklch, var(--error) 20%, transparent)',
                }}
              >
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                {error}
              </div>
            )}

            {/* Full Name */}
            <div className="field">
              <label>الاسم الكامل</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="الاسم الكامل"
                required
                style={{ color: '#111827', backgroundColor: '#ffffff' }}
              />
            </div>

            {/* Username */}
            <div className="field">
              <label>اسم المستخدم</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                placeholder="username"
                required
                dir="ltr"
                style={{ color: '#111827', backgroundColor: '#ffffff' }}
              />
              <p className="text-xs" style={{ color: 'var(--muted)', marginTop: '-4px' }}>
                حروف إنجليزية وأرقام فقط
              </p>
            </div>

            {/* Email */}
            <div className="field">
              <label>البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
                dir="ltr"
                style={{ color: '#111827', backgroundColor: '#ffffff' }}
              />
            </div>

            {/* Password */}
            <div className="field">
              <label>كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 أحرف، حرف كبير، صغير، رقم ورمز"
                required
                dir="ltr"
                style={{ color: '#111827', backgroundColor: '#ffffff' }}
              />
            </div>

            {/* Terms Agreement */}
            <div className="flex items-center gap-2 mb-6" style={{ fontSize: '13px', color: 'var(--muted)' }}>
              <input
                type="checkbox"
                id="terms-agree"
                required
                className="cursor-pointer"
                style={{ accentColor: 'var(--accent)' }}
              />
              <label htmlFor="terms-agree" className="cursor-pointer">
                أوافق على{' '}
                <Link href="/terms" className="font-semibold hover:underline" style={{ color: 'var(--fg)' }}>
                  شروط الاستخدام
                </Link>
                {' '}و{' '}
                <Link href="/privacy" className="font-semibold hover:underline" style={{ color: 'var(--fg)' }}>
                  سياسة الخصوصية
                </Link>
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
              style={{
                padding: '14px',
                background: 'var(--fg)',
                color: 'var(--surface)',
                border: 'none',
                borderRadius: 'var(--radius)',
                fontWeight: 700,
                fontSize: '16px',
                cursor: loading ? 'not-allowed' : 'pointer',
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget.style.background = 'var(--accent)') }}
              onMouseLeave={(e) => { (e.currentTarget.style.background = 'var(--fg)') }}
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  جارٍ إنشاء الحساب...
                </>
              ) : 'إنشاء الحساب'}
            </button>
          </form>
        </div>
      </div>

      {/* ─── Responsive: Mobile adjustments ─── */}
      <style>{`
        @media (max-width: 1024px) {
          .flex.min-h-screen > div:last-of-type {
            width: 100% !important;
            padding: 40px 20px !important;
          }
        }
      `}</style>
    </div>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--bg)' }}>
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: 'var(--accent)' }} />
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
