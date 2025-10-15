import { describe, it, expect } from '@jest/globals'
import { nurseProfileSchema, PREFECTURES, NURSING_SKILLS } from '../profile'

describe('Nurse Profile Validation', () => {
  const validNurseProfile = {
    name: 'テスト 看護師',
    phone: '090-1234-5678',
    city: '新宿区',
    prefecture: '東京都' as const,
    licenseNumber: 'RN-123456789',
    skills: ['応急処置', '外傷処置'] as const,
    yearsOfExperience: 5,
    specializations: ['スポーツ医学', '整形外科'],
    bio: 'スポーツ医学に10年の経験があります。',
  }

  describe('Valid nurse profiles', () => {
    it('should validate a complete nurse profile', () => {
      const result = nurseProfileSchema.safeParse(validNurseProfile)
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.name).toBe('テスト 看護師')
        expect(result.data.licenseNumber).toBe('RN-123456789')
        expect(result.data.skills).toEqual(['応急処置', '外傷処置'])
      }
    })

    it('should validate nurse profile with minimal required fields', () => {
      const minimalProfile = {
        name: 'テスト 看護師',
        city: '新宿区',
        prefecture: '東京都' as const,
        licenseNumber: 'RN-123456789',
        skills: ['応急処置'] as const,
      }

      const result = nurseProfileSchema.safeParse(minimalProfile)
      expect(result.success).toBe(true)
    })

    it('should validate all nursing skills', () => {
      NURSING_SKILLS.forEach(skill => {
        const profile = {
          ...validNurseProfile,
          skills: [skill],
        }
        const result = nurseProfileSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })
    })

    it('should validate all Japanese prefectures', () => {
      PREFECTURES.forEach(prefecture => {
        const profile = {
          ...validNurseProfile,
          prefecture,
        }
        const result = nurseProfileSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })
    })

    it('should validate multiple skills up to maximum', () => {
      const maxSkills = NURSING_SKILLS.slice(0, 10)
      const profile = {
        ...validNurseProfile,
        skills: maxSkills,
      }
      const result = nurseProfileSchema.safeParse(profile)
      expect(result.success).toBe(true)
    })

    it('should validate various license number formats', () => {
      const validLicenseFormats = [
        'RN-123456789',
        'N123456789',
        'RN123456789',
        'NURSE-12345',
        'ABC-123-DEF',
      ]

      validLicenseFormats.forEach(licenseNumber => {
        const profile = {
          ...validNurseProfile,
          licenseNumber,
        }
        const result = nurseProfileSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })
    })

    it('should validate years of experience range', () => {
      const validExperiences = [0, 1, 10, 25, 50]
      
      validExperiences.forEach(years => {
        const profile = {
          ...validNurseProfile,
          yearsOfExperience: years,
        }
        const result = nurseProfileSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })
    })
  })

  describe('Invalid nurse profiles', () => {
    it('should reject profile without name', () => {
      const profile = {
        ...validNurseProfile,
        name: '',
      }
      const result = nurseProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject profile without license number', () => {
      const profile = {
        ...validNurseProfile,
        licenseNumber: '',
      }
      const result = nurseProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject profile without skills', () => {
      const profile = {
        ...validNurseProfile,
        skills: [],
      }
      const result = nurseProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject profile with too many skills', () => {
      const tooManySkills = [...NURSING_SKILLS, '追加スキル'] // 16 skills (over limit of 10)
      const profile = {
        ...validNurseProfile,
        skills: tooManySkills,
      }
      const result = nurseProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject invalid license number format', () => {
      const invalidLicenseNumbers = [
        'invalid license!',
        'ライセンス123',
        'RN 123456789', // spaces not allowed
        'RN@123456789', // special chars not allowed
      ]

      invalidLicenseNumbers.forEach(licenseNumber => {
        const profile = {
          ...validNurseProfile,
          licenseNumber,
        }
        const result = nurseProfileSchema.safeParse(profile)
        expect(result.success).toBe(false)
      })
    })

    it('should reject invalid prefecture', () => {
      const profile = {
        ...validNurseProfile,
        prefecture: 'Invalid Prefecture',
      }
      const result = nurseProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject invalid phone number format', () => {
      const invalidPhoneNumbers = [
        'invalid-phone',
        '090-abcd-efgh',
        '電話番号',
      ]

      invalidPhoneNumbers.forEach(phone => {
        const profile = {
          ...validNurseProfile,
          phone,
        }
        const result = nurseProfileSchema.safeParse(profile)
        expect(result.success).toBe(false)
      })
    })

    it('should reject name that is too long', () => {
      const profile = {
        ...validNurseProfile,
        name: 'a'.repeat(101), // Over 100 character limit
      }
      const result = nurseProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject license number that is too long', () => {
      const profile = {
        ...validNurseProfile,
        licenseNumber: 'RN-' + '1'.repeat(20), // Over 20 character limit
      }
      const result = nurseProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject bio that is too long', () => {
      const profile = {
        ...validNurseProfile,
        bio: 'a'.repeat(501), // Over 500 character limit
      }
      const result = nurseProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject negative years of experience', () => {
      const profile = {
        ...validNurseProfile,
        yearsOfExperience: -1,
      }
      const result = nurseProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject years of experience over maximum', () => {
      const profile = {
        ...validNurseProfile,
        yearsOfExperience: 51, // Over 50 year limit
      }
      const result = nurseProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject too many specializations', () => {
      const profile = {
        ...validNurseProfile,
        specializations: ['1', '2', '3', '4', '5', '6'], // Over 5 specialization limit
      }
      const result = nurseProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })

    it('should reject invalid nursing skills', () => {
      const profile = {
        ...validNurseProfile,
        skills: ['無効なスキル'] as any,
      }
      const result = nurseProfileSchema.safeParse(profile)
      expect(result.success).toBe(false)
    })
  })

  describe('Optional fields handling', () => {
    it('should accept empty optional fields', () => {
      const profile = {
        ...validNurseProfile,
        phone: '',
        yearsOfExperience: undefined,
        specializations: [],
        bio: '',
      }
      const result = nurseProfileSchema.safeParse(profile)
      expect(result.success).toBe(true)
    })

    it('should accept undefined optional fields', () => {
      const profile = {
        name: 'テスト 看護師',
        city: '新宿区',
        prefecture: '東京都' as const,
        licenseNumber: 'RN-123456789',
        skills: ['応急処置'] as const,
        // Optional fields omitted
      }
      const result = nurseProfileSchema.safeParse(profile)
      expect(result.success).toBe(true)
    })
  })

  describe('Edge cases', () => {
    it('should handle Japanese characters in name and city', () => {
      const profile = {
        ...validNurseProfile,
        name: '田中 花子',
        city: '渋谷区',
      }
      const result = nurseProfileSchema.safeParse(profile)
      expect(result.success).toBe(true)
    })

    it('should handle mixed alphanumeric license numbers', () => {
      const profile = {
        ...validNurseProfile,
        licenseNumber: 'RN123ABC456',
      }
      const result = nurseProfileSchema.safeParse(profile)
      expect(result.success).toBe(true)
    })

    it('should validate phone number with various formats', () => {
      const validPhoneFormats = [
        '090-1234-5678',
        '03-1234-5678',
        '0120-123-456',
        '+81-90-1234-5678',
        '(03) 1234-5678',
      ]

      validPhoneFormats.forEach(phone => {
        const profile = {
          ...validNurseProfile,
          phone,
        }
        const result = nurseProfileSchema.safeParse(profile)
        expect(result.success).toBe(true)
      })
    })
  })
})