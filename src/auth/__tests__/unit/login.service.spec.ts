import { Test, TestingModule } from '@nestjs/testing';
import { LoginService } from '../../services/login.service';
import { PrismaService } from '../../../prisma.service';
import { UserValidationService } from '../../services/user-validation.service';
import { TokensService } from '../../services/tokens.service';
import { UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { Role } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('LoginService', () => {
  let service: LoginService;
  let prismaService: jest.Mocked<PrismaService>;
  let userValidationService: jest.Mocked<UserValidationService>;
  let tokensService: jest.Mocked<TokensService>;

  const mockUser = {
    id: 'user-id',
    firstName: 'John',
    lastName: 'Doe',
    email: 'test@example.com',
    password: 'hashedPassword',
    phone: null,
    role: Role.USER,
    isActive: true,
    emailVerified: true,
    emailVerificationToken: null,
    emailVerificationTokenExpiry: null,
    lastEmailVerificationIssue: null,
    lastLogin: null,
    resetToken: null,
    resetTokenExpiry: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    createdBy: null,
    updatedBy: null,
  };

  const mockResponse = {
    cookie: jest.fn(),
    clearCookie: jest.fn(),
  } as Partial<Response> as Response;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LoginService,
        {
          provide: PrismaService,
          useValue: {
            user: {
              findUnique: jest.fn(),
              update: jest.fn(),
            },
          },
        },
        {
          provide: UserValidationService,
          useValue: {
            retrieveUserByEmail: jest.fn(),
            safeTransform: jest.fn(),
          },
        },
        {
          provide: TokensService,
          useValue: {
            generateAndSetAuthTokens: jest.fn(),
            clearAuthCookies: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<LoginService>(LoginService);
    prismaService = module.get(PrismaService);
    userValidationService = module.get(UserValidationService);
    tokensService = module.get(TokensService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    const loginDto = {
      email: 'test@example.com',
      password: 'password123',
    };

    it('should successfully login a user with valid credentials', async () => {
      // Arrange
      const updatedUser = { ...mockUser, lastLogin: new Date() };

      userValidationService.retrieveUserByEmail
        .mockResolvedValueOnce(mockUser) // First call for email verification check
        .mockResolvedValueOnce(mockUser) // Second call in validateUser
        .mockResolvedValueOnce(mockUser); // Third call after validation

      mockedBcrypt.compare.mockResolvedValue(true as never);
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);
      userValidationService.safeTransform.mockReturnValue({
        id: mockUser.id,
        firstName: mockUser.firstName,
        lastName: mockUser.lastName,
        email: mockUser.email,
        phone: mockUser.phone,
        role: mockUser.role,
        isActive: mockUser.isActive,
        emailVerified: mockUser.emailVerified,
        emailVerificationToken: mockUser.emailVerificationToken,
        emailVerificationTokenExpiry: mockUser.emailVerificationTokenExpiry,
        lastEmailVerificationIssue: mockUser.lastEmailVerificationIssue,
        lastLogin: mockUser.lastLogin,
        resetToken: mockUser.resetToken,
        resetTokenExpiry: mockUser.resetTokenExpiry,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
        createdBy: mockUser.createdBy,
        updatedBy: mockUser.updatedBy,
      });

      // Act
      const result = await service.login(loginDto, mockResponse);

      // Assert
      expect(userValidationService.retrieveUserByEmail).toHaveBeenCalledTimes(
        3,
      );
      expect(mockedBcrypt.compare).toHaveBeenCalledWith(
        loginDto.password,
        mockUser.password,
      );
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: { lastLogin: expect.any(Date) },
      });
      expect(tokensService.generateAndSetAuthTokens).toHaveBeenCalledWith(
        updatedUser,
        mockResponse,
      );
      expect(result.message).toBe('Connexion réussie');
      expect(result.user).toBeDefined();
    });

    it('should throw UnauthorizedException for invalid password', async () => {
      // Arrange
      userValidationService.retrieveUserByEmail
        .mockResolvedValueOnce(mockUser) // First call for email verification check
        .mockResolvedValueOnce(mockUser); // Second call in validateUser

      mockedBcrypt.compare.mockResolvedValue(false as never);

      // Act & Assert
      await expect(service.login(loginDto, mockResponse)).rejects.toThrow(
        new UnauthorizedException({
          message: 'Identifiants invalides',
          code: 'INVALID_CREDENTIALS',
        }),
      );
      expect(tokensService.generateAndSetAuthTokens).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for unverified email', async () => {
      // Arrange
      const unverifiedUser = { ...mockUser, emailVerified: false };
      userValidationService.retrieveUserByEmail.mockResolvedValue(
        unverifiedUser,
      );

      // Act & Assert
      await expect(service.login(loginDto, mockResponse)).rejects.toThrow(
        new UnauthorizedException({
          message:
            'Veuillez vérifier votre adresse email avant de vous connecter',
          code: 'EMAIL_NOT_VERIFIED',
        }),
      );
      expect(tokensService.generateAndSetAuthTokens).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for non-existent user', async () => {
      // Arrange
      userValidationService.retrieveUserByEmail.mockResolvedValue(null);

      // Act & Assert
      await expect(service.login(loginDto, mockResponse)).rejects.toThrow(
        new UnauthorizedException({
          message: 'Identifiants invalides',
          code: 'INVALID_CREDENTIALS',
        }),
      );
      expect(tokensService.generateAndSetAuthTokens).not.toHaveBeenCalled();
    });

    it('should throw UnauthorizedException for inactive user', async () => {
      // Arrange
      const inactiveUser = { ...mockUser, isActive: false };
      userValidationService.retrieveUserByEmail
        .mockResolvedValueOnce(inactiveUser) // First call for email verification check
        .mockResolvedValueOnce(inactiveUser); // Second call in validateUser

      mockedBcrypt.compare.mockResolvedValue(true as never);

      // Act & Assert
      await expect(service.login(loginDto, mockResponse)).rejects.toThrow(
        new UnauthorizedException({
          message: 'Identifiants invalides',
          code: 'INVALID_CREDENTIALS',
        }),
      );
      expect(tokensService.generateAndSetAuthTokens).not.toHaveBeenCalled();
    });
  });

  describe('updateLastLogin', () => {
    it('should update user last login date', async () => {
      // Arrange
      const userId = 'user-id';
      const updatedUser = { ...mockUser, lastLogin: new Date() };
      (prismaService.user.update as jest.Mock).mockResolvedValue(updatedUser);

      // Act
      const result = await service.updateLastLogin(userId);

      // Assert
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userId },
        data: { lastLogin: expect.any(Date) },
      });
      expect(result).toEqual(updatedUser);
    });

    it('should throw NotFoundException if user not found during update', async () => {
      // Arrange
      const userId = 'non-existent-id';
      (prismaService.user.update as jest.Mock).mockResolvedValue(null);

      // Act & Assert
      await expect(service.updateLastLogin(userId)).rejects.toThrow(
        'Utilisateur non trouvé',
      );
    });
  });
});
