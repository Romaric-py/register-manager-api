import { Logger, Module } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { PrismaService } from 'src/prisma.service';

@Module({
  providers: [PaymentService, PrismaService, Logger]
})
export class PaymentModule {}
