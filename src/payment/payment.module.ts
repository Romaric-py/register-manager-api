import { Logger, Module } from '@nestjs/common';
import { PaymentRecordService } from './services/payment-record.service';
import { PrismaService } from 'src/prisma.service';
import { FedaPayConfigService } from './services/fedapay-config.service';
import { FedaPayApiService } from './services/fedapay-api.service';
import { CreatePaymentService } from './services/create-payment.service';
import { PaymentController } from './payment.controller';
import { PaymentProcessingService } from './services/payment-processing.service';

@Module({
  providers: [
    PaymentRecordService,
    CreatePaymentService,
    PrismaService,
    Logger,
    FedaPayConfigService,
    FedaPayApiService,
    PaymentProcessingService,
  ],
  controllers: [PaymentController],
})
export class PaymentModule {}
