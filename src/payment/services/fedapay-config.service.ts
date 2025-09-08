import { Injectable } from '@nestjs/common';
import { Currency } from '@prisma/client';
import { FedaPayConfig, FedaPayHeaders } from '../payment.types';

@Injectable()
export class FedaPayConfigService {
  private readonly config: FedaPayConfig;

  constructor() {
    this.config = {
      apiUrl:
        process.env.FEDAPAY_API_URL || 'https://sandbox-api.fedapay.com/v1',
      currency: process.env.FEDAPAY_CURRENCY || Currency.XOF,
      country: process.env.FEDAPAY_COUNTRY || 'BJ'
    };
  }

  getConfig(): FedaPayConfig {
    return this.config;
  }

  getHeaders(): FedaPayHeaders {
    if (!process.env.FEDAPAY_API_KEY) {
      throw new Error('FEDAPAY_API_KEY is not configured');
    }

    return {
      Authorization: `Bearer ${process.env.FEDAPAY_API_KEY}`,
      'Content-Type': 'application/json',
    };
  }

  getCallbackUrl(): string {
    if (!process.env.FEDAPAY_CALLBACK) {
      throw new Error('FEDAPAY_CALLBACK URL is not configured');
    }
    return process.env.FEDAPAY_CALLBACK;
  }
}
