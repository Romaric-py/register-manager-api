import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { PaginationService, PaginationOptions } from '../pagination.service';
import { Role } from '@prisma/client';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(
    private prisma: PrismaService,
    private paginationService: PaginationService,
  ) {}

  async findAll(paginationOptions: PaginationOptions, search?: string) {
    return this.paginationService.paginate(
      (args) =>
        this.prisma.user.findMany({
          ...args,
          select: {
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
      (args) => this.prisma.user.count(args),
      {
        pagination: paginationOptions,
        search,
        searchFields: ['firstName', 'lastName', 'email'],
        where: { role: Role.USER },
        orderBy: { createdAt: 'desc' },
      },
    );
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id, role: Role.USER },
      select: {
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
        registrations: {
          include: {
            formation: true,
          },
        },
      },
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto, updatedBy: string) {
    return this.prisma.user.update({
      where: { id, role: Role.USER },
      data: {
        ...updateUserDto,
        updatedBy,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        isActive: true,
        emailVerified: true,
        updatedAt: true,
      },
    });
  }

  async toggleActive(id: string, updatedBy: string) {
    const user = await this.prisma.user.findUnique({
      where: { id, role: Role.USER },
      select: { isActive: true },
    });

    if (!user) {
      throw new Error('Utilisateur non trouvé');
    }

    return this.prisma.user.update({
      where: { id },
      data: {
        isActive: !user.isActive,
        updatedBy,
        updatedAt: new Date(),
      },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        isActive: true,
        updatedAt: true,
      },
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
}
