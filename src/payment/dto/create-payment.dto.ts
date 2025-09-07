import { PaymentMethod } from '@prisma/client';
import { IsString, IsNumber, IsNotEmpty } from 'class-validator';

export class CreatePaymentDto {
  // ID de l'inscription associée au paiement

  @IsString()
  @IsNotEmpty()
  registrationId: string;

  // Montant du paiement
  @IsNumber()
  @IsNotEmpty()
  amount: number;

  // Méthode de paiement (carte bancaire, PayPal, virement bancaire, etc.)
  @IsString()
  @IsNotEmpty()
  method?: PaymentMethod;

  // Date du paiement
  @IsString()
  @IsNotEmpty()
  paymentDate?: string;
}