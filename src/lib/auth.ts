import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";

const GHL_TOKEN_URL = "https://services.leadconnectorhq.com/oauth/token";
const GHL_BASE_URL = "https://services.leadconnectorhq.com";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      id: "ghl-token",
      name: "GoHighLevel",
      credentials: {
        code: { label: "Authorization Code", type: "text" },
        accessToken: { label: "Access Token", type: "text" },
        locationId: { label: "Location ID", type: "text" },
      },
      async authorize(credentials) {
        const code = credentials?.code as string;
        const directToken = credentials?.accessToken as string;
        const directLocationId = credentials?.locationId as string;

        // Private Integration Token flow (direct token)
        if (directToken && directLocationId) {
          // Verify the token works
          try {
            const testRes = await fetch(`${GHL_BASE_URL}/locations/${directLocationId}`, {
              headers: {
                Authorization: `Bearer ${directToken}`,
                Version: "2021-07-28",
              },
            });
            if (!testRes.ok) {
              console.error("Token verification failed:", testRes.status);
              return null;
            }
            const locationData = await testRes.json();
            return {
              id: directLocationId,
              name: locationData.location?.name || "GHL User",
              email: locationData.location?.email || null,
              accessToken: directToken,
              refreshToken: null,
              locationId: directLocationId,
              expiresAt: Date.now() + 365 * 24 * 60 * 60 * 1000, // Private tokens don't expire
            };
          } catch (error) {
            console.error("Token verification error:", error);
            return null;
          }
        }

        // OAuth code exchange flow
        if (code) {
          try {
            const tokenRes = await fetch(GHL_TOKEN_URL, {
              method: "POST",
              headers: { "Content-Type": "application/x-www-form-urlencoded" },
              body: new URLSearchParams({
                grant_type: "authorization_code",
                code,
                client_id: process.env.GHL_CLIENT_ID!,
                client_secret: process.env.GHL_CLIENT_SECRET!,
                redirect_uri: `${process.env.NEXTAUTH_URL}/api/auth/callback/ghl`,
              }),
            });
            const tokenData = await tokenRes.json();
            if (!tokenRes.ok || !tokenData.access_token) {
              console.error("GHL token exchange failed:", tokenData);
              return null;
            }
            return {
              id: tokenData.userId || tokenData.locationId || "ghl-user",
              name: tokenData.userName || "GHL User",
              email: tokenData.userEmail || null,
              accessToken: tokenData.access_token,
              refreshToken: tokenData.refresh_token,
              locationId: tokenData.locationId,
              expiresAt: Date.now() + (tokenData.expires_in || 86399) * 1000,
            };
          } catch (error) {
            console.error("GHL authorization error:", error);
            return null;
          }
        }

        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = (user as any).accessToken;
        token.refreshToken = (user as any).refreshToken;
        token.locationId = (user as any).locationId;
        token.expiresAt = (user as any).expiresAt;
      }

      // Refresh if expired (only for OAuth tokens, not private tokens)
      if (token.refreshToken && token.expiresAt && Date.now() > (token.expiresAt as number)) {
        try {
          const response = await fetch(GHL_TOKEN_URL, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
              grant_type: "refresh_token",
              refresh_token: token.refreshToken as string,
              client_id: process.env.GHL_CLIENT_ID!,
              client_secret: process.env.GHL_CLIENT_SECRET!,
            }),
          });
          const refreshed = await response.json();
          if (!response.ok) throw refreshed;
          token.accessToken = refreshed.access_token;
          token.refreshToken = refreshed.refresh_token ?? token.refreshToken;
          token.expiresAt = Date.now() + (refreshed.expires_in ?? 86399) * 1000;
        } catch (error) {
          console.error("Token refresh failed:", error);
          token.error = "RefreshAccessTokenError";
        }
      }
      return token;
    },
    async session({ session, token }) {
      (session as any).accessToken = token.accessToken;
      (session as any).locationId = token.locationId;
      (session as any).error = token.error;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
