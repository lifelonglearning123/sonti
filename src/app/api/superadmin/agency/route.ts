import { getSuperAdminContext } from "@/lib/dal";
import { prisma } from "@/lib/db";
import {
  getCompanyId,
  hasEnvPit,
  isOAuthConnected,
  listAgencySubAccounts,
  disconnectAgencyOAuth,
} from "@/lib/ghl-tokens";

const AGENCY_ID = "singleton";

// Status of both agency connection methods (OAuth + env PIT).
export async function GET() {
  const ctx = await getSuperAdminContext();
  if (!ctx) return Response.json({ error: "Forbidden" }, { status: 403 });

  const oauthConnected = await isOAuthConnected();
  const pitConfigured = hasEnvPit();

  const conn = oauthConnected
    ? await prisma.agencyConnection.findUnique({
        where: { id: AGENCY_ID },
        select: { agencyName: true, companyId: true },
      })
    : null;

  // Verify the active method can actually reach GHL.
  let subAccountCount: number | null = null;
  if (oauthConnected || pitConfigured) {
    try {
      subAccountCount = (await listAgencySubAccounts()).length;
    } catch {
      subAccountCount = null;
    }
  }

  return Response.json({
    connected: oauthConnected || pitConfigured,
    oauthConnected,
    pitConfigured,
    activeMethod: oauthConnected ? "oauth" : pitConfigured ? "pit" : null,
    agencyName: conn?.agencyName ?? null,
    companyId: conn?.companyId ?? getCompanyId(),
    subAccountCount,
  });
}

// Disconnect the OAuth connection (env PIT, if any, remains as fallback).
export async function DELETE() {
  const ctx = await getSuperAdminContext();
  if (!ctx) return Response.json({ error: "Forbidden" }, { status: 403 });

  await disconnectAgencyOAuth();
  return Response.json({ success: true });
}
