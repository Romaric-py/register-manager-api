import { Module } from '@nestjs/common';
import { RegistrationService } from './registration.service';
import { RegistrationController } from './registration.controller';
import { PrismaService } from '../prisma.service';
import { PaginationService } from '../pagination.service';

@Module({
  controllers: [RegistrationController],
  providers: [RegistrationService, PrismaService, PaginationService],
})
export class RegistrationModule {}
