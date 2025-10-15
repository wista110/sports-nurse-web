import { TestDatabase } from './database'

// Setup for individual test files
export async function setupTestDatabase() {
  const testDb = TestDatabase.getInstance()
  await testDb.cleanup() // Clean before each test suite
  return testDb.getPrismaClient()
}

export async function cleanupTestDatabase() {
  const testDb = TestDatabase.getInstance()
  await testDb.cleanup() // Clean after each test suite
}

// Mock implementations for testing
export const mockNextRequest = (body: any = {}, searchParams: Record<string, string> = {}) => {
  const url = new URL('http://localhost:3000/api/test')
  Object.entries(searchParams).forEach(([key, value]) => {
    url.searchParams.set(key, value)
  })

  return {
    json: jest.fn().mockResolvedValue(body),
    url: url.toString(),
    nextUrl: url,
    method: 'POST',
    headers: new Headers(),
  } as any
}

export const mockNextResponse = () => ({
  json: jest.fn().mockImplementation((data) => ({
    json: () => Promise.resolve(data),
    status: 200,
  })),
  status: jest.fn().mockReturnThis(),
})

// Test utilities
export const waitFor = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const expectValidationError = (result: any, field: string, message?: string) => {
  expect(result.error).toBeTruthy()
  if (message) {
    expect(result.error.message).toContain(message)
  }
  // Check if it's a Zod validation error with field-specific errors
  if (result.error.details && result.error.details.fieldErrors) {
    expect(result.error.details.fieldErrors[field]).toBeDefined()
  }
}