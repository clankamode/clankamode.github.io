import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';
import { UserRole, hasRole } from '@/types/roles';

export async function getAuthToken(req: NextRequest) {
  const token = await getToken({ req });
  return token;
}

export async function requireAuth(req: NextRequest, requiredRole: UserRole = UserRole.EDITOR) {
  const token = await getAuthToken(req);
  
  if (!token) {
    return null;
  }
  
  const effectiveRole = (token?.proxyRole as UserRole) || (token?.role as UserRole);
  
  if (!hasRole(effectiveRole, requiredRole)) {
    return null;
  }
  
  return token;
}
