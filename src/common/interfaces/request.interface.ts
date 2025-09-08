import type { User } from '@prisma/client';
import type { Request } from 'express';

export interface AuthenticatedRequest extends Request {
  user: {
    id: string;
    email: string;
    role: string;
  };
}

export type AuthUserType = {
  id: string;
  email: string;
  role: string;
};

export interface RequestWithUser extends Request {
  user: User;
}
