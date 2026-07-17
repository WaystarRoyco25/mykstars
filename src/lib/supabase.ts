import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { MyKStarsDatabase } from "@/lib/supabase-types";

// ---------------------------------------------------------------------------
// Server-only Supabase client for the Fan Forecast vote store.
//
// Uses the SERVICE-ROLE key, which bypasses Row Level Security — so it must
// never reach the browser. The vote repository is the only caller. The key
// lives in SUPABASE_SERVICE_ROLE_KEY (no NEXT_PUBLIC_ prefix → never bundled
// into client JS).
//
// Returns null when the env vars are absent (e.g. a local build with no
// .env.local). Callers treat that as "no votes yet" and voting reports that it
// is not configured, so the site still builds and renders without Supabase.
// ---------------------------------------------------------------------------

let cached: SupabaseClient<MyKStarsDatabase> | null = null;

export function getSupabase(): SupabaseClient<MyKStarsDatabase> | null {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  if (!cached) {
    cached = createClient<MyKStarsDatabase>(url, key, {
      auth: { persistSession: false, autoRefreshToken: false },
    });
  }
  return cached;
}
