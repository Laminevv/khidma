'use client'

import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import FileUpload from '@/app/components/FileUpload'
import AvatarCropModal from '@/app/components/AvatarCropModal'

interface Profile {
  id: string
  username: string
  full_name: string
  avatar_url: string
  bio: string
  wilaya: string
  hourly_rate: number
  skills: string[]
  is_verified: boolean
}

interface PortfolioItem {
  id: string
  title: string
  description: string
  image_url: string
  project_link: string
}

const WILAYAS = [
  'أدرار', 'الشلف', 'الأغواط', 'أم البواقي', 'باتنة', 'بجاية', 'بسكرة', 'بشار', 'البليدة', 'البويرة',
  'تمنراست', 'تبسة', 'تلمسان', 'تيارت', 'تيزي وزو', 'الجزائر', 'الجلفة', 'جيجل', 'سطيف', 'سعيدة',
  'سكيكدة', 'سيدي بلعباس', 'عنابة', 'قالمة', 'قسنطينة', 'المدية', 'مستغانم', 'المسيلة', 'معسكر', 'ورقلة',
  'وهران', 'البيض', 'إليزي', 'برج بوعريريج', 'بومرداس', 'الطارف', 'تندوف', 'تسمسيلت', 'الوادي', 'خنشلة',
  'سوق أهراس', 'تيبازة', 'ميلة', 'عين الدفلى', 'النعامة', 'عين تموشنت', 'غرداية', 'غليزان',
  'تيميمون', 'برج باجي مختار', 'أولاد جلال', 'بني عباس', 'إن صالح', 'إن قزام', 'تقرت', 'جانت', 'المغير', 'المنيعة'
]

export default function SettingsPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [portfolios, setPortfolios] = useState<PortfolioItem[]>([])
  const [tab, setTab] = useState<'profile' | 'portfolio'>('profile')
  const [message, setMessage] = useState({ type: '', text: '' })
  
  const [skillInput, setSkillInput] = useState('')
  const [avatarUploading, setAvatarUploading] = useState(false)
  const avatarInputRef = useRef<HTMLInputElement>(null)
  const [cropImageSrc, setCropImageSrc] = useState<string | null>(null)

  // Portfolio Form State
  const [newPortfolio, setNewPortfolio] = useState({
    title: '', description: '', image_url: '', project_link: ''
  })
  const [portfolioAdding, setPortfolioAdding] = useState(false)

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) { router.push('/auth/login'); return }

      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (profileData) {
        setProfile({
          id: profileData.id,
          username: profileData.username || '',
          full_name: profileData.full_name || '',
          avatar_url: profileData.avatar_url || '',
          bio: profileData.bio || '',
          wilaya: profileData.wilaya?.toString() || '',
          hourly_rate: profileData.hourly_rate || 0,
          skills: profileData.skills || [],
          is_verified: profileData.is_verified || false
        })
      }

      const { data: portfolioData } = await supabase
        .from('portfolio_items')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
      
      setPortfolios(portfolioData || [])
      setLoading(false)
    }
    init()
  }, [])

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    setSaving(true)
    setMessage({ type: '', text: '' })

    const { error } = await supabase
      .from('profiles')
      .update({
        full_name: profile.full_name,
        bio: profile.bio,
        wilaya: profile.wilaya ? parseInt(profile.wilaya) : null,
        hourly_rate: profile.hourly_rate || 0,
        skills: profile.skills,
        avatar_url: profile.avatar_url
      })
      .eq('id', profile.id)

    if (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء حفظ الإعدادات' })
    } else {
      setMessage({ type: 'success', text: 'تم حفظ الإعدادات بنجاح!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
    setSaving(false)
  }

  // Step 1: When user selects a file, open the crop modal
  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !profile) return
    e.target.value = '' // Reset so re-selecting the same file works

    if (file.size > 15 * 1024 * 1024) {
      setMessage({ type: 'error', text: 'حجم الصورة يجب أن لا يتجاوز 15MB' })
      return
    }

    const url = URL.createObjectURL(file)
    setCropImageSrc(url)
  }

  // Step 2: After user confirms the crop, upload the cropped blob
  const handleCroppedUpload = async (blob: Blob) => {
    if (!profile) return
    setCropImageSrc(null)
    setAvatarUploading(true)

    const fileName = `${profile.id}_${Date.now()}.jpg`
    const file = new File([blob], fileName, { type: 'image/jpeg' })

    const { error, data } = await supabase.storage
      .from('avatars')
      .upload(fileName, file)

    if (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء رفع الصورة' })
    } else if (data) {
      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName)

      setProfile({ ...profile, avatar_url: publicUrlData.publicUrl })

      // Auto save the new avatar url
      await supabase.from('profiles').update({ avatar_url: publicUrlData.publicUrl }).eq('id', profile.id)
      setMessage({ type: 'success', text: 'تم تحديث الصورة الشخصية بنجاح!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
    setAvatarUploading(false)
  }

  const addSkill = () => {
    const s = skillInput.trim()
    if (s && profile && !profile.skills.includes(s) && profile.skills.length < 10) {
      setProfile({ ...profile, skills: [...profile.skills, s] })
    }
    setSkillInput('')
  }

  const removeSkill = (skill: string) => {
    if (!profile) return
    setProfile({ ...profile, skills: profile.skills.filter(s => s !== skill) })
  }

  const handleAddPortfolio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!profile) return
    
    if (!newPortfolio.title || !newPortfolio.image_url) {
      setMessage({ type: 'error', text: 'يرجى إدخال عنوان المشروع وصورة العرض' })
      return
    }

    setPortfolioAdding(true)
    
    const { data, error } = await supabase
      .from('portfolio_items')
      .insert({
        user_id: profile.id,
        title: newPortfolio.title,
        description: newPortfolio.description,
        image_url: newPortfolio.image_url,
        project_link: newPortfolio.project_link || null
      })
      .select()
      .single()

    if (error) {
      setMessage({ type: 'error', text: 'حدث خطأ أثناء إضافة العمل' })
    } else if (data) {
      setPortfolios([data, ...portfolios])
      setNewPortfolio({ title: '', description: '', image_url: '', project_link: '' })
      setMessage({ type: 'success', text: 'تمت إضافة العمل إلى معرض أعمالك!' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
    setPortfolioAdding(false)
  }

  const handleDeletePortfolio = async (id: string) => {
    if (!confirm('هل أنت متأكد من حذف هذا العمل؟')) return
    
    await supabase.from('portfolio_items').delete().eq('id', id)
    setPortfolios(portfolios.filter(p => p.id !== id))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    )
  }

  if (!profile) return null

  const inputClass = "w-full px-4 py-3 rounded-xl border border-gray-200 bg-white text-gray-900 text-sm focus:outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-50 transition-all"

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* Navbar */}
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/></svg>
            </div>
            <span className="text-lg font-bold text-gray-900">خدمة<span className="text-emerald-500">.dz</span></span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href={`/profile/${profile.username}`} className="text-sm text-emerald-600 hover:text-emerald-700 font-medium">عرض ملفي</Link>
            <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900">← العودة</Link>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">إعدادات الحساب</h1>
            <p className="text-gray-500 text-sm mt-1">تحديث ملفك الشخصي ومعرض أعمالك لجذب المزيد من العملاء</p>
          </div>
          <Link href="/kyc/status" className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors border ${profile.is_verified ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100' : 'bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100'}`}>
            {profile.is_verified ? (
              <><span>✅</span> حساب موثق</>
            ) : (
              <><span>⚠️</span> غير موثق (KYC)</>
            )}
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-200">
          <button 
            onClick={() => { setTab('profile'); setMessage({type:'', text:''}) }}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'profile' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            المعلومات الشخصية
          </button>
          <button 
            onClick={() => { setTab('portfolio'); setMessage({type:'', text:''}) }}
            className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'portfolio' ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
          >
            معرض الأعمال
          </button>
        </div>

        {message.text && (
          <div className={`mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-emerald-50 text-emerald-700 border border-emerald-100'}`}>
            <span>{message.type === 'error' ? '⚠️' : '✅'}</span> {message.text}
          </div>
        )}

        {/* Profile Tab */}
        {tab === 'profile' && (
          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
              
              {/* Avatar */}
              <div className="flex flex-col sm:flex-row items-center gap-6 mb-8 pb-8 border-b border-gray-100">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-emerald-100 border-4 border-white shadow-sm flex items-center justify-center">
                    {profile.avatar_url ? (
                      <img src={profile.avatar_url} alt={profile.full_name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl font-bold text-emerald-600">{profile.full_name?.charAt(0) || profile.username?.charAt(0)}</span>
                    )}
                  </div>
                  <button 
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <span className="text-white text-xs font-medium">تغيير الصورة</span>
                  </button>
                  <input type="file" ref={avatarInputRef} onChange={handleAvatarSelect} accept="image/*" className="hidden" />
                </div>
                <div className="text-center sm:text-right">
                  <h3 className="font-semibold text-gray-900 mb-1">الصورة الشخصية</h3>
                  <p className="text-gray-500 text-xs mb-3">يُفضل استخدام صورة واضحة ومربعة (Max 5MB)</p>
                  <button 
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={avatarUploading}
                    className="bg-gray-100 text-gray-700 hover:bg-gray-200 px-4 py-2 rounded-lg text-xs font-medium transition-colors"
                  >
                    {avatarUploading ? 'جارٍ الرفع...' : 'اختر صورة جديدة'}
                  </button>
                </div>
              </div>

              {/* Basic Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">الاسم الكامل</label>
                  <input type="text" value={profile.full_name} onChange={e => setProfile({...profile, full_name: e.target.value})} className={inputClass} style={{ color: '#111827' }} required />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">اسم المستخدم (غير قابل للتعديل)</label>
                  <input type="text" value={`@${profile.username}`} disabled className="w-full px-4 py-3 rounded-xl border border-gray-100 bg-gray-50 text-gray-500 text-sm cursor-not-allowed" dir="ltr" style={{ textAlign: 'right' }} />
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1.5">نبذة عنك (Bio)</label>
                <textarea 
                  value={profile.bio} 
                  onChange={e => setProfile({...profile, bio: e.target.value})} 
                  className={`${inputClass} resize-none`} 
                  rows={4} 
                  placeholder="أخبر العملاء عن خبرتك وما يميزك..."
                  style={{ color: '#111827' }}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-8 pb-8 border-b border-gray-100">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">الولاية</label>
                  <select 
                    value={profile.wilaya} 
                    onChange={e => setProfile({...profile, wilaya: e.target.value})} 
                    className={inputClass}
                    style={{ color: '#111827' }}
                  >
                    <option value="">اختر الولاية...</option>
                    {WILAYAS.map((w, i) => (
                      <option key={i+1} value={i+1}>{i+1} - {w}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">السعر بالساعة (دج)</label>
                  <input type="number" value={profile.hourly_rate} onChange={e => setProfile({...profile, hourly_rate: Number(e.target.value)})} min="0" className={inputClass} placeholder="مثال: 1500" style={{ color: '#111827' }} />
                </div>
              </div>

              {/* Skills */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">المهارات</label>
                <p className="text-xs text-gray-400 mb-3">أضف أبرز المهارات التي تتقنها (الحد الأقصى 10)</p>
                
                {profile.skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-3">
                    {profile.skills.map((skill) => (
                      <span key={skill} className="flex items-center gap-1 bg-emerald-50 text-emerald-700 text-xs px-3 py-1.5 rounded-lg border border-emerald-100">
                        {skill}
                        <button type="button" onClick={() => removeSkill(skill)} className="hover:text-red-500 font-bold ml-1 transition-colors">×</button>
                      </span>
                    ))}
                  </div>
                )}

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill() } }}
                    placeholder="اكتب مهارة واضغط إضافة"
                    className={inputClass}
                    style={{ color: '#111827' }}
                  />
                  <button type="button" onClick={addSkill} className="bg-gray-100 text-gray-700 px-5 py-3 rounded-xl text-sm font-medium hover:bg-emerald-50 hover:text-emerald-600 transition-colors flex-shrink-0">
                    إضافة
                  </button>
                </div>
              </div>

            </div>

            <button type="submit" disabled={saving} className="bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50 flex items-center gap-2">
              {saving ? 'جارٍ الحفظ...' : 'حفظ التغييرات'}
            </button>
          </form>
        )}

        {/* Portfolio Tab */}
        {tab === 'portfolio' && (
          <div className="space-y-6">
            
            {/* Add New Item */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
              <h2 className="font-semibold text-gray-900 mb-5">إضافة عمل جديد</h2>
              <form onSubmit={handleAddPortfolio} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">عنوان العمل <span className="text-red-500">*</span></label>
                      <input type="text" value={newPortfolio.title} onChange={e => setNewPortfolio({...newPortfolio, title: e.target.value})} required className={inputClass} style={{ color: '#111827' }} placeholder="مثال: تصميم شعار شركة ناشئة" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">رابط المشروع (اختياري)</label>
                      <input type="url" value={newPortfolio.project_link} onChange={e => setNewPortfolio({...newPortfolio, project_link: e.target.value})} className={inputClass} style={{ color: '#111827' }} placeholder="https://..." dir="ltr" />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1.5">وصف العمل</label>
                      <textarea value={newPortfolio.description} onChange={e => setNewPortfolio({...newPortfolio, description: e.target.value})} className={`${inputClass} resize-none`} rows={3} style={{ color: '#111827' }} placeholder="اشرح دورك في هذا المشروع..." />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1.5">صورة العرض <span className="text-red-500">*</span></label>
                    <div className="h-[212px]">
                      {newPortfolio.image_url ? (
                        <div className="relative w-full h-full rounded-2xl overflow-hidden border border-gray-200 group">
                          <img src={newPortfolio.image_url} alt="Preview" className="w-full h-full object-cover" />
                          <button type="button" onClick={() => setNewPortfolio({...newPortfolio, image_url: ''})} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-sm font-medium">
                            إزالة الصورة
                          </button>
                        </div>
                      ) : (
                        <FileUpload 
                          bucketName="attachments" 
                          folderPath={`portfolio/${profile.id}`} 
                          onUploadComplete={(urls) => { if(urls.length > 0) setNewPortfolio({...newPortfolio, image_url: urls[0]}) }}
                          accept=".png,.jpg,.jpeg,.webp"
                          maxFiles={1}
                        />
                      )}
                    </div>
                  </div>
                </div>

                <div className="pt-2">
                  <button type="submit" disabled={portfolioAdding || !newPortfolio.title || !newPortfolio.image_url} className="bg-emerald-500 text-white px-6 py-2.5 rounded-xl text-sm font-medium hover:bg-emerald-600 transition-colors disabled:opacity-50">
                    {portfolioAdding ? 'جارٍ الإضافة...' : 'إضافة للمعرض'}
                  </button>
                </div>
              </form>
            </div>

            {/* List Items */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-8">
              <h2 className="font-semibold text-gray-900 mb-5">أعمالي ({portfolios.length})</h2>
              
              {portfolios.length === 0 ? (
                <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-2xl">
                  <div className="text-4xl mb-3">🎨</div>
                  <p className="text-gray-500 text-sm">لم تقم بإضافة أي أعمال بعد</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {portfolios.map(item => (
                    <div key={item.id} className="border border-gray-100 rounded-2xl overflow-hidden group">
                      <div className="aspect-video w-full bg-gray-100 relative">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover" />
                        <button onClick={() => handleDeletePortfolio(item.id)} className="absolute top-2 right-2 w-8 h-8 bg-white/90 rounded-lg flex items-center justify-center text-red-500 opacity-0 group-hover:opacity-100 hover:bg-red-50 transition-all shadow-sm">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                        </button>
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 text-sm mb-1 truncate">{item.title}</h3>
                        {item.description && <p className="text-gray-500 text-xs line-clamp-2 mb-3">{item.description}</p>}
                        {item.project_link && (
                          <a href={item.project_link} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 text-xs font-medium inline-flex items-center gap-1">
                            <span>🔗</span> رابط المشروع
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>

      {/* Avatar Crop Modal */}
      {cropImageSrc && (
        <AvatarCropModal
          imageSrc={cropImageSrc}
          onCropComplete={handleCroppedUpload}
          onCancel={() => {
            URL.revokeObjectURL(cropImageSrc)
            setCropImageSrc(null)
          }}
        />
      )}
    </div>
  )
}
