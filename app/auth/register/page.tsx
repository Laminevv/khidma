'use client'

import { useState, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'

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

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-300 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"

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
            تحقق من بريدك الإلكتروني وانقر على رابط التفعيل
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

        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-8">
          <div className="grid grid-cols-2 gap-3 mb-6">
            <button type="button" onClick={() => setRole('client')}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                role === 'client' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
              <div className="text-2xl mb-1">💼</div>
              <div className={`text-sm font-medium ${role === 'client' ? 'text-emerald-700' : 'text-gray-700'}`}>صاحب عمل</div>
              <div className="text-xs text-gray-400 mt-0.5">أبحث عن مستقلين</div>
            </button>
            <button type="button" onClick={() => setRole('freelancer')}
              className={`p-4 rounded-xl border-2 text-center transition-all ${
                role === 'freelancer' ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 hover:border-gray-300'
              }`}>
              <div className="text-2xl mb-1">🧑‍💻</div>
              <div className={`text-sm font-medium ${role === 'freelancer' ? 'text-emerald-700' : 'text-gray-700'}`}>مستقل</div>
              <div className="text-xs text-gray-400 mt-0.5">أقدم خدماتي</div>
            </button>
          </div>

          <form onSubmit={handleRegister} className="space-y-4">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-sm px-4 py-3 rounded-xl">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم الكامل</label>
              <input type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                placeholder="الاسم الكامل" required className={inputClass} style={{ color: '#111827' }} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المستخدم</label>
              <input type="text" value={username}
                onChange={(e) => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                placeholder="username" required className={inputClass} dir="ltr" style={{ color: '#111827' }} />
              <p className="text-xs text-gray-400 mt-1">حروف إنجليزية وأرقام فقط</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">البريد الإلكتروني</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com" required className={inputClass} dir="ltr" style={{ color: '#111827' }} />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">كلمة المرور</label>
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                placeholder="8 أحرف، حرف كبير، صغير، رقم ورمز" required className={inputClass} dir="ltr" style={{ color: '#111827' }} />
            </div>

            <button type="submit" disabled={loading}
              className="w-full bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2">
              {loading ? (
                <svg className="animate-spin" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
              ) : null}
              {loading ? 'جارٍ إنشاء الحساب...' : 'إنشاء الحساب'}
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

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    }>
      <RegisterForm />
    </Suspense>
  )
}
