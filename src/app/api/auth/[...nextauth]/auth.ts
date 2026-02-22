import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { NextAuthOptions } from "next-auth";
import { getSupabaseAdminClient } from "@/lib/supabaseAdmin";
import { UserRole } from "@/types/roles";

interface UserIdentity {
  role: UserRole;
  googleId: string | null;
  isNewUser: boolean;
  username: string;
}

const getUserIdentity = async (email: string, googleId?: string): Promise<UserIdentity> => {
  if (process.env.NODE_ENV !== 'production' && email === 'e2e-admin@example.com') {
    return { role: UserRole.ADMIN, googleId: googleId ?? null, isNewUser: false, username: 'e2e-admin' };
  }

  const supabase = getSupabaseAdminClient();

  const { data: user, error } = await supabase
    .from('Users')
    .select('role, google_id, username')
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
      return { role: user.role as UserRole, googleId, isNewUser: false, username: user.username as string };
    }
    return { role: user.role as UserRole, googleId: user.google_id as string | null, isNewUser: false, username: user.username as string };
  }

  const prefix = email.split('@')[0]?.toLowerCase() || 'user';

  let upsertResult = await supabase
    .from('Users')
    .upsert(
      { email, google_id: googleId, role: UserRole.USER, username: prefix },
      { onConflict: 'email', ignoreDuplicates: false }
    )
    .select('role, username')
    .single();

  // If username already taken, retry with a unique fallback
  if (upsertResult.error?.code === '23505') {
    upsertResult = await supabase
      .from('Users')
      .upsert(
        { email, google_id: googleId, role: UserRole.USER, username: `${prefix}_${Date.now()}` },
        { onConflict: 'email', ignoreDuplicates: false }
      )
      .select('role, username')
      .single();
  }

  const { data: newUser, error: upsertError } = upsertResult;

  if (upsertError || !newUser) {
    console.error('Error upserting user:', upsertError);
    return { role: UserRole.USER, googleId: googleId ?? null, isNewUser: false, username: prefix };
  }

  return { role: (newUser.role as UserRole) || UserRole.USER, googleId: googleId ?? null, isNewUser: true, username: newUser.username as string };
};

export const authOptions: NextAuthOptions = {
  providers: (() => {
    const providers: NonNullable<NextAuthOptions['providers']> = [];
    const isProduction = process.env.NODE_ENV === 'production';
    const isProductionBuild = process.env.NEXT_PHASE === 'phase-production-build';
    const googleEnabled = Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);
    const devAuthEnabled = !isProduction && process.env.DEV_AUTH !== 'false';

    if (googleEnabled) {
      providers.push(
        GoogleProvider({
          clientId: process.env.GOOGLE_CLIENT_ID!,
          clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
        })
      );
    } else if (isProduction && !isProductionBuild) {
      throw new Error('Google OAuth is required in production. Set GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET.');
    }

    if (devAuthEnabled) {
      providers.push(
        CredentialsProvider({
          id: 'credentials',
          name: 'Dev Login',
          credentials: {
            email: { label: 'Email', type: 'email' },
          },
          async authorize(credentials) {
            const email = credentials?.email?.trim().toLowerCase();
            if (!email || !email.includes('@')) {
              return null;
            }

            return {
              id: `dev:${email}`,
              email,
              name: email.split('@')[0] || 'Dev User',
              role: UserRole.USER,
            };
          },
        })
      );
    }

    return providers;
  })(),
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
          image: effectiveImage,
          firstLoginPending: !!token.firstLoginPending,
          username: token.username as string,
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
    async jwt({ token, user, trigger, session, account }) {
      if (user) {
        token.id = user.id;
        token.email = token.email || user.email;
        token.name = token.name || user.name;
        (token as { image?: string | null }).image = (token as { image?: string | null }).image || user.image;
        token.originalEmail = token.originalEmail || user.email;
        token.originalName = token.originalName || user.name;
        token.originalImage = (token as { originalImage?: string | null }).originalImage || user.image;
      }

      if (account?.provider) {
        (token as { authProvider?: string }).authProvider = account.provider;
      }

      if (token.email) {
        const authProvider = (token as { authProvider?: string }).authProvider;
        const googleId = authProvider === 'google' ? (token.id as string | undefined) : undefined;
        const identity = await getUserIdentity(token.email as string, googleId);
        token.role = identity.role;
        token.originalRole = token.originalRole || token.role;
        token.username = identity.username;
        if (user) {
          token.firstLoginPending = identity.isNewUser;
        }
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

      if (trigger === 'update' && session && 'completeFirstLogin' in session && session.completeFirstLogin) {
        delete (token as { firstLoginPending?: boolean }).firstLoginPending;
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
