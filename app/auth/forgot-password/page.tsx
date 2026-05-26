'use client'

import { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { ArrowRight, AlertCircle, Loader2, Mail } from 'lucide-react'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
    })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen flex items-center justify-center px-4" dir="rtl" style={{ background: 'var(--bg)' }}>
        <div
          className="text-center max-w-md p-8 rounded-2xl"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: 'var(--accent-soft)' }}
          >
            <Mail className="w-8 h-8" style={{ color: 'var(--accent)' }} />
          </div>
          <h2
            className="mb-3"
            style={{ fontFamily: 'var(--font-display)', fontSize: '24px', color: 'var(--fg)' }}
          >
            تحقق من بريدك الإلكتروني
          </h2>
          <p className="mb-6 text-sm leading-relaxed" style={{ color: 'var(--muted)' }}>
            لقد أرسلنا رابط إعادة تعيين كلمة المرور إلى <strong style={{ color: 'var(--fg)' }}>{email}</strong>. يرجى النقر على الرابط لتعيين كلمة مرور جديدة.
          </p>
          <Link
            href="/auth/login"
            className="btn btn-outline w-full justify-center"
          >
            العودة لتسجيل الدخول
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-4 py-12" dir="rtl" style={{ background: 'var(--bg)' }}>
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link
            href="/"
            className="inline-block text-[24px] font-extrabold mb-6"
            style={{ fontFamily: 'var(--font-display)', color: 'var(--fg)', textDecoration: 'none' }}
          >
            خدمة<span style={{ color: 'var(--accent)' }}>.dz</span>
          </Link>
          <h1
            className="mb-2"
            style={{ fontFamily: 'var(--font-display)', fontSize: '28px', color: 'var(--fg)' }}
          >
            نسيت كلمة المرور؟
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            أدخل بريدك الإلكتروني لإرسال رابط إعادة التعيين
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleReset}>
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
                {error === 'User not found' ? 'هذا البريد الإلكتروني غير مسجل لدينا.' : error}
              </div>
            )}

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

            <button
              type="submit"
              disabled={loading || !email}
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
                  جارٍ الإرسال...
                </>
              ) : 'إرسال رابط الاستعادة'}
            </button>
          </form>
        </div>

        <p className="text-center text-sm mt-6" style={{ color: 'var(--muted)' }}>
          <Link href="/auth/login" className="font-semibold hover:underline" style={{ color: 'var(--accent)' }}>
            <span className="inline-flex items-center gap-1">
              <ArrowRight className="w-3 h-3" />
              العودة لتسجيل الدخول
            </span>
          </Link>
        </p>
      </div>
    </main>
  )
}
