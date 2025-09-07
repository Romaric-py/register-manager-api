import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException, UnauthorizedException } from '@nestjs/common';
import { AuthController } from '../../auth.controller';
import { LoginService } from '../../services/login.service';
import { RegisterUserService } from '../../services/register-user.service';
import { LogoutService } from '../../services/logout.service';
import { PasswordResetService } from '../../services/password-reset.service';
import { EmailVerificationService } from '../../services/email-verification.service';
import { JwtAuthGuard } from '../../../jwt/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import {
  mockUser,
  mockSuperAdmin,
  createMockResponse,
  createMockRequest,
  createLoginDto,
  createRegisterUserDto,
  createAdminDto as createAdminDtoFactory,
  createPasswordResetRequestDto,
  createPasswordResetDto,
  createVerifyEmailDto,
  createResendVerificationEmailDto,
} from '../test-utils';

describe('AuthController', () => {
  let controller: AuthController;
  let loginService: LoginService;
  let registerUserService: RegisterUserService;
  let logoutService: LogoutService;
  let passwordResetService: PasswordResetService;
  let emailVerificationService: EmailVerificationService;

  const mockLoginService = {
    login: jest.fn(),
  };

  const mockRegisterUserService = {
    registerUser: jest.fn(),
    createAdmin: jest.fn(),
  };

  const mockLogoutService = {
    logout: jest.fn(),
  };

  const mockPasswordResetService = {
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
  };

  const mockEmailVerificationService = {
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: LoginService,
          useValue: mockLoginService,
        },
        {
          provide: RegisterUserService,
          useValue: mockRegisterUserService,
        },
        {
          provide: LogoutService,
          useValue: mockLogoutService,
        },
        {
          provide: PasswordResetService,
          useValue: mockPasswordResetService,
        },
        {
          provide: EmailVerificationService,
          useValue: mockEmailVerificationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<AuthController>(AuthController);
    loginService = module.get<LoginService>(LoginService);
    registerUserService = module.get<RegisterUserService>(RegisterUserService);
    logoutService = module.get<LogoutService>(LogoutService);
    passwordResetService = module.get<PasswordResetService>(PasswordResetService);
    emailVerificationService = module.get<EmailVerificationService>(EmailVerificationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('should login user successfully', async () => {
      const loginDto = createLoginDto();
      const mockResponse = createMockResponse();
      const expectedResult = {
        message: 'Connexion réussie',
        user: mockUser,
      };

      mockLoginService.login.mockResolvedValue(expectedResult);

      await controller.login(loginDto, mockResponse as any);

      expect(loginService.login).toHaveBeenCalledWith(loginDto, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should handle UnauthorizedException', async () => {
      const loginDto = createLoginDto();
      const mockResponse = createMockResponse();
      const error = new UnauthorizedException('Invalid credentials');

      mockLoginService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto, mockResponse as any)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should handle BadRequestException', async () => {
      const loginDto = createLoginDto();
      const mockResponse = createMockResponse();
      const error = new BadRequestException('Bad request');

      mockLoginService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto, mockResponse as any)).rejects.toThrow(
        BadRequestException,
      );
    });

    it('should handle generic errors', async () => {
      const loginDto = createLoginDto();
      const mockResponse = createMockResponse();
      const error = new Error('Generic error');

      mockLoginService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto, mockResponse as any)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('registerUser', () => {
    it('should register user successfully', async () => {
      const registerDto = createRegisterUserDto();
      const expectedResult = {
        message: 'Utilisateur créé avec succès',
        user: mockUser,
      };

      mockRegisterUserService.registerUser.mockResolvedValue(expectedResult);

      const result = await controller.registerUser(registerDto);

      expect(registerUserService.registerUser).toHaveBeenCalledWith(registerDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle registration errors', async () => {
      const registerDto = createRegisterUserDto();
      const error = new BadRequestException('Email already exists');

      mockRegisterUserService.registerUser.mockRejectedValue(error);

      await expect(controller.registerUser(registerDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('logout', () => {
    it('should logout user successfully', async () => {
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const expectedResult = { message: 'Déconnexion réussie' };

      mockLogoutService.logout.mockResolvedValue(expectedResult);

      await controller.logout(mockRequest as any, mockResponse as any);

      expect(logoutService.logout).toHaveBeenCalledWith(mockRequest, mockResponse);
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith(expectedResult);
    });

    it('should handle logout errors', async () => {
      const mockRequest = createMockRequest();
      const mockResponse = createMockResponse();
      const error = new Error('Logout error');

      mockLogoutService.logout.mockRejectedValue(error);

      await expect(
        controller.logout(mockRequest as any, mockResponse as any),
      ).rejects.toThrow(error);
    });
  });

  describe('requestPasswordReset', () => {
    it('should request password reset successfully', async () => {
      const requestDto = createPasswordResetRequestDto();
      const expectedResult = {
        message: 'Email de réinitialisation envoyé',
      };

      mockPasswordResetService.requestPasswordReset.mockResolvedValue(expectedResult);

      const result = await controller.requestPasswordReset(requestDto);

      expect(passwordResetService.requestPasswordReset).toHaveBeenCalledWith(requestDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle password reset request errors', async () => {
      const requestDto = createPasswordResetRequestDto();
      const error = new BadRequestException('User not found');

      mockPasswordResetService.requestPasswordReset.mockRejectedValue(error);

      await expect(controller.requestPasswordReset(requestDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resetPassword', () => {
    it('should reset password successfully', async () => {
      const resetDto = createPasswordResetDto();
      const expectedResult = {
        message: 'Mot de passe réinitialisé avec succès',
      };

      mockPasswordResetService.resetPassword.mockResolvedValue(expectedResult);

      const result = await controller.resetPassword(resetDto);

      expect(passwordResetService.resetPassword).toHaveBeenCalledWith(resetDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle password reset errors', async () => {
      const resetDto = createPasswordResetDto();
      const error = new BadRequestException('Invalid token');

      mockPasswordResetService.resetPassword.mockRejectedValue(error);

      await expect(controller.resetPassword(resetDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('verifyEmail', () => {
    it('should verify email successfully', async () => {
      const verifyDto = createVerifyEmailDto();
      const expectedResult = {
        message: 'Email vérifié avec succès',
      };

      mockEmailVerificationService.verifyEmail.mockResolvedValue(expectedResult);

      const result = await controller.verifyEmail(verifyDto);

      expect(emailVerificationService.verifyEmail).toHaveBeenCalledWith(verifyDto.token);
      expect(result).toEqual(expectedResult);
    });

    it('should handle email verification errors', async () => {
      const verifyDto = createVerifyEmailDto();
      const error = new BadRequestException('Invalid token');

      mockEmailVerificationService.verifyEmail.mockRejectedValue(error);

      await expect(controller.verifyEmail(verifyDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('resendVerificationEmail', () => {
    it('should resend verification email successfully', async () => {
      const resendDto = createResendVerificationEmailDto();
      const expectedResult = {
        message: 'Email de vérification renvoyé',
      };

      mockEmailVerificationService.resendVerificationEmail.mockResolvedValue(expectedResult);

      const result = await controller.resendVerificationEmail(resendDto);

      expect(emailVerificationService.resendVerificationEmail).toHaveBeenCalledWith(
        resendDto.email,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle resend verification email errors', async () => {
      const resendDto = createResendVerificationEmailDto();
      const error = new BadRequestException('User not found');

      mockEmailVerificationService.resendVerificationEmail.mockRejectedValue(error);

      await expect(controller.resendVerificationEmail(resendDto)).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('createAdmin', () => {
    it('should create admin successfully', async () => {
      const createAdminDto = createAdminDtoFactory();
      const mockRequest = createMockRequest(mockSuperAdmin);
      const expectedResult = {
        message: 'Administrateur créé avec succès',
        user: mockUser,
      };

      mockRegisterUserService.createAdmin.mockResolvedValue(expectedResult);

      const result = await controller.createAdmin(createAdminDto, mockRequest as any);

      expect(registerUserService.createAdmin).toHaveBeenCalledWith(
        createAdminDto,
        mockRequest.user,
      );
      expect(result).toEqual(expectedResult);
    });

    it('should handle create admin errors', async () => {
      const createAdminDto = createAdminDtoFactory();
      const mockRequest = createMockRequest(mockSuperAdmin);
      const error = new BadRequestException('Email already exists');

      mockRegisterUserService.createAdmin.mockRejectedValue(error);

      await expect(
        controller.createAdmin(createAdminDto, mockRequest as any),
      ).rejects.toThrow(BadRequestException);
    });
  });
});