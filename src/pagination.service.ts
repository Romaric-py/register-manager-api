import { Injectable, BadRequestException } from '@nestjs/common';

export interface PaginationOptions {
  page?: number;
  limit?: number;
  maxLimit?: number;
  defaultLimit?: number;
}

export interface PaginationResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export interface PaginationParams {
  skip: number;
  take: number;
  page: number;
  limit: number;
}

@Injectable()
export class PaginationService {
  private readonly DEFAULT_LIMIT = 10;
  private readonly MAX_LIMIT = 100;

  /**
   * Valide et normalise les paramètres de pagination
   */
  validateAndNormalize(options: PaginationOptions): PaginationParams {
    const {
      page = 1,
      limit = this.DEFAULT_LIMIT,
      maxLimit = this.MAX_LIMIT,
    } = options;

    // Validation des paramètres
    if (page < 1) {
      throw new BadRequestException(
        'Le numéro de page doit être supérieur à 0',
      );
    }

    if (limit < 1) {
      throw new BadRequestException('La limite doit être supérieure à 0');
    }

    if (limit > maxLimit) {
      throw new BadRequestException(
        `La limite ne peut pas dépasser ${maxLimit}`,
      );
    }

    const normalizedPage = Math.max(1, Math.floor(page));
    const normalizedLimit = Math.min(maxLimit, Math.max(1, Math.floor(limit)));

    return {
      skip: (normalizedPage - 1) * normalizedLimit,
      take: normalizedLimit,
      page: normalizedPage,
      limit: normalizedLimit,
    };
  }

  /**
   * Crée la réponse paginée avec les métadonnées
   */
  createPaginationResult<T>(
    data: T[],
    total: number,
    page: number,
    limit: number,
  ): PaginationResult<T> {
    const totalPages = Math.ceil(total / limit);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  }

  /**
   * Méthode utilitaire pour extraire les paramètres de pagination depuis query params
   */
  extractFromQuery(query: {
    page?: string;
    limit?: string;
  }): PaginationOptions {
    return {
      page: query.page ? parseInt(query.page, 10) : undefined,
      limit: query.limit ? parseInt(query.limit, 10) : undefined,
    };
  }

  /**
   * Génère une clause WHERE pour la recherche sur plusieurs champs
   */
  createSearchCondition(
    search: string | undefined,
    fields: string[],
    additionalConditions: any = {},
  ): any {
    if (!search || !fields.length) {
      return additionalConditions;
    }

    const searchConditions = fields.map((field) => ({
      [field]: { contains: search, mode: 'insensitive' as const },
    }));

    return {
      ...additionalConditions,
      OR: searchConditions,
    };
  }

  /**
   * Méthode tout-en-un pour exécuter une requête paginée avec Prisma
   */
  async paginate<T>(
    findManyFn: (args: {
      where?: any;
      skip: number;
      take: number;
      orderBy?: any;
    }) => Promise<T[]>,
    countFn: (args: { where?: any }) => Promise<number>,
    options: {
      pagination: PaginationOptions;
      search?: string;
      searchFields?: string[];
      where?: any;
      orderBy?: any;
    },
  ): Promise<PaginationResult<T>> {
    const {
      pagination,
      search,
      searchFields = [],
      where = {},
      orderBy,
    } = options;

    // Valider et normaliser la pagination
    const paginationParams = this.validateAndNormalize(pagination);

    // Créer les conditions de recherche
    const searchCondition = this.createSearchCondition(
      search,
      searchFields,
      where,
    );

    // Exécuter les requêtes en parallèle
    const [data, total] = await Promise.all([
      findManyFn({
        where: searchCondition,
        skip: paginationParams.skip,
        take: paginationParams.take,
        orderBy,
      }),
      countFn({ where: searchCondition }),
    ]);

    return this.createPaginationResult(
      data,
      total,
      paginationParams.page,
      paginationParams.limit,
    );
  }
}
