import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';
import { LoginDto } from '../../dto/login.dto';
import { RegisterUserDto } from '../../dto/register-user.dto';
import { CreateAdminDto } from '../../dto/create-admin.dto';
import { RequestPasswordResetDto, ResetPasswordDto } from '../../dto/reset-password.dto';
import { VerifyEmailDto, ResendVerificationEmailDto } from '../../dto/email-verification.dto';
import { Role } from '@prisma/client';
import { expectValidationError } from '../test-utils';

describe('Auth DTOs Validation', () => {
  describe('LoginDto', () => {
    it('should validate correct login data', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'test@example.com',
        password: 'password123',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid email', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'invalid-email',
        password: 'password123',
      });

      const errors = await validate(dto);
      expectValidationError(errors, 'email', 'isEmail');
    });

    it('should fail with empty email', async () => {
      const dto = plainToInstance(LoginDto, {
        email: '',
        password: 'password123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });

    it('should fail with empty password', async () => {
      const dto = plainToInstance(LoginDto, {
        email: 'test@example.com',
        password: '',
      });

      const errors = await validate(dto);
      expectValidationError(errors, 'password', 'isNotEmpty');
    });

    it('should fail with missing fields', async () => {
      const dto = plainToInstance(LoginDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors.some(error => error.property === 'email')).toBe(true);
      expect(errors.some(error => error.property === 'password')).toBe(true);
    });
  });

  describe('RegisterUserDto', () => {
    it('should validate correct registration data', async () => {
      const dto = plainToInstance(RegisterUserDto, {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
        phone: '+1234567890',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid email', async () => {
      const dto = plainToInstance(RegisterUserDto, {
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email',
        password: 'Password123!',
        phone: '+1234567890',
      });

      const errors = await validate(dto);
      expectValidationError(errors, 'email', 'isEmail');
    });

    it('should fail with short password', async () => {
      const dto = plainToInstance(RegisterUserDto, {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: '123',
        phone: '+1234567890',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });

    it('should fail with empty first name', async () => {
      const dto = plainToInstance(RegisterUserDto, {
        firstName: '',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123!',
        phone: '+1234567890',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('firstName');
    });

    it('should fail with empty last name', async () => {
      const dto = plainToInstance(RegisterUserDto, {
        firstName: 'John',
        lastName: '',
        email: 'john.doe@example.com',
        password: 'Password123!',
        phone: '+1234567890',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('lastName');
    });

    it('should fail with weak password - no uppercase', async () => {
      const dto = plainToInstance(RegisterUserDto, {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password123!', // Pas de majuscule
        phone: '+1234567890',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isStrongPassword');
    });

    it('should fail with weak password - no lowercase', async () => {
      const dto = plainToInstance(RegisterUserDto, {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'PASSWORD123!', // Pas de minuscule
        phone: '+1234567890',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isStrongPassword');
    });

    it('should fail with weak password - no numbers', async () => {
      const dto = plainToInstance(RegisterUserDto, {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password!', // Pas de chiffre
        phone: '+1234567890',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isStrongPassword');
    });

    it('should fail with weak password - no special characters', async () => {
      const dto = plainToInstance(RegisterUserDto, {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'Password123', // Pas de caractère spécial
        phone: '+1234567890',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
      expect(errors[0].constraints).toHaveProperty('isStrongPassword');
    });

    it('should fail with weak password - too common', async () => {
      const dto = plainToInstance(RegisterUserDto, {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'password', // Mot de passe trop commun
        phone: '+1234567890',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('password');
    });

    it('should pass with strong password', async () => {
      const dto = plainToInstance(RegisterUserDto, {
        firstName: 'John',
        lastName: 'Doe',
        email: 'john.doe@example.com',
        password: 'StrongPass123!', // Mot de passe fort
        phone: '+1234567890',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('CreateAdminDto', () => {
    it('should validate correct admin data', async () => {
      const dto = plainToInstance(CreateAdminDto, {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        phone: '+1234567890',
        role: Role.ADMIN,
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should validate with default role', async () => {
      const dto = plainToInstance(CreateAdminDto, {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        phone: '+1234567890',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid role', async () => {
      const dto = plainToInstance(CreateAdminDto, {
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@example.com',
        phone: '+1234567890',
        role: 'INVALID_ROLE' as any,
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('role');
    });
  });

  describe('RequestPasswordResetDto', () => {
    it('should validate correct email', async () => {
      const dto = plainToInstance(RequestPasswordResetDto, {
        email: 'test@example.com',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid email', async () => {
      const dto = plainToInstance(RequestPasswordResetDto, {
        email: 'invalid-email',
      });

      const errors = await validate(dto);
      expectValidationError(errors, 'email', 'isEmail');
    });

    it('should fail with empty email', async () => {
      const dto = plainToInstance(RequestPasswordResetDto, {
        email: '',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });
  });

  describe('ResetPasswordDto', () => {
    it('should validate correct reset data', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'valid-reset-token',
        newPassword: 'NewPassword123!',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with empty token', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: '',
        newPassword: 'NewPassword123!',
      });

      const errors = await validate(dto);
      expectValidationError(errors, 'token', 'isNotEmpty');
    });

    it('should fail with short password', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'valid-reset-token',
        newPassword: '123',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('newPassword');
    });

    it('should fail with weak password - no uppercase', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'valid-reset-token',
        newPassword: 'newpassword123!', // Pas de majuscule
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('newPassword');
      expect(errors[0].constraints).toHaveProperty('isStrongPassword');
    });

    it('should fail with weak password - no lowercase', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'valid-reset-token',
        newPassword: 'NEWPASSWORD123!', // Pas de minuscule
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('newPassword');
      expect(errors[0].constraints).toHaveProperty('isStrongPassword');
    });

    it('should fail with weak password - no numbers', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'valid-reset-token',
        newPassword: 'NewPassword!', // Pas de chiffre
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('newPassword');
      expect(errors[0].constraints).toHaveProperty('isStrongPassword');
    });

    it('should fail with weak password - no special characters', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'valid-reset-token',
        newPassword: 'NewPassword123', // Pas de caractère spécial
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('newPassword');
      expect(errors[0].constraints).toHaveProperty('isStrongPassword');
    });

    it('should pass with strong password', async () => {
      const dto = plainToInstance(ResetPasswordDto, {
        token: 'valid-reset-token',
        newPassword: 'NewStrongPass123!', // Mot de passe fort
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('VerifyEmailDto', () => {
    it('should validate correct token', async () => {
      const dto = plainToInstance(VerifyEmailDto, {
        token: 'valid-verification-token',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with empty token', async () => {
      const dto = plainToInstance(VerifyEmailDto, {
        token: '',
      });

      const errors = await validate(dto);
      expectValidationError(errors, 'token', 'isNotEmpty');
    });

    it('should fail with missing token', async () => {
      const dto = plainToInstance(VerifyEmailDto, {});

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('token');
    });
  });

  describe('ResendVerificationEmailDto', () => {
    it('should validate correct email', async () => {
      const dto = plainToInstance(ResendVerificationEmailDto, {
        email: 'test@example.com',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail with invalid email', async () => {
      const dto = plainToInstance(ResendVerificationEmailDto, {
        email: 'invalid-email',
      });

      const errors = await validate(dto);
      expectValidationError(errors, 'email', 'isEmail');
    });

    it('should fail with empty email', async () => {
      const dto = plainToInstance(ResendVerificationEmailDto, {
        email: '',
      });

      const errors = await validate(dto);
      expect(errors.length).toBeGreaterThan(0);
      expect(errors[0].property).toBe('email');
    });
  });
});