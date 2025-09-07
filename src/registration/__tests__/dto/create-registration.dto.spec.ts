import { validate } from 'class-validator';
import { plainToClass } from 'class-transformer';
import { CreateRegistrationDto, CreateRegistrationManyForOneDto, CreateRegistrationOneForManyDto } from '../../dto/create-registration.dto';

describe('Registration DTOs', () => {
  describe('CreateRegistrationDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToClass(CreateRegistrationDto, {
        userId: 'user-123',
        courseId: 'course-456',
        registrationDate: '2023-01-01T00:00:00.000Z',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when userId is empty', async () => {
      const dto = plainToClass(CreateRegistrationDto, {
        userId: '',
        courseId: 'course-456',
        registrationDate: '2023-01-01T00:00:00.000Z',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userId');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when courseId is missing', async () => {
      const dto = plainToClass(CreateRegistrationDto, {
        userId: 'user-123',
        registrationDate: '2023-01-01T00:00:00.000Z',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('courseId');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when registrationDate is not a valid date string', async () => {
      const dto = plainToClass(CreateRegistrationDto, {
        userId: 'user-123',
        courseId: 'course-456',
        registrationDate: 'invalid-date',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('registrationDate');
      expect(errors[0].constraints).toHaveProperty('isDateString');
    });

    it('should fail validation when userId is not a string', async () => {
      const dto = plainToClass(CreateRegistrationDto, {
        userId: 123,
        courseId: 'course-456',
        registrationDate: '2023-01-01T00:00:00.000Z',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userId');
      expect(errors[0].constraints).toHaveProperty('isString');
    });
  });

  describe('CreateRegistrationManyForOneDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToClass(CreateRegistrationManyForOneDto, {
        userId: 'user-123',
        courseIds: ['course-456', 'course-789'],
        registrationDate: '2023-01-01T00:00:00.000Z',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when userId is empty', async () => {
      const dto = plainToClass(CreateRegistrationManyForOneDto, {
        userId: '',
        courseIds: ['course-456'],
        registrationDate: '2023-01-01T00:00:00.000Z',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userId');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when courseIds is empty array', async () => {
      const dto = plainToClass(CreateRegistrationManyForOneDto, {
        userId: 'user-123',
        courseIds: [],
        registrationDate: '2023-01-01T00:00:00.000Z',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('courseIds');
      expect(errors[0].constraints).toHaveProperty('arrayNotEmpty');
    });

    it('should fail validation when courseIds contains non-string values', async () => {
      const dto = plainToClass(CreateRegistrationManyForOneDto, {
        userId: 'user-123',
        courseIds: ['course-456', 123, null],
        registrationDate: '2023-01-01T00:00:00.000Z',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('courseIds');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when courseIds contains empty strings', async () => {
      const dto = plainToClass(CreateRegistrationManyForOneDto, {
        userId: 'user-123',
        courseIds: ['course-456', ''],
        registrationDate: '2023-01-01T00:00:00.000Z',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('courseIds');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when registrationDate is invalid', async () => {
      const dto = plainToClass(CreateRegistrationManyForOneDto, {
        userId: 'user-123',
        courseIds: ['course-456'],
        registrationDate: 'not-a-date',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('registrationDate');
      expect(errors[0].constraints).toHaveProperty('isDateString');
    });

    it('should pass validation when registrationDate is omitted (optional field)', async () => {
      const dto = plainToClass(CreateRegistrationManyForOneDto, {
        userId: 'user-123',
        courseIds: ['course-456'],
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });

  describe('CreateRegistrationOneForManyDto', () => {
    it('should pass validation with valid data', async () => {
      const dto = plainToClass(CreateRegistrationOneForManyDto, {
        userIds: ['user-123', 'user-456'],
        courseId: 'course-789',
        registrationDate: '2023-01-01T00:00:00.000Z',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });

    it('should fail validation when courseId is empty', async () => {
      const dto = plainToClass(CreateRegistrationOneForManyDto, {
        userIds: ['user-123'],
        courseId: '',
        registrationDate: '2023-01-01T00:00:00.000Z',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('courseId');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when userIds is empty array', async () => {
      const dto = plainToClass(CreateRegistrationOneForManyDto, {
        userIds: [],
        courseId: 'course-789',
        registrationDate: '2023-01-01T00:00:00.000Z',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userIds');
      expect(errors[0].constraints).toHaveProperty('arrayNotEmpty');
    });

    it('should fail validation when userIds contains non-string values', async () => {
      const dto = plainToClass(CreateRegistrationOneForManyDto, {
        userIds: ['user-123', 456, undefined],
        courseId: 'course-789',
        registrationDate: '2023-01-01T00:00:00.000Z',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userIds');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should fail validation when userIds contains empty strings', async () => {
      const dto = plainToClass(CreateRegistrationOneForManyDto, {
        userIds: ['user-123', ''],
        courseId: 'course-789',
        registrationDate: '2023-01-01T00:00:00.000Z',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('userIds');
      expect(errors[0].constraints).toHaveProperty('isNotEmpty');
    });

    it('should fail validation when courseId is not a string', async () => {
      const dto = plainToClass(CreateRegistrationOneForManyDto, {
        userIds: ['user-123'],
        courseId: 123,
        registrationDate: '2023-01-01T00:00:00.000Z',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(1);
      expect(errors[0].property).toBe('courseId');
      expect(errors[0].constraints).toHaveProperty('isString');
    });

    it('should pass validation when registrationDate is omitted (optional field)', async () => {
      const dto = plainToClass(CreateRegistrationOneForManyDto, {
        userIds: ['user-123'],
        courseId: 'course-789',
      });

      const errors = await validate(dto);
      expect(errors).toHaveLength(0);
    });
  });
});