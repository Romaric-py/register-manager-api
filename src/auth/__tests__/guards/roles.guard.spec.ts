import { Test, TestingModule } from '@nestjs/testing';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { RolesGuard } from '../../guards/roles.guard';
import { Role } from '@prisma/client';
import { mockUser, mockAdmin, mockSuperAdmin } from '../test-utils';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  const mockReflector = {
    getAllAndOverride: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RolesGuard,
        {
          provide: Reflector,
          useValue: mockReflector,
        },
      ],
    }).compile();

    guard = module.get<RolesGuard>(RolesGuard);
    reflector = module.get<Reflector>(Reflector);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const createMockExecutionContext = (user: any): ExecutionContext => {
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user }),
      }),
      getHandler: jest.fn(),
      getClass: jest.fn(),
    } as any;
  };

  describe('canActivate', () => {
    it('should return true when no roles are required', () => {
      const context = createMockExecutionContext(mockUser);
      mockReflector.getAllAndOverride.mockReturnValue(null);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        'roles',
        [context.getHandler(), context.getClass()],
      );
    });

    it('should return true when user has required role', () => {
      const context = createMockExecutionContext(mockAdmin);
      mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when user has one of multiple required roles', () => {
      const context = createMockExecutionContext(mockAdmin);
      mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN, Role.SUPER_ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should return true when super admin accesses admin-only resource', () => {
      const context = createMockExecutionContext(mockSuperAdmin);
      mockReflector.getAllAndOverride.mockReturnValue([Role.SUPER_ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should throw UnauthorizedException when user has insufficient role', () => {
      const context = createMockExecutionContext(mockUser); // USER role
      mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(
        new UnauthorizedException('Forbidden: insufficient role'),
      );
    });

    it('should throw UnauthorizedException when user has no role', () => {
      const userWithoutRole = { ...mockUser, role: undefined };
      const context = createMockExecutionContext(userWithoutRole);
      mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(
        new UnauthorizedException('User role not found'),
      );
    });

    it('should throw UnauthorizedException when user is null', () => {
      const context = createMockExecutionContext(null);
      mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(
        new UnauthorizedException('User role not found'),
      );
    });

    it('should throw UnauthorizedException when user is undefined', () => {
      const context = createMockExecutionContext(undefined);
      mockReflector.getAllAndOverride.mockReturnValue([Role.ADMIN]);

      expect(() => guard.canActivate(context)).toThrow(
        new UnauthorizedException('User role not found'),
      );
    });

    it('should handle multiple roles correctly', () => {
      const context = createMockExecutionContext(mockUser); // USER role
      mockReflector.getAllAndOverride.mockReturnValue([Role.USER, Role.ADMIN]);

      const result = guard.canActivate(context);

      expect(result).toBe(true);
    });

    it('should call reflector with correct parameters', () => {
      const context = createMockExecutionContext(mockUser);
      mockReflector.getAllAndOverride.mockReturnValue([Role.USER]);

      guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        'roles',
        [context.getHandler(), context.getClass()],
      );
    });
  });
});