// roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredRoles) {
      return true;
    }
    
    const { user } = context.switchToHttp().getRequest();

    if (!user?.role) {
      throw new UnauthorizedException('User role not found');
    }
    if (!requiredRoles.includes(user.role)) {
      throw new UnauthorizedException('Forbidden: insufficient role');
    }
    return true;
  }
}
