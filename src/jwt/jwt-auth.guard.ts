import {
  Injectable,
  UnauthorizedException,
  CanActivate,
  ExecutionContext,
} from '@nestjs/common';
import { JwtService } from 'src/jwt/jwt.service';
import { TokensService } from '../auth/services/tokens.service';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private tokensService: TokensService,
    private jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();

    const accessToken =
      this.extractAccessToken(req) || req.cookies?.access_token;
    const refreshToken =
      this.extractRefreshToken(req) || req.cookies?.refresh_token;

    if (!accessToken && !refreshToken) {
      throw new UnauthorizedException({ code: 'TOKEN_MISSING', message: 'no token provided' });
    }

    if (accessToken) {
      try {
        const payload = this.jwtService.verifyToken(accessToken);
        req.user = payload;
        return true;
      } catch {
        if (refreshToken) {
          return this.handleRefreshToken(refreshToken, res, req);
        }

        throw new UnauthorizedException({
          code: 'TOKEN_INVALID',
          message: 'invalid access token',
        });
      }
    }

    return this.handleRefreshToken(refreshToken, res, req);
  }

  private async handleRefreshToken(
    refreshToken: string,
    res: any,
    req: any,
  ): Promise<boolean> {
    try {
      const authTokens = await this.tokensService.refreshTokens(
        refreshToken,
        res,
      );

      const payload = this.jwtService.verifyToken(authTokens.accessToken);
      req.user = payload;

      return true;
    } catch (e) {
      throw new UnauthorizedException({
        code: 'TOKEN_EXPIRED',
        message: 'Invalid or expired refresh token... please log in again',
      });
    }
  }

  private extractAccessToken(req: any): string | null {
    if (req.cookies?.access_token) return req.cookies.access_token;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      return authHeader.substring(7);
    }

    return null;
  }

  private extractRefreshToken(req: any): string | null {
    if (req.cookies?.refresh_token) return req.cookies.refresh_token;

    const refreshHeader = req.headers['x-refresh-token'];
    if (refreshHeader) return refreshHeader;

    return null;
  }
}
