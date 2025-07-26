import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";

const ADMINS = ['jamesperalta.swe@gmail.com'];
const EDITORS = ['castleridge.labs@gmail.com', 'cedsanityfitness@gmail.com'];

const getRole = (email: string) => {
  if (ADMINS.includes(email)) {
    return 'ADMIN';
  }

  if (EDITORS.includes(email)) {
    return 'EDITOR';
  }

  return 'USER';
}

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