import NextAuth from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"

const handler = NextAuth({
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: "Email", type: "email", placeholder: "admin@cadviewer.local" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        // MVP: Hardcoded auth for Tenant Zero. In Phase 2, this hits the PostgreSQL table.
        if (credentials?.email === "admin@cadviewer.local" && credentials?.password === "password") {
          return { id: "1", name: "Super Admin", email: "admin@cadviewer.local", tenant_id: "tenant-0000" }
        }
        return null
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.tenant_id = (user as any).tenant_id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).tenant_id = token.tenant_id;
      }
      return session;
    }
  },
  pages: {
    signIn: '/login',
  }
})

export { handler as GET, handler as POST }
