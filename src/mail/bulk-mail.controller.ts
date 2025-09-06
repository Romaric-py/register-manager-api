import { 
  Controller, 
  Post, 
  Body, 
  UseGuards, 
  HttpCode, 
  HttpStatus,
  BadRequestException
} from '@nestjs/common';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/guards/roles.decorator';
import { BulkMailService, BulkEmailRecipient, BulkMailResult } from './bulk-mail.service';
import { Role } from '@prisma/client';

export interface BulkMailRequest {
  recipients: BulkEmailRecipient[];
  subject: string;
  htmlTemplate: string;
  batchSize?: number;
  delayBetweenBatches?: number;
}

@Controller('bulk-mail')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BulkMailController {
  constructor(private readonly bulkMailService: BulkMailService) {}

  /**
   * Endpoint pour envoyer des emails en masse avec templates flexibles
   */
  @Post('send')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async sendBulkMail(@Body() request: BulkMailRequest): Promise<BulkMailResult> {
    const { recipients, subject, htmlTemplate, batchSize, delayBetweenBatches } = request;

    // Validation des destinataires
    const recipientErrors = this.bulkMailService.validateRecipients(recipients);
    if (recipientErrors.length > 0) {
      throw new BadRequestException({
        message: 'Erreurs de validation des destinataires',
        errors: recipientErrors,
      });
    }

    // Validation des placeholders
    const placeholderErrors = this.bulkMailService.validatePlaceholders(
      subject,
      htmlTemplate,
      recipients,
    );
    if (placeholderErrors.length > 0) {
      throw new BadRequestException({
        message: 'Placeholders manquants dans les données',
        errors: placeholderErrors,
      });
    }

    return await this.bulkMailService.sendBulkMail(
      recipients,
      subject,
      htmlTemplate,
      { batchSize, delayBetweenBatches },
    );
  }

  /**
   * Endpoint pour analyser un template et voir quels placeholders sont utilisés
   */
  @Post('analyze-template')
  @Roles(Role.ADMIN, Role.SUPER_ADMIN)
  @HttpCode(HttpStatus.OK)
  async analyzeTemplate(@Body() body: { subject: string; htmlTemplate: string }) {
    const { subject, htmlTemplate } = body;
    
    const subjectPlaceholders = this.bulkMailService.extractPlaceholders(subject);
    const htmlPlaceholders = this.bulkMailService.extractPlaceholders(htmlTemplate);
    const allPlaceholders = [...new Set([...subjectPlaceholders, ...htmlPlaceholders])];

    return {
      placeholders: {
        subject: subjectPlaceholders,
        html: htmlPlaceholders,
        all: allPlaceholders,
      },
      totalPlaceholders: allPlaceholders.length,
    };
  }
}