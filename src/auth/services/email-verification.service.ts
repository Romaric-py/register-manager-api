import {
  Injectable,
  Logger,
  BadRequestException,
  ConflictException,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { MailService } from 'src/mail/mail.service';
import * as crypto from 'crypto';

@Injectable()
export class EmailVerificationService {
  private readonly logger = new Logger(EmailVerificationService.name);

  // Configuration des délais via variables d'environnement
  private readonly tokenExpiryTime = parseInt(
    process.env.EMAIL_VERIFICATION_TOKEN_EXPIRY_MS || '86400000',
  ); // 24 heures par défaut
  private readonly resendCooldown = parseInt(
    process.env.EMAIL_VERIFICATION_RESEND_COOLDOWN_MS || '300000',
  ); // 5 minutes par défaut

  constructor(
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  /**
   * Génère un token de vérification d'email pour un utilisateur
   * @param userId ID de l'utilisateur
   * @returns Token généré
   */
  async generateVerificationToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    if (user.emailVerified) {
      throw new ConflictException({
        message: 'Email déjà vérifié',
        code: 'EMAIL_ALREADY_VERIFIED',
      });
    }

    // Vérifier le délai de refroidissement pour limiter les demandes répétées
    if (user.lastEmailVerificationIssue) {
      const lastIssue = new Date(user.lastEmailVerificationIssue).getTime();
      const now = Date.now();

      if (now - lastIssue < this.resendCooldown) {
        const waitTimeMinutes = Math.ceil(
          (this.resendCooldown - (now - lastIssue)) / 60000,
        );
        throw new ConflictException({
          message: `Veuillez attendre ${waitTimeMinutes} minute(s) avant de demander un nouveau code de vérification`,
          code: 'TOO_MANY_REQUESTS',
        });
      }
    }

    // Générer un token unique
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenExpiry = new Date(Date.now() + this.tokenExpiryTime);

    // Enregistrer le token dans la base de données
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken: verificationToken,
        emailVerificationTokenExpiry: tokenExpiry,
        lastEmailVerificationIssue: new Date(),
      },
    });

    return verificationToken;
  }

  /**
   * Envoie un email de vérification à un utilisateur
   * @param userId ID de l'utilisateur
   */
  async sendVerificationEmail(userId: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    // Générer un nouveau token de vérification
    const verificationToken = await this.generateVerificationToken(userId);

    // Envoyer l'email avec le token
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    // Utiliser le nouveau template TypeScript
    await this.mailService.sendEmailVerificationEmail(
      user.email,
      user.firstName,
      verificationToken,
    );
    this.logger.log(`Email de vérification envoyé à ${user.email}`);
  }

  /**
   * Vérifie un token de vérification d'email
   * @param token Token de vérification
   */
  async verifyEmail(token: string): Promise<{ message: string }> {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationTokenExpiry: {
          gte: new Date(),
        },
      },
    });

    if (!user) {
      throw new BadRequestException('Token de vérification invalide ou expiré');
    }

    // Marquer l'email comme vérifié et nettoyer les champs de vérification
    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerified: true,
        emailVerificationToken: null,
        emailVerificationTokenExpiry: null,
      },
    });

    // Envoyer l'email de bienvenue maintenant que l'adresse email est vérifiée
    await this.mailService.sendWelcomeEmail(updatedUser);
    this.logger.log(
      `Email de bienvenue envoyé à ${user.email} après vérification`,
    );
    // On ne rejette pas l'erreur ici pour ne pas bloquer le processus de vérification

    this.logger.log(`Email vérifié avec succès pour ${user.email}`);
    return { message: 'Votre adresse email a été vérifiée avec succès' };
  }

  /**
   * Vérifie si un email a déjà été vérifié
   * @param email Adresse email à vérifier
   */
  async isEmailVerified(email: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true },
    });

    if (!user) {
      throw new BadRequestException('Utilisateur non trouvé');
    }

    return user.emailVerified;
  }

  /**
   * Renvoie un email de vérification à l'adresse email spécifiée
   * @param email Adresse email de l'utilisateur
   * @returns Message de confirmation
   */
  async resendVerificationEmail(email: string): Promise<{ message: string, code: string }> {
    // Rechercher l'utilisateur par son email
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    // Si l'utilisateur existe et que son email n'est pas encore vérifié
    if (user && !user.emailVerified) {
      // Envoyer un nouvel email de vérification
      await this.sendVerificationEmail(user.id);
      this.logger.log(`Email de vérification renvoyé à ${email}`);
      return { message: 'Email de vérification envoyé avec succès', code: 'EMAIL_SENT' };
    }

    // Si l'utilisateur existe mais que son email est déjà vérifié
    if (user && user.emailVerified) {
      this.logger.log(
        `Tentative de renvoi d'email pour une adresse déjà vérifiée: ${email}`,
      );
      return { message: 'Cette adresse email est déjà vérifiée', code: 'EMAIL_ALREADY_VERIFIED' };
    }

    // Pour des raisons de sécurité, retourner le même message même si l'utilisateur n'existe pas
    this.logger.log(
      `Tentative de renvoi d'email pour un utilisateur inexistant: ${email}`,
    );
    return {
      message:
        'Si cette adresse email existe, un email de vérification a été envoyé',
      code: 'EMAIL_SENT',
    };
  }
}
