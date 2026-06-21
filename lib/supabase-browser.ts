import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser-side Supabase client used for authentication. It uses the public
 * anon key and persists the session in cookies so the server can read it too.
 *
 * This is intentionally separate from the admin client in `lib/supabase.ts`
 * (which uses the service-role key for database writes) — do not mix the two.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
