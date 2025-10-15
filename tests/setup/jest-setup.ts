import { PrismaClient } from '@prisma/client'
import { TestDatabase } from './database'

let testDb: TestDatabase

export async function setupTestDatabase(): Promise<PrismaClient> {
  testDb = TestDatabase.getInstance()
  await testDb.setup()
  return testDb.getPrismaClient()
}

export async function cleanupTestDatabase(): Promise<void> {
  if (testDb) {
    await testDb.teardown()
  }
}

// Global setup for Jest
export default async function globalSetup() {
  // This will be called once before all tests
  console.log('Setting up test environment...')
}

// Global teardown for Jest
export async function globalTeardown() {
  // This will be called once after all tests
  console.log('Tearing down test environment...')
}