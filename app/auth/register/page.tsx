export const dynamic = 'force-dynamic'
'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

type Role = 'client' | 'freelancer'

export default function RegisterPage() {
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

    if (password.length < 8) {
      setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل')
      setLoading(false)
      return
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          username: username.toLowerCase().trim(),
          role,
          active_role: role,
        },
      },
    })

    if (error) {
      if (error.message.includes('already registered')) {
        setError('هذا البريد الإلكتروني مسجّل مسبقاً')
      } else {
        setError('حدث خطأ، يرجى المحاولة مرة أخرى')
      }
      setLoading(false)
      return
    }

    setSuccess(true)
    setLoading(false)
  }

  if (success) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4" dir="rtl">
        <div className="text-center max-w-md">
          <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">تم إنشاء حسابك!</h2>
          <p className="text-gray-500 text-sm mb-6">
            تحقق من بريدك الإلكتروني <strong>{email}</strong> وانقر على رابط التفعيل
          </p>
          <Link href="/auth/login"
            className="bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors inline-block">
            الذهاب لتسجيل الدخول
          </Link>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-12" dir="rtl">
      <div className="w-full max-w-md">

        {/* Logo */}
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
          <h1 className="text-2xl font-bold text-gray-900">إنشاء حساب جديد</h1>
          <p className="text-gray-500 mt-1 text-sm">انضم لمنصة العمل الحر الجزائرية</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-8">

          {/* Role selector */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button
              type="button"
              onClick={() => setRole('client')}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                role === 'client'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="text-2xl mb-1">💼</div>
              <div className={`text-sm font-medium ${role === 'client' ? 'text-emerald-700' : 'text-gray-700'}`}>
                صاحب عمل
              </div>
              <div className="text-xs text-gray-400 mt-0.5">أبحث عن مستقلين</div>
            </button>
            <button
              type="button"
              onClick={() => setRole('freelancer')}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                role === 'freelancer'
                  ? 'border-emerald-500 bg-emerald-50'
                  : 'border-gray-100 hover:border-gray-200'
              }`}
            >
              <div className="text-2xl mb-1">🧑‍💻</div>
              <div className={`text-sm font-medium ${role === 'freelancer' ? 'text-emerald-700' : 'text-gray-700'}`}>
                مستقل
              </div>
              <div className="text-xs text-gray-400 mt-0.5">أقدم خدماتي</div>
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">

            {error && (
              <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
                </svg>
                {error}
              </div>
            )}

            {/* Full name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم الكامل</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="محمد أمين"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
              />
            </div>

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المستخدم</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                placeholder="mohammed_amine"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                dir="ltr"
              />
              <p className="text-xs text-gray-400 mt-1">حروف إنجليزية وأرقام فقط</p>
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد الإلكتروني</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                dir="ltr"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="8 أحرف على الأقل"
                required
                className="w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"
                dir="ltr"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  جارٍ إنشاء الحساب...
                </>
              ) : 'إنشاء الحساب'}
            </button>

            <p className="text-xs text-gray-400 text-center">
              بالتسجيل توافق على{' '}
              <Link href="#" className="text-emerald-600 hover:underline">شروط الاستخدام</Link>
              {' '}و{' '}
              <Link href="#" className="text-emerald-600 hover:underline">سياسة الخصوصية</Link>
            </p>

          </form>
        </div>

        <p className="text-center text-sm text-gray-500 mt-6">
          لديك حساب بالفعل؟{' '}
          <Link href="/auth/login" className="text-emerald-600 font-medium hover:underline">
            تسجيل الدخول
          </Link>
        </p>

      </div>
    </main>
  )
}
