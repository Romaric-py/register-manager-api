import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import * as bcrypt from 'bcryptjs';
import { LoginDto } from '../dto/login.dto';
import { UserValidationService } from './user-validation.service';
import { TokensService } from './tokens.service';
import type { Response } from 'express';

@Injectable()
export class LoginService {
  private readonly logger = new Logger(LoginService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userValidationService: UserValidationService,
    private readonly tokensService: TokensService,
  ) {}

  private async validateUser(email: string, password: string): Promise<boolean> {
    const user = await this.userValidationService.retrieveUserByEmail(
      email,
      false,
    );
    if (!user) {
      this.logger.warn(
        `Tentative de connexion avec email inexistant: ${email}`,
      );
      return false;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    const isUserActive = user.isActive; // status check
    const isEmailVerified = user.emailVerified; // vérification de l'email

    if (!isPasswordValid) {
      this.logger.warn(
        `Tentative de connexion avec mot de passe incorrect pour: ${email}`,
      );
    }

    if (!isUserActive) {
      this.logger.warn(
        `Tentative de connexion avec compte désactivé: ${email}`,
      );
    }

    if (!isEmailVerified) {
      this.logger.warn(
        `Tentative de connexion avec email non vérifié: ${email}`,
      );
    }

    return isPasswordValid && isUserActive && isEmailVerified;
  }

  async login(loginDto: LoginDto, res: Response) {
    const { email, password } = loginDto;

    // Vérification préliminaire de l'existence de l'utilisateur et du statut de vérification
    const user = await this.userValidationService.retrieveUserByEmail(
      email,
      false,
    );

    if (user && !user.emailVerified) {
      throw new UnauthorizedException({
        message:
          'Veuillez vérifier votre adresse email avant de vous connecter',
        code: 'EMAIL_NOT_VERIFIED',
      });
    }

    const isValid = await this.validateUser(email, password);
    if (!isValid) {
      throw new UnauthorizedException({
        message: 'Identifiants invalides',
        code: 'INVALID_CREDENTIALS',
      });
    }

    // Récupérer à nouveau l'utilisateur après validation
    const validatedUser = await this.userValidationService.retrieveUserByEmail(
      email,
      true,
    );

    // Ensure user is not null before transforming
    if (!validatedUser) {
      throw new NotFoundException('Utilisateur non trouvé après validation');
    }

    // At this point, user is guaranteed to be non-null
    const updatedUser = await this.updateLastLogin(validatedUser.id);

    // Log successful login
    this.logger.log(
      `Connexion réussie pour l'utilisateur: ${validatedUser.email} (ID: ${validatedUser.id})`,
    );

    // Set auth cookies with tokens
    await this.tokensService.generateAndSetAuthTokens(updatedUser, res);

    return {
      message: 'Connexion réussie',
      user: this.userValidationService.safeTransform(updatedUser),
    };
  }

  async updateLastLogin(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { lastLogin: new Date() },
    });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return user;
  }
}
