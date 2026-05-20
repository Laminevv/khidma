import Link from 'next/link'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'

export const metadata: Metadata = {
  title: 'سياسة الخصوصية',
  description: 'سياسة الخصوصية وحماية البيانات الشخصية لمنصة خدمة.dz.',
}

const LAST_UPDATED = '20 مايو 2026'

function Section({ id, icon, title, children }: { id: string; icon: string; title: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3 mb-5">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl flex-shrink-0">
          {icon}
        </div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{title}</h2>
      </div>
      <div className="text-gray-600 leading-[1.9] text-[15px] space-y-4 pr-1">
        {children}
      </div>
    </section>
  )
}

export default async function PrivacyPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const sections = [
    { id: 'intro', title: 'مقدمة', icon: '📋' },
    { id: 'data-collected', title: 'البيانات التي نجمعها', icon: '📊' },
    { id: 'data-usage', title: 'كيفية استخدام البيانات', icon: '⚙️' },
    { id: 'kyc-data', title: 'بيانات التحقق من الهوية', icon: '🪪' },
    { id: 'financial-data', title: 'البيانات المالية', icon: '💳' },
    { id: 'cookies', title: 'ملفات تعريف الارتباط (Cookies)', icon: '🍪' },
    { id: 'sharing', title: 'مشاركة البيانات مع أطراف ثالثة', icon: '🤝' },
    { id: 'security', title: 'أمان البيانات', icon: '🔐' },
    { id: 'rights', title: 'حقوقك كمستخدم', icon: '✋' },
    { id: 'retention', title: 'مدة الاحتفاظ بالبيانات', icon: '📅' },
    { id: 'children', title: 'خصوصية الأطفال', icon: '👶' },
    { id: 'changes', title: 'تحديثات سياسة الخصوصية', icon: '📝' },
    { id: 'contact', title: 'التواصل معنا', icon: '📧' },
  ]

  return (
    <main className="min-h-screen bg-gray-50" dir="rtl">

      {/* Navbar */}
      <nav className="bg-white/90 backdrop-blur-md border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <Link href={user ? '/dashboard' : '/'} className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 2L10 6H14L11 9L12 13L8 10.5L4 13L5 9L2 6H6L8 2Z" fill="white" />
              </svg>
            </div>
            <span className="text-lg font-bold text-gray-900">
              خدمة<span className="text-emerald-500">.dz</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/terms" className="text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors hidden sm:block">
              شروط الاستخدام
            </Link>
            <Link href="/" className="text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors">
              الرئيسية
            </Link>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">

          {/* Sidebar — Table of Contents */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="lg:sticky lg:top-24">
              <div className="bg-white rounded-2xl border border-gray-100 p-5 sm:p-6">
                <h3 className="font-bold text-gray-900 mb-4 text-sm">فهرس المحتويات</h3>
                <nav className="space-y-1 max-h-[60vh] overflow-y-auto">
                  {sections.map((s) => (
                    <a
                      key={s.id}
                      href={`#${s.id}`}
                      className="flex items-center gap-2 text-sm text-gray-500 hover:text-emerald-600 hover:bg-emerald-50 px-3 py-2 rounded-lg transition-all"
                    >
                      <span className="text-xs">{s.icon}</span>
                      <span>{s.title}</span>
                    </a>
                  ))}
                </nav>
              </div>
            </div>
          </aside>

          {/* Main Content */}
          <article className="flex-1 min-w-0">

            {/* Header */}
            <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10 mb-8">
              <div className="inline-flex items-center gap-2 bg-emerald-50 text-emerald-700 text-xs font-medium px-4 py-2 rounded-full mb-5 border border-emerald-100">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>
                حماية بياناتك أولوية
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">سياسة الخصوصية</h1>
              <p className="text-gray-500 text-sm leading-relaxed max-w-2xl">
                نلتزم في خدمة.dz بحماية خصوصيتك وبياناتك الشخصية. تشرح هذه السياسة كيفية جمع واستخدام وحماية معلوماتك عند استخدام منصتنا.
              </p>
              <div className="flex items-center gap-4 mt-5 text-xs text-gray-400">
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
                  آخر تحديث: {LAST_UPDATED}
                </span>
                <span className="flex items-center gap-1">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
                  ~8 دقائق قراءة
                </span>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-10">
              <div className="bg-white rounded-2xl border border-gray-100 p-6 sm:p-10 space-y-12">

                <Section id="intro" icon="📋" title="مقدمة">
                  <p>
                    مرحباً بكم في سياسة الخصوصية الخاصة بمنصة <strong>خدمة.dz</strong>. نحن نؤمن بأن حماية بياناتك الشخصية حق أساسي لك، ونلتزم بالشفافية الكاملة حول كيفية تعاملنا مع معلوماتك.
                  </p>
                  <p>
                    تنطبق هذه السياسة على جميع مستخدمي المنصة، سواء كانوا عملاءً أو مستقلين، وتغطي جميع البيانات التي نجمعها عبر الموقع الإلكتروني وتطبيقاتنا.
                  </p>
                </Section>

                <hr className="border-gray-100" />

                <Section id="data-collected" icon="📊" title="البيانات التي نجمعها">
                  <p>نقوم بجمع أنواع مختلفة من البيانات لتقديم خدماتنا وتحسينها:</p>
                  <p><strong>1. البيانات المقدمة مباشرة منك:</strong></p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>الاسم الكامل والبريد الإلكتروني ورقم الهاتف عند التسجيل.</li>
                    <li>اسم المستخدم والسيرة الذاتية المهنية والمهارات.</li>
                    <li>صورة الملف الشخصي وروابط معرض الأعمال.</li>
                    <li>محتوى الرسائل المتبادلة عبر نظام المراسلة الداخلي.</li>
                    <li>محتوى المشاريع والعروض والعقود.</li>
                  </ul>
                  <p><strong>2. البيانات المُجمّعة تلقائياً:</strong></p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>عنوان IP ونوع المتصفح ونظام التشغيل.</li>
                    <li>صفحات المنصة التي تمت زيارتها ومدة كل زيارة.</li>
                    <li>بيانات الجهاز (نوع، دقة الشاشة، اللغة).</li>
                    <li>سجل تسجيل الدخول والنشاطات الأمنية على الحساب.</li>
                  </ul>
                </Section>

                <hr className="border-gray-100" />

                <Section id="data-usage" icon="⚙️" title="كيفية استخدام البيانات">
                  <p>نستخدم بياناتك للأغراض التالية حصرياً:</p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li><strong>تقديم الخدمة:</strong> إنشاء الحسابات، إدارة المشاريع والعقود، معالجة المدفوعات.</li>
                    <li><strong>الأمان:</strong> حماية الحسابات من الوصول غير المصرح به، الكشف عن الاحتيال.</li>
                    <li><strong>التحسين:</strong> تحليل أنماط الاستخدام لتحسين تجربة المنصة وميزاتها.</li>
                    <li><strong>التواصل:</strong> إرسال إشعارات المعاملات، تنبيهات الأمان، وتحديثات المنصة.</li>
                    <li><strong>الامتثال القانوني:</strong> الالتزام بالتشريعات المحلية ومتطلبات مكافحة غسل الأموال.</li>
                    <li><strong>حل النزاعات:</strong> مراجعة بيانات العقود والرسائل عند فتح نزاع بين الأطراف.</li>
                  </ul>
                  <p>
                    <strong>لا نستخدم بياناتك</strong> لأغراض إعلانية تجارية مع أطراف ثالثة، ولا نبيع بياناتك الشخصية لأي جهة تحت أي ظرف.
                  </p>
                </Section>

                <hr className="border-gray-100" />

                <Section id="kyc-data" icon="🪪" title="بيانات التحقق من الهوية">
                  <p>
                    في إطار عملية التحقق من الهوية (KYC)، نقوم بجمع ومعالجة الوثائق التالية:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>نسخة من بطاقة التعريف الوطنية أو جواز السفر.</li>
                    <li>صورة شخصية (Selfie) للتحقق من الهوية.</li>
                    <li>إثبات عنوان (في بعض الحالات).</li>
                  </ul>
                  <p>ضمانات حماية وثائق KYC:</p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>تُخزّن الوثائق في خوادم مشفرة ومحمية.</li>
                    <li>يقتصر الوصول إليها على فريق التحقق المعتمد فقط.</li>
                    <li>تُحذف الوثائق تلقائياً بعد انتهاء الغرض منها أو إغلاق الحساب (مع مراعاة المتطلبات القانونية).</li>
                    <li>لا تُشارك مع أي طرف ثالث إلا بموجب أمر قضائي.</li>
                  </ul>
                </Section>

                <hr className="border-gray-100" />

                <Section id="financial-data" icon="💳" title="البيانات المالية">
                  <p>
                    نتعامل مع بيانات مالية حساسة بأقصى درجات الأمان:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li><strong>أرقام الحسابات:</strong> نحتفظ بأرقام حسابات CCP/بريدي موب لمعالجة عمليات السحب.</li>
                    <li><strong>إيصالات الدفع:</strong> تُخزّن إيصالات الإيداع اليدوية لأغراض التحقق والمراجعة.</li>
                    <li><strong>بيانات البطاقات:</strong> لا نخزّن أي بيانات بطاقات دفع (Edahabia/CIB). تتم معالجتها حصرياً عبر بوابة Chargily المعتمدة.</li>
                    <li><strong>سجل المعاملات:</strong> نحتفظ بسجل كامل لجميع المعاملات المالية لأغراض المحاسبة والامتثال.</li>
                  </ul>
                </Section>

                <hr className="border-gray-100" />

                <Section id="cookies" icon="🍪" title="ملفات تعريف الارتباط (Cookies)">
                  <p>نستخدم ملفات تعريف الارتباط والتقنيات المشابهة للأغراض التالية:</p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li><strong>ملفات ضرورية:</strong> للحفاظ على جلسة تسجيل الدخول وتأمين الحساب (لا يمكن تعطيلها).</li>
                    <li><strong>ملفات وظيفية:</strong> لتذكر تفضيلاتك (اللغة، إعدادات العرض).</li>
                    <li><strong>ملفات تحليلية:</strong> لفهم كيفية استخدام المنصة وتحسين الأداء.</li>
                  </ul>
                  <p>
                    لا نستخدم ملفات تعريف ارتباط إعلانية أو تتبعية لأطراف ثالثة. يمكنك التحكم في إعدادات الملفات من خلال متصفحك، مع العلم أن تعطيل الملفات الضرورية قد يؤثر على وظائف المنصة.
                  </p>
                </Section>

                <hr className="border-gray-100" />

                <Section id="sharing" icon="🤝" title="مشاركة البيانات مع أطراف ثالثة">
                  <p>لا نبيع بياناتك الشخصية. قد نشارك بيانات محدودة في الحالات التالية فقط:</p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li><strong>بوابات الدفع:</strong> مشاركة البيانات اللازمة لمعالجة المدفوعات مع Chargily (بيانات المعاملة فقط، وليس بيانات الحساب الشخصية).</li>
                    <li><strong>الالتزام القانوني:</strong> الاستجابة لأوامر قضائية أو طلبات رسمية من الجهات المختصة.</li>
                    <li><strong>حماية الحقوق:</strong> عند الضرورة لحماية حقوق المنصة أو مستخدميها من الاحتيال أو الأنشطة غير القانونية.</li>
                    <li><strong>مقدمو الخدمات التقنية:</strong> مشاركة بيانات تقنية مجهولة الهوية مع خدمات الاستضافة والتحليل (مثل: Supabase، Vercel).</li>
                  </ul>
                </Section>

                <hr className="border-gray-100" />

                <Section id="security" icon="🔐" title="أمان البيانات">
                  <p>نطبّق إجراءات أمنية متعددة لحماية بياناتك:</p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li><strong>التشفير:</strong> جميع الاتصالات مشفرة عبر بروتوكول SSL/TLS.</li>
                    <li><strong>تشفير البيانات:</strong> البيانات الحساسة (كلمات المرور، وثائق KYC) مشفرة في حالة السكون.</li>
                    <li><strong>التحكم في الوصول:</strong> نظام صلاحيات صارم يحدّ الوصول إلى البيانات الحساسة على أساس &quot;الحاجة للمعرفة&quot;.</li>
                    <li><strong>المراقبة:</strong> مراقبة مستمرة للأنشطة المشبوهة والمحاولات غير المصرح بها.</li>
                    <li><strong>النسخ الاحتياطي:</strong> نسخ احتياطية منتظمة لضمان عدم فقدان البيانات.</li>
                  </ul>
                  <p>
                    رغم حرصنا الشديد، لا يمكن ضمان أمان مطلق لأي نظام إلكتروني. نشجعك على استخدام كلمة مرور قوية وعدم مشاركة بيانات حسابك.
                  </p>
                </Section>

                <hr className="border-gray-100" />

                <Section id="rights" icon="✋" title="حقوقك كمستخدم">
                  <p>بصفتك مستخدماً للمنصة، لديك الحقوق التالية فيما يتعلق ببياناتك الشخصية:</p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li><strong>حق الوصول:</strong> طلب نسخة من جميع بياناتك الشخصية المحفوظة لدينا.</li>
                    <li><strong>حق التصحيح:</strong> تعديل أو تحديث بياناتك الشخصية غير الدقيقة.</li>
                    <li><strong>حق الحذف:</strong> طلب حذف حسابك وبياناتك الشخصية (مع مراعاة الالتزامات القانونية).</li>
                    <li><strong>حق الاعتراض:</strong> الاعتراض على معالجة بياناتك لأغراض معينة.</li>
                    <li><strong>حق نقل البيانات:</strong> الحصول على بياناتك بتنسيق قابل للقراءة آلياً.</li>
                  </ul>
                  <p>
                    لممارسة أي من هذه الحقوق، تواصل معنا عبر البريد الإلكتروني. سنرد على طلبك خلال 30 يوم عمل كحد أقصى.
                  </p>
                </Section>

                <hr className="border-gray-100" />

                <Section id="retention" icon="📅" title="مدة الاحتفاظ بالبيانات">
                  <p>نحتفظ ببياناتك وفقاً للمعايير التالية:</p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li><strong>بيانات الحساب:</strong> طوال فترة نشاط الحساب + 12 شهراً بعد الإغلاق.</li>
                    <li><strong>سجلات المعاملات:</strong> 10 سنوات (وفقاً لمتطلبات المحاسبة الجزائرية).</li>
                    <li><strong>وثائق KYC:</strong> 5 سنوات من تاريخ آخر معاملة أو إغلاق الحساب.</li>
                    <li><strong>سجلات الرسائل:</strong> طوال فترة نشاط الحساب + 6 أشهر بعد الإغلاق.</li>
                    <li><strong>سجلات الأمان:</strong> 24 شهراً من تاريخ التسجيل.</li>
                  </ul>
                  <p>
                    بعد انتهاء فترات الاحتفاظ، يتم حذف البيانات نهائياً أو تحويلها إلى بيانات مجهولة الهوية لا يمكن ربطها بشخص محدد.
                  </p>
                </Section>

                <hr className="border-gray-100" />

                <Section id="children" icon="👶" title="خصوصية الأطفال">
                  <p>
                    المنصة غير موجهة للأشخاص دون 18 سنة. لا نقوم عمداً بجمع بيانات شخصية من القاصرين. إذا اكتشفنا أن طفلاً دون 18 سنة قد أنشأ حساباً، سنقوم بحذفه فوراً مع جميع بياناته.
                  </p>
                  <p>
                    إذا كنت ولي أمر وتعتقد أن طفلك قد سجّل حساباً على المنصة، يرجى التواصل معنا فوراً لاتخاذ الإجراءات اللازمة.
                  </p>
                </Section>

                <hr className="border-gray-100" />

                <Section id="changes" icon="📝" title="تحديثات سياسة الخصوصية">
                  <p>
                    قد نقوم بتحديث هذه السياسة من وقت لآخر لتعكس التغييرات في ممارساتنا أو المتطلبات القانونية. في حالة إجراء تعديلات جوهرية:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li>سنُخطرك عبر البريد الإلكتروني أو إشعار بارز في المنصة.</li>
                    <li>سنُحدّث تاريخ &quot;آخر تحديث&quot; في أعلى هذه الصفحة.</li>
                    <li>ننصحك بمراجعة هذه السياسة بشكل دوري للبقاء على اطلاع.</li>
                  </ul>
                </Section>

                <hr className="border-gray-100" />

                <Section id="contact" icon="📧" title="التواصل معنا">
                  <p>
                    لأي استفسارات حول سياسة الخصوصية هذه أو لممارسة حقوقك المتعلقة ببياناتك الشخصية:
                  </p>
                  <ul className="list-disc list-inside space-y-2 mr-4">
                    <li><strong>البريد الإلكتروني:</strong> privacy@khidma.dz</li>
                    <li><strong>البريد الإلكتروني العام:</strong> support@khidma.dz</li>
                    <li><strong>نموذج الاتصال:</strong> متاح عبر صفحة &quot;اتصل بنا&quot; في المنصة.</li>
                  </ul>
                  <p>
                    نلتزم بالرد على جميع الاستفسارات المتعلقة بالخصوصية خلال 15 يوم عمل كحد أقصى.
                  </p>
                </Section>

              </div>
            </div>
          </article>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12 py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-400">
          <p>جميع الحقوق محفوظة © {new Date().getFullYear()} خدمة.dz</p>
          <div className="flex gap-6">
            <Link href="/terms" className="hover:text-emerald-600 transition-colors">شروط الاستخدام</Link>
            <Link href="/" className="hover:text-emerald-600 transition-colors">الرئيسية</Link>
          </div>
        </div>
      </footer>
    </main>
  )
}
