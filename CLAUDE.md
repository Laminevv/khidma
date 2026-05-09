# خدمة.dz — Algerian Freelance Marketplace

## نظرة عامة
منصة عمل حر جزائرية مبنية بـ Next.js 15 + Supabase + Tailwind CSS.
الاتجاه: RTL (عربي) — اللون الرئيسي: Emerald Green (#10b981) — الثانوي: Crimson Red.

## Tech Stack
- **Frontend**: Next.js 15.1.0 (App Router, TypeScript, Tailwind CSS)
- **Backend/DB**: Supabase (Auth, PostgreSQL, Realtime, Storage)
- **i18n**: ملفات JSON في /i18n/ (ar, fr, en)
- **Realtime**: Supabase Realtime مفعّل على messages + contracts

## بنية المشروع
```
khidma2/
├── app/
│   ├── page.tsx              ✅ الصفحة الرئيسية (Landing)
│   ├── layout.tsx            ✅ RTL + Tajawal font
│   ├── globals.css           ✅ input color fix
│   ├── auth/
│   │   ├── login/page.tsx    ✅ تسجيل الدخول
│   │   └── register/page.tsx ✅ التسجيل (client/freelancer)
│   ├── dashboard/page.tsx    ✅ لوحة التحكم
│   ├── jobs/
│   │   ├── page.tsx          ✅ قائمة المشاريع + فلاتر
│   │   ├── new/page.tsx      ✅ نشر مشروع جديد
│   │   └── [id]/page.tsx     ✅ تفاصيل + عروض + قبول عرض
│   ├── contracts/
│   │   ├── page.tsx          ✅ قائمة العقود
│   │   └── [id]/page.tsx     ✅ تفاصيل العقد + Escrow
│   ├── messages/page.tsx     ✅ Chat فوري (Supabase Realtime)
│   └── admin/page.tsx        ✅ لوحة الإدارة (admin only)
├── lib/
│   ├── supabase.ts           ✅ Supabase client
│   └── realtime.js           ✅ Realtime subscriptions
├── i18n/
│   ├── ar.json               ✅ العربية (RTL)
│   ├── fr.json               ✅ الفرنسية
│   └── en.json               ✅ الإنجليزية
└── supabase/
    └── schema.sql            ✅ Schema كامل
```

## قاعدة البيانات — Supabase
**الجداول:** profiles, jobs, proposals, contracts, messages, transactions, reviews, disputes, notifications, skills_catalog

**RLS مفعّل** على كل الجداول.

**Policies مهمة تمت إضافتها يدوياً:**
- `contracts_client_insert` — السماح للعميل بإنشاء عقد
- `ALTER PUBLICATION supabase_realtime ADD TABLE messages` ✅
- `ALTER PUBLICATION supabase_realtime ADD TABLE contracts` ✅

**Triggers:**
- `handle_new_user` — إنشاء profile تلقائي عند التسجيل
- `contract_completed_trigger` — تغيير status المشروع لـ completed عند اكتمال العقد
- `set_updated_at` — تحديث updated_at تلقائياً

**تعديلات على Schema:**
- `room_id` في messages تم تغييره لـ TEXT (بدل UUID)

## المستخدمون التجريبيون
| username | role | is_admin |
|----------|------|----------|
| lamine17 | client | ✅ |
| mido12 | freelancer | ❌ |
| moha_lam | freelancer | ❌ |
| chiboutmohamed123 | client | ❌ |

## الميزات المكتملة ✅
1. **Auth** — تسجيل دخول/خروج + حماية الصفحات
2. **Job Board** — نشر + تصفح + فلاتر + بحث
3. **Proposals** — تقديم عرض + عرض العروض لصاحب العمل
4. **Contracts** — إنشاء عقد عند قبول العرض
5. **Escrow** — تأمين أموال + تسليم عمل + موافقة + تحرير دفعة (5% رسوم)
6. **Chat** — رسائل فورية بين المستخدمين (Supabase Realtime)
7. **Admin** — إدارة مستخدمين + مشاريع + إحصائيات
8. **i18n** — ثلاث لغات جاهزة

## ما تبقى ⏳
- Deploy على Vercel
- تحسينات UI/UX
- صفحة Profile للمستقل
- نظام التقييمات (Reviews)
- نظام الإشعارات (Notifications)
- صفحة المحفظة (Wallet)

## مشاكل معروفة وحلولها
- **input color**: أضف `style={{ color: '#111827', backgroundColor: '#ffffff' }}` لكل input
- **useEffect loop**: استخدم `[]` بدل `[router]` في dependency array
- **Turbopack crash**: استخدم Next.js 15.1.0 بدل 16.x
- **RLS block**: تحقق من policies عند أي خطأ في INSERT

## أوامر مهمة
```bash
cd C:\Users\mido\Desktop\khidma\khidma2
npm run dev          # تشغيل المشروع
npm install          # تثبيت المكتبات
```

## ملاحظات للمحادثات القادمة
- المشروع في مرحلة متقدمة — لا تعيد بناء ما هو موجود
- كل ملف جديد يوضع في /mnt/user-data/outputs/khidma2/
- المستخدم يستبدل الملفات يدوياً في جهازه
- تجنب Turbopack — Next.js 15.1.0 فقط
- الـ RLS يحتاج policies يدوية في Supabase عند أي جدول جديد
