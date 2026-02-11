import type { Session } from 'next-auth';
import type { JWT } from 'next-auth/jwt';

export interface EffectiveIdentity {
  email: string;
  googleId?: string;
}

const SAFE_FILTER_VALUE = /^[\w.+@:-]+$/;

function assertSafeFilterValue(value: string, label: string): void {
  if (!SAFE_FILTER_VALUE.test(value)) {
    throw new Error(`Unsafe ${label} value for PostgREST filter: "${value}"`);
  }
}

export function getEffectiveIdentityFromToken(token: JWT | null): EffectiveIdentity | null {
  if (!token) return null;

  const email = ((token.proxyEmail as string | undefined) || (token.email as string | undefined))?.trim();
  if (!email) return null;

  const googleId = token.proxyEmail
    ? (token.proxyGoogleId as string | undefined)
    : (token.id as string | undefined);

  return googleId ? { email, googleId } : { email };
}

export function getEffectiveIdentityFromSession(session: Session | null): EffectiveIdentity | null {
  const email = session?.user?.email?.trim();
  const googleId = session?.user?.id?.trim();
  if (!email) return null;
  return googleId ? { email, googleId } : { email };
}

export function buildIdentityOrFilter(
  identity: EffectiveIdentity,
  emailColumn: string = 'email',
  googleIdColumn: string = 'google_id'
): string {
  assertSafeFilterValue(identity.email, 'email');
  if (identity.googleId) {
    assertSafeFilterValue(identity.googleId, 'googleId');
    return `${emailColumn}.eq.${identity.email},${googleIdColumn}.eq.${identity.googleId}`;
  }
  return `${emailColumn}.eq.${identity.email}`;
}

export function buildUserIdentityOrFilter(identity: EffectiveIdentity): string {
  return buildIdentityOrFilter(identity);
}
