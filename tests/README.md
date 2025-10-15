# Testing Infrastructure

This directory contains the testing infrastructure for the Sports Nurse Matching platform.

## Overview

The testing setup includes:
- **Unit Tests**: Jest-based tests for validation logic, utilities, and business logic
- **Integration Tests**: Database integration tests using test database utilities
- **End-to-End Tests**: Playwright tests for complete user workflows
- **Test Database**: Utilities for setting up and tearing down test databases

## Directory Structure

```
tests/
├── setup/
│   ├── database.ts          # Test database utilities and factories
│   └── jest-setup.ts        # Jest-specific test utilities
├── integration/
│   └── user-management.test.ts  # Database integration tests
└── e2e/
    ├── auth.spec.ts         # Authentication flow tests
    └── job-lifecycle.spec.ts # Job management workflow tests

lib/
├── validations/__tests__/
│   └── auth.test.ts         # Authentication validation tests
└── utils/__tests__/
    └── validation.test.ts   # Utility function tests
```

## Running Tests

### Unit Tests (Jest)

```bash
# Run all unit tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx jest lib/validations/__tests__/auth.test.ts

# Run tests with coverage
npx jest --coverage
```

### End-to-End Tests (Playwright)

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npx playwright test tests/e2e/auth.spec.ts

# Run tests in headed mode (with browser UI)
npx playwright test --headed

# Run tests in specific browser
npx playwright test --project=chromium
```

## Test Database Setup

The test database utilities provide:

1. **Isolated Test Environment**: Each test run uses a unique database
2. **Automatic Cleanup**: Data is cleaned between tests
3. **Test Data Factories**: Pre-configured test data for different scenarios
4. **Migration Management**: Automatic schema setup for tests

### Using Test Database

```typescript
import { setupTestDatabase, cleanupTestDatabase } from '../setup/jest-setup'
import { testDataFactory } from '../setup/database'

describe('My Integration Test', () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = await setupTestDatabase()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
  })

  it('should create a user', async () => {
    const userData = testDataFactory.user.nurse()
    const user = await prisma.user.create({ data: userData })
    expect(user).toBeDefined()
  })
})
```

## Test Data Factories

The test data factories provide realistic test data:

```typescript
// Create a nurse user
const nurse = testDataFactory.user.nurse({
  email: 'custom@example.com'
})

// Create an organizer user
const organizer = testDataFactory.user.organizer()

// Create a job posting
const job = testDataFactory.job(organizerId, {
  title: 'Custom Job Title'
})

// Create a job application
const application = testDataFactory.application(jobId, nurseId)
```

## Configuration Files

### Jest Configuration (`jest.config.js`)
- Uses Next.js Jest configuration
- Configured for TypeScript and module path mapping
- Excludes E2E tests from unit test runs
- Includes coverage collection settings

### Playwright Configuration (`playwright.config.ts`)
- Multi-browser testing (Chrome, Firefox, Safari)
- Mobile device testing
- Automatic dev server startup
- Screenshot and video recording on failures

### Environment Configuration (`.env.test`)
- Test-specific environment variables
- Mock service configurations
- Disabled external service calls

## Writing Tests

### Unit Tests

Focus on testing individual functions and components:

```typescript
describe('validateQuery', () => {
  it('should validate correct query parameters', () => {
    const searchParams = new URLSearchParams({ page: '1', limit: '10' })
    const result = validateQuery(searchParams, schema)
    expect(result.error).toBeNull()
    expect(result.data).toEqual({ page: 1, limit: 10 })
  })
})
```

### Integration Tests

Test database operations and business logic:

```typescript
describe('User Management', () => {
  it('should create user with profile', async () => {
    const userData = testDataFactory.user.nurse()
    const user = await prisma.user.create({ data: userData })
    expect(user.role).toBe('NURSE')
  })
})
```

### E2E Tests

Test complete user workflows:

```typescript
test('should complete job application flow', async ({ page }) => {
  await page.goto('/jobs')
  await page.click('[data-testid="apply-button"]')
  await page.fill('[name="message"]', 'I am interested')
  await page.click('[type="submit"]')
  await expect(page.locator('.success-message')).toBeVisible()
})
```

## Best Practices

1. **Isolation**: Each test should be independent and not rely on other tests
2. **Cleanup**: Always clean up test data after tests complete
3. **Realistic Data**: Use test factories to create realistic test scenarios
4. **Error Cases**: Test both success and failure scenarios
5. **Async Handling**: Properly handle async operations in tests
6. **Descriptive Names**: Use clear, descriptive test names
7. **Arrange-Act-Assert**: Structure tests with clear setup, execution, and verification

## Continuous Integration

The testing infrastructure is designed to work with CI/CD pipelines:

- Tests run automatically on pull requests
- Database migrations are applied automatically
- Test results are reported with coverage information
- E2E tests run against the built application

## Troubleshooting

### Common Issues

1. **Database Connection**: Ensure test database URL is correctly configured
2. **Module Resolution**: Check that path mappings are correct in Jest config
3. **Async Tests**: Use proper async/await patterns in tests
4. **Browser Tests**: Ensure Playwright browsers are installed (`npx playwright install`)

### Debug Mode

```bash
# Run Jest in debug mode
node --inspect-brk node_modules/.bin/jest --runInBand

# Run Playwright in debug mode
npx playwright test --debug
```