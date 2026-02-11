import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { UserRole } from "@/types/roles";

interface UserIdentity {
  role: UserRole;
  googleId: string | null;
}

const getUserIdentity = async (email: string, googleId?: string): Promise<UserIdentity> => {
  if (process.env.NODE_ENV !== 'production' && email === 'e2e-admin@example.com') {
    return { role: UserRole.ADMIN, googleId: googleId ?? null };
  }

  const supabase = getSupabaseAdminClient();

  const { data: user, error } = await supabase
    .from('Users')
    .select('role, google_id')
    .eq('email', email)
    .single();

  if (user && !error) {
    if (googleId && user.google_id !== googleId) {
      const { error: updateError } = await supabase
        .from('Users')
        .update({ google_id: googleId })
        .eq('email', email);

      if (updateError) {
        console.error('Error updating google_id:', updateError);
      }
      return { role: user.role as UserRole, googleId };
    }
    return { role: user.role as UserRole, googleId: user.google_id as string | null };
  }

  const { data: newUser, error: upsertError } = await supabase
    .from('Users')
    .upsert(
      {
        email,
        google_id: googleId,
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
    return { role: UserRole.USER, googleId: googleId ?? null };
  }

  return { role: (newUser?.role as UserRole) || UserRole.USER, googleId: googleId ?? null };
};

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
      const effectiveUserId = token.proxyEmail
        ? ((token.proxyGoogleId as string | null | undefined) ?? null)
        : (token.id as string);
      const effectiveName = (token.proxyName as string) || (session.user?.name ?? token.name ?? null);
      const effectiveImage = (token.proxyImage as string) || (session.user?.image ?? (token as { image?: string }).image ?? null);

      return {
        ...session,
        user: {
          ...session.user,
          id: effectiveUserId,
          role: effectiveRole,
          email: effectiveEmail,
          name: effectiveName,
          image: effectiveImage
        },
        proxy: token.proxyEmail
          ? {
            email: token.proxyEmail as string,
            googleId: (token.proxyGoogleId as string | null) || null,
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

      if (token.email) {
        const identity = await getUserIdentity(token.email as string, token.id as string | undefined);
        token.role = identity.role;
        token.originalRole = token.originalRole || token.role;
      }

      if (trigger === 'update' && session && 'proxyEmail' in session) {
        const requestedProxyEmail = (session as { proxyEmail?: string | null }).proxyEmail;

        if (!requestedProxyEmail) {
          delete (token as { proxyEmail?: string | null }).proxyEmail;
          delete (token as { proxyRole?: string | null }).proxyRole;
          delete (token as { proxyGoogleId?: string | null }).proxyGoogleId;
          delete (token as { proxyName?: string | null }).proxyName;
          delete (token as { proxyImage?: string | null }).proxyImage;
        } else if (token.role === UserRole.ADMIN) {
          const proxyIdentity = await getUserIdentity(requestedProxyEmail);
          (token as { proxyEmail?: string }).proxyEmail = requestedProxyEmail;
          (token as { proxyRole?: UserRole }).proxyRole = proxyIdentity.role;
          (token as { proxyGoogleId?: string | null }).proxyGoogleId = proxyIdentity.googleId;
          (token as { proxyName?: string }).proxyName = (session as { proxyName?: string }).proxyName || requestedProxyEmail;
          (token as { proxyImage?: string | null }).proxyImage = (session as { proxyImage?: string | null }).proxyImage || null;
        }
      }
      return token;
    },
    async redirect({ url, baseUrl }) {
      if (url.startsWith('/')) {
        return url === '/' ? `${baseUrl}/home` : `${baseUrl}${url}`;
      }

      if (url.startsWith(baseUrl)) {
        const path = url.slice(baseUrl.length);
        if (path === '' || path === '/') {
          return `${baseUrl}/home`;
        }
        return url;
      }

      return `${baseUrl}/home`;
    },
  },
};
