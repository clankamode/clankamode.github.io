export enum UserRole {
  USER = 'USER',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
}

// Helper function to check if a role has sufficient permissions
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.ADMIN]: 3,
    [UserRole.EDITOR]: 2,
    [UserRole.USER]: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
