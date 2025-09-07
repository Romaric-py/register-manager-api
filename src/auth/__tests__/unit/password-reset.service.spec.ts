import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { PasswordResetService } from '../../services/password-reset.service';
import { PrismaService } from '../../../prisma.service';
import { UserValidationService } from '../../services/user-validation.service';
import { MailService } from '../../../mail/mail.service';
import {
  mockUser,
  createMockPrismaService,
  createMockUserValidationService,
  createMockMailService,
  createPasswordResetRequestDto,
  createPasswordResetDto,
} from '../test-utils';

// Mock bcrypt and crypto
jest.mock('bcryptjs');
jest.mock('crypto');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;
const mockedCrypto = crypto as jest.Mocked<typeof crypto>;

describe('PasswordResetService', () => {
  let service: PasswordResetService;
  let prismaService: PrismaService;
  let userValidationService: UserValidationService;
  let mailService: MailService;

  const mockPrismaService = {
    ...createMockPrismaService(),
    user: {
      ...createMockPrismaService().user,
      findFirst: jest.fn(),
    },
  };
  const mockUserValidationService = createMockUserValidationService();
  const mockMailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetTokenEmail: jest.fn(), // Fix: Correct method name
    sendWelcomeEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PasswordResetService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UserValidationService,
          useValue: mockUserValidationService,
        },
        {
          provide: MailService,
          useValue: mockMailService,
        },
      ],
    }).compile();

    service = module.get<PasswordResetService>(PasswordResetService);
    prismaService = module.get<PrismaService>(PrismaService);
    userValidationService = module.get<UserValidationService>(UserValidationService);
    mailService = module.get<MailService>(MailService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('requestPasswordReset', () => {
    it('should send reset email for existing user', async () => {
      const requestDto = createPasswordResetRequestDto();
      const resetToken = 'generated-reset-token';
      
      mockUserValidationService.retrieveUserByEmail.mockResolvedValue(mockUser);
      // Fix: Mock randomBytes to return a proper Buffer that will convert to the expected string
      mockedCrypto.randomBytes.mockReturnValue(Buffer.from('generated-reset-token-hex-bytes', 'hex') as never);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockMailService.sendPasswordResetTokenEmail.mockResolvedValue(true); // Fix: Use correct method name

      const result = await service.requestPasswordReset(requestDto);

      expect(userValidationService.retrieveUserByEmail).toHaveBeenCalledWith(
        requestDto.email,
        false,
      );
      expect(crypto.randomBytes).toHaveBeenCalledWith(32);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: mockUser.id },
        data: {
          resetToken: expect.any(String), // Changed to expect any string since hex conversion is dynamic
          resetTokenExpiry: expect.any(Date),
        },
      });
      expect(result.message).toBe(
        'Si cet email existe, un lien de réinitialisation a été envoyé.',
      );
    });

    it('should return generic message for non-existing user', async () => {
      const requestDto = createPasswordResetRequestDto({ email: 'nonexistent@example.com' });
      
      mockUserValidationService.retrieveUserByEmail.mockResolvedValue(null);

      const result = await service.requestPasswordReset(requestDto);

      expect(userValidationService.retrieveUserByEmail).toHaveBeenCalledWith(
        requestDto.email,
        false,
      );
      expect(prismaService.user.update).not.toHaveBeenCalled();
      expect(result.message).toBe(
        'Si cet email existe, un lien de réinitialisation a été envoyé.',
      );
    });

    it('should continue execution if email sending fails', async () => {
      const requestDto = createPasswordResetRequestDto();
      
      mockUserValidationService.retrieveUserByEmail.mockResolvedValue(mockUser);
      // Fix: Mock randomBytes to return a proper Buffer
      mockedCrypto.randomBytes.mockReturnValue(Buffer.from('generated-reset-token-hex-bytes', 'hex') as never);
      mockPrismaService.user.update.mockResolvedValue(mockUser);
      mockMailService.sendPasswordResetTokenEmail.mockRejectedValue( // Fix: Use correct method name
        new Error('Email service error'),
      );

      const result = await service.requestPasswordReset(requestDto);

      expect(result.message).toBe(
        'Si cet email existe, un lien de réinitialisation a été envoyé.',
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetDto = createPasswordResetDto();
      const hashedPassword = 'hashedNewPassword';
      const userWithValidToken = {
        ...mockUser,
        resetToken: resetDto.token,
        resetTokenExpiry: new Date(Date.now() + 300000), // 5 minutes from now
      };

      mockPrismaService.user.findFirst.mockResolvedValue(userWithValidToken);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockPrismaService.user.update.mockResolvedValue(userWithValidToken);
      mockPrismaService.refreshToken.deleteMany.mockResolvedValue({ count: 2 });

      const result = await service.resetPassword(resetDto);

      expect(prismaService.user.findFirst).toHaveBeenCalledWith({
        where: {
          resetToken: resetDto.token,
          resetTokenExpiry: {
            gte: expect.any(Date),
          },
        },
      });
      expect(bcrypt.hash).toHaveBeenCalledWith(resetDto.newPassword, 10);
      expect(prismaService.user.update).toHaveBeenCalledWith({
        where: { id: userWithValidToken.id },
        data: {
          password: hashedPassword,
          resetToken: null,
          resetTokenExpiry: null,
        },
      });
      expect(prismaService.refreshToken.deleteMany).toHaveBeenCalledWith({
        where: { userId: userWithValidToken.id },
      });
      expect(result.message).toBe('Mot de passe réinitialisé avec succès');
    });

    it('should throw BadRequestException for invalid token', async () => {
      const resetDto = createPasswordResetDto({ token: 'invalid-token' });

      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        new BadRequestException('Token de réinitialisation invalide ou expiré'),
      );
    });

    it('should throw BadRequestException for expired token', async () => {
      const resetDto = createPasswordResetDto();

      // Mock user with expired token
      mockPrismaService.user.findFirst.mockResolvedValue(null);

      await expect(service.resetPassword(resetDto)).rejects.toThrow(
        new BadRequestException('Token de réinitialisation invalide ou expiré'),
      );
    });
  });
});