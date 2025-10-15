import { PrismaClient } from '@prisma/client'
import { setupTestDatabase, cleanupTestDatabase } from '../setup/jest-setup'
import { testDataFactory } from '../setup/database'

describe('User Management Integration Tests', () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = await setupTestDatabase()
  })

  afterAll(async () => {
    await cleanupTestDatabase()
  })

  beforeEach(async () => {
    // Clean up data before each test
    await prisma.user.deleteMany()
  })

  describe('User Creation', () => {
    it('should create a nurse user with profile', async () => {
      const nurseData = testDataFactory.user.nurse({
        email: 'test-nurse@example.com',
      })

      const user = await prisma.user.create({
        data: nurseData,
      })

      expect(user).toBeDefined()
      expect(user.email).toBe('test-nurse@example.com')
      expect(user.role).toBe('NURSE')
      expect(user.profile).toMatchObject({
        name: 'Test Nurse',
        licenseNumber: 'N123456789',
        skills: ['救急処置', '外傷処理'],
      })
    })

    it('should create an organizer user with profile', async () => {
      const organizerData = testDataFactory.user.organizer({
        email: 'test-organizer@example.com',
      })

      const user = await prisma.user.create({
        data: organizerData,
      })

      expect(user).toBeDefined()
      expect(user.email).toBe('test-organizer@example.com')
      expect(user.role).toBe('ORGANIZER')
      expect(user.profile).toMatchObject({
        name: 'Test Organizer',
        organizationName: 'Test Sports Club',
      })
    })

    it('should create an admin user', async () => {
      const adminData = testDataFactory.user.admin({
        email: 'test-admin@example.com',
      })

      const user = await prisma.user.create({
        data: adminData,
      })

      expect(user).toBeDefined()
      expect(user.email).toBe('test-admin@example.com')
      expect(user.role).toBe('ADMIN')
    })
  })

  describe('User Queries', () => {
    it('should find user by email', async () => {
      const nurseData = testDataFactory.user.nurse({
        email: 'findme@example.com',
      })

      await prisma.user.create({ data: nurseData })

      const foundUser = await prisma.user.findUnique({
        where: { email: 'findme@example.com' },
      })

      expect(foundUser).toBeDefined()
      expect(foundUser?.email).toBe('findme@example.com')
    })

    it('should find users by role', async () => {
      // Create multiple users with different roles
      await prisma.user.createMany({
        data: [
          testDataFactory.user.nurse({ email: 'nurse1@example.com' }),
          testDataFactory.user.nurse({ email: 'nurse2@example.com' }),
          testDataFactory.user.organizer({ email: 'organizer1@example.com' }),
        ],
      })

      const nurses = await prisma.user.findMany({
        where: { role: 'NURSE' },
      })

      const organizers = await prisma.user.findMany({
        where: { role: 'ORGANIZER' },
      })

      expect(nurses).toHaveLength(2)
      expect(organizers).toHaveLength(1)
    })
  })

  describe('User Profile Updates', () => {
    it('should update user profile information', async () => {
      const nurseData = testDataFactory.user.nurse({
        email: 'updateme@example.com',
      })

      const user = await prisma.user.create({ data: nurseData })

      const updatedProfile = {
        ...user.profile as any,
        name: 'Updated Nurse Name',
        skills: ['救急処置', '外傷処理', 'AED操作'],
      }

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: { profile: updatedProfile },
      })

      expect(updatedUser.profile).toMatchObject({
        name: 'Updated Nurse Name',
        skills: ['救急処置', '外傷処理', 'AED操作'],
      })
    })
  })

  describe('Data Validation', () => {
    it('should enforce unique email constraint', async () => {
      const email = 'duplicate@example.com'
      
      await prisma.user.create({
        data: testDataFactory.user.nurse({ email }),
      })

      // Attempting to create another user with the same email should fail
      await expect(
        prisma.user.create({
          data: testDataFactory.user.organizer({ email }),
        })
      ).rejects.toThrow()
    })

    it('should handle JSON profile data correctly', async () => {
      const complexProfile = {
        name: 'Complex Profile User',
        city: '東京',
        prefecture: '東京都',
        licenseNumber: 'N987654321',
        skills: ['救急処置', '外傷処理', 'スポーツマッサージ'],
        certifications: [
          { name: 'CPR', expiryDate: '2025-12-31' },
          { name: 'First Aid', expiryDate: '2024-06-30' },
        ],
        availability: {
          weekdays: true,
          weekends: true,
          evenings: false,
        },
      }

      const user = await prisma.user.create({
        data: {
          email: 'complex@example.com',
          role: 'NURSE',
          profile: complexProfile,
        },
      })

      expect(user.profile).toMatchObject(complexProfile)
      
      // Verify we can query based on JSON fields
      const foundUser = await prisma.user.findFirst({
        where: {
          profile: {
            path: ['name'],
            equals: 'Complex Profile User',
          },
        },
      })

      expect(foundUser).toBeDefined()
      expect(foundUser?.id).toBe(user.id)
    })
  })
})