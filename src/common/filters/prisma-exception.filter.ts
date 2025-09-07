import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Response } from 'express';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaExceptionFilter.name);

  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();

    // Log l'erreur pour debugging (sans l'exposer à l'utilisateur)
    this.logger.error(
      `Prisma error ${exception.code}: ${exception.message}`,
      exception.stack,
    );

    // Transformer les erreurs Prisma en réponses HTTP appropriées
    const { status, message } = this.mapPrismaErrorToHttp(exception);

    response.status(status).json({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }

  private mapPrismaErrorToHttp(exception: Prisma.PrismaClientKnownRequestError): {
    status: number;
    message: string;
  } {
    switch (exception.code) {
      case 'P2000':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'La valeur fournie est trop longue pour le champ',
        };
      
      case 'P2001':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'L\'enregistrement recherché n\'existe pas',
        };
      
      case 'P2002':
        const target = exception.meta?.target as string[];
        const field = target?.[0] || 'champ';
        return {
          status: HttpStatus.CONFLICT,
          message: `Cette valeur existe déjà pour le ${field}`,
        };
      
      case 'P2003':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Cette opération viole une contrainte de clé étrangère',
        };
      
      case 'P2004':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Une contrainte a échoué sur la base de données',
        };
      
      case 'P2005':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'La valeur stockée dans la base de données n\'est pas valide pour le type de champ',
        };
      
      case 'P2006':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'La valeur fournie n\'est pas valide',
        };
      
      case 'P2007':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Erreur de validation des données',
        };
      
      case 'P2008':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Erreur d\'analyse de la requête',
        };
      
      case 'P2009':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Erreur de validation de la requête',
        };
      
      case 'P2010':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Échec de la requête brute',
        };
      
      case 'P2011':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Contrainte de valeur nulle violée',
        };
      
      case 'P2012':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Valeur requise manquante',
        };
      
      case 'P2013':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Argument requis manquant',
        };
      
      case 'P2014':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'La modification viole la relation requise',
        };
      
      case 'P2015':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Un enregistrement lié est introuvable',
        };
      
      case 'P2016':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Erreur d\'interprétation de la requête',
        };
      
      case 'P2017':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Les enregistrements pour la relation ne sont pas connectés',
        };
      
      case 'P2018':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'Les enregistrements connectés requis n\'ont pas été trouvés',
        };
      
      case 'P2019':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Erreur d\'entrée',
        };
      
      case 'P2020':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'La valeur est hors de portée pour le type',
        };
      
      case 'P2021':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'La table n\'existe pas dans la base de données',
        };
      
      case 'P2022':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'La colonne n\'existe pas dans la base de données',
        };
      
      case 'P2023':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Données incohérentes de la colonne',
        };
      
      case 'P2024':
        return {
          status: HttpStatus.REQUEST_TIMEOUT,
          message: 'Délai d\'attente dépassé lors de l\'acquisition d\'une connexion',
        };
      
      case 'P2025':
        return {
          status: HttpStatus.NOT_FOUND,
          message: 'L\'enregistrement à modifier ou supprimer n\'existe pas',
        };
      
      case 'P2026':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Le moteur de base de données actuel ne prend pas en charge cette fonctionnalité',
        };
      
      case 'P2027':
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Plusieurs erreurs se sont produites sur la base de données',
        };
      
      case 'P2028':
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Erreur de l\'API de transaction',
        };
      
      case 'P2030':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Impossible de trouver un index de recherche en texte intégral',
        };
      
      case 'P2031':
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'MongoDB est nécessaire pour cette opération',
        };
      
      case 'P2033':
        return {
          status: HttpStatus.BAD_REQUEST,
          message: 'Un nombre utilisé dans la requête ne tient pas dans un entier 64 bits',
        };
      
      case 'P2034':
        return {
          status: HttpStatus.CONFLICT,
          message: 'La transaction a échoué en raison d\'un conflit d\'écriture ou d\'un blocage',
        };
      
      default:
        return {
          status: HttpStatus.INTERNAL_SERVER_ERROR,
          message: 'Une erreur de base de données s\'est produite',
        };
    }
  }
}