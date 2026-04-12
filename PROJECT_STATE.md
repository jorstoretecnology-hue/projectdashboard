# Project State — Dashboard Universal SaaS

**Last updated:** 2026-04-11

---

## Session Summary (2026-04-11)

### Fixes Applied

| #   | Issue                                                                          | File(s)                                                                         | Status                           |
| --- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- | -------------------------------- |
| 1   | `ModuleContext` queried `profiles` for `tenant_id` instead of reading from JWT | `src/providers/ModuleContext.tsx`                                               | ✅ Fixed                         |
| 2   | `React is not defined` — `useMemo`/`useCallback` used without `React.` import  | `AuthContext.tsx`, `ModuleContext.tsx`, `Sidebar.tsx`, `demo-glamping/page.tsx` | ✅ Fixed                         |
| 3   | Sales page crash — `fetch('/api/v1/sales')` in server component                | `src/app/(app)/sales/page.tsx`                                                  | ✅ Fixed (direct Supabase query) |
| 4   | Missing `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`                        | `.env.local`                                                                    | ✅ Added                         |
| 5   | Onboarding step 4 silent failures                                              | `src/app/onboarding/actions.ts`                                                 | ✅ Detailed logging added        |
| 6   | Zod schemas accepted floats for monetary fields                                | `sales.ts`, `products.ts`, `purchases.ts`, `services.ts`                        | ✅ `.int()` enforced             |

### Dev Environment

- **Stack:** Next.js 16.2.2 (Turbopack), TypeScript strict, Supabase
- **OS:** Windows (win32)
- **Supabase project:** `kpdadwtxfazhtoqnttdh`
- **Known warning:** Slow filesystem (365ms benchmark) — `.next/dev` may be on network drive
- **Known warning:** `middleware` → `proxy` rename needed (Next.js 16)

### Pending / Known Issues

| #   | Issue                                                | Location                                         | Notes                                                                   |
| --- | ---------------------------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------- |
| 1   | TS errors in `CustomersClient.tsx`                   | `src/app/(app)/customers/CustomersClient.tsx:33` | `useQueryState`, `parseAsString` not imported (needs `nuqs` or similar) |
| 2   | TS error in `PaymentHistory.tsx:86`                  | `src/components/billing/PaymentHistory.tsx:86`   | Expected 1 argument, got 2                                              |
| 3   | TS error in `MobileSidebar.tsx:22,63`                | `src/components/layout/MobileSidebar.tsx`        | `logout` not on `AuthContextType`, `name` not on `ActiveModule`         |
| 4   | `sales/page.tsx` "Nueva Venta" links to `/sales/kds` | `src/app/(app)/sales/page.tsx`                   | Both header buttons link to KDS; one should open POS                    |
| 5   | Chart width/height warnings                          | Browser console                                  | Recharts `ResponsiveContainer` getting -1 dimensions (parent not sized) |

### Architecture Decisions This Session

1. **JWT over DB for tenant_id:** `ModuleContext` reads `tenant_id` from `user.app_metadata` (set during onboarding via `updateUserById`). No extra query needed.
2. **Server components → Supabase directly, not API routes:** Server components cannot use relative `fetch()` URLs. Use `createClient()` + `.from()` for server-side data fetching.
3. **Zod `.int()` mandatory for money:** All price, total, discount, tax fields use `.int()` to match DB `numeric`/`integer` columns.

### Skills Installed

- `supabase` — Supabase product knowledge
- `supabase-postgres-best-practices` — Postgres performance & schema best practices

---

## Quick Start

```bash
pnpm dev        # Start dev server (http://localhost:3000)
# Ensure .env.local has:
#   NEXT_PUBLIC_SUPABASE_URL
#   NEXT_PUBLIC_SUPABASE_ANON_KEY
#   SUPABASE_SERVICE_ROLE_KEY
```
