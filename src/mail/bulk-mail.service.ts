import { Injectable, Logger } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

export interface BulkEmailRecipient {
  email: string;
  [key: string]: any; // Tous les autres champs seront utilisés comme variables
}

export interface BulkMailOptions {
  batchSize?: number;
  delayBetweenBatches?: number; // en millisecondes
}

export interface BulkMailResult {
  totalSent: number;
  totalFailed: number;
  failures: Array<{
    email: string;
    error: string;
  }>;
  duration: number; // en millisecondes
}

@Injectable()
export class BulkMailService {
  private readonly logger = new Logger(BulkMailService.name);
  
  constructor(private readonly mailerService: MailerService) {}

  /**
   * Envoie des emails en masse avec template personnalisé et placeholders
   */
  async sendBulkMail(
    recipients: BulkEmailRecipient[],
    subjectTemplate: string,
    htmlTemplate: string,
    options: BulkMailOptions = {},
  ): Promise<BulkMailResult> {
    const { batchSize = 50, delayBetweenBatches = 1000 } = options;
    const startTime = Date.now();
    
    const result: BulkMailResult = {
      totalSent: 0,
      totalFailed: 0,
      failures: [],
      duration: 0,
    };

    this.logger.log(`Début de l'envoi en masse pour ${recipients.length} destinataires`);

    // Traitement par lots
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);
      const batchNumber = Math.floor(i / batchSize) + 1;
      const totalBatches = Math.ceil(recipients.length / batchSize);

      this.logger.log(`Traitement du lot ${batchNumber}/${totalBatches} (${batch.length} emails)`);

      // Envoi parallèle du lot
      const batchPromises = batch.map(async (recipient) => {
        try {
          const personalizedSubject = this.replacePlaceholders(subjectTemplate, recipient);
          const personalizedHtml = this.replacePlaceholders(htmlTemplate, recipient);

          await this.mailerService.sendMail({
            to: recipient.email,
            subject: personalizedSubject,
            html: personalizedHtml,
          });

          result.totalSent++;
          this.logger.debug(`Email envoyé avec succès à ${recipient.email}`);
        } catch (error) {
          result.totalFailed++;
          const errorMessage = error instanceof Error ? error.message : 'Erreur inconnue';
          result.failures.push({
            email: recipient.email,
            error: errorMessage,
          });
          this.logger.error(`Échec d'envoi à ${recipient.email}: ${errorMessage}`);
        }
      });

      await Promise.all(batchPromises);

      // Délai entre les lots (sauf pour le dernier)
      if (i + batchSize < recipients.length && delayBetweenBatches > 0) {
        this.logger.debug(`Pause de ${delayBetweenBatches}ms avant le prochain lot`);
        await this.sleep(delayBetweenBatches);
      }
    }

    result.duration = Date.now() - startTime;
    
    this.logger.log(
      `Envoi terminé en ${result.duration}ms. Succès: ${result.totalSent}, Échecs: ${result.totalFailed}`,
    );

    return result;
  }

  /**
   * Remplace tous les placeholders {{KEY}} dans le template avec les valeurs de l'objet
   */
  private replacePlaceholders(template: string, data: Record<string, any>): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      const value = data[key];
      if (value === undefined || value === null) {
        this.logger.warn(`Placeholder "${key}" non trouvé dans les données pour ${data.email}`);
        return match; // Garde le placeholder si la valeur n'existe pas
      }
      return String(value);
    });
  }

  /**
   * Utilitaire pour créer une pause
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Valide que tous les destinataires ont un email valide
   */
  validateRecipients(recipients: BulkEmailRecipient[]): string[] {
    const errors: string[] = [];
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    recipients.forEach((recipient, index) => {
      if (!recipient.email) {
        errors.push(`Destinataire ${index + 1}: email manquant`);
      } else if (!emailRegex.test(recipient.email)) {
        errors.push(`Destinataire ${index + 1}: email invalide (${recipient.email})`);
      }
    });

    return errors;
  }

  /**
   * Analyse un template pour extraire tous les placeholders utilisés
   */
  extractPlaceholders(template: string): string[] {
    const matches = template.match(/\{\{(\w+)\}\}/g);
    if (!matches) return [];
    
    return [...new Set(matches.map(match => match.slice(2, -2)))]; // Retire {{ et }}
  }

  /**
   * Vérifie que tous les placeholders requis sont présents dans les données
   */
  validatePlaceholders(
    subjectTemplate: string, 
    htmlTemplate: string, 
    recipients: BulkEmailRecipient[]
  ): string[] {
    const errors: string[] = [];
    const subjectPlaceholders = this.extractPlaceholders(subjectTemplate);
    const htmlPlaceholders = this.extractPlaceholders(htmlTemplate);
    const allPlaceholders = [...new Set([...subjectPlaceholders, ...htmlPlaceholders])];

    recipients.forEach((recipient, index) => {
      const missingPlaceholders = allPlaceholders.filter(
        placeholder => !(placeholder in recipient) || recipient[placeholder] === undefined
      );

      if (missingPlaceholders.length > 0) {
        errors.push(
          `Destinataire ${index + 1} (${recipient.email}): placeholders manquants: ${missingPlaceholders.join(', ')}`
        );
      }
    });

    return errors;
  }
}