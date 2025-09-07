import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaginationService } from '../pagination.service';
import { Prisma, Role } from '@prisma/client';
import { CreateAdminDto } from './dto/create-admin.dto';
import { UpdateAdminDto } from './dto/update-admin.dto';
import { GetAdminsDto } from './dto/get-admins.dto';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

const selectAdminFields = {
  id: true,
  firstName: true,
  lastName: true,
  email: true,
  role: true,
  isActive: true,
  emailVerified: true,
  lastLogin: true,
  createdAt: true,
  updatedAt: true,
  createdBy: true,
};

@Injectable()
export class AdminService {
  constructor(
    private prisma: PrismaService,
    private paginationService: PaginationService,
    private mailService: MailService,
  ) {}

  async findAll(filters?: GetAdminsDto): Promise<any> {
    const { page, limit, skip } = this.paginationService.calculatePagination({
      page: filters?.page,
      limit: filters?.limit,
    });

    // Construire les conditions WHERE
    const where = this.buildAdminFilters(filters || {});

    // Ajouter la recherche textuelle si nécessaire
    if (filters?.search) {
      where.OR = this.buildSearchFilter(filters.search);
    }

    // Construire l'orderBy
    const orderBy = this.buildAdminOrderBy(filters || {});

    // Exécuter les requêtes en parallèle
    const [data, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: selectAdminFields,
      }),
      this.prisma.user.count({ where }),
    ]);

    return this.paginationService.paginate({ data, totalCount: total, page, limit });
  }

  async findOne(id: string) {
    const result = await this.prisma.user.findUnique({
      where: {
        id,
        role: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
      },
      select: selectAdminFields,
    });
    if (!result) {
      throw new NotFoundException('Administrateur non trouvé');
    }
    return result;
  }

  async create(createAdminDto: CreateAdminDto, createdBy: string) {
    // Vérifier si l'email existe déjà
    const existingUser = await this.prisma.user.findUnique({
      where: { email: createAdminDto.email },
    });

    if (existingUser) {
      throw new BadRequestException(
        'Un utilisateur avec cet email existe déjà',
      );
    }

    // Générer un mot de passe temporaire
    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Générer un token de vérification d'email
    const emailVerificationToken = uuidv4();
    const emailVerificationTokenExpiry = new Date(
      Date.now() + 24 * 60 * 60 * 1000,
    ); // 24h

    const admin = await this.prisma.user.create({
      data: {
        ...createAdminDto,
        password: hashedPassword,
        role: createAdminDto.role ?? Role.ADMIN,
        emailVerificationToken,
        emailVerificationTokenExpiry,
        lastEmailVerificationIssue: new Date(),
        createdBy,
      },
      select: selectAdminFields,
    });

    // Envoyer l'email de bienvenue avec le mot de passe temporaire
    await this.mailService.sendAdminWelcomeEmail(
      admin.email,
      admin.firstName,
      tempPassword,
      emailVerificationToken,
    );

    return admin;
  }

  async update(id: string, updateAdminDto: UpdateAdminDto, updatedBy: string) {
    const admin = await this.findOne(id);
    if (!admin) {
      throw new NotFoundException('Administrateur non trouvé');
    }

    // Vérifier si l'email existe déjà (si on change l'email)
    if (updateAdminDto.email && updateAdminDto.email !== admin.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: updateAdminDto.email },
      });

      if (existingUser) {
        throw new BadRequestException(
          'Un utilisateur avec cet email existe déjà',
        );
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        ...updateAdminDto,
        updatedBy,
        updatedAt: new Date(),
      },
      select: selectAdminFields,
    });
  }

  async toggleActive(id: string, updatedBy: string) {
    const admin = await this.findOne(id);
    if (!admin) {
      throw new NotFoundException('Administrateur non trouvé');
    }

    // Empêcher la désactivation du dernier super admin
    if (admin.role === Role.SUPER_ADMIN && admin.isActive) {
      const activeSuperAdmins = await this.prisma.user.count({
        where: {
          role: Role.SUPER_ADMIN,
          isActive: true,
        },
      });

      if (activeSuperAdmins <= 1) {
        throw new BadRequestException(
          'Impossible de désactiver le dernier super administrateur',
        );
      }
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: !admin.isActive,
        updatedBy,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        role: true,
        isActive: true,
        updatedAt: true,
      },
    });
  }

  async delete(id: string) {
    const admin = await this.findOne(id);
    if (!admin) {
      throw new NotFoundException('Administrateur non trouvé');
    }

    // Empêcher la suppression du dernier super admin
    if (admin.role === Role.SUPER_ADMIN) {
      const superAdminsCount = await this.prisma.user.count({
        where: { role: Role.SUPER_ADMIN },
      });

      if (superAdminsCount <= 1) {
        throw new BadRequestException(
          'Impossible de supprimer le dernier super administrateur',
        );
      }
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Administrateur supprimé avec succès' };
  }

  async getAdminStats() {
    const [totalAdmins, activeAdmins, superAdmins, recentAdmins] =
      await Promise.all([
        this.prisma.user.count({
          where: { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } },
        }),
        this.prisma.user.count({
          where: {
            role: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
            isActive: true,
          },
        }),
        this.prisma.user.count({ where: { role: Role.SUPER_ADMIN } }),
        this.prisma.user.count({
          where: {
            role: { in: [Role.ADMIN, Role.SUPER_ADMIN] },
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
            },
          },
        }),
      ]);

    return {
      totalAdmins,
      activeAdmins,
      superAdmins,
      recentAdmins,
    };
  }

  private generateTempPassword(): string {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    let result = '';
    for (let i = 0; i < 12; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  async resetAdminPassword(id: string, updatedBy: string) {
    const admin = await this.findOne(id);
    if (!admin) {
      throw new NotFoundException('Administrateur non trouvé');
    }

    const tempPassword = this.generateTempPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    await this.prisma.user.update({
      where: { id },
      data: {
        password: hashedPassword,
        updatedBy,
        updatedAt: new Date(),
      },
    });

    // Envoyer le nouveau mot de passe par email
    await this.mailService.sendPasswordResetEmail(
      admin.email,
      admin.firstName,
      tempPassword,
    );

    return { message: 'Mot de passe réinitialisé et envoyé par email' };
  }

  private buildSearchFilter(search: string) {
    return [
      { firstName: { contains: search, mode: 'insensitive' as const } },
      { lastName: { contains: search, mode: 'insensitive' as const } },
      { email: { contains: search, mode: 'insensitive' as const } },
    ];
  }

  private buildAdminOrderBy(filters: GetAdminsDto) {
    if (filters.sortBy && filters.sortOrder) {
      return { [filters.sortBy]: filters.sortOrder };
    }
    
    return { createdAt: 'desc' as const };
  }

  private buildAdminFilters(filters: GetAdminsDto) {
    const where: Prisma.UserWhereInput = { role: { in: [Role.ADMIN, Role.SUPER_ADMIN] } };

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.emailVerified !== undefined) {
      where.emailVerified = filters.emailVerified;
    }

    if (filters.role) {
      where.role = filters.role;
    }

    return where;
  }
}
