import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { CreateCourseDto } from './dto/create-course.dto';
import { UpdateCourseDto } from './dto/update-course.dto';
import { GetCoursesDto } from './dto/get-courses.dto';
import { PrismaService } from '../prisma.service';
import { PaginationService } from '../pagination.service';

const selectCourseFields = {
  id: true,
  title: true,
  description: true,
  price: true,
  startDate: true,
  endDate: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

@Injectable()
export class CourseService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly paginationService: PaginationService,
  ) {}

  async findMany(filters?: GetCoursesDto) {
    const {page, limit, skip} = this.paginationService.calculatePagination({
      page: filters?.page,
      limit: filters?.limit,
    });

    // Construire les conditions WHERE
    const where = this.buildCourseFilters(filters || {});

    // Ajouter la recherche textuelle si nécessaire
    if (filters?.search) {
      where.OR = this.buildSearchFilter(filters.search);
    }

    // Construire l'orderBy
    const orderBy = this.buildCourseOrderBy(filters || {});

    // Exécuter les requêtes en parallèle
    const [data, totalCount] = await Promise.all([
      this.prisma.course.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        select: selectCourseFields,
      }),
      this.prisma.course.count({ where }),
    ]);

    return this.paginationService.paginate({data, totalCount, page, limit});
  }

  async findOne(id: string) {
    const result = await this.prisma.course.findUnique({
      where: { id },
      select: {
        ...selectCourseFields,
        registrations: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });
    if (!result) {
      throw new NotFoundException('Cours non trouvé');
    }
    return result;
  }

  async create(createCourseDto: CreateCourseDto, createdBy?: string) {
    // Vérifier si un cours avec le même titre existe déjà
    const existingCourse = await this.prisma.course.findFirst({
      where: { title: createCourseDto.title },
    });

    if (existingCourse) {
      throw new BadRequestException('Un cours avec ce titre existe déjà');
    }

    return this.prisma.course.create({
      data: createCourseDto,
      select: selectCourseFields,
    });
  }

  async update(id: string, updateCourseDto: UpdateCourseDto, updatedBy?: string) {
    const course = await this.prisma.course.findUnique({ where: { id } });
    if (!course) {
      throw new NotFoundException('Cours non trouvé');
    }

    // Vérifier si le titre existe déjà (si on change le titre)
    if (updateCourseDto.title && updateCourseDto.title !== course.title) {
      const existingCourse = await this.prisma.course.findFirst({
        where: { title: updateCourseDto.title, id: { not: id } },
      });

      if (existingCourse) {
        throw new BadRequestException('Un cours avec ce titre existe déjà');
      }
    }

    return this.prisma.course.update({
      where: { id },
      data: {
        ...updateCourseDto,
        updatedAt: new Date(),
      },
      select: selectCourseFields,
    });
  }

  async toggleActive(id: string, updatedBy?: string) {
    const course = await this.findOne(id);
    if (!course) {
      throw new NotFoundException('Cours non trouvé');
    }

    return this.prisma.course.update({
      where: { id },
      data: {
        isActive: !course.isActive,
      },
      select: selectCourseFields,
    });
  }

  async remove(id: string) {
    const course = await this.findOne(id);
    if (!course) {
      throw new NotFoundException('Cours non trouvé');
    }

    // Vérifier s'il y a des inscriptions actives
    const activeRegistrations = await this.prisma.registration.count({
      where: { formationId: id, status: 'CONFIRMED' },
    });

    if (activeRegistrations > 0) {
      throw new BadRequestException(
        'Impossible de supprimer un cours avec des inscriptions confirmées',
      );
    }

    await this.prisma.course.delete({ where: { id } });
    return { message: 'Cours supprimé avec succès' };
  }

  async getCourseStats() {
    const [totalCourses, activeCourses, upcomingCourses, recentCourses] =
      await Promise.all([
        this.prisma.course.count(),
        this.prisma.course.count({ where: { isActive: true } }),
        this.prisma.course.count({
          where: { startDate: { gte: new Date() } },
        }),
        this.prisma.course.count({
          where: {
            createdAt: {
              gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 derniers jours
            },
          },
        }),
      ]);

    return {
      totalCourses,
      activeCourses,
      upcomingCourses,
      recentCourses,
    };
  }

  private buildSearchFilter(search: string) {
    return [
      { title: { contains: search, mode: 'insensitive' as const } },
      { description: { contains: search, mode: 'insensitive' as const } },
    ];
  }

  private buildCourseOrderBy(filters: GetCoursesDto) {
    if (filters.sortBy && filters.sortOrder) {
      return { [filters.sortBy]: filters.sortOrder };
    }
    
    return { createdAt: 'desc' as const };
  }

  private buildCourseFilters(filters: GetCoursesDto) {
    const where: any = {};

    if (filters.isActive !== undefined) {
      where.isActive = filters.isActive;
    }

    if (filters.minPrice !== undefined) {
      where.price = { ...where.price, gte: filters.minPrice };
    }

    if (filters.maxPrice !== undefined) {
      where.price = { ...where.price, lte: filters.maxPrice };
    }

    if (filters.startDateBefore) {
      where.startDate = { ...where.startDate, lte: new Date(filters.startDateBefore) };
    }

    if (filters.startDateAfter) {
      where.startDate = { ...where.startDate, gte: new Date(filters.startDateAfter) };
    }

    if (filters.endDateBefore) {
      where.endDate = { ...where.endDate, lte: new Date(filters.endDateBefore) };
    }

    if (filters.endDateAfter) {
      where.endDate = { ...where.endDate, gte: new Date(filters.endDateAfter) };
    }

    return where;
  }
}
