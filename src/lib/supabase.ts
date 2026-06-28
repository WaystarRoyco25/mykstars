import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// ---------------------------------------------------------------------------
// Server-only Supabase client for the Fan Forecast vote store.
//
// Uses the SERVICE-ROLE key, which bypasses Row Level Security — so it must
// never reach the browser. Only the server-side data layer (data.ts) and the
// vote Server Action (app/predictions/actions.ts) import this module. The key
// lives in SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix → never bundled
// into client JS).
//
// Returns null when the env vars are absent (e.g. a local build with no
// .env.local). Callers treat that as "no votes yet" and voting reports that it
// is not configured, so the site still builds and renders without Supabase.
// ---------------------------------------------------------------------------

let cached: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!cached) {
    cached = createClient(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
