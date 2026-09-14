import { describe, expect, it } from 'vitest';
import { AccessResult, Role } from '@prisma/client';
import { evaluateAccess } from '../src/modules/access/access.policy.js';

const activeEmployee = { id: 'u1', role: Role.EMPLOYEE, isActive: true };
const activeManager = { id: 'u2', role: Role.MANAGER, isActive: true };
const activeAdmin = { id: 'u3', role: Role.SECURITY_ADMIN, isActive: true };

const publicArea = { isActive: true, minimumRole: Role.EMPLOYEE, name: 'Recepção' };
const managerArea = { isActive: true, minimumRole: Role.MANAGER, name: 'Ciências Aplicadas' };
const restrictedArea = { isActive: true, minimumRole: Role.SECURITY_ADMIN, name: 'Batcaverna' };

describe('evaluateAccess', () => {
  it('libera quando o cargo atende ao nível mínimo da área', () => {
    const decision = evaluateAccess(activeEmployee, publicArea, null);
    expect(decision.result).toBe(AccessResult.GRANTED);
  });

  it('libera quando o cargo é superior ao nível mínimo da área', () => {
    expect(evaluateAccess(activeAdmin, publicArea, null).result).toBe(AccessResult.GRANTED);
    expect(evaluateAccess(activeManager, publicArea, null).result).toBe(AccessResult.GRANTED);
  });

  it('nega quando o cargo é inferior ao nível mínimo da área', () => {
    const decision = evaluateAccess(activeEmployee, restrictedArea, null);
    expect(decision.result).toBe(AccessResult.DENIED);
    expect(decision.reason).toContain('Administrador de Segurança');
  });

  it('nega gerente em área exclusiva de administrador', () => {
    expect(evaluateAccess(activeManager, restrictedArea, null).result).toBe(AccessResult.DENIED);
  });

  it('nega usuário inativo mesmo com cargo suficiente', () => {
    const inactiveAdmin = { ...activeAdmin, isActive: false };
    const decision = evaluateAccess(inactiveAdmin, publicArea, null);
    expect(decision.result).toBe(AccessResult.DENIED);
    expect(decision.reason).toBe('Usuário inativo no sistema.');
  });

  it('nega acesso a área desativada mesmo para administrador', () => {
    const decision = evaluateAccess(activeAdmin, { ...publicArea, isActive: false }, null);
    expect(decision.result).toBe(AccessResult.DENIED);
    expect(decision.reason).toBe('Área desativada para acesso.');
  });

  it('libera funcionário com permissão individual em área acima do seu cargo', () => {
    const decision = evaluateAccess(activeEmployee, managerArea, { expiresAt: null });
    expect(decision.result).toBe(AccessResult.GRANTED);
    expect(decision.reason).toBe('Permissão individual concedida para a área.');
  });

  it('nega quando a permissão individual está expirada', () => {
    const yesterday = new Date('2026-01-01T00:00:00.000Z');
    const now = new Date('2026-01-02T00:00:00.000Z');
    const decision = evaluateAccess(activeEmployee, managerArea, { expiresAt: yesterday }, now);
    expect(decision.result).toBe(AccessResult.DENIED);
    expect(decision.reason).toBe('Permissão individual expirada.');
  });

  it('aceita permissão individual ainda dentro da validade', () => {
    const tomorrow = new Date('2026-01-03T00:00:00.000Z');
    const now = new Date('2026-01-02T00:00:00.000Z');
    const decision = evaluateAccess(activeEmployee, managerArea, { expiresAt: tomorrow }, now);
    expect(decision.result).toBe(AccessResult.GRANTED);
  });

  it('prioriza o bloqueio por usuário inativo sobre a permissão individual', () => {
    const inactive = { ...activeEmployee, isActive: false };
    expect(evaluateAccess(inactive, managerArea, { expiresAt: null }).result).toBe(AccessResult.DENIED);
  });
});
