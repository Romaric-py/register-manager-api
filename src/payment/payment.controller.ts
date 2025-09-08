import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/jwt/jwt-auth.guard';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { AuthenticatedRequest } from 'src/common/interfaces/request.interface';
import { CreatePaymentService } from './services/create-payment.service';
import { PaymentProcessingService } from './services/payment-processing.service';
import { PaymentCallbackDto } from './dto/payment-callback.dto';

@Controller('payment')
@UseGuards(JwtAuthGuard)
export class PaymentController {
  // Endpoints pour initier un paiement, gérer les callbacks, etc.
  constructor(
    private readonly createPaymentService: CreatePaymentService,
    private readonly paymentProcessingService: PaymentProcessingService,
  ) {}

  @Post('generate-link')
  async generatePaymentLink(
    @Body() createPaymentDto: CreatePaymentDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<any> {
    const currentUser = req.user;
    return this.createPaymentService.generatePaymentLink(
      createPaymentDto,
      currentUser,
    );
  }

  @Get('available-amounts')
  async getAvailablePaymentAmounts(@Req() req: AuthenticatedRequest, @Body() dto: { registrationId: string }): Promise<any> {
    const currentUser = req.user;
    return this.createPaymentService.getAvailablePaymentAmounts(dto, currentUser);
  }

  @Post('callback')
  @UseGuards(JwtAuthGuard)
  async handlePaymentCallback(
    @Body() dto: PaymentCallbackDto,
    @Req() req: AuthenticatedRequest,
  ): Promise<any> {
    return this.paymentProcessingService.handlePaymentCallback(dto, req.user);
  }
}
