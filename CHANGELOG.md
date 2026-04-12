# Changelog

Todos los cambios notables en este proyecto serán documentados en este archivo.

El formato está basado en [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased] — 2026-04-11

### 🐛 Fixed

#### ModuleContext — tenant_id from JWT instead of profiles query

- **File:** `src/providers/ModuleContext.tsx`
- **Change:** `loadModules()` now reads `tenant_id` from `user.app_metadata` (JWT) instead of querying the `profiles` table. Eliminates an unnecessary DB round-trip and potential race condition.

#### AuthContext & ModuleContext — `React is not defined` errors

- **Files:** `src/providers/AuthContext.tsx`, `src/providers/ModuleContext.tsx`, `src/components/layout/Sidebar.tsx`, `src/app/(app)/demo-glamping/page.tsx`
- **Change:** Replaced all `React.useMemo` → `useMemo` and `React.useCallback` → `useCallback` with explicit imports from `'react'`. Multiple components were using memoization hooks without the `React.` prefix being available in the scope.

#### Sales module — `Failed to parse URL from /api/v1/sales` in server component

- **File:** `src/app/(app)/sales/page.tsx`
- **Change:** Replaced `salesService.list()` (which uses `fetch('/api/v1/sales')` — a relative URL that fails on the server) with a direct Supabase query using `supabase.from('sales').select('*')`.

#### Missing `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

- **File:** `.env.local`
- **Change:** Added `NEXT_PUBLIC_SUPABASE_ANON_KEY`. The server was crashing with `Your project's URL and Key are required` because the anon key was missing from the env file.

#### Onboarding actions — added detailed logging

- **File:** `src/app/onboarding/actions.ts`
- **Change:** Added structured `logger.log()` calls at every step of `createTenantAction()`: schema validation, auth check, industry config, RPC calls, email, service client creation, `updateUserById`, and revalidation. Added try/catch around `createServiceClient()` and `updateUserById()` so JWT update failures don't crash the whole flow.

### 🔧 Changed

#### Zod schemas — enforce `.int()` on all monetary fields

- **Files:** `src/lib/api/schemas/sales.ts`, `src/lib/api/schemas/products.ts`, `src/lib/api/schemas/purchases.ts`, `src/lib/api/schemas/services.ts`
- **Changes:**
  - `sales.ts` — `unit_price`: `.int().positive()`, `discount`: `.int().nonnegative().default(0)`, `tax_rate`: `.int().nonnegative().max(100).default(0)`
  - `products.ts` — `price`: `.int().positive()`
  - `purchases.ts` — `unit_cost`: `.int().nonnegative()`
  - `services.ts` — `quantity`: `.int().positive()`, `unit_price`: `.int().nonnegative()`
- **Rationale:** DB columns use `numeric`/`integer`. Plain `z.number()` accepts floats which cause precision mismatches on inserts.

### 🔐 Security

#### Agent skills — Supabase installed

- **Files:** `.agents/skills/supabase/`, `.agents/skills/supabase-postgres-best-practices/`
- **Change:** Installed Supabase agent skills from `github.com/supabase/agent-skills.git` for Postgres best practices and Supabase product knowledge.

---

## Previous Sessions

_No previous changelog entries._
