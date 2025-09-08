import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { FedaPayConfigService } from './fedapay-config.service';
import { TransactionData } from '../payment.types';

@Injectable()
export class FedaPayApiService {
  constructor(
    private readonly configService: FedaPayConfigService,
    private readonly logger: Logger,
  ) {}

  async createTransaction(transactionData: any/*TransactionData*/): Promise<any> {
    try {
      const response = await fetch(
        `${this.configService.getConfig().apiUrl}/transactions`,
        {
          method: 'POST',
          headers: this.configService.getHeaders(),
          body: JSON.stringify(transactionData),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();

        this.logger.error(`Failed to create transaction: ${errorData.message}`);
        throw new Error(`Failed to create transaction: ${errorData.message}`);
      }

      const data = await response.json();
      return data['v1/transaction'];
    } catch (error) {
      this.logger.error(`Transaction creation failed: ${error.message}`);
      throw new Error(`Transaction creation failed: ${error.message}`);
    }
  }

  async generateTransactionUrl(transactionId: string): Promise<string> {
    try {
      const response = await fetch(
        `${this.configService.getConfig().apiUrl}/transactions/${transactionId}/token`,
        {
          method: 'POST',
          headers: this.configService.getHeaders(),
        },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`Failed to generate url: ${errorData.message}`);
      }

      const data = await response.json();
      return data.url;
    } catch (error) {
      this.logger.error(`Url generation failed: ${error.message}`);
      throw new Error(`Url generation failed: ${error.message}`);
    }
  }

  async retrieveTransaction(transactionId: string): Promise<any> {
    try {
      const response = await fetch(
        `${this.configService.getConfig().apiUrl}/transactions/${transactionId}`,
        {
          method: 'GET',
          headers: this.configService.getHeaders(),
        },
      );

      if (!response.ok) {
        throw new HttpException(
          'Transaction not found',
          HttpStatus.NOT_FOUND,
        );
      }

      const data = await response.json();
      return data['v1/transaction'];
    } catch (error) {
      throw new HttpException(
        `Failed to retrieve transaction: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
