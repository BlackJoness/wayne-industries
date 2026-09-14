import type { Request, Response } from 'express';
import type { UsersService } from './users.service.js';
import type { ListUsersQuery } from './users.schema.js';

export class UsersController {
  constructor(private readonly service: UsersService) {}

  list = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.list(request.query as unknown as ListUsersQuery);
    response.status(200).json(result);
  };

  findById = async (request: Request, response: Response): Promise<void> => {
    const user = await this.service.findById(request.params.id!);
    response.status(200).json(user);
  };

  create = async (request: Request, response: Response): Promise<void> => {
    const user = await this.service.create(request.body, request.user!.id);
    response.status(201).json(user);
  };

  update = async (request: Request, response: Response): Promise<void> => {
    const user = await this.service.update(request.params.id!, request.body, request.user!.id);
    response.status(200).json(user);
  };

  deactivate = async (request: Request, response: Response): Promise<void> => {
    await this.service.deactivate(request.params.id!, request.user!.id);
    response.status(204).send();
  };
}
