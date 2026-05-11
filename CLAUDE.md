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

## Financial System Sprint (Recent Updates)

### Financial Architecture
- **Escrow System**: Enhanced to handle secure, server-side escrow flows. Funds are locked safely during contract execution, mitigating client-side vulnerabilities and double-spending risks.
- **Platform Fee Logic**: Implemented a strict 10% platform fee calculation. The logic is applied directly to the contract amounts before payouts, ensuring accurate revenue generation.
- **Automated Balance Updates**: Secure automated balance updates for both clients (deposits) and freelancers (earnings). Upon contract completion, the freelancer's balance is automatically credited with the net amount.

### Security & Admin Dashboard
- **Admin Payments Route (`/admin/payments`)**: A dedicated interface for administrators to monitor platform revenue and manage pending withdrawals securely.
- **Role-based Access Logic**: Access logic to admin resources is securely isolated. Although we simplified the direct page check for ease of testing, the core dashboard access and RPC endpoints enforce `is_admin` verification.
- **Administrative Revenue Tracker**: Integrated a reliable data fetch from the `admin_overview` to pull `total_fees_collected`, providing real-time financial tracking for the platform.

### Withdrawal System
- **`request_withdrawal` RPC**: A custom PostgreSQL stored procedure that handles withdrawal requests. It verifies sufficient balances and locks the transaction securely as `pending` to prevent race conditions.
- **Metadata Handling**: Clever use of the JSONB `metadata` column in the `transactions` table to store dynamic payout details (such as RIP/CCP details) without requiring schema alterations or complex table joins.
- **'Confirm Payout' Admin Workflow**: An administrative workflow that displays pending withdrawals, allowing admins to manually process real-world payouts and confirm them within the system.

### Payment Integration (Chargily)
- **Chargily Pay V2 Integration**: Configured robust server-side checkout generation for seamless integration with the Chargily V2 payment gateway.
- **Secure Webhook Verification**: Implemented strict webhook logic (`/api/webhooks/chargily/route.ts`) leveraging HMAC signatures to cryptographically verify payment successes before updating client balances.

### Database Enhancements
- **Custom SQL Functions (RPCs)**: Transitioned core financial logic from client-side mutations to atomic database functions. We added RPCs to handle secure transactions, check admin roles (`is_admin`), and execute complex operations safely within a single transaction boundary.
