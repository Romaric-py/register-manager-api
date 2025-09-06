import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { BulkMailService } from './bulk-mail.service';
import { BulkMailController } from './bulk-mail.controller';
import { MailerModule } from '@nestjs-modules/mailer';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.MAIL_HOST || 'smtp.example.com',
        port: parseInt(process.env.MAIL_PORT || '587'),
        secure: process.env.MAIL_SECURE === 'true',
        auth: {
          user: process.env.MAIL_USER || 'user@example.com',
          pass: process.env.MAIL_PASSWORD || 'password',
        },
      },
      defaults: {
        from: `"${process.env.MAIL_FROM_NAME || 'DataScholarHub Register Manager'}" <${process.env.MAIL_FROM_ADDRESS || 'noreply@example.com'}>`,
      },
    }),
  ],
  controllers: [BulkMailController],
  providers: [MailService, BulkMailService],
  exports: [MailService, BulkMailService],
})
export class MailModule {}
