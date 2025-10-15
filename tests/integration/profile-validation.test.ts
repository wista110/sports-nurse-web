import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals'
import { PrismaClient, UserRole } from '@prisma/client'
import { setupTestDatabase, cleanupTestDatabase, testDataFactory } from '../setup/database'
import {
  validateProfileForRole,
  getProfileSchemaForRole,
  profileUpdateSchema,
  nurseProfileSchema,
  organizerProfileSchema,
  baseProfileSchema,
} from '@/lib/validations/profile'

describe('Profile Validation Integration Tests', () => {
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

  describe('Role-based Profile Validation', () => {
    it('should validate and store nurse profile correctly', async () => {
      const nurseProfileData = {
        name: 'テスト 看護師',
        phone: '090-1234-5678',
        city: '新宿区',
        prefecture: '東京都',
        licenseNumber: 'RN-123456789',
        skills: ['応急処置', '外傷処置', '心肺蘇生法'],
        yearsOfExperience: 5,
        specializations: ['スポーツ医学'],
        bio: 'スポーツ医学に専門性を持つ看護師です。',
      }

      // Validate with schema
      const validation = validateProfileForRole(UserRole.NURSE, nurseProfileData)
      expect(validation.success).toBe(true)

      if (validation.success) {
        // Create user with validated profile
        const user = await prisma.user.create({
          data: {
            email: 'nurse@test.com',
            role: UserRole.NURSE,
            profile: validation.data,
          },
        })

        expect(user.profile).toMatchObject(nurseProfileData)
        expect((user.profile as any).licenseNumber).toBe('RN-123456789')
        expect((user.profile as any).skills).toEqual(['応急処置', '外傷処置', '心肺蘇生法'])
      }
    })

    it('should validate and store organizer profile correctly', async () => {
      const organizerProfileData = {
        name: 'テスト 主催者',
        phone: '03-1234-5678',
        city: '渋谷区',
        prefecture: '東京都',
        organizationName: 'テストスポーツクラブ',
        organizationType: 'sports_club' as const,
        representativeName: 'テスト 代表',
        businessRegistrationNumber: '1234567890123',
        website: 'https://test-club.example.com',
        description: '地域のスポーツ振興に取り組んでいます。',
      }

      // Validate with schema
      const validation = validateProfileForRole(UserRole.ORGANIZER, organizerProfileData)
      expect(validation.success).toBe(true)

      if (validation.success) {
        // Create user with validated profile
        const user = await prisma.user.create({
          data: {
            email: 'organizer@test.com',
            role: UserRole.ORGANIZER,
            profile: validation.data,
          },
        })

        expect(user.profile).toMatchObject(organizerProfileData)
        expect((user.profile as any).organizationName).toBe('テストスポーツクラブ')
        expect((user.profile as any).organizationType).toBe('sports_club')
      }
    })

    it('should validate and store admin profile correctly', async () => {
      const adminProfileData = {
        name: 'テスト 管理者',
        phone: '03-9999-9999',
        city: '千代田区',
        prefecture: '東京都',
      }

      // Validate with schema
      const validation = validateProfileForRole(UserRole.ADMIN, adminProfileData)
      expect(validation.success).toBe(true)

      if (validation.success) {
        // Create user with validated profile
        const user = await prisma.user.create({
          data: {
            email: 'admin@test.com',
            role: UserRole.ADMIN,
            profile: validation.data,
          },
        })

        expect(user.profile).toMatchObject(adminProfileData)
        expect((user.profile as any).name).toBe('テスト 管理者')
      }
    })

    it('should reject nurse profile data for organizer role', async () => {
      const nurseProfileData = {
        name: 'テスト 看護師',
        city: '新宿区',
        prefecture: '東京都',
        licenseNumber: 'RN-123456789',
        skills: ['応急処置'],
      }

      const validation = validateProfileForRole(UserRole.ORGANIZER, nurseProfileData)
      expect(validation.success).toBe(false)
    })

    it('should reject organizer profile data for nurse role', async () => {
      const organizerProfileData = {
        name: 'テスト 主催者',
        city: '渋谷区',
        prefecture: '東京都',
        organizationName: 'テストクラブ',
        organizationType: 'sports_club',
        representativeName: 'テスト 代表',
      }

      const validation = validateProfileForRole(UserRole.NURSE, organizerProfileData)
      expect(validation.success).toBe(false)
    })
  })

  describe('Profile Update Validation', () => {
    it('should validate complete profile update for nurse', async () => {
      const updateData = {
        role: UserRole.NURSE,
        profile: {
          name: 'Updated Nurse',
          city: '新宿区',
          prefecture: '東京都',
          licenseNumber: 'RN-987654321',
          skills: ['応急処置', '外傷処置'],
        },
      }

      const validation = profileUpdateSchema.safeParse(updateData)
      expect(validation.success).toBe(true)

      if (validation.success) {
        // Create initial user
        const user = await prisma.user.create({
          data: testDataFactory.user.nurse({ email: 'update-test@example.com' }),
        })

        // Update user profile
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { profile: validation.data.profile },
        })

        expect((updatedUser.profile as any).name).toBe('Updated Nurse')
        expect((updatedUser.profile as any).licenseNumber).toBe('RN-987654321')
      }
    })

    it('should validate complete profile update for organizer', async () => {
      const updateData = {
        role: UserRole.ORGANIZER,
        profile: {
          name: 'Updated Organizer',
          city: '渋谷区',
          prefecture: '東京都',
          organizationName: 'Updated Club',
          organizationType: 'private_company' as const,
          representativeName: 'Updated Representative',
        },
      }

      const validation = profileUpdateSchema.safeParse(updateData)
      expect(validation.success).toBe(true)

      if (validation.success) {
        // Create initial user
        const user = await prisma.user.create({
          data: testDataFactory.user.organizer({ email: 'update-organizer@example.com' }),
        })

        // Update user profile
        const updatedUser = await prisma.user.update({
          where: { id: user.id },
          data: { profile: validation.data.profile },
        })

        expect((updatedUser.profile as any).organizationName).toBe('Updated Club')
        expect((updatedUser.profile as any).organizationType).toBe('private_company')
      }
    })

    it('should reject profile update with mismatched role and data', async () => {
      const mismatchedData = {
        role: UserRole.NURSE,
        profile: {
          name: 'Test',
          city: '新宿区',
          prefecture: '東京都',
          organizationName: 'Should not be here',
          organizationType: 'sports_club',
          representativeName: 'Wrong field',
        },
      }

      const validation = profileUpdateSchema.safeParse(mismatchedData)
      expect(validation.success).toBe(false)
    })
  })

  describe('Schema Selection by Role', () => {
    it('should return correct schema for each role', () => {
      expect(getProfileSchemaForRole(UserRole.NURSE)).toBe(nurseProfileSchema)
      expect(getProfileSchemaForRole(UserRole.ORGANIZER)).toBe(organizerProfileSchema)
      expect(getProfileSchemaForRole(UserRole.ADMIN)).toBe(baseProfileSchema)
    })

    it('should validate role-specific required fields', () => {
      // Nurse missing license number
      const incompleteNurse = {
        name: 'Test Nurse',
        city: '新宿区',
        prefecture: '東京都',
        skills: ['応急処置'],
        // licenseNumber missing
      }
      expect(validateProfileForRole(UserRole.NURSE, incompleteNurse).success).toBe(false)

      // Organizer missing organization name
      const incompleteOrganizer = {
        name: 'Test Organizer',
        city: '新宿区',
        prefecture: '東京都',
        organizationType: 'sports_club',
        representativeName: 'Test Rep',
        // organizationName missing
      }
      expect(validateProfileForRole(UserRole.ORGANIZER, incompleteOrganizer).success).toBe(false)

      // Admin with only base fields should be valid
      const completeAdmin = {
        name: 'Test Admin',
        city: '新宿区',
        prefecture: '東京都',
      }
      expect(validateProfileForRole(UserRole.ADMIN, completeAdmin).success).toBe(true)
    })
  })

  describe('Field Visibility and Access Control', () => {
    it('should store and retrieve role-specific fields correctly', async () => {
      // Create nurse with nurse-specific fields
      const nurseUser = await prisma.user.create({
        data: {
          email: 'nurse-fields@test.com',
          role: UserRole.NURSE,
          profile: {
            name: 'Field Test Nurse',
            city: '新宿区',
            prefecture: '東京都',
            licenseNumber: 'RN-FIELD-TEST',
            skills: ['応急処置', '外傷処置'],
            yearsOfExperience: 3,
            bio: 'Test bio',
          },
        },
      })

      // Create organizer with organizer-specific fields
      const organizerUser = await prisma.user.create({
        data: {
          email: 'organizer-fields@test.com',
          role: UserRole.ORGANIZER,
          profile: {
            name: 'Field Test Organizer',
            city: '渋谷区',
            prefecture: '東京都',
            organizationName: 'Field Test Club',
            organizationType: 'sports_club',
            representativeName: 'Field Test Rep',
            verificationStatus: 'pending',
          },
        },
      })

      // Verify nurse has nurse-specific fields
      const retrievedNurse = await prisma.user.findUnique({
        where: { id: nurseUser.id },
      })
      expect((retrievedNurse?.profile as any).licenseNumber).toBe('RN-FIELD-TEST')
      expect((retrievedNurse?.profile as any).skills).toEqual(['応急処置', '外傷処置'])
      expect((retrievedNurse?.profile as any).organizationName).toBeUndefined()

      // Verify organizer has organizer-specific fields
      const retrievedOrganizer = await prisma.user.findUnique({
        where: { id: organizerUser.id },
      })
      expect((retrievedOrganizer?.profile as any).organizationName).toBe('Field Test Club')
      expect((retrievedOrganizer?.profile as any).organizationType).toBe('sports_club')
      expect((retrievedOrganizer?.profile as any).licenseNumber).toBeUndefined()
    })

    it('should handle optional fields correctly for each role', async () => {
      // Nurse with minimal required fields
      const minimalNurse = await prisma.user.create({
        data: {
          email: 'minimal-nurse@test.com',
          role: UserRole.NURSE,
          profile: {
            name: 'Minimal Nurse',
            city: '新宿区',
            prefecture: '東京都',
            licenseNumber: 'RN-MINIMAL',
            skills: ['応急処置'],
            // Optional fields omitted
          },
        },
      })

      // Organizer with minimal required fields
      const minimalOrganizer = await prisma.user.create({
        data: {
          email: 'minimal-organizer@test.com',
          role: UserRole.ORGANIZER,
          profile: {
            name: 'Minimal Organizer',
            city: '渋谷区',
            prefecture: '東京都',
            organizationName: 'Minimal Club',
            organizationType: 'sports_club',
            representativeName: 'Minimal Rep',
            verificationStatus: 'pending',
            // Optional fields omitted
          },
        },
      })

      expect(minimalNurse.id).toBeDefined()
      expect(minimalOrganizer.id).toBeDefined()

      // Verify optional fields are handled correctly
      const retrievedNurse = await prisma.user.findUnique({
        where: { id: minimalNurse.id },
      })
      expect((retrievedNurse?.profile as any).phone).toBeUndefined()
      expect((retrievedNurse?.profile as any).bio).toBeUndefined()

      const retrievedOrganizer = await prisma.user.findUnique({
        where: { id: minimalOrganizer.id },
      })
      expect((retrievedOrganizer?.profile as any).website).toBeUndefined()
      expect((retrievedOrganizer?.profile as any).description).toBeUndefined()
    })
  })

  describe('Data Integrity and Constraints', () => {
    it('should enforce unique email constraint across roles', async () => {
      const email = 'duplicate@test.com'

      // Create first user
      await prisma.user.create({
        data: testDataFactory.user.nurse({ email }),
      })

      // Attempt to create second user with same email should fail
      await expect(
        prisma.user.create({
          data: testDataFactory.user.organizer({ email }),
        })
      ).rejects.toThrow()
    })

    it('should handle complex profile data structures', async () => {
      const complexProfile = {
        name: 'Complex Profile User',
        city: '東京',
        prefecture: '東京都',
        licenseNumber: 'RN-COMPLEX-123',
        skills: ['応急処置', '外傷処置', '心肺蘇生法'],
        yearsOfExperience: 7,
        specializations: ['スポーツ医学', '整形外科'],
        bio: 'Experienced sports medicine nurse with extensive background.',
        certifications: [
          { name: 'Advanced Cardiac Life Support', year: 2023 },
          { name: 'Pediatric Advanced Life Support', year: 2022 },
        ],
        preferences: {
          workingHours: 'flexible',
          travelDistance: 50,
          sportTypes: ['サッカー', 'バスケットボール'],
        },
      }

      const user = await prisma.user.create({
        data: {
          email: 'complex@test.com',
          role: UserRole.NURSE,
          profile: complexProfile,
        },
      })

      const retrieved = await prisma.user.findUnique({
        where: { id: user.id },
      })

      expect(retrieved?.profile).toMatchObject(complexProfile)
      expect((retrieved?.profile as any).certifications).toHaveLength(2)
      expect((retrieved?.profile as any).preferences.sportTypes).toEqual(['サッカー', 'バスケットボール'])
    })
  })
})