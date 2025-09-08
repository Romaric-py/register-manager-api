import { IsString, IsNotEmpty } from "class-validator";

export class PaymentCallbackDto {
  // ID de la transaction
  @IsString()
  @IsNotEmpty()
  transactionId: string;
}