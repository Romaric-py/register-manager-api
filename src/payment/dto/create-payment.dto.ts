import { IsString, IsNumber, IsNotEmpty, IsDateString } from 'class-validator';

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
  method?: string;

  // Date du paiement
  @IsDateString()
  @IsNotEmpty()
  paymentDate?: string;

  // Numéro de téléphone associé au paiement
  @IsString()
  @IsNotEmpty()
  phoneNumber: string;
}