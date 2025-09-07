import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaginationService } from '../pagination.service';
import { Prisma, Role } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';
import { GetUsersDto } from './dto/get-users.dto';

const selectUserFields = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  isActive: true,
  emailVerified: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
};

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private paginationService: PaginationService,
  ) {}

  async findAll(filters?: GetUsersDto) {
    const {page, limit, skip} = this.paginationService.calculatePagination({
      page: filters?.page,
      limit: filters?.limit,
    });

    // Construire les conditions WHERE
    const where = this.buildUserFilters(filters || {});

    // Ajouter la recherche textuelle si nécessaire
    if (filters?.search) {
      where.OR = this.buildSearchFilter(filters.search);
    }

    // Construire l'orderBy
    const orderBy = this.buildUserOrderBy(filters || {});

    // Exécuter les requêtes en parallèle
    const [data, totalCount] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: {
          ...selectUserFields,
          registrations: {
            include: {
              formation: {
                select: {
                  title: true,
                },
              },
            },
          },
        },
      }),
      this.prisma.user.count({ where }),
    ]);

    return this.paginationService.paginate({data, totalCount, page, limit});
  }

  async findOne(id: string) {
    const result = await this.prisma.user.findUnique({
      where: { id, role: Role.USER },
      select: {
        ...selectUserFields,
        registrations: {
          include: {
            formation: true,
          },
        },
      },
    });
    if (!result) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    return result;
  }

  // TODO: Validate access rights (admin only/ self)
  async update(id: string, updateUserDto: UpdateUserDto, updatedBy: string) {
    const user = await this.findOne(id);

    // Vérifier si l'email existe déjà (si on change l'email)
    if (updateUserDto.email && updateUserDto.email !== user.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateUserDto.email },
      });

      if (existingUser) {
        throw new BadRequestException(
          'Un utilisateur avec cet email existe déjà',
        );
      }
    }

    return this.prisma.user.update({
      where: { id, role: Role.USER },
      data: {
        ...updateUserDto,
        updatedBy,
        updatedAt: new Date(),
      },
      select: selectUserFields,
    });
  }

  async toggleActive(id: string, updatedBy: string) {
    const user = await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: !user.isActive,
        updatedBy,
        updatedAt: new Date(),
      },
      select: selectUserFields,
    });
  }

  async getUserStats() {
    const [total, active, verified, recentRegistrations] = await Promise.all([
      this.prisma.user.count({ where: { role: Role.USER } }),
      this.prisma.user.count({ where: { role: Role.USER, isActive: true } }),
      this.prisma.user.count({
        where: { role: Role.USER, emailVerified: true },
      }),
      this.prisma.user.count({
        where: {
          role: Role.USER,
          createdAt: {
            gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
          },
        },
      }),
    ]);

    return {
      total,
      active,
      verified,
      recentRegistrations,
    };
  }

  private buildSearchFilter(search: string) {
    return [
      { firstName: { contains: search, mode: 'insensitive' as const } },
      { lastName: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
    ];
  }

  private buildUserOrderBy(filters: GetUsersDto) {
    if (filters.sortBy && filters.sortOrder) {
      return { [filters.sortBy]: filters.sortOrder };
    }
    
    return { createdAt: 'desc' as const };
  }

  private buildUserFilters(filters: GetUsersDto) {
    const where: Prisma.UserWhereInput = { role: Role.USER };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.emailVerified !== undefined) {
      where.emailVerified = filters.emailVerified;
    }

    return where;
  }
}
