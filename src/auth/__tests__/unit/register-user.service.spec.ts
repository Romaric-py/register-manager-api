import { Test, TestingModule } from '@nestjs/testing';
import { ConflictException, BadRequestException, InternalServerErrorException, ForbiddenException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { RegisterUserService } from '../../services/register-user.service';
import { PrismaService } from '../../../prisma.service';
import { UserValidationService } from '../../services/user-validation.service';
import { MailService } from '../../../mail/mail.service';
import { EmailVerificationService } from '../../services/email-verification.service';
import { Role } from '@prisma/client';
import {
  mockUser,
  mockAdmin,
  mockSuperAdmin,
  createMockPrismaService,
  createMockUserValidationService,
  createMockMailService,
  createRegisterUserDto,
  createAdminDto,
} from '../test-utils';

// Mock bcrypt
jest.mock('bcryptjs');
const mockedBcrypt = bcrypt as jest.Mocked<typeof bcrypt>;

describe('RegisterUserService', () => {
  let service: RegisterUserService;
  let prismaService: PrismaService;
  let userValidationService: UserValidationService;
  let mailService: MailService;
  let emailVerificationService: EmailVerificationService;

  const mockPrismaService = createMockPrismaService();
  const mockUserValidationService = createMockUserValidationService();
  const mockMailService = {
    sendVerificationEmail: jest.fn(),
    sendPasswordResetEmail: jest.fn(),
    sendWelcomeEmail: jest.fn(),
    sendAdminWelcomeEmail: jest.fn(),
  };
  const mockEmailVerificationService = {
    sendVerificationEmail: jest.fn(),
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegisterUserService,
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
        {
          provide: EmailVerificationService,
          useValue: mockEmailVerificationService,
        },
      ],
    }).compile();

    service = module.get<RegisterUserService>(RegisterUserService);
    prismaService = module.get<PrismaService>(PrismaService);
    userValidationService = module.get<UserValidationService>(UserValidationService);
    mailService = module.get<MailService>(MailService);
    emailVerificationService = module.get<EmailVerificationService>(EmailVerificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('registerUser', () => {
    it('should register user successfully', async () => {
      const registerDto = createRegisterUserDto();
      const hashedPassword = 'hashedPassword123';
      const createdUser = { ...mockUser, ...registerDto, password: hashedPassword };

      mockUserValidationService.retrieveUserByEmail.mockResolvedValue(null);
      mockedBcrypt.genSalt.mockResolvedValue('salt' as never);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockEmailVerificationService.sendVerificationEmail.mockResolvedValue(true);
      mockUserValidationService.safeTransform.mockReturnValue({
        id: createdUser.id,
        firstName: createdUser.firstName,
        lastName: createdUser.lastName,
        email: createdUser.email,
        phone: createdUser.phone,
        role: createdUser.role,
        isActive: createdUser.isActive,
        emailVerified: createdUser.emailVerified,
        emailVerificationToken: createdUser.emailVerificationToken,
        emailVerificationTokenExpiry: createdUser.emailVerificationTokenExpiry,
        lastEmailVerificationIssue: createdUser.lastEmailVerificationIssue,
        lastLogin: createdUser.lastLogin,
        resetToken: createdUser.resetToken,
        resetTokenExpiry: createdUser.resetTokenExpiry,
        createdAt: createdUser.createdAt,
        updatedAt: createdUser.updatedAt,
        createdBy: createdUser.createdBy,
        updatedBy: createdUser.updatedBy,
      });

      const result = await service.registerUser(registerDto);

      expect(userValidationService.retrieveUserByEmail).toHaveBeenCalledWith(
        registerDto.email,
        false,
      );
      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(registerDto.password, 'salt');
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: { ...registerDto, password: hashedPassword },
      });
      expect(emailVerificationService.sendVerificationEmail).toHaveBeenCalledWith(
        createdUser.id,
      );
      expect(result.message).toBe(
        'User registered successfully. Please check your email to verify your account.',
      );
    });

    it('should throw ConflictException if user already exists', async () => {
      const registerDto = createRegisterUserDto();

      mockUserValidationService.retrieveUserByEmail.mockResolvedValue(mockUser);

      await expect(service.registerUser(registerDto)).rejects.toThrow(
        new ConflictException('User with this email already exists'),
      );
    });

    it('should throw InternalServerErrorException if email verification fails', async () => {
      const registerDto = createRegisterUserDto();
      const hashedPassword = 'hashedPassword123';
      const createdUser = { ...mockUser, ...registerDto, password: hashedPassword };

      mockUserValidationService.retrieveUserByEmail.mockResolvedValue(null);
      mockedBcrypt.genSalt.mockResolvedValue('salt' as never);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockPrismaService.user.create.mockResolvedValue(createdUser);
      mockEmailVerificationService.sendVerificationEmail.mockRejectedValue(
        new Error('Email service error'),
      );

      await expect(service.registerUser(registerDto)).rejects.toThrow(
        InternalServerErrorException,
      );
    });
  });

  describe('createAdmin', () => {
    it('should create admin successfully by super admin', async () => {
      const adminDto = createAdminDto();
      const hashedPassword = 'hashedTempPassword';
      const createdAdmin = {
        ...mockAdmin,
        ...adminDto,
        password: hashedPassword,
        emailVerified: true,
        createdBy: mockSuperAdmin.id,
      };

      mockUserValidationService.retrieveUserByEmail.mockResolvedValue(null);
      mockedBcrypt.genSalt.mockResolvedValue('salt' as never);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockPrismaService.user.create.mockResolvedValue(createdAdmin);
      mockMailService.sendAdminWelcomeEmail.mockResolvedValue(true);
      mockUserValidationService.safeTransform.mockReturnValue({
        id: createdAdmin.id,
        firstName: createdAdmin.firstName,
        lastName: createdAdmin.lastName,
        email: createdAdmin.email,
        phone: createdAdmin.phone,
        role: createdAdmin.role,
        isActive: createdAdmin.isActive,
        emailVerified: createdAdmin.emailVerified,
        emailVerificationToken: createdAdmin.emailVerificationToken,
        emailVerificationTokenExpiry: createdAdmin.emailVerificationTokenExpiry,
        lastEmailVerificationIssue: createdAdmin.lastEmailVerificationIssue,
        lastLogin: createdAdmin.lastLogin,
        resetToken: createdAdmin.resetToken,
        resetTokenExpiry: createdAdmin.resetTokenExpiry,
        createdAt: createdAdmin.createdAt,
        updatedAt: createdAdmin.updatedAt,
        createdBy: createdAdmin.createdBy,
        updatedBy: createdAdmin.updatedBy,
      });

      // Mock generateTempPassword
      jest.spyOn(service as any, 'generateTempPassword').mockReturnValue('tempPassword123');

      const result = await service.createAdmin(adminDto, mockSuperAdmin);

      expect(userValidationService.retrieveUserByEmail).toHaveBeenCalledWith(
        adminDto.email,
        false,
      );
      expect(prismaService.user.create).toHaveBeenCalledWith({
        data: {
          email: adminDto.email,
          password: hashedPassword,
          firstName: adminDto.firstName,
          lastName: adminDto.lastName,
          phone: adminDto.phone,
          role: adminDto.role ?? Role.ADMIN,
          emailVerified: true,
          createdBy: mockSuperAdmin.id,
        },
      });
      expect(mailService.sendAdminWelcomeEmail).toHaveBeenCalledWith(
        createdAdmin.email,
        createdAdmin.firstName,
        'tempPassword123',
        '',
      );
      expect(result.message).toBe('Compte administrateur créé avec succès');
    });

    it('should throw ForbiddenException if current user is not super admin', async () => {
      const adminDto = createAdminDto();

      await expect(service.createAdmin(adminDto, mockUser)).rejects.toThrow(
        new ForbiddenException('Seul un Super Admin peut créer un compte administrateur'),
      );
    });

    it('should throw ConflictException if admin email already exists', async () => {
      const adminDto = createAdminDto();

      mockUserValidationService.retrieveUserByEmail.mockResolvedValue(mockUser);

      await expect(service.createAdmin(adminDto, mockSuperAdmin)).rejects.toThrow(
        new ConflictException('Un utilisateur avec cet email existe déjà'),
      );
    });

    it('should continue if welcome email fails', async () => {
      const adminDto = createAdminDto();
      const hashedPassword = 'hashedTempPassword';
      const createdAdmin = {
        ...mockAdmin,
        ...adminDto,
        password: hashedPassword,
        emailVerified: true,
        createdBy: mockSuperAdmin.id,
      };

      mockUserValidationService.retrieveUserByEmail.mockResolvedValue(null);
      mockedBcrypt.genSalt.mockResolvedValue('salt' as never);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);
      mockPrismaService.user.create.mockResolvedValue(createdAdmin);
      mockMailService.sendAdminWelcomeEmail.mockRejectedValue(
        new Error('Email service error'),
      );
      mockUserValidationService.safeTransform.mockReturnValue({
        id: createdAdmin.id,
        firstName: createdAdmin.firstName,
        lastName: createdAdmin.lastName,
        email: createdAdmin.email,
        phone: createdAdmin.phone,
        role: createdAdmin.role,
        isActive: createdAdmin.isActive,
        emailVerified: createdAdmin.emailVerified,
        emailVerificationToken: createdAdmin.emailVerificationToken,
        emailVerificationTokenExpiry: createdAdmin.emailVerificationTokenExpiry,
        lastEmailVerificationIssue: createdAdmin.lastEmailVerificationIssue,
        lastLogin: createdAdmin.lastLogin,
        resetToken: createdAdmin.resetToken,
        resetTokenExpiry: createdAdmin.resetTokenExpiry,
        createdAt: createdAdmin.createdAt,
        updatedAt: createdAdmin.updatedAt,
        createdBy: createdAdmin.createdBy,
        updatedBy: createdAdmin.updatedBy,
      });

      jest.spyOn(service as any, 'generateTempPassword').mockReturnValue('tempPassword123');

      const result = await service.createAdmin(adminDto, mockSuperAdmin);

      expect(result.message).toBe('Compte administrateur créé avec succès');
    });
  });

  describe('findUserByEmail', () => {
    it('should find user by email', async () => {
      const email = 'test@example.com';

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);

      const result = await service.findUserByEmail(email);

      expect(prismaService.user.findUnique).toHaveBeenCalledWith({
        where: { email },
      });
      expect(result).toEqual(mockUser);
    });

    it('should return null if user not found', async () => {
      const email = 'nonexistent@example.com';

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      const result = await service.findUserByEmail(email);

      expect(result).toBeNull();
    });
  });

  describe('hashPassword (private method)', () => {
    it('should hash password correctly', async () => {
      const password = 'password123';
      const salt = 'generatedSalt';
      const hashedPassword = 'hashedPassword';

      mockedBcrypt.genSalt.mockResolvedValue(salt as never);
      mockedBcrypt.hash.mockResolvedValue(hashedPassword as never);

      const result = await (service as any).hashPassword(password);

      expect(bcrypt.genSalt).toHaveBeenCalledWith(10);
      expect(bcrypt.hash).toHaveBeenCalledWith(password, salt);
      expect(result).toBe(hashedPassword);
    });
  });

  describe('generateTempPassword (private method)', () => {
    it('should generate temporary password of correct length', () => {
      const tempPassword = (service as any).generateTempPassword();

      expect(typeof tempPassword).toBe('string');
      expect(tempPassword.length).toBe(12);
      expect(/^[ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789]+$/.test(tempPassword)).toBe(true);
    });

    it('should generate different passwords each time', () => {
      const password1 = (service as any).generateTempPassword();
      const password2 = (service as any).generateTempPassword();

      expect(password1).not.toBe(password2);
    });
  });
});