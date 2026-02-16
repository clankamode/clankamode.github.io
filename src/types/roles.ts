export enum UserRole {
  USER = 'USER',
  INSIDER = 'INSIDER',
  EDITOR = 'EDITOR',
  ADMIN = 'ADMIN',
}

// Helper function to check if a role has sufficient permissions
export function hasRole(userRole: UserRole, requiredRole: UserRole): boolean {
  const roleHierarchy = {
    [UserRole.ADMIN]: 4,
    [UserRole.EDITOR]: 3,
    [UserRole.INSIDER]: 2,
    [UserRole.USER]: 1,
  };

  return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
}
