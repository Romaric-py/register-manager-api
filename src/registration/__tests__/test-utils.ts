import { RegistrationStatus, PaymentStatus, Role } from '@prisma/client';

export const mockRegistration = {
  id: 'registration-1',
  userId: 'user-1',
  courseId: 'course-1',
  status: RegistrationStatus.PENDING,
  paymentStatus: PaymentStatus.PENDING,
  totalAmount: 100.0,
  paidAmount: 0,
  remainingAmount: 100.0,
  registrationDate: new Date('2023-01-01T00:00:00.000Z'),
  confirmationDate: null,
  cancellationDate: null,
  cancellationReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockUser = {
  id: 'user-1',
  firstName: 'John',
  lastName: 'Doe',
  email: 'john.doe@test.com',
  password: 'hashedPassword',
  phone: '+1234567890',
  role: Role.USER,
  isActive: true,
  emailVerified: true,
  emailVerificationToken: null,
  emailVerificationTokenExpiry: null,
  lastEmailVerificationIssue: null,
  lastLogin: null,
  resetToken: null,
  resetTokenExpiry: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: null,
  updatedBy: null,
};

export const mockCourse = {
  id: 'course-1',
  title: 'JavaScript Fundamentals',
  description: 'Learn the basics of JavaScript programming',
  price: 100.0,
  duration: '4 weeks',
  isActive: true,
  maxParticipants: 20,
  currentParticipants: 5,
  startDate: new Date('2023-02-01T00:00:00.000Z'),
  endDate: new Date('2023-02-28T23:59:59.999Z'),
  location: 'Online',
  prerequisites: 'Basic computer knowledge',
  objectives: 'Master JavaScript fundamentals',
  createdAt: new Date(),
  updatedAt: new Date(),
};

export const mockAdmin = {
  id: 'admin-1',
  firstName: 'Admin',
  lastName: 'User',
  email: 'admin@test.com',
  password: 'hashedPassword',
  phone: null,
  role: Role.ADMIN,
  isActive: true,
  emailVerified: true,
  emailVerificationToken: null,
  emailVerificationTokenExpiry: null,
  lastEmailVerificationIssue: null,
  lastLogin: new Date(),
  resetToken: null,
  resetTokenExpiry: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  createdBy: null,
  updatedBy: null,
};

export const createMockPrismaService = () => ({
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
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  course: {
    findUnique: jest.fn(),
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
    count: jest.fn(),
  },
  payment: {
    findMany: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
});

export const createMockPaginationService = () => ({
  calculatePagination: jest.fn().mockReturnValue({
    page: 1,
    limit: 10,
    skip: 0,
  }),
  paginate: jest.fn().mockImplementation(({ data, totalCount, page, limit }) => ({
    data,
    totalCount,
    page,
    limit,
    totalPages: Math.ceil(totalCount / limit),
  })),
});

export const createMockJwtAuthGuard = () => ({
  canActivate: jest.fn().mockImplementation((context) => {
    const req = context.switchToHttp().getRequest();
    req.user = mockAdmin;
    return true;
  }),
});

export const createMockRolesGuard = () => ({
  canActivate: jest.fn(() => true),
});

// Helper function to create test module with common providers
export const createTestModule = async (providers: any[] = []) => {
  const { Test } = await import('@nestjs/testing');
  
  return Test.createTestingModule({
    providers: [
      ...providers,
      {
        provide: 'PrismaService',
        useValue: createMockPrismaService(),
      },
      {
        provide: 'PaginationService',
        useValue: createMockPaginationService(),
      },
    ],
  });
};

// Test data factories
export const createRegistrationDto = (overrides = {}) => ({
  userId: 'user-1',
  courseId: 'course-1',
  registrationDate: '2023-01-01T00:00:00.000Z',
  ...overrides,
});

export const createManyForOneDto = (overrides = {}) => ({
  userId: 'user-1',
  courseIds: ['course-1', 'course-2'],
  registrationDate: '2023-01-01T00:00:00.000Z',
  ...overrides,
});

export const createOneForManyDto = (overrides = {}) => ({
  userIds: ['user-1', 'user-2'],
  courseId: 'course-1',
  registrationDate: '2023-01-01T00:00:00.000Z',
  ...overrides,
});

export const updateRegistrationDto = (overrides = {}) => ({
  registrationDate: '2023-01-02T00:00:00.000Z',
  ...overrides,
});

export const getRegistrationsDto = (overrides = {}) => ({
  page: '1',
  limit: '10',
  ...overrides,
});