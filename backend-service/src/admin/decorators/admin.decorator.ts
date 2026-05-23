import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

export interface AdminUser {
  sub: string;
  email: string;
  role: string;
}

export const Admin = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): AdminUser => {
    const req = ctx.switchToHttp().getRequest<Request & { user: AdminUser }>();
    return req.user;
  },
);
