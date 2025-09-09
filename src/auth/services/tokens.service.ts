import { User } from '.prisma/client';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '../../jwt/jwt.service';
import { PrismaService } from '../../prisma.service';
import { CookieOptions } from 'express-serve-static-core';

type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

@Injectable()
export class TokensService {
  cookiesOptions: CookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict', // Plus sécurisé que 'lax'
    path: '/', // Spécifier le path explicitement
  };
  
  // Configuration des durées de vie via variables d'environnement
  accesTokenLifespan = parseInt(process.env.ACCESS_TOKEN_LIFESPAN_MS || '900000'); // 15 minutes par défaut
  refreshTokenLifespan = parseInt(process.env.REFRESH_TOKEN_LIFESPAN_MS || '2592000000'); // 30 jours par défaut

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  async generateAndSetAuthTokens(user: User, res: any) {
    // Use JWT service to generate acces and refresh tokens
    const authTokens = await this.jwtService.generateAuthTokens({ id: user.id, email: user.email, role: user.role } );

    // Delete old auth refresh tokens of that user
    await this.deleteUserRefreshTokens(user.id);

    // Store refresh tokens in DB (linked with user)
    await this.storeRefreshToken(user.id, authTokens.refreshToken);

    // Set in response cookies access_token and refresh_tokens
    await this.setAuthCookies(res, authTokens);
  }

  async refreshTokens(oldRefreshToken: string, res: any) {
    // Retrieve that token in the DB
    const storedToken = await this.validateRefreshToken(oldRefreshToken);
    // Call generateAndSetAuthTokens
    const authTokens = await this.jwtService.generateAuthTokens(
      { id: storedToken.user.id, email: storedToken.user.email, role: storedToken.user.role },
    );
    // Set in response cookies access_token and refresh_tokens
    await this.setAuthCookies(res, authTokens);
    // Delete all old refresh tokens of that user
    await this.deleteUserRefreshTokens(storedToken.userId);
    // Create a new refresh token in DB
    await this.storeRefreshToken(storedToken.userId, authTokens.refreshToken);
    return authTokens;
  }

  private async validateRefreshToken(token: string) {
    // Check if that refresh token is valid (not expired)
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });
    if (!storedToken || new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
    this.jwtService.verifyToken(token); // Verify JWT token
    return storedToken;
  }

  async storeRefreshToken(userId: string, refreshToken: string) {
    // Store refresh tokens in DB (linked with user)
    await this.prisma.refreshToken.create({
      data: {
        userId: userId,
        token: refreshToken,
        expiresAt: new Date(Date.now() + this.refreshTokenLifespan),
      },
    });
  }

  async setAuthCookies(res: any, authTokens: AuthTokens) {
    // Set access and refresh tokens as cookies to response
    res.cookie('access_token', authTokens.accessToken, {
      ...this.cookiesOptions,
      maxAge: this.accesTokenLifespan, // 15 minutes
    });
    res.cookie('refresh_token', authTokens.refreshToken, {
      ...this.cookiesOptions,
      maxAge: this.refreshTokenLifespan, // 30 days
    });
  }

  async deleteUserRefreshTokens(userId: string) {
    // Delete all refresh tokens of that user
    await this.prisma.refreshToken.deleteMany({
      where: { userId: userId },
    });
  }

  async clearAuthCookies(res: any) {
    // delete auth cookies (access and refresh tokens) avec les mêmes options
    res.clearCookie('access_token', this.cookiesOptions);
    res.clearCookie('refresh_token', this.cookiesOptions);
  }
}
