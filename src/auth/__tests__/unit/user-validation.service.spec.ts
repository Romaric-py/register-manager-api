import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { UserValidationService } from '../../services/user-validation.service';
import { PrismaService } from '../../../prisma.service';
import {
  mockUser,
  createMockPrismaService,
} from '../test-utils';

describe('UserValidationService', () => {
  let service: UserValidationService;
  let prismaService: PrismaService;

  const mockPrismaService = createMockPrismaService();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserValidationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<UserValidationService>(UserValidationService);
    prismaService = module.get<PrismaService>(PrismaService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('retrieveUserByEmail', () => {
    it('should retrieve user by email successfully', async () => {
      const email = 'test@example.com';
      
      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.retrieveUserByEmail(email);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toEqual(mockUser);
    });

    it('should throw NotFoundException when user not found and throwError is true', async () => {
      const email = 'nonexistent@example.com';
      
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.retrieveUserByEmail(email, true)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });

    it('should return null when user not found and throwError is false', async () => {
      const email = 'nonexistent@example.com';
      
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.retrieveUserByEmail(email, false);

      expect(result).toBeNull();
    });

    it('should throw NotFoundException by default when user not found', async () => {
      const email = 'nonexistent@example.com';
      
      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.retrieveUserByEmail(email)).rejects.toThrow(
        new NotFoundException('User not found'),
      );
    });
  });

  describe('safeTransform', () => {
    it('should transform user by removing password', () => {
      const result = service.safeTransform(mockUser);

      expect(result).not.toHaveProperty('password');
      expect(result).toEqual({
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
    });

    it('should handle user with undefined password', () => {
      const userWithoutPassword = { ...mockUser, password: undefined } as any;
      
      const result = service.safeTransform(userWithoutPassword);

      expect(result).not.toHaveProperty('password');
    });
  });
});