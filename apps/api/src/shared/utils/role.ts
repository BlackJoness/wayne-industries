import { Role } from '@prisma/client';

/** Hierarquia de cargos. Número maior representa nível de acesso mais alto. */
export const ROLE_RANK: Record<Role, number> = {
  [Role.EMPLOYEE]: 1,
  [Role.MANAGER]: 2,
  [Role.SECURITY_ADMIN]: 3,
};

export const ROLE_LABEL: Record<Role, string> = {
  [Role.EMPLOYEE]: 'Funcionário',
  [Role.MANAGER]: 'Gerente',
  [Role.SECURITY_ADMIN]: 'Administrador de Segurança',
};

export function hasClearance(userRole: Role, requiredRole: Role): boolean {
  return ROLE_RANK[userRole] >= ROLE_RANK[requiredRole];
}
