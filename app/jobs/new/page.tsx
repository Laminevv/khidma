'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import FileUpload from '@/app/components/FileUpload'

const CATEGORIES = [
  { value: 'development', label: 'تطوير برمجي' },
  { value: 'design', label: 'تصميم' },
  { value: 'marketing', label: 'تسويق رقمي' },
  { value: 'writing', label: 'كتابة محتوى' },
  { value: 'translation', label: 'ترجمة' },
  { value: 'data', label: 'بيانات وتحليل' },
  { value: 'other', label: 'أخرى' },
]

const POPULAR_SKILLS = [
  'React', 'Next.js', 'Node.js', 'Python', 'Laravel', 'WordPress',
  'Figma', 'UI/UX', 'Photoshop', 'SEO', 'Facebook Ads', 'Copywriting',
  'Arabic Translation', 'Video Editing', 'Data Analysis',
]

export default function NewJobPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState<string | null>(null)
  const [skillInput, setSkillInput] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    category: '',
    budget_min: '',
    budget_max: '',
    deadline: '',
    required_skills: [] as string[],
    attachments: [] as string[],
  })

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) router.push('/auth/login')
      else setUserId(data.user.id)
    })
  }, [router])

  const addSkill = (skill: string) => {
    const s = skill.trim()
    if (s && !form.required_skills.includes(s) && form.required_skills.length < 8) {
      setForm({ ...form, required_skills: [...form.required_skills, s] })
    }
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    setForm({ ...form, required_skills: form.required_skills.filter(s => s !== skill) })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!userId) return
    setLoading(true)
    setError('')

    if (!form.title || !form.description || !form.category) {
      setError('يرجى ملء جميع الحقول المطلوبة')
      setLoading(false)
      return
    }

    const { data, error } = await supabase
      .from('jobs')
      .insert({
        client_id: userId,
        title: form.title,
        description: form.description,
        category: form.category,
        budget_min: form.budget_min ? Number(form.budget_min) : null,
        budget_max: form.budget_max ? Number(form.budget_max) : null,
        deadline: form.deadline || null,
        required_skills: form.required_skills,
        attachments: form.attachments,
        status: 'open',
      })
      .select()
      .single()

    if (error) {
      setError('حدث خطأ أثناء نشر المشروع')
      setLoading(false)
      return
    }

    router.push(`/jobs/${data.id}`)
  }

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm placeholder-gray-400 focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">
              خدمة<span className="text-emerald-500">.dz</span>
            </span>
          </Link>
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">
            ← لوحة التحكم
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">نشر مشروع جديد</h1>
          <p className="text-gray-500 text-sm mt-1">صف مشروعك بوضوح لتحصل على أفضل العروض</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {error && (
            <div className="bg-red-50 border border-red-100 text-red-600 text-sm px-4 py-3 rounded-xl">
              {error}
            </div>
          )}

          {/* Title */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              عنوان المشروع <span className="text-red-400">*</span>
            </label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              placeholder="مثال: تصميم موقع إلكتروني لمتجر ملابس"
              required
              maxLength={120}
              className={inputClass}
              style={{ color: '#111827' }}
            />
            <p className="text-xs text-gray-400 mt-1.5">{form.title.length}/120 حرف</p>
          </div>

          {/* Description */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              وصف المشروع <span className="text-red-400">*</span>
            </label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="اشرح تفاصيل المشروع، المتطلبات، والنتيجة المتوقعة..."
              required
              rows={6}
              className={inputClass + ' resize-none'}
              style={{ color: '#111827' }}
            />
            <p className="text-xs text-gray-400 mt-1.5">{form.description.length} حرف (الحد الأدنى 50)</p>
          </div>

          {/* Category */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              الفئة <span className="text-red-400">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.value}
                  type="button"
                  onClick={() => setForm({ ...form, category: cat.value })}
                  className={`py-2.5 px-3 rounded-xl text-sm border-2 transition-all ${
                    form.category === cat.value
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-medium'
                      : 'border-gray-100 text-gray-600 hover:border-gray-200'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Budget */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-3">
              الميزانية (دج)
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">الحد الأدنى</label>
                <input
                  type="number"
                  value={form.budget_min}
                  onChange={(e) => setForm({ ...form, budget_min: e.target.value })}
                  placeholder="5,000"
                  min="0"
                  className={inputClass}
                  style={{ color: '#111827' }}
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">الحد الأقصى</label>
                <input
                  type="number"
                  value={form.budget_max}
                  onChange={(e) => setForm({ ...form, budget_max: e.target.value })}
                  placeholder="50,000"
                  min="0"
                  className={inputClass}
                  style={{ color: '#111827' }}
                />
              </div>
            </div>
          </div>

          {/* Deadline */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              الموعد النهائي
            </label>
            <input
              type="date"
              value={form.deadline}
              onChange={(e) => setForm({ ...form, deadline: e.target.value })}
              min={new Date().toISOString().split('T')[0]}
              className={inputClass}
              style={{ color: '#111827' }}
            />
          </div>

          {/* Skills */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              المهارات المطلوبة
            </label>
            <p className="text-xs text-gray-400 mb-3">أضف حتى 8 مهارات</p>

            {/* Selected skills */}
            {form.required_skills.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-3">
                {form.required_skills.map((skill) => (
                  <span key={skill}
                    className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-lg">
                    {skill}
                    <button type="button" onClick={() => removeSkill(skill)}
                      className="hover:text-red-500 transition-colors">
                      ×
                    </button>
                  </span>
                ))}
              </div>
            )}

            {/* Skill input */}
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(skillInput) } }}
                placeholder="اكتب مهارة واضغط Enter"
                className={inputClass + ' flex-1'}
                style={{ color: '#111827' }}
              />
              <button
                type="button"
                onClick={() => addSkill(skillInput)}
                className="px-4 py-2 bg-emerald-50 text-emerald-600 rounded-xl text-sm hover:bg-emerald-100 transition-colors"
              >
                إضافة
              </button>
            </div>

            {/* Popular skills */}
            <div className="flex flex-wrap gap-2">
              {POPULAR_SKILLS.filter(s => !form.required_skills.includes(s)).slice(0, 8).map((skill) => (
                <button
                  key={skill}
                  type="button"
                  onClick={() => addSkill(skill)}
                  className="text-xs bg-gray-100 text-gray-600 px-3 py-1.5 rounded-lg hover:bg-emerald-50 hover:text-emerald-600 transition-all"
                >
                  + {skill}
                </button>
              ))}
            </div>
          </div>

          {/* Attachments */}
          <div className="bg-white rounded-2xl border border-gray-100 p-6">
            <label className="block text-sm font-semibold text-gray-900 mb-1.5">
              مرفقات المشروع <span className="text-gray-400 font-normal text-xs">(اختياري)</span>
            </label>
            <p className="text-xs text-gray-400 mb-4">أرفق ملفات مثل (PDF, صور, ملفات Word) لمساعدة المستقلين على فهم متطلباتك.</p>
            <FileUpload 
              bucketName="attachments" 
              folderPath={`jobs/${userId}`} 
              onUploadComplete={(urls) => setForm({ ...form, attachments: urls })}
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.zip"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !form.title || !form.description || !form.category}
            className="w-full bg-emerald-500 text-white py-4 rounded-2xl font-semibold text-base hover:bg-emerald-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                </svg>
                جارٍ النشر...
              </>
            ) : '🚀 نشر المشروع'}
          </button>

        </form>
      </div>
    </div>
  )
}
