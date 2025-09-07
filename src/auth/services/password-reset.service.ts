import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import {
  RequestPasswordResetDto,
  ResetPasswordDto,
} from '../dto/reset-password.dto';
import * as bcrypt from 'bcryptjs';
import { UserValidationService } from './user-validation.service';
import * as crypto from 'crypto';
import { MailService } from '../../mail/mail.service';

@Injectable()
export class PasswordResetService {
  // Configuration de l'expiration du token de reset via variable d'environnement
  private readonly resetTokenExpiryTime = parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY_MS || '900000'); // 15 minutes par défaut

  constructor(
    private readonly prisma: PrismaService,
    private readonly userValidationService: UserValidationService,
    private readonly mailService: MailService,
  ) {}

  async requestPasswordReset(requestDto: RequestPasswordResetDto) {
    const user = await this.userValidationService.retrieveUserByEmail(
      requestDto.email,
      false,
    );

    if (!user) {
      // Ne pas révéler si l'email existe ou non pour des raisons de sécurité
      return {
        message:
          'Si cet email existe, un lien de réinitialisation a été envoyé.',
      };
    }

    // Générer un token de réinitialisation sécurisé
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + this.resetTokenExpiryTime);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        resetToken,
        resetTokenExpiry,
      },
    });

    // Envoyer l'email avec le token de réinitialisation
    try {
      await this.mailService.sendPasswordResetTokenEmail(
        user.email,
        resetToken,
      );
    } catch (error) {
      // Logger l'erreur mais continuer l'exécution
      // En production, vous devriez utiliser un logger approprié
    }

    return {
      message: 'Si cet email existe, un lien de réinitialisation a été envoyé.',
    };
  }

  async resetPassword(resetDto: ResetPasswordDto) {
    const user = await this.prisma.user.findFirst({
      where: {
        resetToken: resetDto.token,
        resetTokenExpiry: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException(
        'Token de réinitialisation invalide ou expiré',
      );
    }

    const hashedPassword = await bcrypt.hash(resetDto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null,
        resetTokenExpiry: null,
      },
    });

    // Supprimer tous les refresh tokens pour forcer une nouvelle connexion
    await this.prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    return { message: 'Mot de passe réinitialisé avec succès' };
  }
}
