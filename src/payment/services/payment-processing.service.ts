import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { FedaPayApiService } from './fedapay-api.service';
import { PaymentRecordService } from './payment-record.service';
import { PaymentStatus } from '@prisma/client';
import { PaymentCallbackDto } from '../dto/payment-callback.dto';
import { PrismaService } from '../../prisma.service';

@Injectable()
export class PaymentProcessingService {
  constructor(
    private readonly fedaPayApiService: FedaPayApiService,
    private readonly prisma: PrismaService,
  ) {}

  /**
   * Gère le callback de paiement (FedaPay)
   * @param dto PaymentCallbackDto (doit contenir transactionId)
   * @param jwtUser Utilisateur authentifié (doit contenir id)
   */
  async handlePaymentCallback(
    dto: PaymentCallbackDto,
    jwtUser: { id: string },
  ) {
    try {
      // 1. Retrouver le paiement correspondant dans la base
      const payment = await this.prisma.payment.findFirst({
        where: { transactionId: dto.transactionId },
      });
      if (!payment) throw new NotFoundException('Paiement non trouvé');

      // 2. Récupérer la transaction FedaPay
      const transaction = await this.fedaPayApiService.retrieveTransaction(
        dto.transactionId,
      );
      if (!transaction)
        throw new NotFoundException('Transaction FedaPay non trouvée');

      console.log('Transaction FedaPay récupérée:', transaction);

      // 3. Mettre à jour le statut du paiement selon la transaction
      let newStatus: PaymentStatus;
      switch (transaction.status) {
        case 'approved':
        case 'confirmed':
          newStatus = PaymentStatus.COMPLETED;
          break;
        case 'canceled':
        case 'abandoned':
          newStatus = PaymentStatus.CANCELLED;
          break;
        case 'failed':
        case 'rejected':
          newStatus = PaymentStatus.FAILED;
          break;
        default:
          newStatus = PaymentStatus.PENDING;
      }

      if (payment.status !== newStatus) {
        await this.prisma.payment.update({
          where: { id: payment.id },
          data: { status: newStatus },
        });

        // 4. Mettre à jour l'inscription si le paiement est complété
        if (newStatus === PaymentStatus.COMPLETED) {
          // pour éviter de faire ça plusieurs fois
          // obtenir l'inscription
          const registration = await this.prisma.registration.findUnique({
            where: { id: payment.registrationId },
          });
          if (!registration) {
            throw new NotFoundException(
              'Inscription non trouvée pour ce paiement',
            );
          }
          // diminuer le montant restant et augmenter le montant payé
          const updatedPaidAmount = registration.paidAmount + payment.amount;
          const updatedRemainingAmount =
            registration.totalAmount! - updatedPaidAmount;
          // si le montant restant est à 0, marquer l'inscription comme complétée
          if (updatedRemainingAmount === 0) {
            await this.prisma.registration.update({
              where: { id: registration.id },
              data: {
                status: 'COMPLETED', //! peut changer de sens
                paymentStatus: 'COMPLETED',
                paidAmount: updatedPaidAmount,
                remainingAmount: updatedRemainingAmount,
              },
            });
          } else {
            await this.prisma.registration.update({
              where: { id: registration.id },
              data: {
                paidAmount: updatedPaidAmount,
                remainingAmount: updatedRemainingAmount,
              },
            });
          }

          return { message: `Statut du paiement mis à jour: ${newStatus}` };
        }
      } else {
        return { message: 'Le statut du paiement est déjà à jour.' };
      }
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException(
        'Erreur lors du traitement du callback paiement: ' + error.message,
      );
    }
  }
}
