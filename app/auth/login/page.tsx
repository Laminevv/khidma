'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { loginAction } from '@/app/actions/auth'
import { ArrowRight, AlertCircle, Loader2 } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const result = await loginAction(identifier, password)

    if (result.error) {
      setError(result.error)
      setLoading(false)
      return
    }

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen" dir="rtl">
      {/* ─── Visual Panel (Left on LTR, Right on RTL) ─── */}
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
            العمل ينتظرك.
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
        className="w-full lg:w-[560px] flex flex-col justify-center"
        style={{
          background: 'var(--surface)',
          padding: '80px',
        }}
      >
        <div className="w-full max-w-[400px] mx-auto">
          {/* Logo (Mobile & Desktop) */}
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
            مرحباً بعودتك.
          </h2>
          <p className="mb-8" style={{ color: 'var(--muted)', fontSize: '15px' }}>
            ليس لديك حساب؟{' '}
            <Link
              href="/auth/register"
              className="font-semibold hover:underline"
              style={{ color: 'var(--accent)' }}
            >
              إنشاء حساب جديد
            </Link>
          </p>

          <form onSubmit={handleLogin}>
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

            {/* Email / Username */}
            <div className="field">
              <label>البريد الإلكتروني أو اسم المستخدم</label>
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="example@gmail.com أو username"
                required
                dir="ltr"
                style={{ color: '#111827', backgroundColor: '#ffffff' }}
              />
            </div>

            {/* Password */}
            <div className="field">
              <div className="flex items-center justify-between mb-1">
                <label className="mb-0">كلمة المرور</label>
                <Link
                  href="/auth/forgot-password"
                  className="text-xs font-semibold hover:underline"
                  style={{ color: 'var(--accent)' }}
                >
                  نسيت كلمة المرور؟
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                dir="ltr"
                style={{ color: '#111827', backgroundColor: '#ffffff' }}
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 mt-3 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
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
                  جارٍ تسجيل الدخول...
                </>
              ) : 'تسجيل الدخول'}
            </button>
          </form>
        </div>
      </div>

      {/* ─── Responsive: Mobile adjustments via inline media ─── */}
      <style>{`
        @media (max-width: 1024px) {
          .flex.min-h-screen > div:last-child {
            width: 100% !important;
            padding: 40px 20px !important;
          }
        }
      `}</style>
    </div>
  )
}
