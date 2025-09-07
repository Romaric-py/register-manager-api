import { Injectable } from '@nestjs/common';

interface PaginatedResponseOptions<T> {
  data: T[];
  totalCount: number;
  page: number;
  limit: number;
}

@Injectable()
export class PaginationService {
  calculatePagination(query: { page?: string; limit?: string }) {
    const { page = '1', limit = '10' } = query || {};
    let parsedPage = parseInt(page, 10) || 1;
    let parsedLimit = parseInt(limit, 10) || 10;
    // Minimum limit of 1 for page or limit
    parsedPage = Math.max(1, parsedPage);
    parsedLimit = Math.max(1, parsedLimit);
    const skip = (parsedPage - 1) * parsedLimit;

    return { page: parsedPage, limit: parsedLimit, skip };
  }

  paginate<T>({
    data,
    totalCount,
    page,
    limit,
  }: PaginatedResponseOptions<T>) {
    return {
      data,
      pagination: {
        total: totalCount,
        page,
        limit,
        totalPages: Math.ceil(totalCount / limit),
      },
    };
  }
}