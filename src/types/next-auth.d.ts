import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id?: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      role?: string;
      userId?: string;
      accessToken?: string | null;
      locationId?: string | null;
    };
    accessToken?: string | null;
    locationId?: string | null;
    role?: string;
    userId?: string;
    error?: string;
  }
  interface User {
    accessToken?: string | null;
    locationId?: string | null;
    role?: string;
    userId?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string | null;
    locationId?: string | null;
    role?: string;
    userId?: string;
    error?: string;
  }
}
