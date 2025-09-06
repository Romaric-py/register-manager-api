import { Injectable } from '@nestjs/common';
import { TokensService } from './tokens.service';

@Injectable()
export class LogoutService {
  constructor(private readonly tokensService: TokensService) {}

  async logout(req: any, res: any) {
    // Clear cookies
    this.tokensService.clearAuthCookies(res);
    // Delete that refresh token in the DB
    await this.tokensService.deleteUserRefreshTokens(req?.user?.id);
    return { message: 'Logout successful' };
  }
}
