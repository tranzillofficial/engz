# Engz (إنجز) — Full-Stack Web Delivery Platform 🚀

منصة توصيل ويب متكاملة، فائقة السرعة، مصممة خصيصاً للموبايل وتدعم اللغة العربية والإنجليزية لتوصيل أي شيء (طلبات حرة، مشتريات سوبرماركت، صيدلية، عيش، خضار، أو أي طلب خاص).

---

## 🌟 المميزات الرئيسية (Core Features)

1. **العميل (Customer):**
   - إنشاء طلب حر يحتوي على أي عدد من الأصناف الحرة مع تحديد الكميات والملاحظات.
   - تحديد أماكن الاستلام والتسليم مع حساب مسافة القيادة الحقيقية (`Driving Route Distance`) والتكلفة التقديرية اللحظية.
   - متابعة حالة الطلب لحظياً ومعرفة بيانات الطيار والاتصال به مباشرة.
   - إدارة الملف الشخصي وسجل الطلبات السابقة.

2. **الطيار (Driver):**
   - واجهة استخدام مخصصة وسريعة للهاتف.
   - زر التبديل بين متاح (`Online`) وغير متاح (`Offline`) وتحديث إحداثيات الـ GPS الحالية.
   - استعراض الطلبات المتاحة في نطاق الطيار الجغرافي وقبول الطلب ذرياً (`Atomic Acceptance`) لمنع التنافس والقبول المزدوج.
   - إدارة مراحل الرحلة (`accepted` → `in_progress` → `delivered`).
   - محفظة عمولات متكاملة لحساب عمولة المنصة آلياً وحظر الطيار تلقائياً عند تجاوز حد العمولات.
   - قنوات سداد إقليمية (واتساب / إنستجرام الوكيل) ونموذج تسجيل إشعار دفع يدوي.

3. **الوكيل (Regional Agent):**
   - إدارة مخصصة لنطاق المنطقة الجغرافية المسندة إليه.
   - متابعة طياري المنطقة، تفرغهم، وحالات حظرهم.
   - متابعة طلبات المنطقة الحالية والسابقة.
   - مراجعة وتأكيد أو رفض إشعارات سداد العمولات مع التحديث والفك التلقائي للحظر.
   - ضبط أرقام وحسابات التواصل الإقليمية للمنطقة.

4. **المدير العام (Super Admin):**
   - لوحة قيادة مركزية لمتابعة مؤشرات الأداء الحية ومعدلات الطلبات والتحصيل.
   - التحكم في محرك التسعير (الرسوم الأساسية، نطاق البحث، خطوات التوسيع، وشرائح المسافات).
   - إدارة شرائح العمولات الثابتة والنسبية.
   - إدارة كل المستخدمين (عملاء، طيارين، وكلاء، مدراء) مع إمكانية الحظر الفوري.
   - إنشاء وإدارة المناطق الجغرافية ومراجعة دفتر التحويلات المالي الكامل.

---

## 🛠️ التقنيات المستخدمة (Tech Stack)

- **Framework:** [Next.js 16 (App Router)](https://nextjs.org/) + React 19 + TypeScript
- **Database & Auth:** [Supabase](https://supabase.com/) (PostgreSQL + Row Level Security + Triggers + RPCs)
- **Styling:** Vanilla CSS Custom Design System + TailwindCSS 4 (Dark mode, RTL-first, Safe-area insets)
- **Validation:** [Zod](https://zod.dev/) Server & Client Side
- **Maps Abstraction:** Google Maps Platform (`Directions API`, `Geocoding API`) مع دعم التبديل لـ Mapbox / OpenStreetMap

---

## 🚀 دليل التثبيت والتشغيل المحلي (Setup Guide)

### 1. استنساخ المشروع وتثبيت الحزم
```bash
git clone <repository-url>
cd engz
npm install
```

### 2. إعداد قاعدة البيانات في Supabase
1. أنشئ مشروع جديد في [Supabase](https://supabase.com).
2. ادخل على **SQL Editor** في لوحة تحكم Supabase.
3. انسخ محتوى الملف [`schema.sql`](./schema.sql) والصقه بالكامل ثم اضغط **Run**.
   - سينشئ السكربت 13 جدولاً، العلاقات، الدوال الذرية (`RPCs`)، سياسات الأمان (`RLS`)، والبيانات الأولية الافتراضية.

### 3. إعداد متغيرات البيئة (`.env.local`)
قم بإنشاء ملف `.env.local` في المجلد الرئيسي وضع القيم الخاصة بك:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Google Maps API (Optional — fallback driving approximation included)
NEXT_PUBLIC_MAPS_API_KEY=your-google-maps-browser-key
MAPS_SERVER_API_KEY=your-google-maps-server-key

# App URL
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. تشغيل خادم التطوير
```bash
npm run dev
```
افتح المتصفح على: `http://localhost:3000`

---

## 🔐 بنية الأدوار والحسابات (Roles & Access)

| الدور (Role) | المسار الرئيسي | الصلاحيات |
|---|---|---|
| **عميل (Customer)** | `/orders` | إنشاء الطلبات، تتبع الرحلة، الملف الشخصي |
| **طيار (Driver)** | `/driver` | قبول الطلبات، تحديث الموقع، محفظة العمولات، تسجيل الدفع |
| **وكيل (Agent)** | `/agent` | إدارة طياري وطلبات المنطقة، تأكيد المدفوعات |
| **مدير (Admin)** | `/admin` | التحكم الكامل، التسعير، العمولات، المستخدمين، المناطق |

---

## 📐 بنية المشروع البرمجية (Architecture)

```
engz/
├── app/                      # Next.js App Router (Pages, Layouts & Route Handlers)
│   ├── (auth)/               # Login & Register with role selection
│   ├── orders/               # Customer orders flow (/new, /[id])
│   ├── driver/               # Driver portal (/orders, /wallet, /profile)
│   ├── agent/                # Agent dashboard (/orders, /drivers, /payments)
│   ├── admin/                # Super admin suite (/pricing, /commissions, etc.)
│   ├── api/                  # API endpoints (pricing estimation, auth routes)
│   └── globals.css           # Full Design System & tokens
├── components/               # Mobile-First Component Library
│   ├── ui/                   # Button, Input, Card, Badge, Modal, Spinner, etc.
│   ├── layout/               # AppShell, BottomNav, PageHeader
│   ├── driver/               # Driver interactive widgets
│   ├── agent/                # Agent widgets
│   └── admin/                # Admin config widgets
├── lib/
│   ├── actions/              # Server Actions (Auth, Orders, Drivers, Agent, Admin)
│   ├── services/             # Pure Business Logic (Pricing, Matching, Commissions)
│   ├── supabase/             # Client, Server, and Middleware clients
│   ├── types/                # Complete TypeScript database definitions
│   └── validations/          # Zod validation schemas
├── schema.sql                # Complete standalone Supabase SQL Schema
├── .env.local.example        # Environment variables template
└── README.md                 # Documentation
```

---

## ☁️ النشر على Vercel (Deployment)

1. ارفع المشروع على GitHub / GitLab.
2. استورد المشروع في [Vercel](https://vercel.com).
3. أضف متغيرات البيئة المذكورة في `.env.local` داخل إعدادات المشروع في Vercel.
4. اضغط **Deploy**.

---

## 🛡️ الأمان والنزاهة المالية (Security & Correctness)
- جميع العمليات الحساسة (قبول الطلب، احتساب العمولة، تأكيد الدفع) تتم عبر استدعاءات ذرية في قاعدة البيانات (`Database Transactions / RPCs`) لمنع أي تلاعب أو سباق بيانات (`Race Conditions`).
- التحقق المزدوج من صحة المدخلات باستخدام Zod على الخادم.
- حماية المسارات على مستوى `Middleware` و`Server Actions` وسياسات `Row Level Security (RLS)`.
#   e n g z  
 