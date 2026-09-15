Engz — Full-Stack Implementation Task

Build Engz, a production-ready, mobile-first delivery platform for anything, not restaurants only. A customer creates one order containing multiple free-text items (e.g. fruit + bread + supermarket items), and a driver accepts and delivers it.

IMPORTANT: Existing Project

Do not rebuild the project from scratch.

First inspect the existing codebase:

structure and routes

package.json / Next.js version

existing Supabase/auth integration

UI/components

env variables (never expose secret values)

existing database/types/services

Reuse the existing architecture and components where possible. Plan first, then implement.

Stack

Next.js + App Router

TypeScript

Supabase PostgreSQL + Auth + RLS

Vercel Serverless/Edge compatible

Responsive/mobile-first UI

No permanent server, WebSocket server, filesystem persistence, or hardcoded production data.

Roles

Customer

Register/login

Create orders with multiple items

Pickup + drop-off address/location

View fee and order status

Track current/previous orders

Driver

Register/login

Online/offline

Current location

See eligible available orders

Accept and execute orders

Update order status

View commission wallet/history

Automatically blocked when unpaid commission reaches admin threshold

Agent

Assigned to one region

Manage/monitor drivers and orders in that region

Review/confirm manual payments in that region

Admin

Full access:

customers, drivers, agents, regions, orders

pricing

commission tiers

payment confirmations

system settings

statistics

Order Lifecycle

Use:

pending → accepted → in_progress → delivered

Also support cancelled where appropriate.

An order contains:

pickup address + lat/lng
drop-off address + lat/lng
multiple order_items
calculated route distance/duration
calculated delivery fee
pricing snapshot

Prevent invalid status transitions and double acceptance.

Driver Matching

Driving route distance is mandatory.

Do NOT use Haversine/straight-line distance as the final eligibility or pricing distance.

Use a map provider abstraction supporting:

Geocoding

Driving distance

ETA/Directions

Prefer Google Maps Platform initially, but keep provider logic replaceable so Mapbox can be used later.

Architecture:

rough geographic candidate filtering
        ↓
Driving Route API only for candidates
        ↓
eligible drivers

Do not call routing APIs unnecessarily for every driver.

Search radius is configurable:

default radius → expansion step → maximum radius

Example:

2km → 4km → 6km → 8km → 10km

If no driver exists, expand until max radius. Do not make these values hardcoded.

Handle concurrent driver acceptance atomically so only one driver can win.

Pricing Engine

Create a separate server-side pricing service.

Default example:

Base fee = 20 EGP

But nothing is hardcoded as the source of truth.

Pricing must be controlled from Admin Dashboard:

base delivery fee

default search radius

expansion step

maximum radius

distance pricing tiers

scarcity/availability pricing

Example:

0–2 km  +0
2–4 km  +5
4–6 km  +10

Store the final calculated fee and pricing snapshot inside the order so changing settings later does not change old orders.

Commission System

Admin-configurable tiers.

Example:

1–3 orders   = 0 EGP
4–10         = 4 EGP/order
11+          = configurable %

Support:

fixed
percentage

When an order is completed:

determine driver's completed-order count

select commission tier

calculate commission

create commission ledger transaction

update unpaid balance safely

check blocking threshold

Prevent duplicate commission for the same order.

Driver has:

commission balance
commission history
paid/unpaid history

If balance reaches/exceeds the configured threshold, automatically block the driver from seeing/accepting new orders.

Manual Payments

Driver can submit:

amount
payment method
reference
optional proof image
notes

Proof image can use private Supabase Storage.

Region has configurable:

WhatsApp
Instagram

Agent/Admin can:

confirm
reject

Confirmation must atomically:

confirm payment
→ create payment ledger entry
→ reduce unpaid balance
→ recalculate driver blocked status

Never delete historical transactions.

Database

Create one file only:

schema.sql

It must run directly in Supabase SQL Editor.

Include:

extensions

enums

tables

relations

constraints

indexes

triggers/functions where needed

RLS

policies

safe initial seed/default settings

Required tables:

users
regions
agents
drivers
orders
order_items
commission_tiers
commission_transactions
payment_confirmations
pricing_settings

Recommended where useful:

pricing_distance_tiers
order_status_history
audit_logs

Use UUID PKs.

Authentication must use Supabase Auth. Never store passwords yourself.

RLS must enforce role/region ownership server/database-side, not only through UI.

Admin-only settings must not be writable by customers/drivers/agents.

Environment

Create:

.env.local.example

with:

NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

NEXT_PUBLIC_MAPS_API_KEY=
MAPS_SERVER_API_KEY=

NEXT_PUBLIC_APP_URL=

Never expose service-role or server map keys to the browser.

Ensure .env.local is gitignored.

Pages

Implement appropriate responsive pages for:

Customer

/login
/register
/orders
/orders/new
/orders/[id]
/profile

Driver

/driver
/driver/orders
/driver/orders/[id]
/driver/wallet
/driver/profile

Agent

/agent
/agent/orders
/agent/drivers
/agent/payments
/agent/profile

Admin

/admin
/admin/orders
/admin/drivers
/admin/customers
/admin/agents
/admin/regions
/admin/pricing
/admin/commissions
/admin/payments
/admin/settings

Adapt paths to the existing project if it already has a routing convention.

UI/UX

Mobile-first and Arabic-friendly.

Driver/customer workflows must be extremely simple.

Include proper:

loading states

empty states

errors

success feedback

pagination

search/filter for admin tables

status badges

responsive dashboard

Do not create fake/mock functionality in production UI.

Security & Correctness

Server-side validate all business-critical operations.

Never trust client-supplied:

role
commission
delivery fee
balance
driver eligibility
payment status

Use Zod or existing validation system.

Critical operations should be atomic:

accept order

complete order + commission

confirm payment + balance update

Use database constraints/functions/RPC where appropriate.

Recommended Architecture

Reuse existing project structure, but keep business logic separated conceptually:

lib/services/
  auth
  maps
  pricing
  matching
  commissions
  orders

Business logic must not live inside UI components.

Important functions should be testable:

calculateDeliveryFee()
getCommissionTier()
calculateCommission()
shouldBlockDriver()
validateOrderStatusTransition()

Required Final Deliverables

At minimum:

schema.sql
.env.local.example
README.md

plus the complete functional source code.

README must explain:

setup

Supabase

running schema.sql

environment variables

Maps API setup

roles

pricing

commission

manual payments

Vercel deployment

Final Verification

Before declaring completion:

Run TypeScript check.

Run lint.

Run production build.

Fix errors.

Verify auth/role protection.

Verify RLS.

Verify order lifecycle.

Verify atomic driver acceptance.

Verify real driving distance integration.

Verify radius expansion.

Verify configurable pricing.

Verify commission tiers and duplicate protection.

Verify driver blocking/unblocking.

Verify manual payment flow.

Verify mobile responsiveness.

Verify Vercel compatibility.

Execution Rule

Follow:

Inspect → Plan → Implement → Test → Fix

Do not stop at UI/mockups. Implement the actual Supabase-backed functionality.

Do not rebuild existing working parts unnecessarily.