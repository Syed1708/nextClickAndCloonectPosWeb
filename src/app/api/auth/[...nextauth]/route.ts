import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';

export const authOptions: NextAuthOptions = {
  providers: [
    // 1. Web Customer Provider (clients table)
    CredentialsProvider({
      id: 'client-credentials',
      name: 'Client Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          console.log('👉 [NextAuth] Attempting client login for:', credentials.email);

          const res = await fetch(`${API_BASE_URL}/api/client/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await res.json();
          console.log('👈 [Laravel Response Status]', res.status, data);

          if (!res.ok) {
            console.error('❌ [Login Failed]', data.message || data);
            return null;
          }

          // 🚀 Flexible Key Extraction (Handles data.client, data.user, or data.data)
          const clientData = data.client || data.user || data.data;
          const tokenData = data.token || data.access_token;

          if (clientData && tokenData) {
            return {
              id: String(clientData.id),
              name: clientData.name,
              email: clientData.email,
              accessToken: tokenData,
              userType: 'client',
              role: 'customer',
            };
          }

          console.error('❌ Missing clientData or tokenData in response payload:', data);
          return null;
        } catch (err) {
          console.error('❌ NextAuth client authorize exception:', err);
          return null;
        }
      },
    }),

    // 2. POS Staff Provider (users table)
    CredentialsProvider({
      id: 'staff-credentials',
      name: 'Staff Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(`${API_BASE_URL}/api/admin/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
            body: JSON.stringify({
              email: credentials.email,
              password: credentials.password,
            }),
          });

          const data = await res.json();

          if (res.ok) {
            const userData = data.user || data.data;
            const tokenData = data.token || data.access_token;

            if (userData && tokenData) {
              return {
                id: String(userData.id),
                name: userData.name,
                email: userData.email,
                accessToken: tokenData,
                userType: 'staff',
                role: userData.role || 'cashier',
              };
            }
          }

          return null;
        } catch (err) {
          console.error('Staff auth error:', err);
          return null;
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accessToken = (user as any).accessToken;
        token.userType = (user as any).userType;
        token.role = (user as any).role;
      }
      return token;
    },

    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.id;
        (session.user as any).userType = token.userType;
        (session.user as any).role = token.role;
        (session as any).accessToken = token.accessToken;
      }
      return session;
    },
  },

  pages: {
    signIn: '/login',
  },
  session: {
    strategy: 'jwt',
  },
};

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };