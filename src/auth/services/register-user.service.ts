import {
  ConflictException,
  Injectable,
  Logger,
  InternalServerErrorException,
  ForbiddenException,
} from '@nestjs/common';
import { RegisterUserDto } from '../dto/register-user.dto';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { PrismaService } from '../../prisma.service';
import { Role, User } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { UserValidationService } from './user-validation.service';
import { MailService } from '../../mail/mail.service';
import { EmailVerificationService } from './email-verification.service';

@Injectable()
export class RegisterUserService {
  private readonly logger = new Logger(RegisterUserService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly userValidationService: UserValidationService,
    private readonly mailService: MailService,
    private readonly emailVerificationService: EmailVerificationService,
  ) {}

  async registerUser(userData: RegisterUserDto) {
    const hashedPassword = await this.hashPassword(userData.password);
    const userExists = await this.userValidationService.retrieveUserByEmail(
      userData.email,
      false,
    );
    if (userExists) {
      throw new ConflictException('User with this email already exists');
    }
    const user = await this.prisma.user.create({
      data: { ...userData, password: hashedPassword },
    });

    // Envoyer seulement l'email de vérification (pas d'email de bienvenue à ce stade)
    try {
      await this.emailVerificationService.sendVerificationEmail(user.id);
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'envoi de l'email de vérification à ${user.email}:`,
        (error as Error).stack,
      );
      // On continue l'exécution mais on informe l'utilisateur du problème
      throw new InternalServerErrorException(
        "Votre compte a été créé mais l'envoi de l'email de vérification a échoué. Veuillez utiliser la fonction \"Renvoyer l'email de vérification\" plus tard.",
      );
    }

    return {
      message:
        'User registered successfully. Please check your email to verify your account.',
      user: this.userValidationService.safeTransform(user),
    };
  }

  /**
   * Crée un nouvel utilisateur avec le rôle ADMIN
   * Cette méthode ne peut être appelée que par un SUPER_ADMIN
   */
  async createAdmin(
    createAdminDto: CreateAdminDto,
    currentUser: User,
  ): Promise<any> {
    // Vérifier que l'utilisateur actuel est un SUPER_ADMIN
    if (currentUser.role !== Role.SUPER_ADMIN) {
      this.logger.warn(
        `Tentative de création d'admin par un utilisateur non autorisé: ${currentUser.email}`,
      );
      throw new ForbiddenException(
        'Seul un Super Admin peut créer un compte administrateur',
      );
    }

    // Vérifier si l'email est déjà utilisé
    const existingUser = await this.userValidationService.retrieveUserByEmail(
      createAdminDto.email,
      false,
    );

    if (existingUser) {
      throw new ConflictException('Un utilisateur avec cet email existe déjà');
    }

    // Générer un mot de passe temporaire
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await this.hashPassword(tempPassword);

    // Créer le nouvel administrateur
    const newAdmin = await this.prisma.user.create({
      data: {
        email: createAdminDto.email,
        password: hashedPassword,
        firstName: createAdminDto.firstName,
        lastName: createAdminDto.lastName,
        phone: createAdminDto.phone,
        role: createAdminDto.role ?? Role.ADMIN,
        emailVerified: true,
        createdBy: currentUser.id,
      },
    });

    // Envoyer un email de bienvenue avec le mot de passe temporaire
    try {
      await this.mailService.sendAdminWelcomeEmail(
        newAdmin.email,
        newAdmin.firstName,
        tempPassword,
        '', // Pas de token de vérification car déjà vérifié
      );
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'envoi de l'email de bienvenue à ${newAdmin.email}:`,
        (error as Error).stack,
      );
      // On ne lance pas d'exception ici pour ne pas interrompre le processus
    }

    this.logger.log(
      `Nouvel administrateur créé: ${newAdmin.email} par ${currentUser.email}`,
    );

    return {
      message: 'Compte administrateur créé avec succès',
      admin: this.userValidationService.safeTransform(newAdmin),
    };
  }

  async findUserByEmail(email: string) {
    return await this.prisma.user.findUnique({
      where: { email },
    });
  }

  private async hashPassword(password: string): Promise<string> {
    const salt = await bcrypt.genSalt(10);
    return bcrypt.hash(password, salt);
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }
}
