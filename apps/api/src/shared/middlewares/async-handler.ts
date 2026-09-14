import type { NextFunction, Request, RequestHandler, Response } from 'express';

/**
 * Encaminha rejeições de handlers assíncronos para o errorHandler.
 * Necessário porque o Express 4 não captura promises rejeitadas automaticamente.
 */
export function asyncHandler(handler: RequestHandler): RequestHandler {
  return (request: Request, response: Response, next: NextFunction) => {
    Promise.resolve(handler(request, response, next)).catch(next);
  };
}
