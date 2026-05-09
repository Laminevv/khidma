import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-white" dir="rtl">

      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-white/90 backdrop-blur border-b border-gray-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white"/>
              </svg>
            </div>
            <span className="text-lg font-semibold text-gray-900">
              خدمة<span className="text-emerald-500">.dz</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            <Link href="/jobs" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              تصفح المشاريع
            </Link>
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900 transition-colors">
              تسجيل الدخول
            </Link>
            <Link href="/auth/register"
              className="text-sm bg-emerald-500 text-white px-4 py-2 rounded-lg hover:bg-emerald-600 transition-colors">
              ابدأ الآن
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-40 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-sm px-4 py-2 rounded-full mb-8 border border-emerald-100">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            منصة العمل الحر الجزائرية الأولى
          </div>

          <h1 className="text-5xl font-bold text-gray-900 leading-tight mb-6">
            اربط المواهب الجزائرية
            <br />
            <span className="text-emerald-500">بالفرص الحقيقية</span>
          </h1>

          <p className="text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            منصة آمنة للعمل الحر مع نظام ضمان محلي، دفع بـ CCP وبريدي موب، ودعم كامل باللغة العربية
          </p>

          <div className="flex items-center justify-center gap-4">
            <Link href="/auth/register?role=client"
              className="bg-emerald-500 text-white px-8 py-3.5 rounded-xl font-medium hover:bg-emerald-600 transition-all hover:shadow-lg hover:shadow-emerald-100">
              أنا أبحث عن مستقل
            </Link>
            <Link href="/auth/register?role=freelancer"
              className="border border-gray-200 text-gray-700 px-8 py-3.5 rounded-xl font-medium hover:border-emerald-300 hover:text-emerald-600 transition-all">
              أنا مستقل
            </Link>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-12 border-y border-gray-100 bg-gray-50">
        <div className="max-w-4xl mx-auto px-6">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: '1,200+', label: 'مستخدم نشط' },
              { value: '850+', label: 'مشروع منجز' },
              { value: '58', label: 'ولاية مغطاة' },
            ].map((s) => (
              <div key={s.label}>
                <div className="text-3xl font-bold text-gray-900 mb-1">{s.value}</div>
                <div className="text-sm text-gray-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">
            لماذا خدمة.dz؟
          </h2>
          <div className="grid grid-cols-3 gap-8">
            {[
              {
                icon: '🔒',
                title: 'نظام الضمان الآمن',
                desc: 'أموالك محمية — تُحجز عند بدء المشروع وتُحرَّر فقط عند موافقتك على التسليم',
              },
              {
                icon: '💳',
                title: 'دفع محلي 100%',
                desc: 'CCP، بريدي موب، CIB — بدون بطاقات دولية أو تحويلات معقدة',
              },
              {
                icon: '🌍',
                title: 'ثلاث لغات',
                desc: 'المنصة متاحة بالعربية والفرنسية والإنجليزية مع دعم RTL كامل',
              },
              {
                icon: '⚡',
                title: 'رسائل فورية',
                desc: 'تواصل مباشر بين صاحب العمل والمستقل مع إشعارات لحظية',
              },
              {
                icon: '⭐',
                title: 'نظام التقييم',
                desc: 'تقييمات شفافة تساعدك على اختيار الأفضل والبناء على سمعتك',
              },
              {
                icon: '🛡️',
                title: 'حل النزاعات',
                desc: 'فريق إدارة متخصص يتدخل عند أي خلاف لضمان حق الطرفين',
              },
            ].map((f) => (
              <div key={f.title}
                className="p-6 rounded-2xl border border-gray-100 hover:border-emerald-200 hover:shadow-sm transition-all group">
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="font-semibold text-gray-900 mb-2 group-hover:text-emerald-600 transition-colors">
                  {f.title}
                </h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-gray-900 text-center mb-16">كيف يعمل؟</h2>
          <div className="grid grid-cols-4 gap-6">
            {[
              { step: '01', title: 'انشر مشروعك', desc: 'صف احتياجاتك وميزانيتك' },
              { step: '02', title: 'استقبل عروضاً', desc: 'مستقلون معتمدون يتقدمون إليك' },
              { step: '03', title: 'ابدأ بأمان', desc: 'أموالك محجوزة في الضمان' },
              { step: '04', title: 'وافق واستلم', desc: 'حرّر الدفعة عند الرضا' },
            ].map((s, i) => (
              <div key={s.step} className="text-center relative">
                {i < 3 && (
                  <div className="absolute top-5 left-0 w-full h-px bg-emerald-100 -z-10" />
                )}
                <div className="w-10 h-10 bg-emerald-500 text-white rounded-full flex items-center justify-center text-sm font-bold mx-auto mb-4 relative z-10">
                  {s.step}
                </div>
                <h3 className="font-semibold text-gray-900 mb-1 text-sm">{s.title}</h3>
                <p className="text-xs text-gray-500">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-2xl mx-auto text-center">
          <div className="bg-emerald-500 rounded-3xl p-12 text-white">
            <h2 className="text-3xl font-bold mb-4">جاهز تبدأ؟</h2>
            <p className="text-emerald-100 mb-8">انضم لآلاف المستقلين وأصحاب العمل في الجزائر</p>
            <Link href="/auth/register"
              className="bg-white text-emerald-600 px-8 py-3.5 rounded-xl font-semibold hover:bg-emerald-50 transition-colors inline-block">
              إنشاء حساب مجاني
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 py-8 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between text-sm text-gray-400">
          <span>خدمة.dz © 2026 — منصة العمل الحر الجزائرية</span>
          <div className="flex gap-6">
            <Link href="#" className="hover:text-gray-600">الشروط</Link>
            <Link href="#" className="hover:text-gray-600">الخصوصية</Link>
            <Link href="#" className="hover:text-gray-600">اتصل بنا</Link>
          </div>
        </div>
      </footer>

    </main>
  )
}
