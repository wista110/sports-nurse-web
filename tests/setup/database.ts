import { PrismaClient } from '@prisma/client'
import { execSync } from 'child_process'

// Test database utilities
export class TestDatabase {
  private static instance: TestDatabase
  private prisma: PrismaClient
  private testDbUrl: string

  private constructor() {
    // Create a unique test database URL
    const timestamp = Date.now()
    const randomId = Math.random().toString(36).substring(7)
    const testDbName = `test_sports_nurse_${timestamp}_${randomId}`
    
    // Use the base DATABASE_URL but replace the database name
    const baseUrl = process.env.DATABASE_URL || ''
    this.testDbUrl = baseUrl.replace(/\/[^/?]+(\?|$)/, `/${testDbName}$1`)
    
    this.prisma = new PrismaClient({
      datasources: {
        db: {
          url: this.testDbUrl,
        },
      },
    })
  }

  static getInstance(): TestDatabase {
    if (!TestDatabase.instance) {
      TestDatabase.instance = new TestDatabase()
    }
    return TestDatabase.instance
  }

  async setup(): Promise<void> {
    try {
      // Run migrations to set up the test database schema
      process.env.DATABASE_URL = this.testDbUrl
      execSync('npx prisma migrate deploy', { stdio: 'inherit' })
      
      // Connect to the database
      await this.prisma.$connect()
      
      console.log('Test database setup completed')
    } catch (error) {
      console.error('Failed to setup test database:', error)
      throw error
    }
  }

  async teardown(): Promise<void> {
    try {
      // Clean up all data
      await this.cleanup()
      
      // Disconnect from the database
      await this.prisma.$disconnect()
      
      console.log('Test database teardown completed')
    } catch (error) {
      console.error('Failed to teardown test database:', error)
      throw error
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Delete all data in reverse dependency order
      await this.prisma.auditLog.deleteMany()
      await this.prisma.review.deleteMany()
      await this.prisma.attendanceRecord.deleteMany()
      await this.prisma.escrowTransaction.deleteMany()
      await this.prisma.jobOrder.deleteMany()
      await this.prisma.message.deleteMany()
      await this.prisma.thread.deleteMany()
      await this.prisma.application.deleteMany()
      await this.prisma.job.deleteMany()
      await this.prisma.user.deleteMany()
      
      console.log('Test database cleaned up')
    } catch (error) {
      console.error('Failed to cleanup test database:', error)
      throw error
    }
  }

  getPrismaClient(): PrismaClient {
    return this.prisma
  }

  getTestDbUrl(): string {
    return this.testDbUrl
  }
}

// Test data factories
export const testDataFactory = {
  user: {
    nurse: (overrides: any = {}) => ({
      email: `nurse-${Date.now()}@test.com`,
      role: 'NURSE' as const,
      profile: {
        name: 'Test Nurse',
        city: '東京',
        prefecture: '東京都',
        licenseNumber: 'N123456789',
        skills: ['救急処置', '外傷処理'],
        ratingAverage: 4.5,
        ratingCount: 10,
      },
      ...overrides,
    }),
    
    organizer: (overrides: any = {}) => ({
      email: `organizer-${Date.now()}@test.com`,
      role: 'ORGANIZER' as const,
      profile: {
        name: 'Test Organizer',
        city: '大阪',
        prefecture: '大阪府',
        organizationName: 'Test Sports Club',
        ratingAverage: 4.0,
        ratingCount: 5,
      },
      ...overrides,
    }),
    
    admin: (overrides: any = {}) => ({
      email: `admin-${Date.now()}@test.com`,
      role: 'ADMIN' as const,
      profile: {
        name: 'Test Admin',
        city: '東京',
        prefecture: '東京都',
        ratingAverage: 5.0,
        ratingCount: 1,
      },
      ...overrides,
    }),
  },

  job: (organizerId: string, overrides: any = {}) => ({
    organizerId,
    title: 'Test Sports Event',
    description: 'A test sports event requiring medical support',
    categories: ['サッカー'],
    location: {
      prefecture: '東京都',
      city: '渋谷区',
      venue: 'Test Stadium',
      address: '1-1-1 Test Address',
    },
    startAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
    endAt: new Date(Date.now() + 25 * 60 * 60 * 1000), // Tomorrow + 1 hour
    headcount: 2,
    compensation: {
      type: 'hourly',
      amount: 3000,
      currency: 'JPY',
    },
    deadline: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
    status: 'OPEN' as const,
    ...overrides,
  }),

  application: (jobId: string, nurseId: string, overrides: any = {}) => ({
    jobId,
    nurseId,
    message: 'I am interested in this position and have relevant experience.',
    quote: {
      breakdown: [
        { description: 'Base hourly rate', amount: 3000 },
        { description: 'Emergency response premium', amount: 500 },
      ],
      total: 3500,
      currency: 'JPY',
    },
    status: 'PENDING' as const,
    ...overrides,
  }),
}

// Global test setup and teardown
export async function globalSetup() {
  const testDb = TestDatabase.getInstance()
  await testDb.setup()
}

export async function globalTeardown() {
  const testDb = TestDatabase.getInstance()
  await testDb.teardown()
}