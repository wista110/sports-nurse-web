import { describe, it, expect } from '@jest/globals'
import { organizerProfileSchema, PREFECTURES } from '../profile'

describe('Organizer Profile Validation', () => {
  const validOrganizerProfile = {
    name: 'テスト 太郎',
    phone: '03-1234-5678',
    city: '新宿区',
    prefecture: '東京都' as const,
    organizationName: 'テストスポーツクラブ',
    organizationType: 'sports_club' as const,
    representativeName: 'テスト 花子',
    businessRegistrationNumber: '1234567890123',
    website: 'https://test-sports-club.example.com',
    description: 'テスト用のスポーツクラブです。地域のスポーツ振興に貢献しています。',
    verificationStatus: 'pending' as const,
  }

  describe('Valid organizer profiles', () => {
    it('should validate a complete organizer profile', () => {
      const result = organizerProfileSchema.safeParse(validOrganizerProfile)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.organizationName).toBe('テストスポーツクラブ')
        expect(result.data.organizationType).toBe('sports_club')
        expect(result.data.verificationStatus).toBe('pending')
      }
    })

    it('should validate organizer profile with minimal required fields', () => {
      const minimalProfile = {
        name: 'テスト 太郎',
        city: '新宿区',
        prefecture: '東京都' as const,
        organizationName: 'テストクラブ',
        organizationType: 'sports_club' as const,
        representativeName: 'テスト 花子',
      }

      const result = organizerProfileSchema.safeParse(minimalProfile)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.verificationStatus).toBe('pending') // Default value
      }
    })

    it('should validate all organization types', () => {
      const organizationTypes = [
        'sports_club',
        'school',
        'municipality',
        'private_company',
        'npo',
        'other',
      ]

      organizationTypes.forEach(type => {
        const profile = {
          ...validOrganizerProfile,
          organizationType: type as any,
        }
        const result = organizerProfileSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })
    })

    it('should validate all Japanese prefectures', () => {
      PREFECTURES.forEach(prefecture => {
        const profile = {
          ...validOrganizerProfile,
          prefecture,
        }
        const result = organizerProfileSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })
    })

    it('should validate all verification statuses', () => {
      const statuses = ['pending', 'verified', 'rejected']
      
      statuses.forEach(status => {
        const profile = {
          ...validOrganizerProfile,
          verificationStatus: status as any,
        }
        const result = organizerProfileSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Invalid organizer profiles', () => {
    it('should reject profile without organization name', () => {
      const profile = {
        ...validOrganizerProfile,
        organizationName: '',
      }
      const result = organizerProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject profile without representative name', () => {
      const profile = {
        ...validOrganizerProfile,
        representativeName: '',
      }
      const result = organizerProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject invalid organization type', () => {
      const profile = {
        ...validOrganizerProfile,
        organizationType: 'invalid_type',
      }
      const result = organizerProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject invalid prefecture', () => {
      const profile = {
        ...validOrganizerProfile,
        prefecture: 'Invalid Prefecture',
      }
      const result = organizerProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject invalid website URL', () => {
      const profile = {
        ...validOrganizerProfile,
        website: 'not-a-valid-url',
      }
      const result = organizerProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject invalid business registration number format', () => {
      const profile = {
        ...validOrganizerProfile,
        businessRegistrationNumber: 'invalid-format-with-letters',
      }
      const result = organizerProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject description that is too long', () => {
      const profile = {
        ...validOrganizerProfile,
        description: 'a'.repeat(1001), // Over 1000 character limit
      }
      const result = organizerProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject organization name that is too long', () => {
      const profile = {
        ...validOrganizerProfile,
        organizationName: 'a'.repeat(101), // Over 100 character limit
      }
      const result = organizerProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject invalid verification status', () => {
      const profile = {
        ...validOrganizerProfile,
        verificationStatus: 'invalid_status',
      }
      const result = organizerProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })
  })

  describe('Optional fields handling', () => {
    it('should accept empty optional fields', () => {
      const profile = {
        ...validOrganizerProfile,
        phone: '',
        businessRegistrationNumber: '',
        website: '',
        description: '',
      }
      const result = organizerProfileSchema.safeParse(profile)
      expect(result.success).toBe(true)
    })

    it('should accept undefined optional fields', () => {
      const profile = {
        name: 'テスト 太郎',
        city: '新宿区',
        prefecture: '東京都' as const,
        organizationName: 'テストクラブ',
        organizationType: 'sports_club' as const,
        representativeName: 'テスト 花子',
        // Optional fields omitted
      }
      const result = organizerProfileSchema.safeParse(profile)
      expect(result.success).toBe(true)
    })
  })
})