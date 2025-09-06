import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma.service';
import { PaginationService } from '../pagination.service';
import { JwtModule } from '../jwt/jwt.module';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [JwtModule, MailModule],
  controllers: [AdminController],
  providers: [AdminService, PrismaService, PaginationService],
  exports: [AdminService],
})
export class AdminModule {}
