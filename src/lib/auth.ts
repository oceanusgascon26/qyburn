import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

/**
 * NextAuth configuration.
 *
 * In stub mode, uses a credentials provider that accepts any email/password.
 * When AZURE_AD_CLIENT_ID and AZURE_AD_TENANT_ID are set to real values,
 * you can swap to AzureADProvider for real SSO.
 */
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "SAGA Diagnostics",
      credentials: {
        email: { label: "Email", type: "email", placeholder: "you@saga.com" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        // Stub mode: accept any email with password "admin"
        // In production, replace with Azure AD or real auth
        if (!credentials?.email) return null;

        const isStubMode =
          !process.env.AZURE_CLIENT_ID ||
          process.env.AZURE_CLIENT_ID === "stub-client-id";

        if (isStubMode) {
          // Accept any email with "admin" or "password" as password
          if (
            credentials.password === "admin" ||
            credentials.password === "password"
          ) {
            const name = credentials.email
              .split("@")[0]
              .split(".")
              .map((n) => n.charAt(0).toUpperCase() + n.slice(1))
              .join(" ");

            return {
              id: `user-${Date.now()}`,
              email: credentials.email,
              name,
              role: credentials.email.includes("admin") ? "admin" : "viewer",
            };
          }
          return null;
        }

        // Real auth would go here (e.g., validate against Azure AD)
        return null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as { role?: string }).role ?? "viewer";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { role?: string }).role =
          (token.role as string) ?? "viewer";
        (session.user as { id?: string }).id = token.sub ?? "";
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    maxAge: 8 * 60 * 60, // 8 hours
  },
  secret: process.env.NEXTAUTH_SECRET ?? "qyburn-dev-secret-change-in-prod",
};
