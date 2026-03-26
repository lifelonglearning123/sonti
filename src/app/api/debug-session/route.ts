import { auth } from "@/lib/auth";

export async function GET() {
  const session = await auth();
  return Response.json({
    hasSession: !!session,
    sessionKeys: session ? Object.keys(session) : [],
    role: (session as any)?.role,
    userRole: (session?.user as any)?.role,
    userId: (session as any)?.userId,
    userUserId: (session?.user as any)?.userId,
    accessToken: (session as any)?.accessToken ? "set" : "not set",
    userAccessToken: (session?.user as any)?.accessToken ? "set" : "not set",
    userName: session?.user?.name,
    fullSession: session,
  });
}
