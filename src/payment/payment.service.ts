import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  constructor(private readonly prisma: PrismaService, private readonly logger: Logger) {}

  /**
   * Crée un paiement pour une inscription donnée (suite à l'intention de paiement).
   */
  async createPaymentForRegistration(paymentDto: CreatePaymentDto) {
    const { registrationId, amount, method, paymentDate } = paymentDto;

    // Vérifier si l'inscription existe
    await this.checkIfRegistrationExists(registrationId);

    this.logger.log(`Creating payment for registration ID: ${registrationId}`);
    
    const payment = await this.prisma.payment.create({
      data: {
        registrationId,
        amount,
        method,
        paymentDate,
        status: PaymentStatus.PENDING, // Statut initial
      },
    });

    return { message: 'Paiement créé avec succès', data: payment };
  }

  async getPaymentsByRegistration(registrationId: string) {
    await this.checkIfRegistrationExists(registrationId);
    return this.prisma.payment.findMany({
      where: { registrationId },
      orderBy: { paymentDate: 'desc' },
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