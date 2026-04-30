# OUCHCare

Production-focused scaffold for a pet post-operative clothing store built with:

- Next.js 16 (App Router + Server Components)
- TypeScript
- Tailwind CSS 4
- shadcn/ui
- Supabase (auth + data)
- Zustand (cart)
- TanStack Table (admin grids)

## Route Structure

- `app/(store)/` customer storefront and support flows
- `app/(auth)/auth/` login and signup pages with dedicated auth shell
- `app/(customer)/customer/` protected customer workspace
- `app/(vet)/vet/` protected vet workspace
- `app/(admin)/admin/` protected admin dashboard
- `app/api/` REST endpoints for products, orders, profile, checkout, auth callback

## Features Included

- Supabase auth scaffolding with role model: `customer`, `vet`, `admin`
- Product catalog scaffolding with custom sizes
- Accessible multi-step measurement wizard:
	- neck, chest, back length, leg girth
	- progress indicator
	- input validation
	- example diagrams
- Zustand cart and checkout placeholder endpoint for Stripe
- Admin panel with TanStack Table for products, orders, and users
- Vet advice / FAQ section
- Typed domain model + Supabase database type scaffold
- SQL schema suggestions embedded in `lib/types/database.ts`

## Setup

1. Install dependencies.

```bash
npm install
```

2. Create environment variables from the template.

```bash
cp .env.example .env.local
```

3. Start development server.

```bash
npm run dev
```

4. Open `http://localhost:3000`.

## Authentication Notes

- Login and signup are scaffolded at:
	- `/auth/login`
	- `/auth/signup`
- Protected routes are role-aware:
	- `/customer` for customer users
	- `/vet` for vet users
	- `/admin` for vet and admin users
- Public signup is limited to customer and vet accounts; admin access is assigned separately.

## Production Hardening Next Steps

- Replace mock fallback data with direct Supabase queries and pagination.
- Enforce strict RLS policies for all tables.
- Implement full Stripe Checkout Session + webhook verification.
- Add server-side input validation for API endpoints.
- Add integration tests for auth, checkout, and admin authorization.

## Thesis Developer Docs

See [docs/thesis-developer-guide.md](docs/thesis-developer-guide.md) for implementation notes, route map, validation commands, and data model guidance.
For Supabase setup, use [supabase/schema.sql](supabase/schema.sql) as the target schema and [supabase/legacy_migration.sql](supabase/legacy_migration.sql) to migrate existing legacy rows.
