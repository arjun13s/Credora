import type { NextAuthConfig } from "next-auth";

// Edge-safe config — no bcryptjs, no Node-only modules.
// Used by middleware. The full auth.ts adds the Credentials provider.
export const authConfig: NextAuthConfig = {
  pages: {
    signIn: "/login",
  },
  callbacks: {
    authorized({ auth, request: { nextUrl } }) {
      return true; // Let all requests through; page-level guards handle access.
    },
  },
  providers: [], // Providers added in auth.ts
};
