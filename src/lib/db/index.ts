/**
 * Data access layer — single swap surface for backend integration.
 *
 * Current implementation: in-memory (memory.ts) — suitable for demo/dev.
 *
 * To connect a real database:
 *   1. Install your ORM/client (e.g. `npm i prisma`, `npm i @supabase/supabase-js`)
 *   2. Create a new adapter file (e.g. `prisma.ts`, `supabase.ts`) that exports
 *      the same function signatures below
 *   3. Change the import below from `./memory` to your adapter
 *
 * All API routes import exclusively from `@/lib/db` — nothing else needs to change.
 */

export {
  listReports,
  getReport,
  createReport,
  logReportAccess,
  addDispute,
  recordReview,
  updateConsentStatus,
} from "./memory";
