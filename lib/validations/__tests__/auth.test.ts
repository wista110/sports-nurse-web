import {
  signUpSchema,
  signInSchema,
  userProfileSchema,
  nurseProfileSchema,
  organizerProfileSchema,
} from '../auth'
import { UserRole } from '@prisma/client'

describe('Auth Validation Schemas', () => {
  describe('signUpSchema', () => {
    const validSignUpData = {
      email: 'test@example.com',
      password: 'Password123',
      confirmPassword: 'Password123',
      name: 'Test User',
      role: UserRole.NURSE,
    }

    it('should validate correct sign up data', () => {
      const result = signUpSchema.safeParse(validSignUpData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = signUpSchema.safeParse({
        ...validSignUpData,
        email: 'invalid-email',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address')
      }
    })

    it('should reject weak password', () => {
      const result = signUpSchema.safeParse({
        ...validSignUpData,
        password: 'weak',
        confirmPassword: 'weak',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('Password must be at least 8 characters')
        )).toBe(true)
      }
    })

    it('should reject password without uppercase letter', () => {
      const result = signUpSchema.safeParse({
        ...validSignUpData,
        password: 'password123',
        confirmPassword: 'password123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('Password must contain at least one uppercase letter')
        )).toBe(true)
      }
    })

    it('should reject password without number', () => {
      const result = signUpSchema.safeParse({
        ...validSignUpData,
        password: 'Password',
        confirmPassword: 'Password',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.some(issue => 
          issue.message.includes('Password must contain at least one uppercase letter, one lowercase letter, and one number')
        )).toBe(true)
      }
    })

    it('should reject mismatched passwords', () => {
      const result = signUpSchema.safeParse({
        ...validSignUpData,
        confirmPassword: 'DifferentPassword123',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Passwords don't match")
      }
    })

    it('should reject empty name', () => {
      const result = signUpSchema.safeParse({
        ...validSignUpData,
        name: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name is required')
      }
    })

    it('should reject name that is too long', () => {
      const result = signUpSchema.safeParse({
        ...validSignUpData,
        name: 'a'.repeat(101),
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Name is too long')
      }
    })

    it('should accept all valid user roles', () => {
      Object.values(UserRole).forEach(role => {
        const result = signUpSchema.safeParse({
          ...validSignUpData,
          role,
        })
        expect(result.success).toBe(true)
      })
    })
  })

  describe('signInSchema', () => {
    const validSignInData = {
      email: 'test@example.com',
      password: 'password123',
    }

    it('should validate correct sign in data', () => {
      const result = signInSchema.safeParse(validSignInData)
      expect(result.success).toBe(true)
    })

    it('should reject invalid email', () => {
      const result = signInSchema.safeParse({
        ...validSignInData,
        email: 'invalid-email',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Invalid email address')
      }
    })

    it('should reject empty password', () => {
      const result = signInSchema.safeParse({
        ...validSignInData,
        password: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Password is required')
      }
    })
  })

  describe('userProfileSchema', () => {
    const validProfileData = {
      name: 'Test User',
      city: '東京',
      prefecture: '東京都',
    }

    it('should validate correct profile data', () => {
      const result = userProfileSchema.safeParse(validProfileData)
      expect(result.success).toBe(true)
    })

    it('should accept optional fields', () => {
      const result = userProfileSchema.safeParse({
        ...validProfileData,
        phone: '+81-90-1234-5678',
        licenseNumber: 'N123456789',
        skills: ['救急処置', '外傷処理'],
        organizationName: 'Test Organization',
      })
      expect(result.success).toBe(true)
    })

    it('should reject empty required fields', () => {
      const result = userProfileSchema.safeParse({
        name: '',
        city: '',
        prefecture: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(0)
        expect(result.error.issues.some(issue => issue.message.includes('required'))).toBe(true)
      }
    })
  })

  describe('nurseProfileSchema', () => {
    const validNurseData = {
      name: 'Test Nurse',
      city: '東京',
      prefecture: '東京都',
      licenseNumber: 'N123456789',
      skills: ['救急処置', '外傷処理'],
    }

    it('should validate correct nurse profile data', () => {
      const result = nurseProfileSchema.safeParse(validNurseData)
      expect(result.success).toBe(true)
    })

    it('should reject nurse profile without license number', () => {
      const result = nurseProfileSchema.safeParse({
        ...validNurseData,
        licenseNumber: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('License number is required for nurses')
      }
    })

    it('should reject nurse profile without skills', () => {
      const result = nurseProfileSchema.safeParse({
        ...validNurseData,
        skills: [],
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one skill is required')
      }
    })
  })

  describe('organizerProfileSchema', () => {
    const validOrganizerData = {
      name: 'Test Organizer',
      city: '大阪',
      prefecture: '大阪府',
      organizationName: 'Test Sports Club',
    }

    it('should validate correct organizer profile data', () => {
      const result = organizerProfileSchema.safeParse(validOrganizerData)
      expect(result.success).toBe(true)
    })

    it('should reject organizer profile without organization name', () => {
      const result = organizerProfileSchema.safeParse({
        ...validOrganizerData,
        organizationName: '',
      })
      expect(result.success).toBe(false)
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Organization name is required')
      }
    })
  })
})