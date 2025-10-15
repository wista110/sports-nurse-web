import { describe, it, expect } from '@jest/globals'
import { UserRole } from '@prisma/client'
import {
  getProfileSchemaForRole,
  validateProfileForRole,
  profileUpdateSchema,
  registrationSchema,
  baseProfileSchema,
  nurseProfileSchema,
  organizerProfileSchema,
} from '../profile'

describe('Profile Helper Functions', () => {
  describe('getProfileSchemaForRole', () => {
    it('should return nurse schema for NURSE role', () => {
      const schema = getProfileSchemaForRole(UserRole.NURSE)
      expect(schema).toBe(nurseProfileSchema)
    })

    it('should return organizer schema for ORGANIZER role', () => {
      const schema = getProfileSchemaForRole(UserRole.ORGANIZER)
      expect(schema).toBe(organizerProfileSchema)
    })

    it('should return base schema for ADMIN role', () => {
      const schema = getProfileSchemaForRole(UserRole.ADMIN)
      expect(schema).toBe(baseProfileSchema)
    })
  })

  describe('validateProfileForRole', () => {
    const validNurseData = {
      name: 'テスト 看護師',
      city: '新宿区',
      prefecture: '東京都',
      licenseNumber: 'RN-123456789',
      skills: ['応急処置'],
    }

    const validOrganizerData = {
      name: 'テスト 主催者',
      city: '新宿区',
      prefecture: '東京都',
      organizationName: 'テストクラブ',
      organizationType: 'sports_club',
      representativeName: 'テスト 代表',
    }

    const validAdminData = {
      name: 'テスト 管理者',
      city: '新宿区',
      prefecture: '東京都',
    }

    it('should validate nurse data for NURSE role', () => {
      const result = validateProfileForRole(UserRole.NURSE, validNurseData)
      expect(result.success).toBe(true)
    })

    it('should validate organizer data for ORGANIZER role', () => {
      const result = validateProfileForRole(UserRole.ORGANIZER, validOrganizerData)
      expect(result.success).toBe(true)
    })

    it('should validate admin data for ADMIN role', () => {
      const result = validateProfileForRole(UserRole.ADMIN, validAdminData)
      expect(result.success).toBe(true)
    })

    it('should reject nurse data for ORGANIZER role', () => {
      const result = validateProfileForRole(UserRole.ORGANIZER, validNurseData)
      expect(result.success).toBe(false)
    })

    it('should reject organizer data for NURSE role', () => {
      const result = validateProfileForRole(UserRole.NURSE, validOrganizerData)
      expect(result.success).toBe(false)
    })

    it('should reject incomplete data for any role', () => {
      const incompleteData = { name: 'Test' }
      
      expect(validateProfileForRole(UserRole.NURSE, incompleteData).success).toBe(false)
      expect(validateProfileForRole(UserRole.ORGANIZER, incompleteData).success).toBe(false)
      expect(validateProfileForRole(UserRole.ADMIN, incompleteData).success).toBe(false)
    })
  })

  describe('profileUpdateSchema', () => {
    it('should validate nurse profile update', () => {
      const updateData = {
        role: UserRole.NURSE,
        profile: {
          name: 'テスト 看護師',
          city: '新宿区',
          prefecture: '東京都',
          licenseNumber: 'RN-123456789',
          skills: ['応急処置'],
        },
      }

      const result = profileUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should validate organizer profile update', () => {
      const updateData = {
        role: UserRole.ORGANIZER,
        profile: {
          name: 'テスト 主催者',
          city: '新宿区',
          prefecture: '東京都',
          organizationName: 'テストクラブ',
          organizationType: 'sports_club',
          representativeName: 'テスト 代表',
        },
      }

      const result = profileUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should validate admin profile update', () => {
      const updateData = {
        role: UserRole.ADMIN,
        profile: {
          name: 'テスト 管理者',
          city: '新宿区',
          prefecture: '東京都',
        },
      }

      const result = profileUpdateSchema.safeParse(updateData)
      expect(result.success).toBe(true)
    })

    it('should reject mismatched role and profile data', () => {
      const mismatchedData = {
        role: UserRole.NURSE,
        profile: {
          name: 'テスト',
          city: '新宿区',
          prefecture: '東京都',
          organizationName: 'テストクラブ', // Organizer field in nurse profile
          organizationType: 'sports_club',
          representativeName: 'テスト 代表',
        },
      }

      const result = profileUpdateSchema.safeParse(mismatchedData)
      expect(result.success).toBe(false)
    })
  })

  describe('registrationSchema', () => {
    const validRegistrationData = {
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      role: UserRole.NURSE,
      agreeToTerms: true,
    }

    it('should validate complete registration data', () => {
      const result = registrationSchema.safeParse(validRegistrationData)
      expect(result.success).toBe(true)
    })

    it('should validate all user roles', () => {
      const roles = [UserRole.NURSE, UserRole.ORGANIZER, UserRole.ADMIN]
      
      roles.forEach(role => {
        const data = {
          ...validRegistrationData,
          role,
        }
        const result = registrationSchema.safeParse(data)
        expect(result.success).toBe(true)
      })
    })

    it('should reject invalid email format', () => {
      const data = {
        ...validRegistrationData,
        email: 'invalid-email',
      }
      const result = registrationSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject weak password', () => {
      const weakPasswords = [
        'password', // No uppercase or numbers
        'PASSWORD', // No lowercase or numbers
        '12345678', // No letters
        'Pass123',  // Too short
        'password123', // No uppercase
        'PASSWORD123', // No lowercase
      ]

      weakPasswords.forEach(password => {
        const data = {
          ...validRegistrationData,
          password,
          confirmPassword: password,
        }
        const result = registrationSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    it('should reject mismatched passwords', () => {
      const data = {
        ...validRegistrationData,
        password: 'Password123',
        confirmPassword: 'DifferentPassword123',
      }
      const result = registrationSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject without terms agreement', () => {
      const data = {
        ...validRegistrationData,
        agreeToTerms: false,
      }
      const result = registrationSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject invalid role', () => {
      const data = {
        ...validRegistrationData,
        role: 'INVALID_ROLE' as any,
      }
      const result = registrationSchema.safeParse(data)
      expect(result.success).toBe(false)
    })
  })

  describe('baseProfileSchema', () => {
    const validBaseProfile = {
      name: 'テスト ユーザー',
      city: '新宿区',
      prefecture: '東京都',
    }

    it('should validate complete base profile', () => {
      const result = baseProfileSchema.safeParse(validBaseProfile)
      expect(result.success).toBe(true)
    })

    it('should validate base profile with optional phone', () => {
      const data = {
        ...validBaseProfile,
        phone: '090-1234-5678',
      }
      const result = baseProfileSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should accept empty phone field', () => {
      const data = {
        ...validBaseProfile,
        phone: '',
      }
      const result = baseProfileSchema.safeParse(data)
      expect(result.success).toBe(true)
    })

    it('should reject missing required fields', () => {
      const requiredFields = ['name', 'city', 'prefecture']
      
      requiredFields.forEach(field => {
        const data = { ...validBaseProfile }
        delete (data as any)[field]
        
        const result = baseProfileSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })

    it('should reject invalid prefecture', () => {
      const data = {
        ...validBaseProfile,
        prefecture: 'Invalid Prefecture',
      }
      const result = baseProfileSchema.safeParse(data)
      expect(result.success).toBe(false)
    })

    it('should reject fields that are too long', () => {
      const longFieldTests = [
        { field: 'name', maxLength: 100 },
        { field: 'city', maxLength: 50 },
      ]

      longFieldTests.forEach(({ field, maxLength }) => {
        const data = {
          ...validBaseProfile,
          [field]: 'a'.repeat(maxLength + 1),
        }
        const result = baseProfileSchema.safeParse(data)
        expect(result.success).toBe(false)
      })
    })
  })
})