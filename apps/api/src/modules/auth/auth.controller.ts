import type { Request, Response } from 'express';
import type { AuthService } from './auth.service.js';

export class AuthController {
  constructor(private readonly service: AuthService) {}

  login = async (request: Request, response: Response): Promise<void> => {
    const result = await this.service.login(request.body);
    response.status(200).json(result);
  };

  me = async (request: Request, response: Response): Promise<void> => {
    const user = await this.service.profile(request.user!.id);
    response.status(200).json(user);
  };
}
