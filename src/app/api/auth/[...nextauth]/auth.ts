import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { getRole } from "@/types/auth";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    }),
  ],
  pages: {
    signIn: '/login',
  },
  callbacks: {
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: token.role
        },
      };
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = getRole(user.email || '');
      }
      return token;
    },
  },
}; 