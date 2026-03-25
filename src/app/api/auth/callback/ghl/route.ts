import { NextRequest, NextResponse } from "next/server";

// GHL redirects here with ?code=AUTH_CODE after user authorizes
// We redirect to a page that will exchange the code for tokens via NextAuth credentials
export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get("code");

  if (!code) {
    return NextResponse.redirect(new URL("/login?error=NoCode", req.url));
  }

  // Redirect to the login page with the code, which will auto-submit to NextAuth
  return NextResponse.redirect(
    new URL(`/login?code=${encodeURIComponent(code)}`, req.url)
  );
}
