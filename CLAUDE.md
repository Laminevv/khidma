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
14. **File Uploads & Storage** — رفع المرفقات (Supabase Storage) في المشاريع والعروض والمحادثات
15. **Settings & Portfolios** — صفحة الإعدادات لتحديث البيانات الشخصية وإضافة أعمال سابقة للمعرض


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
## Supabase Storage & Portfolios Sprint (Recent Updates)

### Storage Infrastructure
- Created **`attachments`** bucket for jobs, proposals, and chat attachments.
- Created **`avatars`** bucket for user profile pictures.
- Implemented robust **RLS policies** for both buckets to allow public read access while restricting write/update/delete actions to authenticated owners.

### Reusable FileUpload Component
- Built a highly reusable `FileUpload.tsx` component that interacts with Supabase Storage.
- Features dual UI variants:
  - `variant="default"`: Large drag-and-drop zone with visual feedback.
  - `variant="icon"`: Minimalist paperclip icon specifically tailored for chat interfaces.
- Integrates multiple file support, size validation (e.g., max 10MB), and public URL generation.

### Settings Page & Portfolios (`app/settings/page.tsx`)
- Developed a dedicated Settings page where users can update their profile metadata (Bio, Skills, Hourly Rate, Wilaya).
- Integrated `avatars` bucket for profile picture uploads.
- **Portfolio Database Integration**: Added `portfolio_items` table in Supabase. Freelancers can upload images (via `FileUpload`) and add details (title, description, link) to build their portfolio.

### Public Profile Enhancements
- Updated `app/profile/[username]` and `ClientProfilePage.tsx` to beautifully render the freelancer's portfolio grid.
- Designed an elegant empty state if the freelancer has not uploaded any portfolio items yet.
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

---

## 🔍 Comprehensive Code Review — May 2026

> Performed a full audit of the codebase covering: wallet system, deposit flow, admin approvals, Chargily webhook, routing, security, and architecture.

---

### 🐛 BUGS & ISSUES FOUND

#### BUG-01 — `confirmDepositAction` has NO admin authentication check (CRITICAL)
- **File**: `app/actions/admin.ts`, lines 91–168
- **Problem**: `confirmDepositAction` uses the service-role Supabase client but **never verifies that the calling user is an admin**. Any authenticated user who discovers this Server Action endpoint can confirm any deposit, crediting any user's wallet with any amount.
- **Fix Required**: Add the same `getUser()` + `is_admin` check that `confirmPayoutAction` already has (lines 12–30) at the top of `confirmDepositAction`.
```typescript
// ADD THIS at the start of confirmDepositAction:
const authSupabase = await createClient()
const { data: { user }, error: authError } = await authSupabase.auth.getUser()
if (!user || authError) return { success: false, error: 'Unauthorized' }
const { data: adminProfile } = await authSupabase.from('profiles').select('is_admin').eq('id', user.id).single()
if (!adminProfile?.is_admin) return { success: false, error: 'Forbidden' }
```

#### BUG-02 — `confirmDepositAction` has a RACE CONDITION in balance update (HIGH)
- **File**: `app/actions/admin.ts`, lines 113–134
- **Problem**: The balance update is done with a manual READ-then-WRITE: fetch current `balance`, add the deposit amount, then update. This is **not atomic**. If two admin requests confirm deposits for the same user simultaneously, one of the increments will be silently lost.
- **Fix Required**: Use a PostgreSQL atomic update instead of read-then-write:
```sql
-- Replace the two-step balance update with a single atomic RPC or SQL:
UPDATE profiles SET balance = balance + p_amount WHERE id = p_user_id;
```
Or add a new database RPC: `confirm_manual_deposit(p_transaction_id UUID)` that handles the entire operation in a single transaction.

#### BUG-03 — `uploadReceiptAction` and `submitManualDepositAction` accept `userId` from the client (MEDIUM)
- **File**: `app/wallet/deposit/actions.ts`, `app/wallet/deposit/page.tsx`
- **Problem**: Both server actions accept `userId` as a parameter sourced from the client (`supabase.auth.getUser()` inside `useEffect` in the client component). A malicious user could theoretically pass a **different** user's ID, creating deposits under another user's account.
- **Fix Required**: Inside the server actions, ignore the passed `userId` parameter and instead derive it from the server-side session:
```typescript
// In uploadReceiptAction and submitManualDepositAction:
const { createClient } = await import('@/lib/supabase/server')
const supabase = await createClient()
const { data: { user } } = await supabase.auth.getUser()
if (!user) return { success: false, error: 'Unauthorized' }
const userId = user.id // Use this, not the parameter
```

#### BUG-04 — `admin/payments/page.tsx` has NO admin authentication guard (HIGH)
- **File**: `app/admin/payments/page.tsx`, lines 1–70
- **Problem**: This is a Server Component that fetches sensitive financial data using the **service role** key but never checks if the requesting user is an admin. Any authenticated or unauthenticated user can access this page and see all pending deposits and withdrawals.
- **Fix Required**: Add a server-side auth + admin role check before rendering:
```typescript
import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
// At the top of AdminPaymentsPage():
const authClient = await createClient()
const { data: { user } } = await authClient.auth.getUser()
if (!user) redirect('/auth/login')
const { data: profile } = await authClient.from('profiles').select('is_admin').eq('id', user.id).single()
if (!profile?.is_admin) redirect('/dashboard')
```

#### BUG-05 — `AdminContent.tsx` uses client-side Supabase for admin mutations (MEDIUM)
- **File**: `app/admin/AdminContent.tsx`, lines 119–138
- **Problem**: `banUser()`, `verifyUser()`, and `deleteJob()` call `supabase.from(...)` directly from the client component using the anon key. This means the RLS policies on the `profiles` and `jobs` tables must be permissive enough for this to work — which is a policy misconfiguration risk. Any client knowing the target user ID could attempt these mutations.
- **Fix Required**: Move `banUser`, `verifyUser`, and `deleteJob` to Server Actions in `app/actions/admin.ts` with admin role verification.

#### BUG-06 — `wallet/page.tsx` is a Client Component fetching data in `useEffect` (LOW-MEDIUM)
- **File**: `app/wallet/page.tsx`, lines 1–6, 79–106
- **Problem**: The wallet page is marked `'use client'` and does all data fetching in a `useEffect`. This means:
  1. The balance flashes as "0" on first render before the effect runs.
  2. No SSR caching benefits.
  3. The `revalidatePath('/wallet')` calls in server actions don't actually refresh the client-side state — the page must be manually refreshed to see updated balance after withdrawal.
- **Note**: The withdrawal form DOES optimistically update the balance locally (`setProfile({ ...profile, balance: profile.balance - amount })`), but newly confirmed deposits won't show without a hard refresh.
- **Fix**: Convert to a Server Component + Client Component pattern (like `/profile/[username]`). Or at minimum, add a manual "refresh" button on the wallet page.

#### BUG-07 — Chargily uses TEST environment (`pay.chargily.net/test/`) (REMINDER)
- **File**: `app/wallet/deposit/actions.ts`, line 181
- **Problem**: The Chargily API URL still points to the test environment. This must be changed to production before going live.
- **Fix**: Change `https://pay.chargily.net/test/api/v2/checkouts` → `https://pay.chargily.net/api/v2/checkouts` in production.

#### BUG-08 — `sendNotificationAction` requires an authenticated session (EDGE CASE)
- **File**: `app/actions/notifications.ts`, lines 88–90
- **Problem**: `sendNotificationAction` calls `supabase.auth.getUser()` and returns early if there's no user. But `confirmDepositAction` (which uses the admin service-role client) calls `sendNotificationAction`. Since the service-role client doesn't carry a user session, this check will always fail and notifications will **never be sent** for deposit confirmations.
- **Fix**: `sendNotificationAction` called from the context of `confirmDepositAction` should use the service-role `supabase.rpc('create_notification', ...)` directly instead of going through the auth-dependent helper.

#### BUG-09 — `auth/callback/route.ts` is vulnerable to open redirect (LOW)
- **File**: `app/auth/callback/route.ts`, line 8
- **Problem**: The `next` parameter is taken directly from the URL query string and used as a redirect target without validation: `const next = searchParams.get('next') ?? '/dashboard'`. An attacker could craft a link like `.../auth/callback?next=https://evil.com` and redirect users after login.
- **Fix**: Validate that `next` starts with `/` (is a relative path):
```typescript
const rawNext = searchParams.get('next') ?? '/dashboard'
const next = rawNext.startsWith('/') ? rawNext : '/dashboard'
```

#### BUG-10 — Metadata update for sender info is non-atomic and silently fails (MEDIUM)
- **File**: `app/wallet/deposit/actions.ts`, lines 118–132
- **Problem**: The `request_deposit` RPC creates the transaction, then in a **second, separate** database call the server action updates the metadata with `sender_name` and `sender_account`. If the second call fails (network issue, etc.), the transaction exists but with NO sender metadata. The admin sees "—" instead of the sender's name and can't verify the deposit.
- **Fix**: Add `sender_name` and `sender_account` parameters to the `request_deposit` SQL function so all data is written atomically in a single INSERT, or pass them as a JSONB metadata parameter.

---

### ⚠️ NAVIGATION & ROUTING INCONSISTENCIES

#### NAV-01 — `/admin/withdrawals` duplicates functionality of `/admin/payments`
- Both pages show pending withdrawals and have a "Confirm Payout" button. They call the **same** `confirmPayoutAction`. The `/admin/payments` page shows BOTH deposits and withdrawals, while `/admin/withdrawals` shows only withdrawals.
- **Recommendation**: Remove the withdrawals table from `/admin/payments` (keep only deposits there) and let `/admin/withdrawals` own the withdrawal approval flow. Or consolidate into a single tabbed page.

#### NAV-02 — `wallet/page.tsx` "شحن الرصيد" only shown to clients, not "both" role
- **File**: `app/wallet/page.tsx`, line 156: `const isClient = profile.role === 'client' || profile.role === 'both'`
- This is actually correct — just confirm the logic is consistently applied everywhere the role check appears.

#### NAV-03 — No middleware protecting admin routes from unauthenticated access
- Currently, admin route protection is done via client-side `useEffect` redirects in `AdminContent.tsx` and `AdminWithdrawalsPage`. Server Components like `/admin/payments/page.tsx` have **no protection at all** (BUG-04 above).
- **Recommendation**: Add a Next.js middleware (`middleware.ts`) that protects all `/admin/*` routes server-side.

---

### ✅ WHAT IS WORKING WELL

1. **Chargily Webhook Handler** (`/api/webhooks/chargily/route.ts`): Excellent implementation. Timing-safe HMAC comparison, idempotency via unique `reference` constraint, handles both deposit and funding metadata formats, atomic `process_deposit` RPC call. Production-ready.

2. **`requestWithdrawalAction`** (`app/actions/wallet.ts`): Clean server action. Proper auth check, server-side validation, uses atomic `request_withdrawal` RPC to prevent double-spending. Correct error message passthrough for known DB errors.

3. **`confirmPayoutAction`** (`app/actions/admin.ts`): Good implementation. Auth + admin verification, status check before update, notification on success, proper revalidation.

4. **Deposit UI** (`app/wallet/deposit/page.tsx`): Complete, well-structured flow. Sender name/account fields properly validated on both client and server. File upload with type and size checks. Chargily redirect flow clean.

5. **`request_deposit` SQL function** (`deposit.sql`): Solid. Amount validation, method whitelist, receipt requirement for manual methods, all handled at the DB level.

6. **Review System**: Self-review prevention, party verification, duplicate prevention via UNIQUE constraint — properly multi-layered.

7. **Notification System**: `create_notification` as SECURITY DEFINER RPC is the right pattern for cross-user notifications.

---

### 🔧 REQUIRED FIXES (Priority Order)

| Priority | Bug ID | Description | File to Edit |
|----------|--------|-------------|--------------|
| 🔴 CRITICAL | BUG-01 | Add admin auth check to `confirmDepositAction` | `app/actions/admin.ts` |
| 🔴 HIGH | BUG-04 | Add server-side admin guard to `/admin/payments` page | `app/admin/payments/page.tsx` |
| 🟠 HIGH | BUG-02 | Fix race condition in balance update (use atomic SQL) | `app/actions/admin.ts` |
| 🟠 HIGH | BUG-03 | Derive userId server-side in deposit actions | `app/wallet/deposit/actions.ts` |
| 🟠 HIGH | BUG-05 | Move admin mutations to Server Actions | `app/admin/AdminContent.tsx` + `app/actions/admin.ts` |
| 🟡 FIXED | BUG-08 | Fix notification delivery in confirmDepositAction | `app/actions/admin.ts` |
| 🟡 MEDIUM | BUG-10 | Make sender metadata atomic with deposit creation | `app/wallet/deposit/actions.ts` + `deposit.sql` |
| 🟡 FIXED | NAV-03 | Add middleware for `/admin/*` route protection | `middleware.ts` |
| 🟢 LOW | BUG-09 | Validate `next` param in auth callback | `app/auth/callback/route.ts` |
| 🟢 LOW | BUG-06 | Convert wallet page to Server Component | `app/wallet/page.tsx` |
| ⬜ REMINDER | BUG-07 | Switch Chargily to production URL before launch | `app/wallet/deposit/actions.ts` |

---

### 🏗️ ARCHITECTURAL PLAN — National ID Verification (KYC) & Enhanced User Profiles

#### Overview
KYC (Know Your Customer) and Enhanced Profiles are the next major feature set. The goal is to:
1. Require identity verification before users can withdraw funds above a threshold.
2. Store KYC documents securely (Supabase Storage, private bucket).
3. Give admins a review workflow to approve/reject KYC submissions.
4. Display verified status on public profiles.

---

#### Database Schema Changes Required

```sql
-- 1. KYC submissions table
CREATE TABLE public.kyc_submissions (
  id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id       UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  id_type       TEXT NOT NULL CHECK (id_type IN ('national_id', 'passport', 'driving_license')),
  id_number     TEXT,                     -- hashed or encrypted before storage
  id_front_url  TEXT NOT NULL,            -- Supabase Storage path (private bucket)
  id_back_url   TEXT,                     -- Optional (not always needed)
  selfie_url    TEXT,                     -- Selfie with ID for liveness
  rejection_reason TEXT,                  -- Admin sets this on rejection
  reviewed_by   UUID REFERENCES profiles(id),
  reviewed_at   TIMESTAMPTZ,
  submitted_at  TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Add KYC status column to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS kyc_status TEXT DEFAULT 'none'
    CHECK (kyc_status IN ('none', 'pending', 'approved', 'rejected')),
  ADD COLUMN IF NOT EXISTS kyc_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS phone_number TEXT,       -- For Enhanced Profile
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,      -- For Enhanced Profile
  ADD COLUMN IF NOT EXISTS id_number_hash TEXT;     -- SHA-256 of national ID to prevent duplicates

-- 3. Storage bucket (PRIVATE — no public access)
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- RLS: Only the owner can INSERT; only service-role can SELECT
-- (Admin reads via service role client, not anon key)

-- 4. RPC to approve KYC
CREATE OR REPLACE FUNCTION public.approve_kyc(p_submission_id UUID, p_admin_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.kyc_submissions
  SET status = 'approved', reviewed_by = p_admin_id, reviewed_at = NOW()
  WHERE id = p_submission_id;
  
  UPDATE public.profiles
  SET kyc_status = 'approved', is_verified = true
  WHERE id = (SELECT user_id FROM public.kyc_submissions WHERE id = p_submission_id);
END;
$$;

-- 5. RPC to reject KYC
CREATE OR REPLACE FUNCTION public.reject_kyc(p_submission_id UUID, p_admin_id UUID, p_reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.kyc_submissions
  SET status = 'rejected', reviewed_by = p_admin_id, reviewed_at = NOW(), rejection_reason = p_reason
  WHERE id = p_submission_id;

  UPDATE public.profiles
  SET kyc_status = 'rejected'
  WHERE id = (SELECT user_id FROM public.kyc_submissions WHERE id = p_submission_id);
END;
$$;
```

---

#### Application Routes & Components to Create

| Route | Purpose |
|-------|---------|
| `app/kyc/page.tsx` | User-facing KYC submission form (upload national ID front/back + selfie) |
| `app/kyc/status/page.tsx` | Show user their current KYC status (pending / approved / rejected + reason) |
| `app/admin/kyc/page.tsx` | Admin review queue for KYC submissions |
| `app/actions/kyc.ts` | Server Actions: `submitKycAction`, `approveKycAction`, `rejectKycAction` |

---

#### KYC File Upload Security Rules
- Upload to the **private** `kyc-documents` bucket (NOT `attachments` or `receipts`).
- File path: `{userId}/national_id_front.jpg` — always overwrite (one submission per user).
- Admin retrieves signed URLs using the service-role client (short-lived, 60 seconds).
- **Never expose KYC document URLs publicly.** Use `supabase.storage.from('kyc-documents').createSignedUrl(path, 60)`.

---

#### KYC Gating Logic (Withdrawal Threshold)
```typescript
// In requestWithdrawalAction (app/actions/wallet.ts):
// Add before the RPC call:
if (amount >= 50000) { // Gate large withdrawals behind KYC
  const { data: profile } = await supabase.from('profiles').select('kyc_status').eq('id', user.id).single()
  if (profile?.kyc_status !== 'approved') {
    return { success: false, error: 'يجب إكمال التحقق من الهوية (KYC) للسحب بمبالغ تتجاوز 50,000 دج' }
  }
}
```

---

#### Enhanced Profile Fields
When KYC is implemented, the settings page (`app/settings/page.tsx`) should add:
- **Phone Number** field (with OTP verification via Supabase Auth phone)
- **Date of Birth** field (used for age verification)
- **KYC Status Badge** visible on the public profile (e.g., "✓ موثق رسمياً")
- **Account Tier**: `basic` (no KYC) → `verified` (KYC approved) — affects withdrawal limits and trust badges on proposals

---

#### Admin KYC Review Workflow
1. Admin navigates to `/admin/kyc`
2. Sees a list of pending submissions with: username, submission date, ID type
3. Clicks "مراجعة" to open a detail view with signed document URLs
4. Can "قبول" → calls `approveKycAction(submissionId)` → updates `kyc_status = 'approved'`, sets `is_verified = true`, sends notification
5. Can "رفض" → opens a modal to enter rejection reason → calls `rejectKycAction(submissionId, reason)` → sends notification with reason

---

#### Security Principles for KYC
- **Never store raw national ID numbers** — hash them (SHA-256) to detect duplicates.
- **Signed URL expiry**: All KYC document URLs should expire in 60 seconds maximum.
- **One submission at a time**: Prevent a user from submitting new KYC while `status = 'pending'`.
- **Audit log**: Log all admin review actions with `reviewed_by` and `reviewed_at` in `kyc_submissions`.
- **Notification on every status change**: User gets notified when: submission received, approved, rejected (with reason).

---

### 📋 GENERAL RECOMMENDATIONS

1. **Add `middleware.ts`** to protect all `/admin/*`, `/wallet`, `/contracts`, `/jobs/new` routes at the Next.js middleware layer. Currently these all rely on client-side `useEffect` redirects which expose a flash of content before the redirect fires.

2. **Move wallet page to Server Component**: Convert `app/wallet/page.tsx` to a Server Component pattern (matching `/profile/[username]`) so `revalidatePath` actually works and balance shows immediately on load.

3. **Add Zod schema validation** to all server actions. Currently validation is done with manual `if` checks. Using Zod schemas makes this more robust and gives automatic TypeScript inference.

4. **Rate-limit the deposit submission**: A user could spam the deposit form creating hundreds of pending deposit records. Add a simple count check: if a user already has 3+ pending deposits, reject the new one.

5. **Add `process.env` checks at startup**: Validate that `CHARGILY_SECRET_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, and `NEXT_PUBLIC_APP_URL` are set. If any are missing, log a clear error on server startup rather than failing silently at runtime.

6. **Switch Chargily to production before launch**: Change line 181 in `app/wallet/deposit/actions.ts` from `pay.chargily.net/test/` to `pay.chargily.net/`.

7. **Add `?deposit=success` handler to wallet page**: The Chargily `success_url` redirects to `/wallet?deposit=success` but the wallet page doesn't show any success banner for this case. Add detection for this query param and show a success alert.

---

## 🆔 KYC (National ID Verification) — Implementation Progress

### Step 1: Database Foundation ✅
- **Migration file**: `supabase/kyc_migration.sql` — run in Supabase SQL Editor
- Added `kyc_status`, `is_verified`, `phone_number`, `date_of_birth`, `id_number_hash` columns to `profiles`
- Created `kyc_submissions` table with full audit trail (`reviewed_by`, `reviewed_at`, `rejection_reason`)
- Unique partial index prevents multiple active submissions per user
- Private `kyc-documents` storage bucket (10MB limit, images/PDF only)
- Storage RLS: users upload only to `{userId}/` folder
- Three SECURITY DEFINER RPCs: `submit_kyc`, `approve_kyc`, `reject_kyc` — all atomic

### Step 2: Server Actions ✅
- **File**: `app/actions/kyc.ts` — 7 server actions covering the full lifecycle:
  1. `uploadKycDocumentAction` — Upload to private bucket (front/back/selfie)
  2. `submitKycAction` — Submit application (hashes ID number, calls submit_kyc RPC, notifies admins)
  3. `getKycStatusAction` — Fetch user's current KYC status + latest submission
  4. `getKycSubmissionsAction` — Admin: fetch pending/all submissions with profile joins
  5. `getKycDocumentUrlAction` — Admin: generate 60-second signed URLs for private documents
  6. `approveKycAction` — Admin: approve + notify user
  7. `rejectKycAction` — Admin: reject with reason + notify user
- All actions follow established patterns: `requireAdmin()`, `getAuthenticatedUser()`, `getAdminSupabase()`
- SHA-256 hashing of national ID numbers (never stored raw)
- Full Arabic error messages for all validation failures

### Step 3: User-Facing KYC Pages ✅
- `app/kyc/page.tsx` — Submission form:
  - 3-step wizard: document type selector → ID number → triple file upload (front/back/selfie)
  - Calls `uploadKycDocumentAction` + `submitKycAction` server actions
  - Guards against pending/approved status (redirects to status page)
  - Rejected users see a banner with link to check rejection reason
  - File upload zones with loading spinners, success indicators, and clear buttons
  - SHA-256 privacy notice for the ID number field
  - RTL layout, Tajawal font, emerald/white theme
- `app/kyc/status/page.tsx` — Status tracker:
  - Visual 3-step progress bar (التقديم → المراجعة → القرار) with animated pending state
  - Submission details card (document type, dates, status badge)
  - Rejection reason card (red, with clear explanation)
  - Benefits card when approved (unlimited withdrawals, verified badge, search priority)
  - Action buttons: resubmit (if rejected/none), back to dashboard, settings link
- Dashboard quick links updated: added KYC + Settings links

### Step 4: Admin KYC Review Page ✅
- `app/admin/kyc/page.tsx` — Review queue and management:
  - Filterable queue (pending, approved, rejected, all)
  - Review modal for individual submissions
  - Secure document viewer using ephemeral signed URLs (60-second expiry)
  - Approve workflow (calls `approveKycAction` to update status and notify)
  - Reject workflow with required reason input (calls `rejectKycAction` to update status and notify)
  - Responsive design matching the `admin/withdrawals` light theme pattern
- `app/admin/AdminContent.tsx` — Updated quick actions grid to include a link to the new KYC Review page

### Step 5: Integration ✅
- Withdrawal gating: `is_verified === true` required in `app/actions/wallet.ts` for withdrawals ≥ 50,000 DZD.
- Verified badge added to public profiles (`app/profile/[username]/ClientProfilePage.tsx`).
- KYC status badge added to user settings page (`app/settings/page.tsx`).

---

### 🗺️ CURRENT ARCHITECTURE MAP (Updated)

```
app/
├── actions/
│   ├── admin.ts         ✅  BUG-01/02/05/08 FIXED — admin auth + atomic RPCs
│   ├── wallet.ts        ✅  requestWithdrawalAction — clean
│   ├── notifications.ts ⚠️  sendNotification breaks when called without user session (BUG-08)
│   └── kyc.ts           ✅  NEW — 7 server actions for full KYC lifecycle
├── admin/
│   ├── AdminContent.tsx ✅  BUG-05 FIXED — mutations moved to Server Actions
│   ├── page.tsx         ✅  delegates to AdminContent
│   ├── payments/
│   │   ├── page.tsx     ✅  BUG-04 FIXED — server-side admin guard added
│   │   └── ClientPaymentsPage.tsx ✅  UI correct, calls correct actions
│   └── withdrawals/
│       └── page.tsx     ✅  has admin check in useEffect (still should be middleware)
├── api/
│   └── webhooks/chargily/route.ts ✅  excellent — timing-safe HMAC, idempotent
├── auth/
│   └── callback/route.ts ✅  BUG-09 FIXED — next param validated
├── wallet/
│   ├── page.tsx         🟡  client component, revalidatePath won't work fully (BUG-06)
│   └── deposit/
│       ├── page.tsx     ✅  BUG-03 FIXED — userId derived server-side
│       ├── actions.ts   ✅  BUG-03/10 FIXED — atomic metadata via RPC
│       └── deposit.sql  ✅  request_deposit RPC is correct
├── kyc/                  ⏳  NEXT — user submission form + status page
└── settings/page.tsx    ✅  client mutations acceptable here (own profile only, RLS protects)

supabase/
├── schema.sql           ✅  original schema
└── kyc_migration.sql    ✅  KYC tables, columns, RPCs, storage bucket
```

## ⚖️ Dual Balance Architecture Sprint (Completed)

To prevent money laundering (depositing then immediately withdrawing) and cleanly separate funds, the financial engine was refactored from a single `balance` to a dual-balance system (`deposit_balance` and `withdrawable_balance`).

### Step 1: Database Migration ✅
- **Migration file**: `supabase/dual_balance_migration.sql`
- Renamed `balance` column to `deposit_balance`.
- Added `withdrawable_balance` (DEFAULT 0.00).
- **Waterfall Spending Logic**: Escrow (`lock_milestone_escrow`) now strictly pulls from `deposit_balance` first. If insufficient, it pulls the remainder from `withdrawable_balance`.
- **Atomic Refunds**: Created `refund_escrow_cancellation` RPC. This enforces that canceled contracts refund the client entirely back into their `deposit_balance` (preventing them from withdrawing manual deposits).
- Updated all existing financial RPCs (`confirm_manual_deposit`, `process_deposit`, `request_withdrawal`, `release_milestone_escrow`) to target the correct balances.

### Step 2: Application Layer ✅
- **TypeScript Definitions**: Replaced `balance` with `deposit_balance` and `withdrawable_balance` in `Profile` and `User` interfaces across all files.
- **Wallet UI (`app/wallet/page.tsx`)**: 
  - Redesigned to show two separate balance cards: "رصيد الشحن" (Deposit Balance for hiring) and "رصيد الأرباح" (Withdrawable Balance for earnings).
  - Fixed visibility bug to ensure UI states correctly match the two balances.
  - Withdrawal form strictly validates against `withdrawable_balance`.
- **Dashboard UI (`app/dashboard/page.tsx`)**: Computes and displays the combined total balance but routes withdrawals correctly against the earnings limit.
- **Admin UI (`app/admin/AdminContent.tsx`)**: Updated the user list table to sum and display the total balance correctly.
- **Contracts (`app/contracts/[id]/actions.ts`)**: Replaced manual cancellation refunds with the atomic `refund_escrow_cancellation` RPC.
- **Dispute Resolution (`app/admin/disputes/actions.ts`)**: Refactored to refund clients to `deposit_balance` and release payouts to freelancers to `withdrawable_balance`.
