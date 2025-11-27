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
      const effectiveRole = (token.proxyRole as UserRole) || (token.role as UserRole);
      const effectiveEmail = (token.proxyEmail as string) || (token.email as string | null);
      const effectiveName = (token.proxyName as string) || (session.user?.name ?? token.name ?? null);
      const effectiveImage = (token.proxyImage as string) || (session.user?.image ?? (token as { image?: string }).image ?? null);

      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          role: effectiveRole,
          email: effectiveEmail,
          name: effectiveName,
          image: effectiveImage
        },
        proxy: token.proxyEmail
          ? {
              email: token.proxyEmail as string,
              role: token.proxyRole as UserRole,
              name: (token.proxyName as string | undefined) || undefined,
              image: (token.proxyImage as string | undefined) || undefined
            }
          : null,
        originalUser: {
          email: (token.originalEmail as string | null) || (token.email as string | null) || null,
          name: (token.originalName as string | null) || null,
          image: (token.originalImage as string | null) || null,
          role: (token.role as UserRole) || UserRole.USER
        },
        isProxying: !!token.proxyEmail
      };
    },
    async jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.email = token.email || user.email;
        token.name = token.name || user.name;
        (token as { image?: string | null }).image = (token as { image?: string | null }).image || user.image;
        token.originalEmail = token.originalEmail || user.email;
        token.originalName = token.originalName || user.name;
        token.originalImage = (token as { originalImage?: string | null }).originalImage || user.image;
      }

      // Always fetch the role from the database to keep the JWT token updated
      // This ensures middleware has access to the current role
      if (token.email) {
        token.role = await getRole(token.email as string);
        token.originalRole = token.originalRole || token.role;
      }

      if (trigger === 'update' && session && 'proxyEmail' in session) {
        const requestedProxyEmail = (session as { proxyEmail?: string | null }).proxyEmail;

        // Clear proxy when admin submits an empty value
        if (!requestedProxyEmail) {
          delete (token as { proxyEmail?: string | null }).proxyEmail;
          delete (token as { proxyRole?: string | null }).proxyRole;
          delete (token as { proxyName?: string | null }).proxyName;
          delete (token as { proxyImage?: string | null }).proxyImage;
        } else if (token.role === UserRole.ADMIN) {
          const proxyRole = await getRole(requestedProxyEmail);
          (token as { proxyEmail?: string }).proxyEmail = requestedProxyEmail;
          (token as { proxyRole?: UserRole }).proxyRole = proxyRole;
          (token as { proxyName?: string }).proxyName = (session as { proxyName?: string }).proxyName || requestedProxyEmail;
          (token as { proxyImage?: string | null }).proxyImage = (session as { proxyImage?: string | null }).proxyImage || null;
        }
      }
      return token;
    },
  },
};