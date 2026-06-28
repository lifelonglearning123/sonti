/**
 * Resolve the app's base URL (scheme://host[:port]) from the incoming request.
 * Honors reverse-proxy headers (Vercel, nginx) and falls back to env vars.
 * Use this for building user-facing links (e.g. invite/redirect URLs) so they
 * always match the host the app is actually being served on.
 */
export function baseUrlFromRequest(req: Request): string {
  const url = new URL(req.url);
  const proto =
    req.headers.get("x-forwarded-proto")?.split(",")[0]?.trim() ||
    url.protocol.replace(":", "");
  const host =
    req.headers.get("x-forwarded-host")?.split(",")[0]?.trim() ||
    req.headers.get("host") ||
    url.host;

  if (host) return `${proto}://${host}`;

  // Fallback when no host header is available.
  const env =
    process.env.NEXTAUTH_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");
  return env.replace(/\/$/, "");
}
