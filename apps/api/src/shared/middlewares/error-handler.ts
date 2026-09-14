import type { NextFunction, Request, Response } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError } from '../errors/app-error.js';
import { env } from '../../config/env.js';

interface ErrorBody {
  code: string;
  message: string;
  details?: unknown;
}

/** Ponto único de tratamento de erro. Nenhuma stack trace vaza para o cliente. */
export function errorHandler(
  error: Error,
  _request: Request,
  response: Response,
  _next: NextFunction,
): void {
  if (error instanceof AppError) {
    const body: ErrorBody = { code: error.code, message: error.message };
    if (error.details) body.details = error.details;
    response.status(error.statusCode).json(body);
    return;
  }

  if (error instanceof ZodError) {
    response.status(400).json({
      code: 'BAD_REQUEST',
      message: 'Dados inválidos na requisição.',
      details: error.flatten().fieldErrors,
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2002') {
      response.status(409).json({ code: 'CONFLICT', message: 'Já existe um registro com esse valor único.' });
      return;
    }
    if (error.code === 'P2025') {
      response.status(404).json({ code: 'NOT_FOUND', message: 'Registro não encontrado.' });
      return;
    }
  }

  if (env.NODE_ENV !== 'test') {
    console.error('[erro inesperado]', error);
  }

  response.status(500).json({
    code: 'INTERNAL_SERVER_ERROR',
    message: 'Erro interno do servidor. Tente novamente em instantes.',
  });
}
