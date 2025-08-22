import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { supabase } from "@/lib/supabase";
import { UserRole } from "@/types/roles";

const getRole = async (email: string): Promise<UserRole> => {
  const { data: user, error } = await supabase
    .from('Users')
    .select('role')
    .eq('email', email)
    .single();

  if (error || !user) {
    console.error('email', email);
    console.error('Error fetching user role:', error);
    return UserRole.USER;
  }

  return user.role as UserRole;
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
        token.role = await getRole(user.email || '');
      }
      return token;
    },
  },
}; 