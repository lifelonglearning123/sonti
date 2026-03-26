import NextAuth from "next-auth";
import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const authConfig: NextAuthConfig = {
  providers: [
    Credentials({
      id: "credentials",
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const username = credentials?.username as string;
        const password = credentials?.password as string;

        if (!username || !password) return null;

        try {
          const user = await prisma.user.findUnique({
            where: { username },
          });

          if (!user) return null;

          const valid = await bcrypt.compare(password, user.passwordHash);
          if (!valid) return null;

          return {
            id: user.id,
            name: user.username,
            role: user.role,
            userId: user.id,
            accessToken: user.ghlAccessToken || null,
            locationId: user.ghlLocationId || null,
          };
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.locationId = user.locationId;
        token.role = user.role;
        token.userId = user.userId;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | null;
      session.locationId = token.locationId as string | null;
      session.role = token.role as string;
      session.userId = token.userId as string;
      session.error = token.error as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: { strategy: "jwt" },
};

export const { handlers, signIn, signOut, auth } = NextAuth(authConfig);
