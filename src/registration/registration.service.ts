import { BadRequestException, Injectable } from '@nestjs/common';
import {
  CreateRegistrationDto,
  CreateRegistrationOneForManyDto,
  CreateRegistrationManyForOneDto,
} from './dto/create-registration.dto';
import { UpdateRegistrationDto } from './dto/update-registration.dto';
import { PrismaService } from '../prisma.service';
import { GetRegistrationsDto } from './dto/get-registrations.dto';
import { PaginationService } from '../pagination.service';
import { RegistrationStatus } from '@prisma/client';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  async create(createRegistrationDto: CreateRegistrationDto) {
    // Vérifier que l'utilisateur et le cours existent
    const user = await this.prisma.user.findUnique({
      where: { id: createRegistrationDto.userId },
    });
    if (!user) {
      throw new BadRequestException(
        `User with id ${createRegistrationDto.userId} does not exist`,
      );
    }
    const course = await this.prisma.course.findUnique({
      where: { id: createRegistrationDto.courseId },
    });
    if (!course) {
      throw new BadRequestException(
        `Course with id ${createRegistrationDto.courseId} does not exist`,
      );
    }
    // Empêcher les doublons (un utilisateur ne peut s'inscrire qu'une fois au même cours)
    const existingRegistration = await this.prisma.registration.findFirst({
      where: {
        userId: createRegistrationDto.userId,
        courseId: createRegistrationDto.courseId,
      },
    });
    if (existingRegistration) {
      throw new BadRequestException(
        `User with id ${createRegistrationDto.userId} is already registered for course with id ${createRegistrationDto.courseId}`,
      );
    }

    // Créer l'inscription
    const registration = await this.prisma.registration.create({
      data: {
        ...createRegistrationDto,
        totalAmount: course.price,
        remainingAmount: course.price, // Par défaut, le montant payé est le prix du cours
        paidAmount: 0, // Par défaut, le montant payé est 0
        status: course.price ? RegistrationStatus.PENDING : RegistrationStatus.COMPLETED, // Si le cours est gratuit, marquer comme payé
      },
    });
    return registration;
  }

  async findAll(query: GetRegistrationsDto) {
    const { page, limit, skip } = this.paginationService.calculatePagination({
      page: query?.page,
      limit: query?.limit,
    });

    const [data, totalCount] = await Promise.all([
      this.prisma.registration.findMany({
        skip,
        take: limit,
      }),
      this.prisma.registration.count(),
    ]);

    return this.paginationService.paginate({ data, totalCount, page, limit });
  }

  async findUserRegistrations(query: GetRegistrationsDto, userId: string) {
    const { page, limit, skip } = this.paginationService.calculatePagination({
      page: query?.page,
      limit: query?.limit,
    });

    const [data, totalCount] = await Promise.all([
      this.prisma.registration.findMany({
        where: { userId },
        skip,
        take: limit,
        include: { course: true },
      }),
      this.prisma.registration.count(),
    ]);

    return this.paginationService.paginate({ data, totalCount, page, limit });
  }

  async findOne(id: string) {
    const result = await this.prisma.registration.findUnique({
      where: { id },
    });
    if (!result) {
      throw new BadRequestException(
        `Registration with id ${id} does not exist`,
      );
    }
    return result;
  }

  async update(id: string, updateRegistrationDto: UpdateRegistrationDto) {
    // Vérifier que l'inscription existe avant de la mettre à jour
    const existingRegistration = await this.prisma.registration.findUnique({
      where: { id },
    });
    if (!existingRegistration) {
      throw new BadRequestException(
        `Registration with id ${id} does not exist`,
      );
    }

    return this.prisma.registration.update({
      where: { id },
      data: updateRegistrationDto,
    });
  }

  async remove(id: string) {
    // Vérifier que l'inscription existe avant de la supprimer
    const existingRegistration = await this.prisma.registration.findUnique({
      where: { id },
    });
    if (!existingRegistration) {
      throw new BadRequestException(
        `Registration with id ${id} does not exist`,
      );
    }

    return this.prisma.registration.delete({
      where: { id },
    });
  }

  /**
   * Inscrire un utilisateur à plusieurs cours
   */
  async createManyForOne(
    createRegistrationsDto: CreateRegistrationManyForOneDto,
  ) {
    // Validations
    const userId = createRegistrationsDto.userId;
    if (!userId) {
      throw new BadRequestException('userId is required');
    }
    if (
      !createRegistrationsDto.courseIds ||
      createRegistrationsDto.courseIds.length === 0
    ) {
      throw new BadRequestException('courseIds must be a non-empty array');
    }
    // Validation in the database
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException(`User with id ${userId} does not exist`);
    }
    const courses = await this.prisma.course.findMany({
      where: { id: { in: createRegistrationsDto.courseIds } },
    });
    if (courses.length !== createRegistrationsDto.courseIds.length) {
      const foundCourseIds = courses.map((course) => course.id);
      const missingCourseIds = createRegistrationsDto.courseIds.filter(
        (id) => !foundCourseIds.includes(id),
      );
      throw new BadRequestException(
        `Courses with ids ${missingCourseIds.join(', ')} do not exist`,
      );
    }

    // Create registrations
    const registrations = createRegistrationsDto.courseIds.map((courseId) => ({
      userId,
      courseId,
    }));

    await this.prisma.registration.createMany({
      data: registrations,
      skipDuplicates: true, // Pour éviter les doublons si la même inscription existe déjà
    });

    return { message: 'Registrations created successfully' };
  }

  /**
   * Inscrire plusieurs utilisateurs à un cours
   */
  async createOneForMany(
    createRegistrationDtos: CreateRegistrationOneForManyDto,
  ) {
    // Validations
    const courseId = createRegistrationDtos.courseId;
    if (!courseId) {
      throw new BadRequestException('courseId is required');
    }
    if (
      !createRegistrationDtos.userIds ||
      createRegistrationDtos.userIds.length === 0
    ) {
      throw new BadRequestException('userIds must be a non-empty array');
    }
    // Validation in the database
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course) {
      throw new BadRequestException(
        `Course with id ${courseId} does not exist`,
      );
    }
    const users = await this.prisma.user.findMany({
      where: { id: { in: createRegistrationDtos.userIds } },
    });
    if (users.length !== createRegistrationDtos.userIds.length) {
      const foundUserIds = users.map((user) => user.id);
      const missingUserIds = createRegistrationDtos.userIds.filter(
        (id) => !foundUserIds.includes(id),
      );
      throw new BadRequestException(
        `Users with ids ${missingUserIds.join(', ')} do not exist`,
      );
    }

    // Create registrations
    const registrations = createRegistrationDtos.userIds.map((userId) => ({
      userId,
      courseId,
    }));

    await this.prisma.registration.createMany({
      data: registrations,
      skipDuplicates: true, // Pour éviter les doublons si la même inscription existe déjà
    });

    return { message: 'Registrations created successfully' };
  }
}
