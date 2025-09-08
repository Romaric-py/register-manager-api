import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { FedaPayConfigService } from './fedapay-config.service';
import { AuthUserType } from '../../common/interfaces/request.interface';
import { CreatePaymentDto } from '../dto/create-payment.dto';
import { PrismaService } from '../../prisma.service';
import { User } from '@prisma/client';
import { FedaPayApiService } from './fedapay-api.service';
import { PaymentRecordService } from './payment-record.service';
import { TransactionData } from '../payment.types';
import { count } from 'console';

@Injectable()
export class CreatePaymentService {
  private readonly minPaymentAmount = 100; // Montant minimum pour un paiement complet
  private readonly minInstallmentAmount = 1000; // Montant minimum pour un paiement partiel

  constructor(
    private readonly logger: Logger,
    private readonly fedaPayConfigService: FedaPayConfigService,
    private readonly prisma: PrismaService,
    private readonly fedaPayApiService: FedaPayApiService,
    private readonly paymentRecordService: PaymentRecordService,
  ) {}

  async generatePaymentLink(
    createPaymentDto: CreatePaymentDto,
    jwtUser: AuthUserType,
  ) {
    const user = await this.findUserById(jwtUser.id);
    const paymentUrl = await this.processPayment(createPaymentDto, user);

    return { url: paymentUrl };
  }

  private async processPayment(
    dto: CreatePaymentDto,
    user: User,
  ): Promise<string> {
    if (dto.registrationId) {
      await this.validateRegistrationForPayment(dto.registrationId, dto, user);
    }

    const transactionData = this.prepareTransactionData(dto, user);

    const transaction =
      await this.fedaPayApiService.createTransaction(transactionData);

    await this.paymentRecordService.createPaymentRecord(transaction, dto);

    return this.fedaPayApiService.generateTransactionUrl(transaction.id);
  }

  private async validateRegistrationForPayment(
    registrationId: string,
    dto: CreatePaymentDto,
    user: { id: string },
  ) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: { course: true },
    });

    if (!registration) {
      throw new NotFoundException('Inscription non trouvée');
    }
    // Ownership check
    if (registration.userId !== user.id) {
      throw new NotFoundException(
        'Inscription non trouvée pour cet utilisateur',
      );
    }
    if (!registration.status || registration.status === 'CANCELLED') {
      throw new NotFoundException(
        `L'inscription est annulée ou n'a pas de statut valide`,
      );
    }
    if (registration.status === 'COMPLETED') {
      throw new UnauthorizedException('L\'inscription est déjà complétée');
    }
    if (!registration.course || !registration.course.price) {
      throw new NotFoundException('Aucun prix défini pour ce cours');
    }
    if (registration.course.price <= 0) {
      throw new NotFoundException('Le cours est gratuit, aucun paiement requis');
    }
    if (!dto.amount || dto.amount <= 0) {
      throw new NotFoundException('Montant de paiement invalide');
    }
    if (dto.amount < this.minPaymentAmount) {
      throw new NotFoundException(
        `Le montant minimum pour un paiement est de ${this.minPaymentAmount}`,
      );
    }
    if (dto.amount > registration.course.price) {
      throw new NotFoundException(
        'Le montant du paiement ne peut pas dépasser le prix du cours',
      );
    }
    if (
      dto.amount < registration.course.price &&
      dto.amount < this.minInstallmentAmount
    ) {
      throw new NotFoundException(
        `Le montant minimum pour un paiement partiel est de ${this.minInstallmentAmount}`,
      );
    }

    const availableAmounts =
      await this.calculateAvailableAmounts(registrationId);
    // console.log('availableAmounts', availableAmounts);
    if (!availableAmounts.includes(dto.amount)) {
      throw new NotFoundException(
        'Montant de paiement invalide. Les montants disponibles sont : ' +
          availableAmounts.join(', '),
      );
    }

    this.logger.log(
      `Validation réussie pour l'inscription ${registrationId} avec le montant ${dto.amount}`,
    );

    return true;
  }

  async getAvailablePaymentAmounts(dto: { registrationId: string }, jwtUser: AuthUserType) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: dto.registrationId },
    });
    if (!registration) {
      throw new NotFoundException('Inscription non trouvée');
    }
    // Ownership check
    if (registration.userId !== jwtUser.id) {
      throw new NotFoundException(
        'Inscription non trouvée pour cet utilisateur',
      );
    }
    if (dto.registrationId) {
      return { data: await this.calculateAvailableAmounts(dto.registrationId) };
    } else {
      throw new NotFoundException('L\'ID de l\'inscription est requis');
    }
  }

  //! Vérifier le bon fonctionnement de cette méthode
  private async calculateAvailableAmounts(registrationId: string) {
    const registration = await this.prisma.registration.findUnique({
      where: { id: registrationId },
      include: { course: true, payments: true },
    });

    if (!registration) {
      throw new NotFoundException('Inscription non trouvée');
    }

    if (!registration.course.price) {
      throw new NotFoundException('Aucun prix défini pour ce cours');
    }

    let remainingAmount =
      registration.remainingAmount ?? registration.course.price; // par défaut, le montant total du cours

    const availableAmounts: number[] = [];

    if (remainingAmount >= this.minPaymentAmount) {
      availableAmounts.push(remainingAmount); // Paiement complet
    }

    // Ajouter des montants d'acompte (par exemple, par tranches de 1000)
    for (
      let amt = this.minInstallmentAmount;
      amt < remainingAmount;
      amt += this.minInstallmentAmount
    ) {
      if (remainingAmount - amt >= this.minInstallmentAmount) {
        availableAmounts.push(amt);
      }
    }

    return availableAmounts;
  }

  private async findUserById(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });
    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return user;
  }

  private prepareTransactionData(dto: CreatePaymentDto, user: User) {
    return {
      amount: dto.amount,
      currency: { iso: this.fedaPayConfigService.getConfig().currency },
      description: `Paiement de ${dto.amount} pour l'inscription ${dto.registrationId}`,
      customer: {
        firstname: user.firstName,
        lastname: user.lastName,
        email: user.email,
        phone_number: { number: dto.phoneNumber, country: 'BJ' },
      },
      callback_url: this.fedaPayConfigService.getCallbackUrl(),
    } satisfies TransactionData;
  }
}
