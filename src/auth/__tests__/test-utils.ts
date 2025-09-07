import { Role, User } from '@prisma/client';
import { Response } from 'express';

// Mock data for testing
export const mockUser: User = {
  id: 'user-123',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  password: '$2a$10$hashedPassword',
  phone: '+1234567890',
  role: Role.USER,
  isActive: true,
  emailVerified: true,
  emailVerificationToken: null,
  emailVerificationTokenExpiry: null,
  lastEmailVerificationIssue: null,
  lastLogin: new Date('2023-01-01T10:00:00.000Z'),
  resetToken: null,
  resetTokenExpiry: null,
  createdAt: new Date('2023-01-01T00:00:00.000Z'),
  updatedAt: new Date('2023-01-01T00:00:00.000Z'),
  createdBy: null,
  updatedBy: null,
};

export const mockAdmin: User = {
  ...mockUser,
  id: 'admin-123',
  email: 'admin@example.com',
  role: Role.ADMIN,
  firstName: 'Admin',
  lastName: 'User',
};

export const mockSuperAdmin: User = {
  ...mockUser,
  id: 'super-admin-123',
  email: 'superadmin@example.com',
  role: Role.SUPER_ADMIN,
  firstName: 'Super',
  lastName: 'Admin',
};

export const mockUnverifiedUser: User = {
  ...mockUser,
  id: 'unverified-123',
  email: 'unverified@example.com',
  emailVerified: false,
  emailVerificationToken: 'verification-token-123',
  emailVerificationTokenExpiry: new Date(Date.now() + 3600000), // 1 hour from now
};

export const mockInactiveUser: User = {
  ...mockUser,
  id: 'inactive-123',
  email: 'inactive@example.com',
  isActive: false,
};

// Mock services
export const createMockPrismaService = () => ({
  user: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  refreshToken: {
    create: jest.fn(),
    findUnique: jest.fn(),
    deleteMany: jest.fn(),
    delete: jest.fn(),
  },
});

export const createMockTokensService = () => ({
  generateAndSetAuthTokens: jest.fn(),
  refreshTokens: jest.fn(),
  deleteUserRefreshTokens: jest.fn(),
  clearAuthCookies: jest.fn(),
  setAuthCookies: jest.fn(),
  storeRefreshToken: jest.fn(),
});

export const createMockJwtService = () => ({
  generateAuthTokens: jest.fn().mockResolvedValue({
    accessToken: 'mock-access-token',
    refreshToken: 'mock-refresh-token',
  }),
  verifyToken: jest.fn().mockReturnValue({ id: 'user-123', email: 'test@example.com' }),
});

export const createMockMailService = () => ({
  sendVerificationEmail: jest.fn().mockResolvedValue(true),
  sendPasswordResetEmail: jest.fn().mockResolvedValue(true),
  sendWelcomeEmail: jest.fn().mockResolvedValue(true),
});

export const createMockUserValidationService = () => ({
  retrieveUserByEmail: jest.fn(),
  safeTransform: jest.fn().mockImplementation((user) => ({
    id: user.id,
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phone: user.phone,
    role: user.role,
    isActive: user.isActive,
    emailVerified: user.emailVerified,
    lastLogin: user.lastLogin,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  })),
  validateUserExists: jest.fn(),
  checkEmailExists: jest.fn(),
});

export const createMockResponse = (): Partial<Response> => ({
  status: jest.fn().mockReturnThis(),
  json: jest.fn().mockReturnThis(),
  cookie: jest.fn().mockReturnThis(),
  clearCookie: jest.fn().mockReturnThis(),
});

export const createMockRequest = (user?: Partial<User>) => ({
  user: user || mockUser,
  cookies: {
    access_token: 'mock-access-token',
    refresh_token: 'mock-refresh-token',
  },
});

// Test data factories
export const createLoginDto = (overrides = {}) => ({
  email: 'john.doe@example.com',
  password: 'StrongPass123!', // Mot de passe fort pour passer la validation
  ...overrides,
});

export const createRegisterUserDto = (overrides = {}) => ({
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@example.com',
  password: 'StrongPass123!', // Mot de passe fort pour passer la validation
  phone: '+1234567890',
  ...overrides,
});

export const createAdminDto = (overrides = {}) => ({
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@example.com',
  phone: '+1234567890',
  role: Role.ADMIN,
  // Pas de champ password - c'est généré automatiquement
  ...overrides,
});

export const createPasswordResetRequestDto = (overrides = {}) => ({
  email: 'john.doe@example.com',
  ...overrides,
});

export const createPasswordResetDto = (overrides = {}) => ({
  token: 'reset-token-123',
  newPassword: 'NewStrongPass123!', // Mot de passe fort pour @IsStrongPassword
  ...overrides,
});

export const createVerifyEmailDto = (overrides = {}) => ({
  token: 'verification-token-123',
  ...overrides,
});

export const createResendVerificationEmailDto = (overrides = {}) => ({
  email: 'john.doe@example.com',
  ...overrides,
});

// Helper function to setup test module
export const createAuthTestModule = async (providers: any[] = []) => {
  const { Test } = await import('@nestjs/testing');
  
  return Test.createTestingModule({
    providers: [
      ...providers,
      {
        provide: 'PrismaService',
        useValue: createMockPrismaService(),
      },
      {
        provide: 'TokensService',
        useValue: createMockTokensService(),
      },
      {
        provide: 'MailService',
        useValue: createMockMailService(),
      },
      {
        provide: 'UserValidationService',
        useValue: createMockUserValidationService(),
      },
    ],
  });
};

// Mock guards
export const createMockJwtAuthGuard = () => ({
  canActivate: jest.fn().mockImplementation((context) => {
    const req = context.switchToHttp().getRequest();
    req.user = mockUser;
    return true;
  }),
});

export const createMockRolesGuard = () => ({
  canActivate: jest.fn(() => true),
});

// Validation helpers
export const expectValidationError = (errors: any[], property: string, constraint: string) => {
  expect(errors).toHaveLength(1);
  expect(errors[0].property).toBe(property);
  expect(errors[0].constraints).toHaveProperty(constraint);
};

// Async helper to wait for promises
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));