import { describe, expect, it } from 'vitest';
import express from 'express';
import request from 'supertest';
import { Role } from '@prisma/client';
import { z } from 'zod';
import { createAuthenticate, type AuthenticatedUser } from '../src/shared/middlewares/authenticate.js';
import { authorize } from '../src/shared/middlewares/authorize.js';
import { validate } from '../src/shared/middlewares/validate.js';
import { errorHandler } from '../src/shared/middlewares/error-handler.js';
import { signToken } from '../src/shared/utils/jwt.js';

/** Banco falso: o cargo vem daqui, não do token. */
const USERS: Record<string, AuthenticatedUser> = {
  'admin-1': { id: 'admin-1', role: Role.SECURITY_ADMIN, isActive: true },
  'employee-1': { id: 'employee-1', role: Role.EMPLOYEE, isActive: true },
  'inativo-1': { id: 'inativo-1', role: Role.SECURITY_ADMIN, isActive: false },
};

const authenticate = createAuthenticate(async (id) => USERS[id] ?? null);

function buildTestApp() {
  const app = express();
  app.use(express.json());

  app.get('/protegida', authenticate, (req, res) => {
    res.json({ userId: req.user?.id, role: req.user?.role });
  });

  app.delete('/somente-admin', authenticate, authorize(Role.SECURITY_ADMIN), (_req, res) => {
    res.status(204).send();
  });

  app.post('/com-validacao', validate({ body: z.object({ nome: z.string().min(3) }) }), (req, res) =>
    res.status(201).json(req.body),
  );

  app.use(errorHandler);
  return app;
}

const app = buildTestApp();
const adminToken = signToken({ sub: 'admin-1' });
const employeeToken = signToken({ sub: 'employee-1' });
const inactiveToken = signToken({ sub: 'inativo-1' });
const ghostToken = signToken({ sub: 'nao-existe' });

describe('camada de autenticação e autorização', () => {
  it('bloqueia requisição sem token com 401', async () => {
    const response = await request(app).get('/protegida');
    expect(response.status).toBe(401);
    expect(response.body.code).toBe('UNAUTHORIZED');
  });

  it('bloqueia token malformado com 401', async () => {
    const response = await request(app).get('/protegida').set('Authorization', 'Bearer token-invalido');
    expect(response.status).toBe(401);
  });

  it('permite acesso com token válido e carrega o cargo do banco', async () => {
    const response = await request(app).get('/protegida').set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(response.body).toEqual({ userId: 'admin-1', role: Role.SECURITY_ADMIN });
  });

  it('rejeita com 401 o token de um usuário desativado depois da emissão', async () => {
    const response = await request(app).get('/protegida').set('Authorization', `Bearer ${inactiveToken}`);
    expect(response.status).toBe(401);
    expect(response.body.message).toContain('inativo');
  });

  it('rejeita com 401 o token de um usuário que não existe mais', async () => {
    const response = await request(app).get('/protegida').set('Authorization', `Bearer ${ghostToken}`);
    expect(response.status).toBe(401);
  });

  it('devolve 403 quando o cargo não está na lista permitida', async () => {
    const response = await request(app).delete('/somente-admin').set('Authorization', `Bearer ${employeeToken}`);
    expect(response.status).toBe(403);
    expect(response.body.code).toBe('FORBIDDEN');
  });

  it('devolve 204 quando o cargo está autorizado', async () => {
    const response = await request(app).delete('/somente-admin').set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(204);
  });

  it('rejeita corpo inválido com 400 e detalha o campo', async () => {
    const response = await request(app).post('/com-validacao').send({ nome: 'ab' });
    expect(response.status).toBe(400);
    expect(response.body.code).toBe('BAD_REQUEST');
    expect(response.body.details).toHaveProperty('nome');
  });

  it('nunca devolve stack trace ao cliente', async () => {
    const response = await request(app).get('/protegida');
    expect(JSON.stringify(response.body)).not.toContain('at ');
  });
});
