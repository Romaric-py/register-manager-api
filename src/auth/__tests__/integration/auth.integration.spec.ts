import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import * as request from 'supertest';
import { AuthController } from '../../auth.controller';
import { LoginService } from '../../services/login.service';
import { RegisterUserService } from '../../services/register-user.service';
import { PasswordResetService } from '../../services/password-reset.service';
import { EmailVerificationService } from '../../services/email-verification.service';
import { LogoutService } from '../../services/logout.service';
import { TokensService } from '../../services/tokens.service';
import { JwtAuthGuard } from '../../../jwt/jwt-auth.guard';
import { RolesGuard } from '../../guards/roles.guard';
import {
  mockUser,
  mockAdmin,
  mockSuperAdmin,
  mockUnverifiedUser,
  createLoginDto,
  createRegisterUserDto,
  createAdminDto as createAdminDtoFactory,
  createPasswordResetRequestDto,
  createPasswordResetDto,
  createVerifyEmailDto,
  createResendVerificationEmailDto,
} from '../test-utils';

describe('AuthController (e2e)', () => {
  let app: INestApplication;
  let controller: AuthController;

  const mockLoginService = {
    login: jest.fn(), // Correction: utilise 'login' au lieu de 'loginUser'
  };

  const mockRegisterUserService = {
    registerUser: jest.fn(),
    createAdmin: jest.fn(),
  };

  const mockPasswordResetService = {
    requestPasswordReset: jest.fn(),
    resetPassword: jest.fn(),
  };

  const mockEmailVerificationService = {
    verifyEmail: jest.fn(),
    resendVerificationEmail: jest.fn(),
  };

  const mockLogoutService = {
    logout: jest.fn(),
  };

  const mockTokensService = {
    generateTokens: jest.fn(),
    refreshTokens: jest.fn(),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
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
          provide: PasswordResetService,
          useValue: mockPasswordResetService,
        },
        {
          provide: EmailVerificationService,
          useValue: mockEmailVerificationService,
        },
        {
          provide: LogoutService,
          useValue: mockLogoutService,
        },
        {
          provide: TokensService,
          useValue: mockTokensService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({
        canActivate: (context) => {
          const req = context.switchToHttp().getRequest();
          req.user = mockSuperAdmin;
          return true;
        },
      })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    app = moduleFixture.createNestApplication();
    
    app.useGlobalPipes(new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }));
    
    controller = moduleFixture.get<AuthController>(AuthController);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('/auth/login (POST)', () => {
    it('should login user successfully', async () => {
      const loginDto = createLoginDto();
      const expectedResponse = {
        message: 'Connexion réussie',
        user: {
          id: mockUser.id,
          firstName: mockUser.firstName,
          lastName: mockUser.lastName,
          email: mockUser.email,
          role: mockUser.role,
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      mockLoginService.login.mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(200);

      expect(response.body.message).toBe('Connexion réussie');
      expect(response.body.user).toBeDefined();
      // Correction: le contrôleur appelle login avec 2 paramètres (dto, res)
      expect(mockLoginService.login).toHaveBeenCalledWith(loginDto, expect.any(Object));
    });

    it('should return 401 for invalid credentials', async () => {
      const loginDto = createLoginDto({ email: 'invalid@example.com' });

      mockLoginService.login.mockRejectedValue(
        new UnauthorizedException('Invalid credentials')
      );

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(401);
    });

    it('should return 400 for invalid input', async () => {
      const invalidDto = { email: 'invalid-email', password: '' };

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/auth/register (POST)', () => {
    it('should register user successfully', async () => {
      const registerDto = createRegisterUserDto();
      const expectedResponse = {
        message: 'User registered successfully. Please check your email to verify your account.',
        user: {
          id: 'new-user-id',
          firstName: registerDto.firstName,
          lastName: registerDto.lastName,
          email: registerDto.email,
          role: 'USER',
        },
      };

      mockRegisterUserService.registerUser.mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(201);

      expect(response.body.message).toContain('User registered successfully');
      expect(response.body.user).toBeDefined();
      expect(mockRegisterUserService.registerUser).toHaveBeenCalledWith(registerDto);
    });

    it('should return 409 for existing email', async () => {
      const registerDto = createRegisterUserDto();

      mockRegisterUserService.registerUser.mockRejectedValue(
        new ConflictException('Email already exists')
      );

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(registerDto)
        .expect(409);
    });

    it('should return 400 for invalid input', async () => {
      const invalidDto = { email: 'invalid-email', password: '123', firstName: '', lastName: '' };

      await request(app.getHttpServer())
        .post('/auth/register')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/auth/logout (POST)', () => {
    it('should logout user successfully', async () => {
      mockLogoutService.logout.mockResolvedValue({
        message: 'Déconnexion réussie',
      });

      const response = await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(200);

      expect(response.body.message).toBe('Déconnexion réussie');
    });
  });

  describe('/auth/request-password-reset (POST)', () => {
    it('should request password reset successfully', async () => {
      const requestDto = createPasswordResetRequestDto();
      const expectedResponse = {
        message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
      };

      mockPasswordResetService.requestPasswordReset.mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/request-password-reset')
        .send(requestDto)
        .expect(201);

      expect(response.body.message).toContain('lien de réinitialisation a été envoyé');
      expect(mockPasswordResetService.requestPasswordReset).toHaveBeenCalledWith(requestDto);
    });

    it('should return 400 for invalid email', async () => {
      const invalidDto = { email: 'invalid-email' };

      await request(app.getHttpServer())
        .post('/auth/request-password-reset')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/auth/reset-password (POST)', () => {
    it('should reset password successfully', async () => {
      const resetDto = createPasswordResetDto();
      const expectedResponse = {
        message: 'Mot de passe réinitialisé avec succès',
      };

      mockPasswordResetService.resetPassword.mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(resetDto)
        .expect(201);

      expect(response.body.message).toContain('réinitialisé avec succès');
      expect(mockPasswordResetService.resetPassword).toHaveBeenCalledWith(resetDto);
    });

    it('should return 400 for invalid token', async () => {
      const resetDto = createPasswordResetDto({ token: 'invalid-token' });

      mockPasswordResetService.resetPassword.mockRejectedValue(
        new BadRequestException('Token de réinitialisation invalide ou expiré')
      );

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(resetDto)
        .expect(400);
    });

    it('should return 400 for invalid input', async () => {
      const invalidDto = { token: '', newPassword: '123' };

      await request(app.getHttpServer())
        .post('/auth/reset-password')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/auth/verify-email (POST)', () => {
    it('should verify email successfully', async () => {
      const verifyDto = createVerifyEmailDto();
      const expectedResponse = {
        message: 'Votre adresse email a été vérifiée avec succès',
      };

      mockEmailVerificationService.verifyEmail.mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send(verifyDto)
        .expect(201);

      expect(response.body.message).toContain('vérifiée avec succès');
      expect(mockEmailVerificationService.verifyEmail).toHaveBeenCalledWith(verifyDto.token);
    });

    it('should return 400 for invalid token', async () => {
      const verifyDto = createVerifyEmailDto({ token: 'invalid-token' });

      mockEmailVerificationService.verifyEmail.mockRejectedValue(
        new BadRequestException('Token de vérification invalide ou expiré')
      );

      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send(verifyDto)
        .expect(400);
    });

    it('should return 400 for empty token', async () => {
      const invalidDto = { token: '' };

      await request(app.getHttpServer())
        .post('/auth/verify-email')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/auth/resend-verification-email (POST)', () => {
    it('should resend verification email successfully', async () => {
      const resendDto = createResendVerificationEmailDto();
      const expectedResponse = {
        message: 'Email de vérification envoyé avec succès',
        code: 'EMAIL_SENT',
      };

      mockEmailVerificationService.resendVerificationEmail.mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/resend-verification-email')
        .send(resendDto)
        .expect(201);

      expect(response.body.message).toContain('envoyé avec succès');
      expect(mockEmailVerificationService.resendVerificationEmail).toHaveBeenCalledWith(resendDto.email);
    });

    it('should return already verified message', async () => {
      const resendDto = createResendVerificationEmailDto();
      const expectedResponse = {
        message: 'Cette adresse email est déjà vérifiée',
        code: 'EMAIL_ALREADY_VERIFIED',
      };

      mockEmailVerificationService.resendVerificationEmail.mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/resend-verification-email')
        .send(resendDto)
        .expect(201);

      expect(response.body.message).toContain('déjà vérifiée');
    });

    it('should return 400 for invalid email', async () => {
      const invalidDto = { email: 'invalid-email' };

      await request(app.getHttpServer())
        .post('/auth/resend-verification-email')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('/auth/create-admin (POST)', () => {
    it('should create admin successfully', async () => {
      const adminDto = createAdminDtoFactory();
      const expectedResponse = {
        message: 'Administrateur créé avec succès. Un email de bienvenue a été envoyé.',
        admin: {
          id: 'new-admin-id',
          firstName: adminDto.firstName,
          lastName: adminDto.lastName,
          email: adminDto.email,
          role: 'ADMIN',
        },
      };

      mockRegisterUserService.createAdmin.mockResolvedValue(expectedResponse);

      const response = await request(app.getHttpServer())
        .post('/auth/create-admin')
        .send(adminDto)
        .expect(201);

      expect(response.body.message).toContain('créé avec succès');
      expect(response.body.admin).toBeDefined();
      // Correction: le contrôleur appelle createAdmin avec 2 paramètres (dto, user)
      expect(mockRegisterUserService.createAdmin).toHaveBeenCalledWith(adminDto, mockSuperAdmin);
    });

    it('should return 409 for existing admin email', async () => {
      const adminDto = createAdminDtoFactory();

      mockRegisterUserService.createAdmin.mockRejectedValue(
        new ConflictException('Email already exists')
      );

      await request(app.getHttpServer())
        .post('/auth/create-admin')
        .send(adminDto)
        .expect(409);
    });

    it('should return 400 for invalid input', async () => {
      const invalidDto = { email: 'invalid-email', firstName: '', lastName: '' };

      await request(app.getHttpServer())
        .post('/auth/create-admin')
        .send(invalidDto)
        .expect(400);
    });
  });

  describe('Error handling', () => {
    it('should handle internal server errors gracefully', async () => {
      const loginDto = createLoginDto();

      // Le contrôleur login a un try-catch qui transforme les erreurs en BadRequestException
      mockLoginService.login.mockRejectedValue(new Error('Database error'));

      await request(app.getHttpServer())
        .post('/auth/login')
        .send(loginDto)
        .expect(400); // Le contrôleur retourne 400 à cause du try-catch
    });

    it('should validate request bodies', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({}) // Empty body
        .expect(400);

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ email: 'test' }) // Invalid data
        .expect(400);
    });
  });
});