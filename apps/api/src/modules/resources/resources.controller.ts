import type { Request, Response } from 'express';
import type { ListResourcesQuery } from './resources.schema.js';
import type { ResourcesService } from './resources.service.js';

export class ResourcesController {
  constructor(private readonly service: ResourcesService) {}

  list = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.list(request.query as unknown as ListResourcesQuery);
    response.status(200).json(result);
  };

  findById = async (request: Request, response: Response): Promise<void> => {
    const resource = await this.service.findById(request.params.id!);
    response.status(200).json(resource);
  };

  create = async (request: Request, response: Response): Promise<void> => {
    const resource = await this.service.create(request.body, request.user!.id);
    response.status(201).json(resource);
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const resource = await this.service.update(request.params.id!, request.body, request.user!.id);
    response.status(200).json(resource);
  };

  delete = async (request: Request, response: Response): Promise<void> => {
    await this.service.delete(request.params.id!, request.user!.id);
    response.status(204).send();
  };
}
