'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { AlertCircle, Loader2 } from 'lucide-react'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleUpdatePassword = async (e: React.FormEvent) => {
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

    const { error } = await supabase.auth.updateUser({ password })

    if (error) {
      setError(error.message)
      setLoading(false)
      return
    }

    // Success - redirect to dashboard since they are now logged in
    router.push('/dashboard')
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
            تعيين كلمة مرور جديدة
          </h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            الرجاء إدخال كلمة المرور الجديدة لحسابك
          </p>
        </div>

        <div className="card">
          <form onSubmit={handleUpdatePassword}>
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

            <div className="field">
              <label>كلمة المرور الجديدة</label>
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

            <button
              type="submit"
              disabled={loading || !password}
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
                  جارٍ الحفظ...
                </>
              ) : 'حفظ كلمة المرور'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
