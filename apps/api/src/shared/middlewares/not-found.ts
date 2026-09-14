import type { Request, Response } from 'express';

export function notFoundHandler(request: Request, response: Response): void {
  response.status(404).json({
    code: 'ROUTE_NOT_FOUND',
    message: `Rota ${request.method} ${request.originalUrl} não existe nesta API.`,
  });
}
