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
│   ├── profile/
│   │   └── [username]/       ✅ ملف المستقل العام (Dark-mode)
│   │       ├── page.tsx      ✅ Server Component (data fetching)
│   │       └── ClientProfilePage.tsx ✅ Client UI
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
9. **Public Profiles** — صفحة عامة للمستقل مع المشاريع المكتملة والتقييمات
10. **Reviews & Ratings** — نظام تقييم 1-5 نجوم + تعليق عند إكمال العقد
11. **Notifications** — إشعارات فورية + جرس + عداد غير مقروء + تنبيهات أحداث تلقائية
12. **Mobile Optimization** — واجهة مستخدم متجاوبة مع الهواتف الذكية (قائمة همبرغر، جداول قابلة للتمرير، الخ)
13. **Wallet & Withdrawals** — صفحة المحفظة مع سجل المعاملات وطلبات السحب (CCP/BaridiMob)

## ما تبقى ⏳
- Deploy على Vercel
- ~~تحسينات UI/UX (الهواتف)~~ ✅ تم
- ~~صفحة Profile للمستقل~~ ✅ تم
- ~~نظام التقييمات (Reviews)~~ ✅ تم
- ~~نظام الإشعارات (Notifications)~~ ✅ تم
- ~~صفحة المحفظة (Wallet)~~ ✅ تم

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

## Public Freelancer Profiles Sprint

### Route: `/profile/[username]`
- **Architecture**: Server Component (`page.tsx`) fetches data → passes to Client Component (`ClientProfilePage.tsx`)
- **Data Fetching** (Server-side):
  - Profile from `profiles` table (by username)
  - Completed contracts from `contracts` table (where `freelancer_id = profile.id` and `status = 'completed'`)
  - Reviews from `reviews` table (where `reviewee_id = profile.id`)
  - Current user auth state (for conditional UI: "Send Message" / "Hire Me" buttons)
- **UI/UX**:
  - Premium dark-mode design (`bg-gray-950`) with glassmorphic hero section
  - Gradient avatar with emerald accent ring and online indicator
  - Skills displayed as styled tags with hover effects
  - Stats grid (completed projects, reviews, hourly rate)
  - Completed projects list with links to contract details
  - Reviews section with star ratings and reviewer info
  - "Send Message" + "Hire Me" action buttons (hidden on own profile)
  - Fully responsive (mobile-first with `sm:` and `lg:` breakpoints)
  - RTL layout with Tajawal font
- **Error Handling**: Full try/catch on server component, 404 page for unknown usernames
- **SEO**: Dynamic `generateMetadata` for per-profile title and description
- **Navigation Links** (added to existing pages):
  - Dashboard sidebar: "ملفي الشخصي" quick link → `/profile/${username}`
  - Job detail proposals list: Freelancer names + avatars → `/profile/${username}` (clickable)
  - Job detail sidebar: Job owner name → `/profile/${username}` (clickable)
  - Contract detail sidebar: Client + Freelancer party names → `/profile/${username}` (clickable)

## Review & Rating System Sprint

### Architecture
- **Server Action**: `submitReviewAction` in `app/contracts/[id]/actions.ts`
- **Server Page**: `page.tsx` fetches existing reviews per contract and passes to client
- **Client UI**: Review section + modal integrated into `ClientContractPage.tsx`

### Rating Recalculation Logic
- **Fully automated via PostgreSQL trigger** (`update_user_rating`):
  - On every `INSERT` or `UPDATE` on `reviews`, the trigger fires
  - Calculates `AVG(rating)` across all reviews where `reviewee_id = NEW.reviewee_id`
  - Updates `profiles.rating` (rounded to 2 decimal places) and `profiles.total_reviews` (COUNT)
  - Zero application-level code needed for recalculation — the database handles it atomically

### Server-Side Validation (submitReviewAction)
- Auth verification
- Rating range check (1-5, integer only)
- Self-review prevention (`reviewer_id !== reviewee_id`)
- Contract completion verification (`status === 'completed'`)
- Party verification (only client/freelancer of the contract)
- Duplicate review prevention (checked both in-app and via DB UNIQUE constraint)

### UI Components
- **StarRatingInput**: Interactive 1-5 star selector with hover effects and scale animation
- **StarRatingDisplay**: Read-only star display for existing reviews
- **Review Modal**: Bottom-sheet on mobile, centered on desktop. Includes star selector, comment textarea (500 char limit), Arabic label descriptors (سيئ/مقبول/جيد/جيد جداً/ممتاز)
- **Reviews List**: Displayed on contract page when status is `completed`, with reviewer avatar, name, date, stars, and comment
- **State Indicators**: "✅ لقد قمت بتقييم" badge when already reviewed, "أضف تقييم" button hidden after submission

## Notifications System Sprint

### Architecture
- **Server Actions**: `app/actions/notifications.ts`
  - `getNotifications(limit)` — Fetch user's notifications (newest first)
  - `markNotificationRead(id)` — Mark single notification as read
  - `markAllNotificationsRead()` — Mark all as read
  - `sendNotificationAction(userId, type, title, body, link)` — Create notification for any user
- **UI Component**: `app/components/NotificationBell.tsx` — Reusable client component
- **Database RPC**: `create_notification()` — SECURITY DEFINER function (bypasses RLS for cross-user inserts)

### NotificationBell Component
- Bell icon with red unread count badge (animated pulse)
- Dropdown with notification list (max-height scrollable)
- Auto-refresh every 30 seconds via polling
- Click-outside-to-close behavior
- "Mark All Read" button
- Per-notification click marks as read and navigates to link
- **Design**: White/green theme matching platform (NO dark mode)
- Integrated into dashboard navbar (importable to any page)

### Event Triggers (automatic notification creation)
| Event | Who is Notified | Type | Where Triggered |
|---|---|---|---|
| Freelancer submits proposal | Job owner | `new_proposal` | `jobs/[id]/page.tsx` |
| Client accepts proposal | Freelancer | `proposal_accepted` | `jobs/[id]/page.tsx` |
| Client locks escrow funds | Freelancer | `contract_funded` | `contracts/[id]/actions.ts` |
| Client releases payment | Freelancer | `payment_released` | `contracts/[id]/actions.ts` |
| All milestones completed | Both parties | `contract_completed` | `contracts/[id]/actions.ts` |
| User submits review | Reviewee | `new_review` | `contracts/[id]/actions.ts` |

### Database Changes
- Added `create_notification` SECURITY DEFINER RPC to `supabase/schema.sql`
- **IMPORTANT**: This RPC must be deployed to the database before notifications will work

### SQL to run in Supabase SQL Editor:
```sql
CREATE OR REPLACE FUNCTION public.create_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_link TEXT DEFAULT NULL
)
RETURNS UUID LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, link)
  VALUES (p_user_id, p_type, p_title, p_body, p_link)
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;
```

## Mobile UI Optimization Sprint

### Architecture & Fixes
- **Dashboard (`app/dashboard/page.tsx`)**:
  - Implemented a hidden hamburger menu (`mobileMenuOpen` state) for mobile screens.
  - Collapsed `grid-cols-4` stats and `grid-cols-3` content areas to stack vertically (`flex-col` or `grid-cols-2 sm:grid-cols-4`) on small screens.
- **Jobs & Contracts Lists (`app/jobs/page.tsx`, `app/contracts/page.tsx`)**:
  - Hid sidebar filters on mobile by default with a "فلترة المشاريع" toggle button.
  - Updated card layouts to stack title/info and budget dynamically (`flex-col sm:flex-row`).
- **Data Tables (`app/admin/payments/ClientPaymentsPage.tsx`)**:
  - Wrapped large tables in `<div className="overflow-x-auto">` to prevent horizontal overflow on the whole screen.
  - Kept a `min-w-[640px]` on the table itself so columns don't squish.
- **Messages (`app/messages/page.tsx`)**:
  - Hid the conversation list when an active chat is open on mobile.
  - Added a "back arrow" button inside the active chat view to return to the list on mobile screens.
- **Design Tokens**:
  - Strictly maintained the Green (`emerald-500`) and White (`bg-white` / `bg-gray-50`) palette.
  - Replaced hard-coded `px-6` with responsive `px-4 sm:px-6` across container elements.

## Freelancer Wallet & Withdrawal System Sprint

### Architecture
- **Server Component**: `app/wallet/page.tsx` — Server-side data fetching (profile balance, transaction history)
- **Client Component**: `app/wallet/ClientWalletPage.tsx` — Interactive UI with withdrawal form
- **Server Action**: `app/actions/wallet.ts` — `requestWithdrawalAction` (already existed, enhanced with `/wallet` revalidation)
- **Database RPC**: `request_withdrawal` — Atomic PostgreSQL function that deducts balance and creates pending transaction

### Route: `/wallet`
- **Data Fetching** (Server-side):
  - Profile from `profiles` table (balance, role, username)
  - Transactions from `transactions` table (where user is `from_user_id` or `to_user_id`, last 50)
- **Auth**: Redirects to `/auth/login` if not authenticated

### UI Components
- **Balance Card**: Emerald gradient card with available balance and action buttons (withdraw for freelancers, fund for clients)
- **Stats Grid**: 4 cards showing total deposits, total earnings, total withdrawals, and pending count
- **Withdrawal Modal**: Form with amount input (min 10,000 DZD), payout details field (CCP/BaridiMob RIP), full client-side + server-side validation, success confirmation animation
- **Transaction History Table**: Scrollable table with type icons/labels, amounts (color-coded: green for credits, dark for debits), fees, status badges, and dates
- **Responsive**: Mobile-first with hamburger menu, `overflow-x-auto` table wrapper

### Validation (Client + Server)
- Amount must be numeric, ≥ 10,000 DZD
- Amount must not exceed available balance
- Payout details must be non-empty string, minimum 5 characters
- Server-side auth verification before RPC call
- Database-level balance check via `request_withdrawal` RPC (prevents double-spending)

### Design
- Strictly follows White & Green (`emerald-500`) theme
- RTL layout with Tajawal font
- Matches dashboard navbar pattern (desktop + mobile hamburger)
- `style={{ color: '#111827', backgroundColor: '#ffffff' }}` on inputs per project convention

## Admin Withdrawal Management Sprint

### Architecture
- **Route**: `app/admin/withdrawals/page.tsx`
- **Component**: `AdminWithdrawalsPage` (Client Component to handle auth redirects via client-side Supabase client).
- **Server Action**: Enhanced `confirmPayoutAction` in `app/actions/admin.ts`.

### Features
- **Data Fetching**: Fetches pending transactions of type `withdrawal` using a join with `profiles` to get freelancer details (name and username).
- **UI Components**:
  - Statistics card showing total pending withdrawals amount and count.
  - Responsive table displaying Freelancer info, Amount, Payout Details (CCP/BaridiMob RIP), Date, and the action button.
- **Approve Payout Action**:
  - Admin clicks "تأكيد الدفع ✅".
  - Triggers `confirmPayoutAction` which verifies Admin role.
  - Updates transaction status to `completed` and logs the resolver (`resolved_by`, `resolved_at`).
  - **Notification**: Automatically sends a `withdrawal_completed` notification to the freelancer.
  - Triggers `revalidatePath` for `/admin/payments`, `/admin/withdrawals`, and `/wallet`.
- **Theme**: Maintained the White & Green theme matching the admin dashboard pattern.
- **Admin Dashboard Link**: Added a quick action link to the Withdrawals page in `AdminContent.tsx`.
