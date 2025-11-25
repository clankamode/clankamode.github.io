import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { supabase } from "@/lib/supabase";
import { UserRole } from "@/types/roles";

const getRole = async (email: string): Promise<UserRole> => {
  // First, try to get the existing user
  const { data: user, error } = await supabase
    .from('Users')
    .select('role')
    .eq('email', email)
    .single();

  // If user exists, return their role
  if (user && !error) {
    return user.role as UserRole;
  }

  // If user doesn't exist, create them with the basic USER role
  const { data: newUser, error: upsertError } = await supabase
    .from('Users')
    .upsert(
      { 
        email, 
        role: UserRole.USER 
      },
      { 
        onConflict: 'email',
        ignoreDuplicates: false 
      }
    )
    .select('role')
    .single();

  if (upsertError) {
    console.error('Error upserting user:', upsertError);
    // Return USER as fallback even if upsert fails
    return UserRole.USER;
  }

  return newUser?.role as UserRole || UserRole.USER;
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
      // Fetch the role from the database on every session request
      // This ensures role changes are reflected immediately
      const role = await getRole(session.user?.email || '');
      
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: role
        },
      };
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      // Always fetch the role from the database to keep the JWT token updated
      // This ensures middleware has access to the current role
      if (token.email) {
        token.role = await getRole(token.email as string);
      }
      return token;
    },
  },
}; 