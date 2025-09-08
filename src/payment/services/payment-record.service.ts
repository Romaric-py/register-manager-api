import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { Currency, PaymentStatus } from '@prisma/client';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { SortOrder } from 'src/common/constants/global.constants';

@Injectable()
export class PaymentRecordService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly logger: Logger,
  ) {}

  /**
   * Crée un paiement pour une inscription donnée (suite à l'intention de paiement).
   */
  async createPaymentRecord(
    transaction: {
      id: number;
      amount: number;
      status: string;
      created_at: string;
      updated_at: string;
    },
    createPaymentDto: CreatePaymentDto,
  ) {
    return this.prisma.payment.create({
      data: {
        registrationId: createPaymentDto.registrationId,
        transactionId: transaction.id ? transaction.id.toString() : undefined,
        amount: createPaymentDto.amount,
        status: PaymentStatus.PENDING,
        currency: Currency.XOF,
        phoneNumber: createPaymentDto.phoneNumber,
        notes: undefined,
        method: 'unknown',
        paymentDate: new Date(), // Set to current date (// TODO can be updated later)
        processedAt: undefined,
      },
    });
  }

  async getPendingPayments() {
    return this.prisma.payment.findMany({
      where: {
        status: PaymentStatus.PENDING,
      },
    });
  }

  async getPaymentsByRegistration(registrationId: string) {
    await this.checkIfRegistrationExists(registrationId);
    return this.prisma.payment.findMany({
      where: { registrationId },
      orderBy: { paymentDate: SortOrder.DESC },
    });
  }

  private async checkIfRegistrationExists(registrationId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
    });

    if (!registration) {
      throw new NotFoundException('Inscription non trouvée');
    }
  }
}

/* IDÉES ET NOTES
Pour faire un paiement, on doit connaitre, l'inscription (qui contient le user et le cours),
le montant, le mode de paiement (carte bancaire, paypal, virement bancaire, etc...)
et la date du paiement.


Deux phases principales pour un paiement: 
1. Reception de l'intention de paiement
2. Création du paiement dans la base de données (statut "en attente")
3. Interaction avec le fournisseur de paiement (FedaPay)
4. Mise à jour du statut du paiement en fonction de la réponse du fournisseur
(le paiement pouvant être abandonné, le montant total payé pour une inscription est la somme des 
paiements avec le statut "confirmé")

5. Notification de l'utilisateur du résultat du paiement
6. Mise à jour du statut de l'inscription si le paiement total atteint le montant requis

États possibles d'un paiement:
- "en_attente": paiement initié mais pas encore traité
- "confirme": paiement réussi et confirmé par le fournisseur
- "echec": paiement échoué
- "abandonne": paiement abandonné par l'utilisateur
- "rembourse": paiement remboursé

Une inscription peut avoir plusieurs paiements (paiements partiels)
Le statut de l'inscription dépend du montant total des paiements confirmés */
