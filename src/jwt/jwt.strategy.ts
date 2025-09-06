import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: (req: Request): string | null => {
        const headerToken = req?.headers?.authorization?.split(' ')[1];
        const cookieToken = req?.cookies?.['access_token'];

        return headerToken || cookieToken || null;
      },
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET || 'fallback-secret',
    });
  }

  validate(payload: any) {
    return payload;
  }
}
