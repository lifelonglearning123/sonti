import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Exchanges the PKCE code from Supabase (Google OAuth, email verification,
 * password recovery, and invite links) for a session, then redirects.
 * Recovery/invite flows land on /auth/update-password to set a password.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const type = searchParams.get("type");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(`${origin}/login?error=AuthCallback`);
    }
  }

  const dest =
    type === "recovery" || type === "invite"
      ? "/auth/update-password"
      : next || "/dashboard";

  return NextResponse.redirect(`${origin}${dest}`);
}
