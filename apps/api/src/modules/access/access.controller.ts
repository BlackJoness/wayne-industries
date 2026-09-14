import type { Request, Response } from 'express';
import type { AccessService } from './access.service.js';
import type { ListLogsQuery } from './access.schema.js';

export class AccessController {
  constructor(private readonly service: AccessService) {}

  attempt = async (request: Request, response: Response): Promise<void> => {
    const outcome = await this.service.attempt(request.user!.id, request.body.areaId, request.ip);
    // A tentativa foi processada com sucesso mesmo quando o acesso é negado,
    // por isso o status é 200 e a negativa vem no corpo.
    response.status(200).json({ result: outcome.result, reason: outcome.reason, log: outcome.log });
  };

  clearanceMap = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.service.clearanceMap(request.user!.id));
  };

  listLogs = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.listLogs(
      request.user!.id,
      request.user!.role,
      request.query as unknown as ListLogsQuery,
    );
    response.status(200).json(result);
  };

  listOwnLogs = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.listOwnLogs(request.user!.id, request.query as unknown as ListLogsQuery);
    response.status(200).json(result);
  };
}
