import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class PrismaErrorHandler {
  private readonly logger = new Logger(PrismaErrorHandler.name);

  /**
   * Wrapper pour exécuter des opérations Prisma avec gestion d'erreur
   * Les erreurs Prisma seront automatiquement interceptées par les filtres globaux
   */
  async execute<T>(
    operation: () => Promise<T>,
    context?: string,
  ): Promise<T> {
    try {
      return await operation();
    } catch (error) {
      // Log le contexte pour debugging
      if (context) {
        this.logger.error(`Error in ${context}:`, error);
      }
      
      // Re-throw l'erreur pour que les filtres globaux la gèrent
      throw error;
    }
  }

  /**
   * Wrapper spécialisé pour les opérations qui peuvent retourner null
   * Transforme automatiquement null en NotFoundException
   */
  async executeWithNotFound<T>(
    operation: () => Promise<T | null>,
    notFoundMessage: string,
    context?: string,
  ): Promise<T> {
    const result = await this.execute(operation, context);
    
    if (result === null) {
      const { NotFoundException } = await import('@nestjs/common');
      throw new NotFoundException(notFoundMessage);
    }
    
    return result;
  }
}