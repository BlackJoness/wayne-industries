import { AccessResult, type Area, type AreaPermission, type Role } from '@prisma/client';
import { hasClearance, ROLE_LABEL } from '../../shared/utils/role.js';

export interface AccessSubject {
  id: string;
  role: Role;
  isActive: boolean;
}

export interface AccessDecision {
  result: AccessResult;
  reason: string;
}

/**
 * Motor de decisão de acesso a áreas restritas.
 *
 * Função pura de propósito: não toca banco, não depende do Express e por isso
 * pode ser testada isoladamente. Toda a regra de segurança do sistema vive aqui,
 * em um único lugar auditável.
 *
 * Ordem de avaliação (a primeira condição satisfeita encerra a decisão):
 *  1. Usuário inativo é sempre negado.
 *  2. Área inativa é sempre negada.
 *  3. Permissão individual válida concede acesso, mesmo abaixo do cargo mínimo.
 *  4. Cargo com nível igual ou superior ao exigido concede acesso.
 *  5. Caso contrário, nega.
 */
export function evaluateAccess(
  subject: AccessSubject,
  area: Pick<Area, 'isActive' | 'minimumRole' | 'name'>,
  permission: Pick<AreaPermission, 'expiresAt'> | null,
  now: Date = new Date(),
): AccessDecision {
  if (!subject.isActive) {
    return { result: AccessResult.DENIED, reason: 'Usuário inativo no sistema.' };
  }

  if (!area.isActive) {
    return { result: AccessResult.DENIED, reason: 'Área desativada para acesso.' };
  }

  if (permission) {
    if (permission.expiresAt && permission.expiresAt <= now) {
      return { result: AccessResult.DENIED, reason: 'Permissão individual expirada.' };
    }
    return { result: AccessResult.GRANTED, reason: 'Permissão individual concedida para a área.' };
  }

  if (hasClearance(subject.role, area.minimumRole)) {
    return {
      result: AccessResult.GRANTED,
      reason: `Nível de acesso do cargo atende ao exigido pela área.`,
    };
  }

  return {
    result: AccessResult.DENIED,
    reason: `A área exige o nível ${ROLE_LABEL[area.minimumRole]} ou superior.`,
  };
}
