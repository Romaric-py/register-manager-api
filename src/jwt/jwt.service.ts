import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';

@Injectable()
export class JwtService {
  constructor(private readonly jwtService: NestJwtService) {}

  generateToken(payload: Record<string, unknown>, expiresIn: string) {
    return this.jwtService.sign(payload, { expiresIn });
  }

  generateAuthTokens(payload: { id: string; email: string; role: string }) {
    const [accessToken, refreshToken] = ['15m', '7d'].map((expiry) =>
      this.generateToken(payload, expiry),
    );
    return { accessToken, refreshToken };
  }

  verifyToken(
    token: string,
    isRefresh = false,
  ): Record<string, unknown> | null {
    try {
      const result = this.jwtService.verify(token);
      return result;
    } catch {
      return null;
    }
  }
}
