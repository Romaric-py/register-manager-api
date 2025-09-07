# Registration Module Tests

This directory contains comprehensive tests for the Registration module, organized into logical folders for better maintainability and clarity.

## Test Structure

```
__tests__/
├── unit/                           # Unit tests
│   ├── registration.service.spec.ts    # Service unit tests
│   └── registration.controller.spec.ts # Controller unit tests
├── integration/                    # Integration tests
│   └── registration.integration.spec.ts # End-to-end API tests
├── dto/                           # DTO validation tests
│   └── create-registration.dto.spec.ts # DTO validation tests
├── test-utils.ts                  # Shared test utilities and mocks
└── README.md                      # This file
```

## Test Types

### Unit Tests (`unit/`)
- **Service Tests**: Test business logic in isolation with mocked dependencies
- **Controller Tests**: Test controller methods and request/response handling

### Integration Tests (`integration/`)
- **E2E Tests**: Test complete API workflows with HTTP requests
- Test the entire request/response cycle including middleware, guards, and validation

### DTO Tests (`dto/`)
- **Validation Tests**: Test data transfer object validation rules
- Ensure proper validation of input data using class-validator

## Test Utilities (`test-utils.ts`)

Contains reusable test utilities including:
- Mock data objects (users, courses, registrations)
- Mock service factories
- Test data factories with customizable overrides
- Common test setup helpers

## Running Tests

### Run all registration tests:
```bash
npm test -- --testPathPattern=registration
```

### Run specific test types:
```bash
# Unit tests only
npm test -- --testPathPattern=registration/__tests__/unit

# Integration tests only
npm test -- --testPathPattern=registration/__tests__/integration

# DTO tests only
npm test -- --testPathPattern=registration/__tests__/dto
```

### Run with coverage:
```bash
npm test -- --coverage --testPathPattern=registration
```

### Run in watch mode:
```bash
npm test -- --watch --testPathPattern=registration
```

## Test Coverage Goals

- **Service Layer**: 100% coverage of all business logic methods
- **Controller Layer**: 100% coverage of all endpoints and error handling
- **DTO Validation**: All validation rules tested with valid/invalid scenarios
- **Integration**: All API endpoints tested with various scenarios

## Test Data

All test data is centralized in `test-utils.ts` for consistency and reusability:

```typescript
import { 
  mockRegistration, 
  mockUser, 
  mockCourse,
  createRegistrationDto,
  createMockPrismaService 
} from './test-utils';
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Mocking**: External dependencies are mocked to ensure unit test isolation
3. **Coverage**: Aim for comprehensive test coverage including edge cases
4. **Readability**: Test names should clearly describe what is being tested
5. **Organization**: Tests are grouped logically by functionality

## Adding New Tests

When adding new features to the Registration module:

1. Add unit tests to the appropriate service/controller test file
2. Add integration tests for new API endpoints
3. Add DTO validation tests for new data structures
4. Update test utilities with new mock data as needed
5. Ensure all tests pass and maintain high coverage