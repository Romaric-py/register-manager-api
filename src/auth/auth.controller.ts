import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  Response,
  BadRequestException,
  UnauthorizedException,
  HttpStatus,
} from '@nestjs/common';
import { LoginService } from './services/login.service';
import { RegisterUserService } from './services/register-user.service';
import { LogoutService } from './services/logout.service';
import { PasswordResetService } from './services/password-reset.service';
import { EmailVerificationService } from './services/email-verification.service';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { CreateAdminDto } from './dto/create-admin.dto';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from './dto/reset-password.dto';
import {
  VerifyEmailDto,
  ResendVerificationEmailDto,
} from './dto/email-verification.dto';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from './guards/roles.guard';
import { Roles } from './guards/roles.decorator';
import { Role } from '@prisma/client';
import type { Response as ExpressResponse } from 'express';
import type { RequestWithUser } from '../common/interfaces/request.interface';
import type { AuthenticatedRequest } from '../common/interfaces/request.interface';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly loginService: LoginService,
    private readonly registerUserService: RegisterUserService,
    private readonly logoutService: LogoutService,
    private readonly passwordResetService: PasswordResetService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: LoginDto, @Response() res: ExpressResponse) {
    try {
      const result = await this.loginService.login(loginDto, res);
      return res.status(HttpStatus.OK).json(result);
    } catch (error) {
      if (
        error instanceof UnauthorizedException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Erreur lors de la connexion');
    }
  }

  @Post('register')
  async registerUser(@Body() registerUserDto: RegisterUserDto) {
    return await this.registerUserService.registerUser(registerUserDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  async logout(
    @Request() req: AuthenticatedRequest,
    @Response() res: ExpressResponse,
  ) {
    const result = await this.logoutService.logout(req, res);
    return res.status(HttpStatus.OK).json(result);
  }

  @Post('request-password-reset')
  async requestPasswordReset(@Body() requestDto: RequestPasswordResetDto) {
    return this.passwordResetService.requestPasswordReset(requestDto);
  }

  @Post('reset-password')
  async resetPassword(@Body() resetDto: ResetPasswordDto) {
    return this.passwordResetService.resetPassword(resetDto);
  }

  @Post('verify-email')
  async verifyEmail(@Body() verifyEmailDto: VerifyEmailDto) {
    return this.emailVerificationService.verifyEmail(verifyEmailDto.token);
  }

  @Post('resend-verification-email')
  async resendVerificationEmail(@Body() resendDto: ResendVerificationEmailDto) {
    return this.emailVerificationService.resendVerificationEmail(
      resendDto.email,
    );
  }

  @Post('create-admin')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.SUPER_ADMIN)
  async createAdmin(
    @Body() createAdminDto: CreateAdminDto,
    @Request() req: RequestWithUser,
  ) {
    return this.registerUserService.createAdmin(createAdminDto, req.user);
  }
}
