'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'

export default function Home() {
  const router = useRouter()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [latestJobs, setLatestJobs] = useState<any[]>([])

  useEffect(() => {
    const init = async () => {
      const { data: authData } = await supabase.auth.getUser()
      setUser(authData.user)

      const { data: jobs } = await supabase
        .from('jobs')
        .select(`
          id,
          title,
          category,
          budget_min,
          budget_max,
          created_at,
          profiles:client_id(full_name, username)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false })
        .limit(6)
      
      if (jobs) {
        setLatestJobs(jobs)
      }
      setLoading(false)
    }

    init()
  }, [])

  function timeAgo(date: string) {
    const diff = Date.now() - new Date(date).getTime()
    const days = Math.floor(diff / 86400000)
    if (days === 0) {
      const hours = Math.floor(diff / 3600000)
      if (hours === 0) return 'منذ لحظات'
      return `منذ ${hours} ساعة`
    }
    if (days === 1) return 'أمس'
    return `منذ ${days} يوم`
  }

  const categories = [
    { name: 'برمجة وتطوير', icon: '💻', count: '120+' },
    { name: 'تصميم جرافيك', icon: '🎨', count: '85+' },
    { name: 'ترجمة وكتابة', icon: '✍️', count: '45+' },
    { name: 'مونتاج وفيديو', icon: '🎬', count: '30+' },
    { name: 'تسويق رقمي', icon: '📱', count: '55+' },
    { name: 'استشارات', icon: '💡', count: '20+' },
  ]

  return (
    <main className="min-h-screen bg-white" dir="rtl">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/>
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">
              خدمة<span className="text-emerald-500">.dz</span>
            </span>
          </Link>

          <div className="flex items-center gap-4">
            <Link href="/jobs" className="text-sm font-medium text-gray-600 hover:text-emerald-600 transition-colors hidden sm:block">
              تصفح المشاريع
            </Link>
            {!loading && (
              user ? (
                <Link href="/dashboard"
                  className="text-sm bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/20">
                  لوحة التحكم
                </Link>
              ) : (
                <>
                  <Link href="/auth/login" className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors">
                    دخول
                  </Link>
                  <Link href="/auth/register"
                    className="text-sm bg-emerald-500 text-white px-5 py-2.5 rounded-xl font-medium hover:bg-emerald-600 transition-colors shadow-sm shadow-emerald-500/20">
                    حساب جديد
                  </Link>
                </>
              )
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 overflow-hidden">
        {/* Background Accents */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-emerald-50 rounded-full blur-[100px] -z-10 translate-x-1/3 -translate-y-1/4" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-emerald-100/50 rounded-full blur-[80px] -z-10 -translate-x-1/3 translate-y-1/3" />

        <div className="max-w-5xl mx-auto text-center mt-10">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-medium px-4 py-2 rounded-full mb-8 border border-emerald-100 shadow-sm">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            المنصة الأولى للعمل الحر في الجزائر
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold text-gray-900 leading-[1.2] mb-6 tracking-tight">
            وظّف أفضل المستقلين <br className="hidden sm:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-emerald-400 to-emerald-600">الجزائريين لمشروعك القادم</span>
          </h1>

          <p className="text-lg sm:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed font-medium">
            مئات المستقلين المبدعين جاهزون لتحويل أفكارك إلى واقع. ادفع بأمان وبكل ثقة عبر نظام الضمان المحلي الخاص بنا.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            {user ? (
              <Link href="/dashboard"
                className="w-full sm:w-auto bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-600 transition-all hover:shadow-lg hover:shadow-emerald-500/30 text-lg">
                الذهاب للوحة التحكم
              </Link>
            ) : (
              <>
                <Link href="/auth/register?role=client"
                  className="w-full sm:w-auto bg-emerald-500 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-600 transition-all hover:shadow-lg hover:shadow-emerald-500/30 text-lg">
                  💼 انشر مشروعاً الآن
                </Link>
                <Link href="/jobs"
                  className="w-full sm:w-auto bg-white border-2 border-gray-200 text-gray-700 px-8 py-4 rounded-xl font-bold hover:border-emerald-200 hover:bg-emerald-50 hover:text-emerald-700 transition-all text-lg">
                  🔍 تصفح المشاريع المتاحة
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* How It Works (Trust & Security) */}
      <section className="py-20 px-6 bg-gray-50 border-y border-gray-100">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">كيف تعمل منصة خدمة.dz؟</h2>
            <p className="text-gray-500 text-lg max-w-2xl mx-auto">نظام ضمان متكامل يضمن حق الطرفين، بدون مخاطر، وبطرق دفع محلية.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 relative">
            <div className="hidden md:block absolute top-8 left-[10%] right-[10%] h-0.5 bg-gradient-to-r from-emerald-100 via-emerald-200 to-emerald-100 z-0" />
            
            {[
              { step: '1', title: 'انشر مشروعك', desc: 'اكتب تفاصيل مشروعك وميزانيتك مجاناً لتتلقى عروض المستقلين.', icon: '📝' },
              { step: '2', title: 'اختر المستقل', desc: 'قارن العروض، تصفح معرض الأعمال، واختر المستقل الأنسب لك.', icon: '🔍' },
              { step: '3', title: 'ادفع بأمان (Escrow)', desc: 'ادفع عبر بريدي موب، وستبقى أموالك محجوزة بأمان حتى الاستلام.', icon: '🛡️' },
              { step: '4', title: 'استلم عملك', desc: 'حرّر الدفعة للمستقل فقط بعد استلامك للعمل كاملاً والموافقة عليه.', icon: '✅' },
            ].map((s) => (
              <div key={s.step} className="relative z-10 text-center bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center text-2xl mx-auto mb-5 rotate-3 hover:rotate-0 transition-transform">
                  {s.icon}
                </div>
                <div className="absolute -top-3 -right-3 w-8 h-8 bg-gray-900 text-white rounded-full flex items-center justify-center font-bold text-sm border-4 border-white shadow-sm">
                  {s.step}
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{s.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Categories Grid */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col sm:flex-row items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">تصفح حسب التصنيف</h2>
              <p className="text-gray-500">اكتشف أفضل المهارات في شتى المجالات</p>
            </div>
            <Link href="/jobs" className="hidden sm:inline-flex items-center gap-1 text-emerald-600 font-medium hover:text-emerald-700">
              عرض كل المشاريع ←
            </Link>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {categories.map((cat) => (
              <Link key={cat.name} href={`/jobs?category=${cat.name}`} className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-emerald-300 hover:shadow-md transition-all text-center group">
                <div className="text-4xl mb-4 group-hover:scale-110 transition-transform">{cat.icon}</div>
                <h3 className="font-bold text-gray-900 text-sm mb-1">{cat.name}</h3>
                <p className="text-xs text-gray-400">{cat.count} مشروع</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Latest Jobs */}
      <section className="py-20 px-6 bg-emerald-50/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">أحدث المشاريع المتاحة</h2>
            <p className="text-gray-500">فرص عمل جديدة تضاف يومياً</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
          ) : latestJobs.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {latestJobs.map((job) => (
                <Link key={job.id} href={`/jobs/${job.id}`} className="bg-white p-6 rounded-2xl border border-gray-100 hover:border-emerald-300 hover:shadow-lg transition-all flex flex-col h-full group">
                  <div className="flex justify-between items-start mb-4">
                    <span className="bg-gray-50 text-gray-600 text-xs font-medium px-3 py-1 rounded-lg border border-gray-200">
                      {job.category}
                    </span>
                    <span className="text-emerald-600 font-bold text-sm bg-emerald-50 px-3 py-1 rounded-lg">
                      {job.budget_min} - {job.budget_max} دج
                    </span>
                  </div>
                  <h3 className="font-bold text-gray-900 text-lg mb-2 leading-snug group-hover:text-emerald-600 transition-colors line-clamp-2">
                    {job.title}
                  </h3>
                  <div className="mt-auto pt-4 flex items-center justify-between border-t border-gray-50">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 text-xs font-bold">
                        {job.profiles?.full_name?.charAt(0) || job.profiles?.username?.charAt(0)}
                      </div>
                      <span className="text-sm font-medium text-gray-700 truncate max-w-[100px]">
                        {job.profiles?.full_name || job.profiles?.username}
                      </span>
                    </div>
                    <span className="text-xs text-gray-400 font-medium">
                      {timeAgo(job.created_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 bg-white rounded-2xl border border-gray-100">
              <p className="text-gray-500">لا توجد مشاريع مفتوحة حالياً.</p>
            </div>
          )}

          <div className="text-center mt-12">
            <Link href="/jobs" className="inline-flex items-center gap-2 bg-white text-emerald-600 border-2 border-emerald-100 px-8 py-3.5 rounded-xl font-bold hover:bg-emerald-50 hover:border-emerald-200 transition-all">
              تصفح المزيد من المشاريع
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Bottom */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="bg-emerald-600 rounded-[2.5rem] p-10 sm:p-16 text-center relative overflow-hidden shadow-2xl shadow-emerald-600/20">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-400 rounded-full blur-[80px] opacity-50" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-700 rounded-full blur-[80px] opacity-50" />
            
            <div className="relative z-10">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6">مستعد لتبدأ رحلتك؟</h2>
              <p className="text-emerald-100 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                سواء كنت تبحث عن مستقل محترف لتنفيذ فكرتك، أو تبحث عن فرص عمل تليق بمهاراتك.
              </p>
              
              {!user && (
                <div className="flex flex-col sm:flex-row justify-center gap-4">
                  <Link href="/auth/register?role=freelancer" className="bg-white text-emerald-600 px-8 py-4 rounded-xl font-bold hover:bg-gray-50 transition-colors shadow-lg shadow-black/5">
                    سجل كمستقل
                  </Link>
                  <Link href="/auth/register?role=client" className="bg-emerald-800 text-white px-8 py-4 rounded-xl font-bold hover:bg-emerald-900 transition-colors shadow-lg shadow-black/5 border border-emerald-700">
                    سجل كصاحب عمل
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 pt-16 pb-8 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            <div className="md:col-span-2">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/>
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">
                  خدمة<span className="text-emerald-500">.dz</span>
                </span>
              </Link>
              <p className="text-gray-500 leading-relaxed max-w-sm text-sm">
                المنصة الجزائرية الأولى التي تجمع بين الكفاءات المحلية وأصحاب المشاريع بنظام دفع آمن 100%.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-gray-900 mb-4">للمستقلين</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><Link href="/jobs" className="hover:text-emerald-600 transition-colors">تصفح المشاريع</Link></li>
                <li><Link href="/auth/register?role=freelancer" className="hover:text-emerald-600 transition-colors">إنشاء حساب</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">نظام الضمان</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-gray-900 mb-4">لأصحاب العمل</h4>
              <ul className="space-y-3 text-sm text-gray-500">
                <li><Link href="/auth/register?role=client" className="hover:text-emerald-600 transition-colors">نشر مشروع</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">كيفية التوظيف</Link></li>
                <li><Link href="#" className="hover:text-emerald-600 transition-colors">الدفع الآمن</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500">
            <p>جميع الحقوق محفوظة © {new Date().getFullYear()} خدمة.dz</p>
            <div className="flex gap-6">
              <Link href="#" className="hover:text-emerald-600 transition-colors">شروط الاستخدام</Link>
              <Link href="#" className="hover:text-emerald-600 transition-colors">سياسة الخصوصية</Link>
              <Link href="#" className="hover:text-emerald-600 transition-colors">اتصل بنا</Link>
            </div>
          </div>
        </div>
      </footer>
    </main>
  )
}
