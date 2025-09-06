import { Module } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { LoginService } from './services/login.service';
import { AuthController } from './auth.controller';
import { UserValidationService } from './services/user-validation.service';
import { RegisterUserService } from './services/register-user.service';
import { TokensService } from './services/tokens.service';
import { PasswordResetService } from './services/password-reset.service';
import { EmailVerificationService } from './services/email-verification.service';
import { JwtModule } from 'src/jwt/jwt.module';
import { LogoutService } from './services/logout.service';
import { MailModule } from 'src/mail/mail.module';

@Module({
  imports: [JwtModule, MailModule],
  providers: [
    PrismaService,
    LoginService,
    UserValidationService,
    RegisterUserService,
    TokensService,
    LogoutService,
    PasswordResetService,
    EmailVerificationService,
  ],
  controllers: [AuthController],
  exports: [
    LoginService,
    UserValidationService,
    RegisterUserService,
    TokensService,
    LogoutService,
    PasswordResetService,
    EmailVerificationService,
  ],
})
export class AuthModule {}
