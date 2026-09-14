import type { Request, Response } from 'express';
import type { AreasService } from './areas.service.js';

export class AreasController {
  constructor(private readonly service: AreasService) {}

  list = async (_request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.service.list());
  };

  findById = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.service.findById(request.params.id!));
  };

  create = async (request: Request, response: Response): Promise<void> => {
    response.status(201).json(await this.service.create(request.body, request.user!.id));
  };

  update = async (request: Request, response: Response): Promise<void> => {
    response.status(200).json(await this.service.update(request.params.id!, request.body, request.user!.id));
  };

  delete = async (request: Request, response: Response): Promise<void> => {
    await this.service.delete(request.params.id!, request.user!.id);
    response.status(204).send();
  };

  grantPermission = async (request: Request, response: Response): Promise<void> => {
    response.status(201).json(await this.service.grantPermission(request.params.id!, request.body, request.user!.id));
  };

  revokePermission = async (request: Request, response: Response): Promise<void> => {
    const { id, userId } = request.params as { id: string; userId: string };
    response.status(200).json(await this.service.revokePermission(id, userId, request.user!.id));
  };
}
