'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'

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

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12" dir="rtl">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-9 h-9 bg-emerald-500 rounded-xl flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/>
              </svg>
            </div>
            <span className="text-xl font-bold text-gray-900">
              خدمة<span className="text-emerald-500">.dz</span>
            </span>
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">تعيين كلمة مرور جديدة</h1>
          <p className="text-gray-500 mt-1 text-sm">الرجاء إدخال كلمة المرور الجديدة لحسابك</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <form onSubmit={handleUpdatePassword} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور الجديدة</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="8 أحرف، حرف كبير، صغير، رقم ورمز" required className={inputClass} dir="ltr" style={{ color: '#111827' }} />
            </div>

            <button type="submit" disabled={loading || !password}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : null}
              {loading ? 'جارٍ الحفظ...' : 'حفظ كلمة المرور'}
            </button>
          </form>
        </div>
      </div>
    </main>
  )
}
