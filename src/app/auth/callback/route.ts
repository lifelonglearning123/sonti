import { NextRequest, NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { createSupabaseServerClient } from "@/lib/supabase/server";

/**
 * Auth landing for Supabase email links and OAuth.
 * - Email links (invite / recovery / signup / magiclink): use `token_hash` + `type`
 *   verified via verifyOtp — the recommended SSR flow (no PKCE code-verifier needed).
 * - OAuth (Google): uses `?code=` exchanged via exchangeCodeForSession.
 * Recovery/invite then land on /auth/update-password to set a password.
 */
export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = (searchParams.get("type") || "") as EmailOtpType | "";
  const next = searchParams.get("next");

  const supabase = await createSupabaseServerClient();
  let error: { message: string } | null = null;

  if (tokenHash && type) {
    ({ error } = await supabase.auth.verifyOtp({ type: type as EmailOtpType, token_hash: tokenHash }));
  } else if (code) {
    ({ error } = await supabase.auth.exchangeCodeForSession(code));
  } else {
    return NextResponse.redirect(`${origin}/login?error=AuthMissingParams`);
  }

  if (error) {
    return NextResponse.redirect(
      `${origin}/login?error=AuthCallback&reason=${encodeURIComponent(error.message)}`
    );
  }

  const dest =
    type === "recovery" || type === "invite"
      ? "/auth/update-password"
      : next || "/dashboard";

  return NextResponse.redirect(`${origin}${dest}`);
}
