# Univa — College Management System

A full-stack college management portal built with **Next.js 14**, **Prisma**, **PostgreSQL**, and **Razorpay**. Supports five user roles with role-specific dashboards and a complete set of academic, library, and canteen features.

---

## Tech Stack

| Layer     | Technology              |
| --------- | ----------------------- |
| Framework | Next.js 14 (App Router) |
| Language  | TypeScript              |
| Database  | PostgreSQL              |
| ORM       | Prisma 5                |
| Auth      | JWT (httpOnly cookies)  |
| Payments  | Razorpay                |
| Email     | Nodemailer (SMTP)       |
| Styling   | Tailwind CSS            |
| QR Codes  | `qrcode` npm package    |

---

## User Roles

| Role           | College ID (Demo) | Password    |
| -------------- | ----------------- | ----------- |
| Student        | STU001            | Student@123 |
| Professor      | PROF001           | Prof@123    |
| Librarian      | LIB001            | Lib@123     |
| Cook           | COOK001           | Cook@123    |
| Canteen Server | SRV001            | Server@123  |
| Admin          | ADMIN001          | Admin@123   |

---

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- A Razorpay account (test keys are fine)
- SMTP credentials (Gmail app password works)

---

## Setup Instructions

### 1. Clone and Install

```bash
git clone <repo-url>
cd univa
npm install
```

### 2. Configure Environment Variables

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
# PostgreSQL connection string
DATABASE_URL="postgresql://postgres:password@localhost:5432/univa?schema=public"

# Auth — generate with: openssl rand -base64 32
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"
JWT_SECRET="another-secret-here"

# Razorpay (get from https://dashboard.razorpay.com)
RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxxxxxx"
RAZORPAY_KEY_SECRET="xxxxxxxxxxxxxxxxxxxxxxxxxx"
NEXT_PUBLIC_RAZORPAY_KEY_ID="rzp_test_xxxxxxxxxxxxxxxxxx"

# SMTP (Gmail example)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER="your-email@gmail.com"
SMTP_PASS="your-16-char-app-password"
SMTP_FROM="Univa System <noreply@univa.edu>"

# App
NEXT_PUBLIC_APP_URL="http://localhost:3000"
CRON_SECRET="your-cron-secret"

# Library config
LIBRARY_FINE_PER_DAY=2
LIBRARY_LOAN_DAYS=14
SESSION_TIMEOUT_MINUTES=15
```

### 3. Set Up the Database

```bash
# Create the database (PostgreSQL)
createdb univa

# generate Prisma client
pnpm exec prisma generate

# Push schema
pnpm exec prisma migrate dev

# Seed the database
pnpm exec prisma seed


```

### 4. Start Development Server

```bash
pnpm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you'll be redirected to `/login`.

---

## Project Structure

```
univa/
├── prisma/
│   ├── schema.prisma          # All database models
│   └── seed.ts                # Demo data seeder
│
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          # login, logout, me
│   │   │   ├── students/      # attendance, grades, timetable, library, fees, wallet
│   │   │   ├── professors/    # courses, students, attendance, grades, reports
│   │   │   ├── librarian/     # books, circulation, patrons, stats
│   │   │   ├── canteen/       # menu, orders, settings
│   │   │   ├── payment/       # create-order, verify (Razorpay)
│   │   │   ├── admin/         # users, audit, stats, terms
│   │   │   ├── notifications/ # in-app notifications
│   │   │   └── cron/          # due-reminders (daily cron)
│   │   │
│   │   ├── login/             # Login page
│   │   ├── dashboard/
│   │   │   ├── student/       # overview, timetable, attendance, grades, library, canteen, fees
│   │   │   ├── professor/     # overview, courses, attendance, grades, reports
│   │   │   ├── librarian/     # overview, catalog, circulation, patrons
│   │   │   ├── cook/          # kitchen display, menu management
│   │   │   ├── server/        # ready-to-serve dashboard
│   │   │   └── admin/         # overview, users, audit, terms
│   │   │
│   │   ├── globals.css
│   │   └── layout.tsx
│   │
│   ├── components/
│   │   └── shared/
│   │       ├── Sidebar.tsx          # Role-aware sidebar nav
│   │       ├── PaymentButton.tsx    # Razorpay checkout button
│   │       └── NotificationBell.tsx # In-app notifications
│   │
│   ├── lib/
│   │   ├── prisma.ts     # Singleton Prisma client
│   │   ├── auth.ts       # JWT sign/verify, requireAuth middleware
│   │   ├── audit.ts      # Audit log helper
│   │   ├── razorpay.ts   # Order creation + signature verification
│   │   └── email.ts      # Nodemailer email helpers
│   │
│   ├── middleware.ts     # Session guard, role-based routing, token refresh
│   └── types/
│       └── index.ts      # Shared TypeScript types
```

---

## Key Features by Role

### 🎓 Student

- View timetable with colour-coded course slots
- Attendance summary with per-subject % and ≥75% warning
- Grades (internal marks + locked final results + CGPA)
- Library catalog search, active loans, borrowing history
- Canteen — browse menu, add to cart, choose dine-in/takeaway
- Pay via campus **wallet** or **Razorpay** (card/UPI/netbanking)
- Fee payment with Razorpay
- Wallet top-up via Razorpay

### 👨‍🏫 Professor

- View assigned courses and enrolled student rosters
- Search student academic profile across courses
- Mark attendance (P/A/L) with bulk actions
- Enter internal marks, midterm, practical, end-sem grades
- **Lock & publish** grades (visible to students once locked)
- Generate attendance reports (daily / monthly / semester)
- Export attendance to CSV

### 📚 Librarian

- Dashboard with overdue alerts
- Search and manage book catalog (add, edit status, archive)
- Check out books by Book ID + Student College ID (14-day default)
- Check in books with automatic fine calculation (₹2/day)
- Fine waiver with mandatory reason (logged to audit trail)
- Patron account management — view loans, block/unblock accounts

### 🍳 Cook (Kitchen Display)

- Real-time auto-refreshing order queue (sorted chronologically)
- Accept/reject orders, update to Preparing → Ready for Pickup
- Mark menu items as sold out (instantly removed from student view)
- Menu management — add items, toggle availability, set daily specials
- Toggle entire canteen Online/Offline

### 🪑 Canteen Server

- Dashboard of all "Ready for Pickup" orders
- Verify order by confirmation number before marking Served
- Auto-refresh every 10 seconds

### ⚙️ Admin

- Full user CRUD — create any role, deactivate accounts
- View unfiltered audit trail (grade changes, checkouts, payments, etc.)
- Manage academic terms (active term drives timetable/enrollment)

---

## Payment Flow (Razorpay)

```
Student clicks "Pay"
  → POST /api/payment/create-order  (creates Razorpay order, stores order ID)
  → Razorpay checkout modal opens
  → Student pays
  → POST /api/payment/verify  (HMAC signature check → mark fee/order PAID)
```

**Wallet flow:**

```
Student tops up via Razorpay → wallet balance incremented
Student orders food → balance deducted immediately (no Razorpay for wallet payments)
```

---

## Audit Trail

The following actions are always logged with `userId`, `timestamp`, `IP address`, and `metadata`:

- `USER_LOGIN` / `USER_LOGOUT`
- `GRADE_CHANGE` / `GRADE_LOCK`
- `ATTENDANCE_MARK` / `ATTENDANCE_EDIT`
- `BOOK_CHECKOUT` / `BOOK_RETURN` / `FINE_WAIVED`
- `ORDER_PLACED` / `ORDER_CANCELLED`
- `PAYMENT_SUCCESS`
- `USER_CREATED` / `USER_DEACTIVATED`
- `ACCOUNT_BLOCKED`

---

## Book Due Reminders (Cron Job)

The endpoint `GET /api/cron/due-reminders` sends email + in-app notifications for all books due the next day.

**Setup with Vercel Cron** — add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/due-reminders",
      "schedule": "0 8 * * *"
    }
  ]
}
```

Set `CRON_SECRET` in your environment and pass it as `Authorization: Bearer <secret>`.

---

## Security Notes

- All cookies are `httpOnly`, `sameSite: lax`, and `secure` in production
- Sessions expire after 15 minutes of inactivity (refreshed on every request)
- All role-protected routes enforced in both middleware (page-level) and API handlers
- Razorpay payments verified with HMAC-SHA256 signature before any DB update
- All grade changes, fine waivers, and account blocks require a reason stored in the audit log

---

## Deployment (Vercel + Supabase)

1. Push to GitHub
2. Import project in Vercel
3. Add all environment variables in Vercel dashboard
4. Use [Supabase](https://supabase.com) for managed PostgreSQL — copy the connection string with `?pgbouncer=true&connection_limit=1`
5. Run `npx prisma migrate deploy` in the Vercel build command or via CI

```
Build Command: npx prisma generate && next build
```
