import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { TokensService } from '../../services/tokens.service';
import { PrismaService } from '../../../prisma.service';
import { JwtService } from '../../../jwt/jwt.service';
import {
  mockUser,
  createMockPrismaService,
  createMockJwtService,
  createMockResponse,
} from '../test-utils';

describe('TokensService', () => {
  let service: TokensService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  const mockPrismaService = createMockPrismaService();
  const mockJwtService = createMockJwtService();

  const mockRefreshToken = {
    id: 'refresh-token-id',
    userId: mockUser.id,
    token: 'refresh-token',
    expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
    createdAt: new Date(),
    user: mockUser,
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TokensService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
      ],
    }).compile();

    service = module.get<TokensService>(TokensService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generateAndSetAuthTokens', () => {
    it('should generate and set auth tokens successfully', async () => {
      const mockResponse = createMockResponse();
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      mockJwtService.generateAuthTokens.mockResolvedValue(mockTokens);
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

      await service.generateAndSetAuthTokens(mockUser, mockResponse);

      expect(jwtService.generateAuthTokens).toHaveBeenCalledWith(mockUser);
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: mockUser.id },
      });
      expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId: mockUser.id,
          token: mockTokens.refreshToken,
          expiresAt: expect.any(Date),
        },
      });
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        mockTokens.accessToken,
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          path: '/',
        }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        mockTokens.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          path: '/',
        }),
      );
    });
  });

  describe('refreshTokens', () => {
    it('should refresh tokens successfully', async () => {
      const oldRefreshToken = 'old-refresh-token';
      const mockResponse = createMockResponse();
      const mockTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);
      mockJwtService.verifyToken.mockReturnValue({ id: mockUser.id });
      mockJwtService.generateAuthTokens.mockResolvedValue(mockTokens);
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 1 });
      mockPrismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

      const result = await service.refreshTokens(oldRefreshToken, mockResponse);

      expect(prismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token: oldRefreshToken },
        include: { user: true },
      });
      expect(jwtService.verifyToken).toHaveBeenCalledWith(oldRefreshToken);
      expect(jwtService.generateAuthTokens).toHaveBeenCalledWith(mockRefreshToken.user);
      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(result).toEqual(mockTokens);
    });

    it('should throw UnauthorizedException for invalid refresh token', async () => {
      const invalidToken = 'invalid-token';
      const mockResponse = createMockResponse();

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect(service.refreshTokens(invalidToken, mockResponse)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired refresh token'),
      );
    });

    it('should throw UnauthorizedException for expired refresh token', async () => {
      const expiredToken = 'expired-token';
      const mockResponse = createMockResponse();
      const expiredRefreshToken = {
        ...mockRefreshToken,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      };

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(expiredRefreshToken);

      await expect(service.refreshTokens(expiredToken, mockResponse)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired refresh token'),
      );
    });
  });

  describe('validateRefreshToken (private method)', () => {
    it('should validate refresh token successfully', async () => {
      const token = 'valid-token';

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(mockRefreshToken);
      mockJwtService.verifyToken.mockReturnValue({ id: mockUser.id });

      const result = await (service as any).validateRefreshToken(token);

      expect(prismaService.refreshToken.findUnique).toHaveBeenCalledWith({
        where: { token },
        include: { user: true },
      });
      expect(jwtService.verifyToken).toHaveBeenCalledWith(token);
      expect(result).toEqual(mockRefreshToken);
    });

    it('should throw UnauthorizedException for non-existent token', async () => {
      const token = 'non-existent-token';

      mockPrismaService.refreshToken.findUnique.mockResolvedValue(null);

      await expect((service as any).validateRefreshToken(token)).rejects.toThrow(
        new UnauthorizedException('Invalid or expired refresh token'),
      );
    });
  });

  describe('storeRefreshToken', () => {
    it('should store refresh token in database', async () => {
      const userId = 'user-123';
      const refreshToken = 'refresh-token-123';

      mockPrismaService.refreshToken.create.mockResolvedValue(mockRefreshToken);

      await service.storeRefreshToken(userId, refreshToken);

      expect(prismaService.refreshToken.create).toHaveBeenCalledWith({
        data: {
          userId,
          token: refreshToken,
          expiresAt: expect.any(Date),
        },
      });
    });
  });

  describe('setAuthCookies', () => {
    it('should set auth cookies correctly', async () => {
      const mockResponse = createMockResponse();
      const authTokens = {
        accessToken: 'access-token',
        refreshToken: 'refresh-token',
      };

      await service.setAuthCookies(mockResponse, authTokens);

      expect(mockResponse.cookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'access_token',
        authTokens.accessToken,
        expect.objectContaining({
          httpOnly: true,
          secure: false, // NODE_ENV !== 'production'
          sameSite: 'strict',
          path: '/',
          maxAge: expect.any(Number),
        }),
      );
      expect(mockResponse.cookie).toHaveBeenCalledWith(
        'refresh_token',
        authTokens.refreshToken,
        expect.objectContaining({
          httpOnly: true,
          secure: false,
          sameSite: 'strict',
          path: '/',
          maxAge: expect.any(Number),
        }),
      );
    });
  });

  describe('deleteUserRefreshTokens', () => {
    it('should delete all user refresh tokens', async () => {
      const userId = 'user-123';

      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 3 });

      await service.deleteUserRefreshTokens(userId);

      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId },
      });
    });
  });

  describe('clearAuthCookies', () => {
    it('should clear auth cookies', async () => {
      const mockResponse = createMockResponse();

      await service.clearAuthCookies(mockResponse);

      expect(mockResponse.clearCookie).toHaveBeenCalledTimes(2);
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'access_token',
        service.cookiesOptions,
      );
      expect(mockResponse.clearCookie).toHaveBeenCalledWith(
        'refresh_token',
        service.cookiesOptions,
      );
    });
  });

  describe('cookie options', () => {
    it('should have correct default cookie options', () => {
      expect(service.cookiesOptions).toEqual({
        httpOnly: true,
        secure: false, // NODE_ENV !== 'production'
        sameSite: 'strict',
        path: '/',
      });
    });

    it('should set secure to true in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      // Create new service instance to test production behavior
      const testService = new TokensService(mockPrismaService as any, mockJwtService as any);

      expect(testService.cookiesOptions.secure).toBe(true);

      // Restore original environment
      process.env.NODE_ENV = originalEnv;
    });
  });
});