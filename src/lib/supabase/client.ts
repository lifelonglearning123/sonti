import { createBrowserClient } from "@supabase/ssr";

/**
 * Supabase client for use inside "use client" components. Replaces next-auth's
 * useSession / signIn / signOut on the browser.
 */
export function createSupabaseBrowserClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
