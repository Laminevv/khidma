'use client'

import Link from 'next/link'

// ── Wilaya map (1-58) ──
const wilayaNames: Record<number, string> = {
  1: 'أدرار', 2: 'الشلف', 3: 'الأغواط', 4: 'أم البواقي', 5: 'باتنة',
  6: 'بجاية', 7: 'بسكرة', 8: 'بشار', 9: 'البليدة', 10: 'البويرة',
  11: 'تمنراست', 12: 'تبسة', 13: 'تلمسان', 14: 'تيارت', 15: 'تيزي وزو',
  16: 'الجزائر', 17: 'الجلفة', 18: 'جيجل', 19: 'سطيف', 20: 'سعيدة',
  21: 'سكيكدة', 22: 'سيدي بلعباس', 23: 'عنابة', 24: 'قالمة', 25: 'قسنطينة',
  26: 'المدية', 27: 'مستغانم', 28: 'المسيلة', 29: 'معسكر', 30: 'ورقلة',
  31: 'وهران', 32: 'البيض', 33: 'إليزي', 34: 'برج بوعريريج', 35: 'بومرداس',
  36: 'الطارف', 37: 'تندوف', 38: 'تيسمسيلت', 39: 'الوادي', 40: 'خنشلة',
  41: 'سوق أهراس', 42: 'تيبازة', 43: 'ميلة', 44: 'عين الدفلى', 45: 'النعامة',
  46: 'عين تموشنت', 47: 'غرداية', 48: 'غليزان',
  49: 'تيميمون', 50: 'برج باجي مختار', 51: 'أولاد جلال', 52: 'بني عباس',
  53: 'عين صالح', 54: 'عين قزام', 55: 'تقرت', 56: 'جانت', 57: 'المغير', 58: 'المنيعة',
}

// ── Types ──
interface Profile {
  id: string
  username: string
  full_name: string | null
  avatar_url: string | null
  bio: string | null
  role: string
  wilaya: number | null
  skills: string[] | null
  hourly_rate: number | null
  rating: number
  total_reviews: number
  created_at: string
  is_verified: boolean
}

interface CompletedContract {
  id: string
  title: string
  total_amount: number
  status: string
  start_date: string
  created_at: string
  updated_at: string
  client: { username: string; full_name: string } | null
  freelancer: { username: string; full_name: string } | null
}

interface Review {
  id: string
  rating: number
  comment: string | null
  created_at: string
  reviewer: { username: string; full_name: string } | null
}

interface PortfolioItem {
  id: string
  title: string
  description: string | null
  image_url: string
  project_link: string | null
}

interface ClientProfilePageProps {
  profile: Profile
  completedContracts: CompletedContract[]
  reviews: Review[]
  portfolios: PortfolioItem[]
  currentUserId: string | null
}

// ── Helpers ──
function timeAgo(date: string) {
  const diff = Date.now() - new Date(date).getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'اليوم'
  if (days === 1) return 'أمس'
  if (days < 30) return `منذ ${days} يوم`
  const months = Math.floor(days / 30)
  if (months < 12) return `منذ ${months} شهر`
  return `منذ ${Math.floor(months / 12)} سنة`
}

function StarRating({ rating, size = 'md' }: { rating: number; size?: 'sm' | 'md' | 'lg' }) {
  const sizeClass = size === 'lg' ? 'text-2xl' : size === 'md' ? 'text-lg' : 'text-sm'
  return (
    <div className={`flex items-center gap-0.5 ${sizeClass}`} dir="ltr">
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          className={star <= Math.round(rating) ? 'text-amber-400' : 'text-gray-300'}
        >
          ★
        </span>
      ))}
    </div>
  )
}

// ── Main Component ──
export default function ClientProfilePage({ profile, completedContracts, reviews, portfolios, currentUserId }: ClientProfilePageProps) {
  const isOwnProfile = currentUserId === profile.id
  const isFreelancer = profile.role === 'freelancer' || profile.role === 'both'
  const memberSince = new Date(profile.created_at).toLocaleDateString('ar-DZ', { year: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      {/* ── Navbar ── */}
      <nav className="bg-white/80 backdrop-blur-xl border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href="/dashboard" className="text-sm text-gray-500 hover:text-gray-900 transition-colors">← الرجوع</Link>
          <Link href={currentUserId ? '/dashboard' : '/'} className="flex items-center gap-1.5">
            <div className="w-7 h-7 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/></svg>
            </div>
            <span className="font-bold text-gray-900 text-base">خدمة<span className="text-emerald-500">.dz</span></span>
          </Link>
        </div>
      </nav>

      {/* ── Hero / Profile Header ── */}
      <div className="relative overflow-hidden bg-white border-b border-gray-100">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-50 rounded-full blur-3xl" />

        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-6 sm:pb-8">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-5 sm:gap-6">
            {/* Avatar */}
            <div className="relative group">
              <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-br from-emerald-100 to-emerald-200 flex items-center justify-center text-emerald-600 text-4xl sm:text-5xl font-bold shadow-sm ring-4 ring-white">
                {profile.avatar_url ? (
                  <img src={profile.avatar_url} alt={profile.full_name || profile.username} className="w-full h-full rounded-2xl object-cover" />
                ) : (
                  profile.full_name?.charAt(0) || profile.username.charAt(0).toUpperCase()
                )}
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-1 -left-1 w-5 h-5 bg-emerald-400 rounded-full border-4 border-white" />
            </div>

            {/* Info */}
            <div className="flex-1 text-center sm:text-right">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-2 sm:gap-3 mb-2">
                <div className="flex items-center gap-1.5">
                  <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{profile.full_name || profile.username}</h1>
                  {profile.is_verified && (
                    <div className="text-white bg-emerald-500 p-0.5 rounded-full shadow-sm" title="حساب موثق رسمياً">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <polyline points="20 6 9 17 4 12"></polyline>
                      </svg>
                    </div>
                  )}
                </div>
                {isFreelancer && (
                  <span className="bg-emerald-50 text-emerald-600 text-xs font-medium px-3 py-1 rounded-full border border-emerald-100">
                    🧑‍💻 مستقل
                  </span>
                )}
              </div>
              <p className="text-gray-500 text-sm mb-3">@{profile.username}</p>

              {/* Stats row */}
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-sm">
                {profile.rating > 0 && (
                  <div className="flex items-center gap-1.5">
                    <StarRating rating={profile.rating} size="sm" />
                    <span className="text-gray-900 font-medium">{profile.rating}</span>
                    <span className="text-gray-500">({profile.total_reviews})</span>
                  </div>
                )}
                {profile.wilaya && (
                  <span className="text-gray-500 flex items-center gap-1">
                    <span className="text-base">📍</span>
                    {wilayaNames[profile.wilaya] || `ولاية ${profile.wilaya}`}
                  </span>
                )}
                <span className="text-gray-500 flex items-center gap-1">
                  <span className="text-base">📅</span>
                  عضو منذ {memberSince}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            {!isOwnProfile && currentUserId && (
              <div className="flex flex-col gap-2 mt-2 sm:mt-0">
                <Link
                  href={`/messages?user=${profile.id}`}
                  className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 rounded-xl text-sm font-medium transition-colors text-center shadow-sm hover:shadow-emerald-500/25"
                >
                  💬 أرسل رسالة
                </Link>
                <Link
                  href="/jobs/new"
                  className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-6 py-2.5 rounded-xl text-sm font-medium transition-colors text-center"
                >
                  💼 وظّفني
                </Link>
              </div>
            )}
            {isOwnProfile && (
              <Link
                href="/dashboard"
                className="bg-gray-100 hover:bg-gray-200 text-gray-900 px-5 py-2.5 rounded-xl text-sm font-medium transition-colors mt-2 sm:mt-0"
              >
                ✏️ تعديل الملف
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Content ── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-5 sm:gap-6">

          {/* ── Left Column: Bio + Skills ── */}
          <div className="space-y-5">
            {/* Bio Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-base">📝</span> نبذة عني
              </h2>
              {profile.bio ? (
                <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{profile.bio}</p>
              ) : (
                <p className="text-gray-400 text-sm italic">لم يتم إضافة نبذة بعد</p>
              )}
            </div>

            {/* Skills Card */}
            {profile.skills && profile.skills.length > 0 && (
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
                <h2 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <span className="text-base">🛠️</span> المهارات
                </h2>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, i) => (
                    <span
                      key={i}
                      className="bg-emerald-50 text-emerald-700 text-xs font-medium px-3 py-1.5 rounded-lg border border-emerald-100"
                    >
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Stats Card */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <span className="text-base">📊</span> إحصائيات
              </h2>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <div className="text-xl font-bold text-emerald-600">{completedContracts.length}</div>
                  <div className="text-xs text-gray-500 mt-1">مشروع مكتمل</div>
                </div>
                <div className="bg-gray-50 rounded-xl p-3 text-center border border-gray-100">
                  <div className="text-xl font-bold text-amber-500">{profile.total_reviews}</div>
                  <div className="text-xs text-gray-500 mt-1">تقييم</div>
                </div>
                {profile.hourly_rate && (
                  <div className="bg-gray-50 rounded-xl p-3 text-center col-span-2 border border-gray-100">
                    <div className="text-xl font-bold text-gray-900">{profile.hourly_rate.toLocaleString()} <span className="text-sm text-gray-500">دج/ساعة</span></div>
                    <div className="text-xs text-gray-500 mt-1">السعر بالساعة</div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* ── Right Column: Projects + Reviews ── */}
          <div className="lg:col-span-2 space-y-5 sm:space-y-6">

            {/* Portfolio Grid */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-base">🎨</span> معرض الأعمال
                </h2>
                {portfolios && portfolios.length > 0 && (
                  <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100">
                    {portfolios.length} أعمال
                  </span>
                )}
              </div>
              
              {!portfolios || portfolios.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
                  <div className="text-5xl mb-3 opacity-30">🖼️</div>
                  <p className="text-gray-500 text-sm">لم يقم بإضافة أي أعمال لمعرضه بعد</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {portfolios.map(item => (
                    <div key={item.id} className="group border border-gray-100 rounded-xl overflow-hidden bg-white hover:border-emerald-300 transition-all shadow-sm hover:shadow-md">
                      <div className="aspect-video w-full relative overflow-hidden bg-gray-50">
                        <img src={item.image_url} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      </div>
                      <div className="p-4">
                        <h3 className="font-bold text-gray-900 text-sm mb-1 truncate group-hover:text-emerald-600 transition-colors">{item.title}</h3>
                        {item.description && <p className="text-gray-500 text-xs line-clamp-2 mb-3">{item.description}</p>}
                        {item.project_link && (
                          <a href={item.project_link} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 text-xs font-medium inline-flex items-center gap-1 transition-colors">
                            <span>🔗</span> عرض المشروع
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Completed Projects */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-base">🏆</span> المشاريع المكتملة
                </h2>
                {completedContracts.length > 0 && (
                  <span className="text-xs bg-emerald-50 text-emerald-600 px-2.5 py-1 rounded-full border border-emerald-100">
                    {completedContracts.length} مشروع
                  </span>
                )}
              </div>

              {completedContracts.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
                  <div className="text-5xl mb-3 opacity-30">📂</div>
                  <p className="text-gray-500 text-sm">لا توجد مشاريع مكتملة بعد</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {completedContracts.map((contract) => (
                    <Link
                      key={contract.id}
                      href={`/contracts/${contract.id}`}
                      className="flex items-center justify-between p-4 rounded-xl border border-gray-100 bg-gray-50 hover:bg-emerald-50 hover:border-emerald-200 transition-all group"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs px-2 py-0.5 rounded-lg font-medium bg-emerald-100 text-emerald-700">
                            مكتمل ✓
                          </span>
                          <span className="text-xs text-gray-500">{timeAgo(contract.updated_at)}</span>
                        </div>
                        <h3 className="font-medium text-gray-900 text-sm group-hover:text-emerald-600 transition-colors truncate">
                          {contract.title}
                        </h3>
                        {contract.client && contract.client.username !== profile.username ? (
                          <p className="text-xs text-gray-500 mt-1">
                            لصالح: {contract.client.full_name || contract.client.username}
                          </p>
                        ) : contract.freelancer && contract.freelancer.username !== profile.username ? (
                          <p className="text-xs text-gray-500 mt-1">
                            المستقل: {contract.freelancer.full_name || contract.freelancer.username}
                          </p>
                        ) : null}
                      </div>
                      <div className="text-sm font-semibold text-emerald-600 mr-4 flex-shrink-0">
                        {contract.total_amount?.toLocaleString()} دج
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Reviews */}
            <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6 shadow-sm">
              <div className="flex items-center justify-between mb-5">
                <h2 className="font-semibold text-gray-900 flex items-center gap-2">
                  <span className="text-base">⭐</span> التقييمات
                </h2>
                {profile.rating > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={profile.rating} size="sm" />
                    <span className="text-sm font-bold text-gray-900">{profile.rating}</span>
                  </div>
                )}
              </div>

              {reviews.length === 0 ? (
                <div className="text-center py-10 border-2 border-dashed border-gray-100 rounded-2xl">
                  <div className="text-5xl mb-3 opacity-30">💬</div>
                  <p className="text-gray-500 text-sm">لا توجد تقييمات بعد</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {reviews.map((review) => (
                    <div key={review.id} className="border border-gray-100 rounded-xl p-4 bg-gray-50">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-sm font-bold flex-shrink-0">
                            {review.reviewer?.full_name?.charAt(0) || '؟'}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-gray-900">
                              {review.reviewer?.full_name || 'مستخدم مجهول'}
                            </div>
                            <div className="text-xs text-gray-500">{timeAgo(review.created_at)}</div>
                          </div>
                        </div>
                        <StarRating rating={review.rating} size="sm" />
                      </div>
                      {review.comment && (
                        <p className="text-sm text-gray-600 leading-relaxed mt-2 pr-12">{review.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
