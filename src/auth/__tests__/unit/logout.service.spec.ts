import { Test, TestingModule } from '@nestjs/testing';
import { LogoutService } from '../../services/logout.service';
import { TokensService } from '../../services/tokens.service';
import {
  createMockTokensService,
  createMockRequest,
  createMockResponse,
  mockUser,
} from '../test-utils';

describe('LogoutService', () => {
  let service: LogoutService;
  let tokensService: TokensService;

  const mockTokensService = createMockTokensService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LogoutService,
        {
          provide: TokensService,
          useValue: mockTokensService,
        },
      ],
    }).compile();

    service = module.get<LogoutService>(LogoutService);
    tokensService = module.get<TokensService>(TokensService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const mockRequest = createMockRequest(mockUser);
      const mockResponse = createMockResponse();

      const result = await service.logout(mockRequest, mockResponse);

      expect(tokensService.clearAuthCookies).toHaveBeenCalledWith(mockResponse);
      expect(tokensService.deleteUserRefreshTokens).toHaveBeenCalledWith(mockUser.id);
      expect(result).toEqual({ message: 'Logout successful' });
    });

    it('should handle logout with no user in request', async () => {
      const mockRequest = { user: null };
      const mockResponse = createMockResponse();

      const result = await service.logout(mockRequest, mockResponse);

      expect(tokensService.clearAuthCookies).toHaveBeenCalledWith(mockResponse);
      expect(tokensService.deleteUserRefreshTokens).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({ message: 'Logout successful' });
    });

    it('should handle logout with undefined request', async () => {
      const mockResponse = createMockResponse();

      const result = await service.logout(undefined, mockResponse);

      expect(tokensService.clearAuthCookies).toHaveBeenCalledWith(mockResponse);
      expect(tokensService.deleteUserRefreshTokens).toHaveBeenCalledWith(undefined);
      expect(result).toEqual({ message: 'Logout successful' });
    });
  });
});