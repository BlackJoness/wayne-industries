import type { NextFunction, Request, Response } from 'express';
import { ZodError, type ZodSchema } from 'zod';
import { BadRequestError } from '../errors/app-error.js';

interface ValidationSchemas {
  body?: ZodSchema;
  params?: ZodSchema;
  query?: ZodSchema;
}

/** Valida e sanitiza a entrada antes de chegar ao controller. */
export function validate(schemas: ValidationSchemas) {
  return (request: Request, _response: Response, next: NextFunction): void => {
    try {
      if (schemas.body) request.body = schemas.body.parse(request.body);
      if (schemas.params) request.params = schemas.params.parse(request.params);
      if (schemas.query) Object.assign(request.query, schemas.query.parse(request.query));
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        throw new BadRequestError('Dados inválidos na requisição.', error.flatten().fieldErrors);
      }
      throw error;
    }
  };
}
