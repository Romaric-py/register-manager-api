import { Test, TestingModule } from '@nestjs/testing';
import { BadRequestException } from '@nestjs/common';
import { RegistrationController } from '../../registration.controller';
import { RegistrationService } from '../../registration.service';
import { CreateRegistrationDto, CreateRegistrationManyForOneDto, CreateRegistrationOneForManyDto } from '../../dto/create-registration.dto';
import { UpdateRegistrationDto } from '../../dto/update-registration.dto';
import { GetRegistrationsDto } from '../../dto/get-registrations.dto';
import { JwtAuthGuard } from '../../../jwt/jwt-auth.guard';
import { RolesGuard } from '../../../auth/guards/roles.guard';

describe('RegistrationController', () => {
  let controller: RegistrationController;
  let service: RegistrationService;

  const mockRegistrationService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
    createManyForOne: jest.fn(),
    createOneForMany: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RegistrationController],
      providers: [
        {
          provide: RegistrationService,
          useValue: mockRegistrationService,
        },
      ],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .overrideGuard(RolesGuard)
      .useValue({ canActivate: jest.fn(() => true) })
      .compile();

    controller = module.get<RegistrationController>(RegistrationController);
    service = module.get<RegistrationService>(RegistrationService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a registration', async () => {
      const createDto: CreateRegistrationDto = {
        userId: 'user-1',
        courseId: 'course-1',
        registrationDate: '2023-01-01T00:00:00.000Z',
      };
      const expectedResult = { id: 'registration-1', ...createDto };

      mockRegistrationService.create.mockResolvedValue(expectedResult);

      const result = await controller.create(createDto);

      expect(service.create).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle service errors', async () => {
      const createDto: CreateRegistrationDto = {
        userId: 'user-1',
        courseId: 'course-1',
        registrationDate: '2023-01-01T00:00:00.000Z',
      };

      mockRegistrationService.create.mockRejectedValue(
        new BadRequestException('User does not exist')
      );

      await expect(controller.create(createDto)).rejects.toThrow(
        new BadRequestException('User does not exist')
      );
    });
  });

  describe('createManyForOne', () => {
    it('should create multiple registrations for one user', async () => {
      const createDto: CreateRegistrationManyForOneDto = {
        userId: 'user-1',
        courseIds: ['course-1', 'course-2'],
        registrationDate: '2023-01-01T00:00:00.000Z',
      };
      const expectedResult = { message: 'Registrations created successfully' };

      mockRegistrationService.createManyForOne.mockResolvedValue(expectedResult);

      const result = await controller.createManyForOne(createDto);

      expect(service.createManyForOne).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle validation errors', async () => {
      const createDto: CreateRegistrationManyForOneDto = {
        userId: '',
        courseIds: ['course-1'],
        registrationDate: '2023-01-01T00:00:00.000Z',
      };

      mockRegistrationService.createManyForOne.mockRejectedValue(
        new BadRequestException('userId is required')
      );

      await expect(controller.createManyForOne(createDto)).rejects.toThrow(
        new BadRequestException('userId is required')
      );
    });
  });

  describe('createOneForMany', () => {
    it('should create registrations for multiple users', async () => {
      const createDto: CreateRegistrationOneForManyDto = {
        userIds: ['user-1', 'user-2'],
        courseId: 'course-1',
        registrationDate: '2023-01-01T00:00:00.000Z',
      };
      const expectedResult = { message: 'Registrations created successfully' };

      mockRegistrationService.createOneForMany.mockResolvedValue(expectedResult);

      const result = await controller.createOneForMany(createDto);

      expect(service.createOneForMany).toHaveBeenCalledWith(createDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle validation errors', async () => {
      const createDto: CreateRegistrationOneForManyDto = {
        userIds: [],
        courseId: 'course-1',
        registrationDate: '2023-01-01T00:00:00.000Z',
      };

      mockRegistrationService.createOneForMany.mockRejectedValue(
        new BadRequestException('userIds must be a non-empty array')
      );

      await expect(controller.createOneForMany(createDto)).rejects.toThrow(
        new BadRequestException('userIds must be a non-empty array')
      );
    });
  });

  describe('findAll', () => {
    it('should return paginated registrations', async () => {
      const query: GetRegistrationsDto = { page: '1', limit: '10' };
      const expectedResult = {
        data: [
          { id: 'reg-1', userId: 'user-1', courseId: 'course-1' },
          { id: 'reg-2', userId: 'user-2', courseId: 'course-2' },
        ],
        totalCount: 2,
        page: 1,
        limit: 10,
        totalPages: 1,
      };

      mockRegistrationService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });

    it('should handle empty query parameters', async () => {
      const query: GetRegistrationsDto = {};
      const expectedResult = {
        data: [],
        totalCount: 0,
        page: 1,
        limit: 10,
        totalPages: 0,
      };

      mockRegistrationService.findAll.mockResolvedValue(expectedResult);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(expectedResult);
    });
  });

  describe('findOne', () => {
    it('should return a single registration', async () => {
      const registrationId = 'registration-1';
      const expectedResult = {
        id: registrationId,
        userId: 'user-1',
        courseId: 'course-1',
      };

      mockRegistrationService.findOne.mockResolvedValue(expectedResult);

      const result = await controller.findOne(registrationId);

      expect(service.findOne).toHaveBeenCalledWith(registrationId);
      expect(result).toEqual(expectedResult);
    });

    it('should handle not found error', async () => {
      const registrationId = 'nonexistent-id';

      mockRegistrationService.findOne.mockRejectedValue(
        new BadRequestException(`Registration with id ${registrationId} does not exist`)
      );

      await expect(controller.findOne(registrationId)).rejects.toThrow(
        new BadRequestException(`Registration with id ${registrationId} does not exist`)
      );
    });
  });

  describe('update', () => {
    it('should update a registration', async () => {
      const registrationId = 'registration-1';
      const updateDto: UpdateRegistrationDto = {
        registrationDate: '2023-01-02T00:00:00.000Z',
      };
      const expectedResult = {
        id: registrationId,
        userId: 'user-1',
        courseId: 'course-1',
        ...updateDto,
      };

      mockRegistrationService.update.mockResolvedValue(expectedResult);

      const result = await controller.update(registrationId, updateDto);

      expect(service.update).toHaveBeenCalledWith(registrationId, updateDto);
      expect(result).toEqual(expectedResult);
    });

    it('should handle update errors', async () => {
      const registrationId = 'nonexistent-id';
      const updateDto: UpdateRegistrationDto = {};

      mockRegistrationService.update.mockRejectedValue(
        new BadRequestException(`Registration with id ${registrationId} does not exist`)
      );

      await expect(controller.update(registrationId, updateDto)).rejects.toThrow(
        new BadRequestException(`Registration with id ${registrationId} does not exist`)
      );
    });
  });

  describe('remove', () => {
    it('should delete a registration', async () => {
      const registrationId = 'registration-1';
      const expectedResult = {
        id: registrationId,
        userId: 'user-1',
        courseId: 'course-1',
      };

      mockRegistrationService.remove.mockResolvedValue(expectedResult);

      const result = await controller.remove(registrationId);

      expect(service.remove).toHaveBeenCalledWith(registrationId);
      expect(result).toEqual(expectedResult);
    });

    it('should handle deletion errors', async () => {
      const registrationId = 'nonexistent-id';

      mockRegistrationService.remove.mockRejectedValue(
        new BadRequestException(`Registration with id ${registrationId} does not exist`)
      );

      await expect(controller.remove(registrationId)).rejects.toThrow(
        new BadRequestException(`Registration with id ${registrationId} does not exist`)
      );
    });
  });
});