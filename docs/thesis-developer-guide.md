# OUCHCare Developer Guide

## Purpose

This project is the implementation side of the thesis work for OUCHCare: a role-based pet recovery clothing storefront with measurement capture, vet guidance, checkout, and admin operations.

## Core Stack

- Next.js 16 App Router
- Supabase for auth and data access
- Stripe for checkout and payment finalization
- Zustand for the shopping cart
- TanStack Table for admin CRUD grids
- Zod for runtime validation

## Key Routes

- `/` store landing page
- `/shop` live product catalog
- `/measurement-wizard` measurement flow and save action
- `/customizer` product fit and pricing preview
- `/checkout` cart and Stripe checkout launcher
- `/faq` public vet advice content
- `/customer` customer dashboard
- `/vet` vet workspace
- `/admin` admin dashboard
- `/admin/vet-advice` vet advice CMS

## Working Rules

- Use `npm.cmd` on Windows if PowerShell script policy blocks `npm`.
- Run `npm run lint` and `npm run test` before finalizing UI or API work.
- Prefer server-side Supabase access for protected routes and service-role access only inside guarded admin/server flows.
- Keep public signup restricted to `customer` and `vet`; admin roles should be created through the admin surface.

## Data Model Notes

- `pet_measurements` is the canonical measurement table.
- `vet_articles` is the canonical source for public FAQ/advice content.
- `orders` and `order_items` are created at checkout initiation and finalized via Stripe webhook confirmation.
- Use `supabase/schema.sql` for the target schema and `supabase/legacy_migration.sql` to copy existing data from the old tables.

## UI Notes

- The store shell uses a skip link and responsive navigation.
- Cart, wizard, and admin grids are designed to stay usable on narrow screens.
- Validation errors should come from shared Zod schemas in `lib/api/validation.ts`.

## Validation and Testing

- `npm run lint` checks application code.
- `npm run test` runs the focused Vitest suite for sizing and API validation.
- For route changes, prefer checking the affected files with `get_errors` before widening to the whole repo.

## Implementation Status

- Stripe checkout flow: complete
- Live storefront data: complete
- Customer order lifecycle: complete
- API validation and security: complete
- Measurements normalization: complete
- Vet advice CMS: complete
- Sizing intelligence: complete
- Accessibility and mobile audits: in progress
- Automated tests: complete
- Thesis developer docs: this guide