import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { User } from '@prisma/client';
import {
  welcomeEmailTemplate,
  emailVerificationTemplate,
  adminWelcomeEmailTemplate,
  passwordResetTokenEmailTemplate,
  passwordResetEmailTemplate,
  registrationConfirmationEmailTemplate,
  type WelcomeEmailProps,
  type EmailVerificationProps,
  type AdminWelcomeEmailProps,
  type PasswordResetTokenEmailProps,
  type PasswordResetEmailProps,
  type RegistrationConfirmationEmailProps,
} from './templates';

@Injectable()
export class MailService {
  constructor(private readonly mailerService: MailerService) {}

  /**
   * Envoie un e-mail de bienvenue à un utilisateur nouvellement inscrit
   */
  async sendWelcomeEmail(user: User) {
    const templateProps: WelcomeEmailProps = {
      name: `${user.firstName} ${user.lastName}`,
      email: user.email,
    };

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Bienvenue sur notre plateforme !',
      html: welcomeEmailTemplate(templateProps),
    });
  }

  /**
   * Envoie un e-mail de bienvenue à un nouvel administrateur
   */
  async sendAdminWelcomeEmail(
    email: string,
    firstName: string,
    tempPassword: string,
    verificationToken: string,
  ) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const templateProps: AdminWelcomeEmailProps = {
      name: firstName,
      email,
      tempPassword,
      verificationUrl,
    };

    await this.mailerService.sendMail({
      to: email,
      subject: 'Bienvenue - Votre compte administrateur a été créé',
      html: adminWelcomeEmailTemplate(templateProps),
    });
  }

  /**
   * Envoie un e-mail de réinitialisation de mot de passe
   */
  async sendPasswordResetEmail(
    email: string,
    firstName: string,
    newPassword: string,
  ) {
    const templateProps: PasswordResetEmailProps = {
      name: firstName,
      email,
      newPassword,
    };

    await this.mailerService.sendMail({
      to: email,
      subject: 'Votre nouveau mot de passe',
      html: passwordResetEmailTemplate(templateProps),
    });
  }

  /**
   * Envoie un mail de vérification d'email avec token
   */
  async sendEmailVerificationEmail(email: string, firstName: string, token: string) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;

    const templateProps: EmailVerificationProps = {
      name: firstName,
      verificationUrl,
    };

    await this.mailerService.sendMail({
      to: email,
      subject: 'Vérification de votre adresse email',
      html: emailVerificationTemplate(templateProps),
    });
  }

  /**
   * Envoie un e-mail de réinitialisation de mot de passe avec token
   */
  async sendPasswordResetTokenEmail(email: string, resetToken: string) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;

    const templateProps: PasswordResetTokenEmailProps = {
      email,
      resetUrl,
    };

    await this.mailerService.sendMail({
      to: email,
      subject: 'Réinitialisation de votre mot de passe',
      html: passwordResetTokenEmailTemplate(templateProps),
    });
  }

  /**
   * Envoie une confirmation d'inscription à une formation
   */
  async sendRegistrationConfirmation(
    user: User,
    formationTitle: string,
    startDate: Date,
  ) {
    const formattedDate = new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
    }).format(startDate);

    const templateProps: RegistrationConfirmationEmailProps = {
      name: `${user.firstName} ${user.lastName}`,
      formationTitle,
      formattedDate,
    };

    await this.mailerService.sendMail({
      to: user.email,
      subject: `Confirmation d'inscription à la formation : ${formationTitle}`,
      html: registrationConfirmationEmailTemplate(templateProps),
    });
  }

  /**
   * Envoie un e-mail de vérification d'adresse email
   */
  async sendEmailVerification(
    email: string,
    firstName: string,
    verificationToken: string,
  ) {
    const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${verificationToken}`;

    const templateProps: EmailVerificationProps = {
      name: firstName,
      verificationUrl,
    };

    await this.mailerService.sendMail({
      to: email,
      subject: 'Vérification de votre adresse email',
      html: emailVerificationTemplate(templateProps),
    });
  }

  /**
   * Envoie un e-mail de notification générique
   */
  async sendNotification(
    to: string,
    subject: string,
    htmlContent: string,
  ) {
    await this.mailerService.sendMail({
      to,
      subject,
      html: htmlContent,
    });
  }
}
