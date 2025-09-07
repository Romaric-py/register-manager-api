import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RegistrationService } from '../../registration.service';
import { PrismaService } from '../../../prisma.service';
import { PaginationService } from '../../../pagination.service';
import { CreateRegistrationDto, CreateRegistrationManyForOneDto, CreateRegistrationOneForManyDto } from '../../dto/create-registration.dto';
import { UpdateRegistrationDto } from '../../dto/update-registration.dto';
import { GetRegistrationsDto } from '../../dto/get-registrations.dto';
import { RegistrationStatus, PaymentStatus } from '@prisma/client';

describe('RegistrationService', () => {
  let service: RegistrationService;
  let prisma: PrismaService;
  let paginationService: PaginationService;

  const mockPrismaService = {
    registration: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      createMany: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    course: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };

  const mockPaginationService = {
    calculatePagination: jest.fn(),
    paginate: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RegistrationService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: PaginationService,
          useValue: mockPaginationService,
        },
      ],
    }).compile();

    service = module.get<RegistrationService>(RegistrationService);
    prisma = module.get<PrismaService>(PrismaService);
    paginationService = module.get<PaginationService>(PaginationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a registration successfully', async () => {
      const createDto: CreateRegistrationDto = {
        userId: 'user-1',
        courseId: 'course-1',
        registrationDate: '2023-01-01T00:00:00.000Z',
      };

      const expectedResult = {
        id: 'registration-1',
        ...createDto,
        status: RegistrationStatus.PENDING,
        paymentStatus: PaymentStatus.PENDING,
        paidAmount: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrismaService.registration.create.mockResolvedValue(expectedResult);

      const result = await service.create(createDto);

      expect(prisma.registration.create).toHaveBeenCalledWith({
        data: createDto,
      });
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findAll', () => {
    it('should return paginated registrations', async () => {
      const query: GetRegistrationsDto = { page: '1', limit: '10' };
      const mockPagination = { page: 1, limit: 10, skip: 0 };
      const mockRegistrations = [
        { id: 'reg-1', userId: 'user-1', courseId: 'course-1' },
        { id: 'reg-2', userId: 'user-2', courseId: 'course-2' },
      ];
      const mockCount = 2;
      const mockPaginatedResult = {
        data: mockRegistrations,
        totalCount: mockCount,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockPaginationService.calculatePagination.mockReturnValue(mockPagination);
      mockPrismaService.registration.findMany.mockResolvedValue(mockRegistrations);
      mockPrismaService.registration.count.mockResolvedValue(mockCount);
      mockPaginationService.paginate.mockReturnValue(mockPaginatedResult);

      const result = await service.findAll(query);

      expect(paginationService.calculatePagination).toHaveBeenCalledWith({
        page: query.page,
        limit: query.limit,
      });
      expect(prisma.registration.findMany).toHaveBeenCalledWith({
        skip: 0,
        take: 10,
      });
      expect(prisma.registration.count).toHaveBeenCalled();
      expect(paginationService.paginate).toHaveBeenCalledWith({
        data: mockRegistrations,
        totalCount: mockCount,
        page: 1,
        limit: 10,
      });
      expect(result).toEqual(mockPaginatedResult);
    });
  });

  describe('findOne', () => {
    it('should return a registration when found', async () => {
      const registrationId = 'registration-1';
      const mockRegistration = {
        id: registrationId,
        userId: 'user-1',
        courseId: 'course-1',
      };

      mockPrismaService.registration.findUnique.mockResolvedValue(mockRegistration);

      const result = await service.findOne(registrationId);

      expect(prisma.registration.findUnique).toHaveBeenCalledWith({
        where: { id: registrationId },
      });
      expect(result).toEqual(mockRegistration);
    });

    it('should throw BadRequestException when registration not found', async () => {
      const registrationId = 'nonexistent-id';

      mockPrismaService.registration.findUnique.mockResolvedValue(null);

      await expect(service.findOne(registrationId)).rejects.toThrow(
        new BadRequestException(`Registration with id ${registrationId} does not exist`)
      );
    });
  });

  describe('update', () => {
    it('should update a registration successfully', async () => {
      const registrationId = 'registration-1';
      const updateDto: UpdateRegistrationDto = {
        registrationDate: '2023-01-02T00:00:00.000Z',
      };
      const existingRegistration = { id: registrationId, userId: 'user-1' };
      const updatedRegistration = { ...existingRegistration, ...updateDto };

      mockPrismaService.registration.findUnique.mockResolvedValue(existingRegistration);
      mockPrismaService.registration.update.mockResolvedValue(updatedRegistration);

      const result = await service.update(registrationId, updateDto);

      expect(prisma.registration.findUnique).toHaveBeenCalledWith({
        where: { id: registrationId },
      });
      expect(prisma.registration.update).toHaveBeenCalledWith({
        where: { id: registrationId },
        data: updateDto,
      });
      expect(result).toEqual(updatedRegistration);
    });

    it('should throw BadRequestException when registration not found for update', async () => {
      const registrationId = 'nonexistent-id';
      const updateDto: UpdateRegistrationDto = {};

      mockPrismaService.registration.findUnique.mockResolvedValue(null);

      await expect(service.update(registrationId, updateDto)).rejects.toThrow(
        new BadRequestException(`Registration with id ${registrationId} does not exist`)
      );
    });
  });

  describe('remove', () => {
    it('should delete a registration successfully', async () => {
      const registrationId = 'registration-1';
      const existingRegistration = { id: registrationId, userId: 'user-1' };

      mockPrismaService.registration.findUnique.mockResolvedValue(existingRegistration);
      mockPrismaService.registration.delete.mockResolvedValue(existingRegistration);

      const result = await service.remove(registrationId);

      expect(prisma.registration.findUnique).toHaveBeenCalledWith({
        where: { id: registrationId },
      });
      expect(prisma.registration.delete).toHaveBeenCalledWith({
        where: { id: registrationId },
      });
      expect(result).toEqual(existingRegistration);
    });

    it('should throw BadRequestException when registration not found for deletion', async () => {
      const registrationId = 'nonexistent-id';

      mockPrismaService.registration.findUnique.mockResolvedValue(null);

      await expect(service.remove(registrationId)).rejects.toThrow(
        new BadRequestException(`Registration with id ${registrationId} does not exist`)
      );
    });
  });

  describe('createManyForOne', () => {
    it('should create multiple registrations for one user successfully', async () => {
      const createDto: CreateRegistrationManyForOneDto = {
        userId: 'user-1',
        courseIds: ['course-1', 'course-2'],
        registrationDate: '2023-01-01T00:00:00.000Z',
      };

      const mockUser = { id: 'user-1', firstName: 'John', lastName: 'Doe' };
      const mockCourses = [
        { id: 'course-1', title: 'Course 1' },
        { id: 'course-2', title: 'Course 2' },
      ];

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.course.findMany.mockResolvedValue(mockCourses);
      mockPrismaService.registration.createMany.mockResolvedValue({ count: 2 });

      const result = await service.createManyForOne(createDto);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.userId },
      });
      expect(prisma.course.findMany).toHaveBeenCalledWith({
        where: { id: { in: createDto.courseIds } },
      });
      expect(prisma.registration.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: createDto.userId,
            courseId: 'course-1',
            registrationDate: createDto.registrationDate,
          }),
          expect.objectContaining({
            userId: createDto.userId,
            courseId: 'course-2',
            registrationDate: createDto.registrationDate,
          }),
        ]),
        skipDuplicates: true,
      });
      expect(result).toEqual({ message: 'Registrations created successfully' });
    });

    it('should throw BadRequestException when userId is missing', async () => {
      const createDto: CreateRegistrationManyForOneDto = {
        userId: '',
        courseIds: ['course-1'],
        registrationDate: '2023-01-01T00:00:00.000Z',
      };

      await expect(service.createManyForOne(createDto)).rejects.toThrow(
        new BadRequestException('userId is required')
      );
    });

    it('should throw BadRequestException when courseIds is empty', async () => {
      const createDto: CreateRegistrationManyForOneDto = {
        userId: 'user-1',
        courseIds: [],
        registrationDate: '2023-01-01T00:00:00.000Z',
      };

      await expect(service.createManyForOne(createDto)).rejects.toThrow(
        new BadRequestException('courseIds must be a non-empty array')
      );
    });

    it('should throw BadRequestException when user does not exist', async () => {
      const createDto: CreateRegistrationManyForOneDto = {
        userId: 'nonexistent-user',
        courseIds: ['course-1'],
        registrationDate: '2023-01-01T00:00:00.000Z',
      };

      mockPrismaService.user.findUnique.mockResolvedValue(null);

      await expect(service.createManyForOne(createDto)).rejects.toThrow(
        new BadRequestException(`User with id ${createDto.userId} does not exist`)
      );
    });

    it('should throw BadRequestException when some courses do not exist', async () => {
      const createDto: CreateRegistrationManyForOneDto = {
        userId: 'user-1',
        courseIds: ['course-1', 'course-2', 'course-3'],
        registrationDate: '2023-01-01T00:00:00.000Z',
      };

      const mockUser = { id: 'user-1', firstName: 'John' };
      const mockCourses = [{ id: 'course-1', title: 'Course 1' }]; // Only one course found

      mockPrismaService.user.findUnique.mockResolvedValue(mockUser);
      mockPrismaService.course.findMany.mockResolvedValue(mockCourses);

      await expect(service.createManyForOne(createDto)).rejects.toThrow(
        new BadRequestException('Courses with ids course-2, course-3 do not exist')
      );
    });
  });

  describe('createOneForMany', () => {
    it('should create registrations for multiple users successfully', async () => {
      const createDto: CreateRegistrationOneForManyDto = {
        userIds: ['user-1', 'user-2'],
        courseId: 'course-1',
        registrationDate: '2023-01-01T00:00:00.000Z',
      };

      const mockCourse = { id: 'course-1', title: 'Course 1' };
      const mockUsers = [
        { id: 'user-1', firstName: 'John' },
        { id: 'user-2', firstName: 'Jane' },
      ];

      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.registration.createMany.mockResolvedValue({ count: 2 });

      const result = await service.createOneForMany(createDto);

      expect(prisma.course.findUnique).toHaveBeenCalledWith({
        where: { id: createDto.courseId },
      });
      expect(prisma.user.findMany).toHaveBeenCalledWith({
        where: { id: { in: createDto.userIds } },
      });
      expect(prisma.registration.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-1',
            courseId: createDto.courseId,
            registrationDate: createDto.registrationDate,
          }),
          expect.objectContaining({
            userId: 'user-2',
            courseId: createDto.courseId,
            registrationDate: createDto.registrationDate,
          }),
        ]),
        skipDuplicates: true,
      });
      expect(result).toEqual({ message: 'Registrations created successfully' });
    });

    it('should throw BadRequestException when courseId is missing', async () => {
      const createDto: CreateRegistrationOneForManyDto = {
        userIds: ['user-1'],
        courseId: '',
        registrationDate: '2023-01-01T00:00:00.000Z',
      };

      await expect(service.createOneForMany(createDto)).rejects.toThrow(
        new BadRequestException('courseId is required')
      );
    });

    it('should throw BadRequestException when userIds is empty', async () => {
      const createDto: CreateRegistrationOneForManyDto = {
        userIds: [],
        courseId: 'course-1',
        registrationDate: '2023-01-01T00:00:00.000Z',
      };

      await expect(service.createOneForMany(createDto)).rejects.toThrow(
        new BadRequestException('userIds must be a non-empty array')
      );
    });

    it('should throw BadRequestException when course does not exist', async () => {
      const createDto: CreateRegistrationOneForManyDto = {
        userIds: ['user-1'],
        courseId: 'nonexistent-course',
        registrationDate: '2023-01-01T00:00:00.000Z',
      };

      mockPrismaService.course.findUnique.mockResolvedValue(null);

      await expect(service.createOneForMany(createDto)).rejects.toThrow(
        new BadRequestException(`Course with id ${createDto.courseId} does not exist`)
      );
    });

    it('should throw BadRequestException when some users do not exist', async () => {
      const createDto: CreateRegistrationOneForManyDto = {
        userIds: ['user-1', 'user-2', 'user-3'],
        courseId: 'course-1',
        registrationDate: '2023-01-01T00:00:00.000Z',
      };

      const mockCourse = { id: 'course-1', title: 'Course 1' };
      const mockUsers = [{ id: 'user-1', firstName: 'John' }]; // Only one user found

      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);

      await expect(service.createOneForMany(createDto)).rejects.toThrow(
        new BadRequestException('Users with ids user-2, user-3 do not exist')
      );
    });

    it('should use current date when registrationDate is not provided', async () => {
      const createDto: CreateRegistrationOneForManyDto = {
        userIds: ['user-1'],
        courseId: 'course-1',
      };

      const mockCourse = { id: 'course-1', title: 'Course 1' };
      const mockUsers = [{ id: 'user-1', firstName: 'John' }];

      mockPrismaService.course.findUnique.mockResolvedValue(mockCourse);
      mockPrismaService.user.findMany.mockResolvedValue(mockUsers);
      mockPrismaService.registration.createMany.mockResolvedValue({ count: 1 });

      await service.createOneForMany(createDto);

      expect(prisma.registration.createMany).toHaveBeenCalledWith({
        data: expect.arrayContaining([
          expect.objectContaining({
            userId: 'user-1',
            courseId: 'course-1',
            registrationDate: expect.any(String),
          }),
        ]),
        skipDuplicates: true,
      });
    });
  });
});