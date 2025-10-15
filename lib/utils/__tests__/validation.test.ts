import { z } from 'zod'
import {
  validateQuery,
  createSuccessResponse,
  createPaginatedResponse,
  commonValidations,
  japaneseValidations,
} from '../validation'
import { mockNextRequest } from '../../../tests/setup/jest-setup'

describe('Validation Utilities', () => {
  describe('validateQuery', () => {
    const testSchema = z.object({
      page: z.number().min(1),
      limit: z.number().min(1).max(100),
      search: z.string().optional(),
      active: z.boolean().optional(),
    })

    it('should validate correct query parameters', () => {
      const searchParams = new URLSearchParams({
        page: '1',
        limit: '10',
        search: 'test',
        active: 'true',
      })

      const result = validateQuery(searchParams, testSchema)
      expect(result.error).toBeNull()
      expect(result.data).toEqual({
        page: 1,
        limit: 10,
        search: 'test',
        active: true,
      })
    })

    it('should convert string numbers to numbers', () => {
      const searchParams = new URLSearchParams({
        page: '2',
        limit: '25',
      })

      const result = validateQuery(searchParams, testSchema)
      expect(result.error).toBeNull()
      expect(result.data?.page).toBe(2)
      expect(result.data?.limit).toBe(25)
    })

    it('should convert string booleans to booleans', () => {
      const searchParams = new URLSearchParams({
        page: '1',
        limit: '10',
        active: 'false',
      })

      const result = validateQuery(searchParams, testSchema)
      expect(result.error).toBeNull()
      expect(result.data?.active).toBe(false)
    })

    it('should handle decimal numbers', () => {
      const decimalSchema = z.object({
        rating: z.number().min(0).max(5),
      })

      const searchParams = new URLSearchParams({
        rating: '4.5',
      })

      const result = validateQuery(searchParams, decimalSchema)
      expect(result.error).toBeNull()
      expect(result.data?.rating).toBe(4.5)
    })

    it('should return error for invalid data', () => {
      const searchParams = new URLSearchParams({
        page: '0', // Invalid: min is 1
        limit: '200', // Invalid: max is 100
      })

      const result = validateQuery(searchParams, testSchema)
      expect(result.error).toBeTruthy()
      expect(result.data).toBeNull()
    })

    it('should handle missing optional parameters', () => {
      const searchParams = new URLSearchParams({
        page: '1',
        limit: '10',
      })

      const result = validateQuery(searchParams, testSchema)
      expect(result.error).toBeNull()
      expect(result.data).toEqual({
        page: 1,
        limit: 10,
      })
    })
  })

  describe('createSuccessResponse', () => {
    it('should create success response with data', () => {
      const data = { id: '1', name: 'Test' }
      const response = createSuccessResponse(data)
      
      // Mock the Response.json method
      const mockJson = jest.spyOn(Response, 'json').mockImplementation((body) => body as any)
      
      const result = createSuccessResponse(data)
      expect(result).toEqual({
        success: true,
        data,
      })
      
      mockJson.mockRestore()
    })

    it('should create success response with data and message', () => {
      const data = { id: '1', name: 'Test' }
      const message = 'Operation successful'
      
      const mockJson = jest.spyOn(Response, 'json').mockImplementation((body) => body as any)
      
      const result = createSuccessResponse(data, message)
      expect(result).toEqual({
        success: true,
        data,
        message,
      })
      
      mockJson.mockRestore()
    })
  })

  describe('createPaginatedResponse', () => {
    it('should create paginated response with correct pagination info', () => {
      const data = [{ id: '1' }, { id: '2' }]
      const pagination = { page: 1, limit: 10, total: 25 }
      
      const mockJson = jest.spyOn(Response, 'json').mockImplementation((body) => body as any)
      
      const result = createPaginatedResponse(data, pagination)
      expect(result).toEqual({
        success: true,
        data,
        pagination: {
          page: 1,
          limit: 10,
          total: 25,
          totalPages: 3, // Math.ceil(25 / 10)
        },
      })
      
      mockJson.mockRestore()
    })

    it('should calculate total pages correctly', () => {
      const data = []
      const pagination = { page: 1, limit: 7, total: 20 }
      
      const mockJson = jest.spyOn(Response, 'json').mockImplementation((body) => body as any)
      
      const result = createPaginatedResponse(data, pagination)
      expect(result.pagination.totalPages).toBe(3) // Math.ceil(20 / 7)
      
      mockJson.mockRestore()
    })
  })

  describe('commonValidations', () => {
    it('should validate ID correctly', () => {
      expect(commonValidations.id.safeParse('valid-id').success).toBe(true)
      expect(commonValidations.id.safeParse('').success).toBe(false)
    })

    it('should validate email correctly', () => {
      expect(commonValidations.email.safeParse('test@example.com').success).toBe(true)
      expect(commonValidations.email.safeParse('invalid-email').success).toBe(false)
    })

    it('should validate phone number correctly', () => {
      expect(commonValidations.phone.safeParse('+81901234567').success).toBe(true)
      expect(commonValidations.phone.safeParse('901234567').success).toBe(true) // Without leading 0
      expect(commonValidations.phone.safeParse('invalid-phone').success).toBe(false)
      expect(commonValidations.phone.safeParse(undefined).success).toBe(true) // Optional
    })

    it('should validate URL correctly', () => {
      expect(commonValidations.url.safeParse('https://example.com').success).toBe(true)
      expect(commonValidations.url.safeParse('http://localhost:3000').success).toBe(true)
      expect(commonValidations.url.safeParse('invalid-url').success).toBe(false)
    })

    it('should validate positive numbers correctly', () => {
      expect(commonValidations.positiveNumber.safeParse(0).success).toBe(true)
      expect(commonValidations.positiveNumber.safeParse(10).success).toBe(true)
      expect(commonValidations.positiveNumber.safeParse(-1).success).toBe(false)
    })

    it('should validate rating correctly', () => {
      expect(commonValidations.rating.safeParse(1).success).toBe(true)
      expect(commonValidations.rating.safeParse(5).success).toBe(true)
      expect(commonValidations.rating.safeParse(0).success).toBe(false)
      expect(commonValidations.rating.safeParse(6).success).toBe(false)
      expect(commonValidations.rating.safeParse(3.5).success).toBe(false) // Must be integer
    })

    it('should validate future dates correctly', () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000)
      const pastDate = new Date(Date.now() - 24 * 60 * 60 * 1000)
      
      expect(commonValidations.dateInFuture.safeParse(futureDate).success).toBe(true)
      expect(commonValidations.dateInFuture.safeParse(pastDate).success).toBe(false)
    })
  })

  describe('japaneseValidations', () => {
    it('should validate Japanese prefectures correctly', () => {
      expect(japaneseValidations.prefecture.safeParse('東京都').success).toBe(true)
      expect(japaneseValidations.prefecture.safeParse('大阪府').success).toBe(true)
      expect(japaneseValidations.prefecture.safeParse('北海道').success).toBe(true)
      expect(japaneseValidations.prefecture.safeParse('Invalid Prefecture').success).toBe(false)
    })

    it('should validate sport categories correctly', () => {
      expect(japaneseValidations.sportCategories.safeParse('サッカー').success).toBe(true)
      expect(japaneseValidations.sportCategories.safeParse('野球').success).toBe(true)
      expect(japaneseValidations.sportCategories.safeParse('その他').success).toBe(true)
      expect(japaneseValidations.sportCategories.safeParse('Invalid Sport').success).toBe(false)
    })

    it('should validate nurse skills correctly', () => {
      expect(japaneseValidations.nurseSkills.safeParse('救急処置').success).toBe(true)
      expect(japaneseValidations.nurseSkills.safeParse('外傷処理').success).toBe(true)
      expect(japaneseValidations.nurseSkills.safeParse('AED操作').success).toBe(true)
      expect(japaneseValidations.nurseSkills.safeParse('Invalid Skill').success).toBe(false)
    })

    it('should include all 47 Japanese prefectures', () => {
      const prefectures = [
        '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
        '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
        '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
        '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
        '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
        '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
        '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
      ]
      
      expect(prefectures).toHaveLength(47)
      
      prefectures.forEach(prefecture => {
        expect(japaneseValidations.prefecture.safeParse(prefecture).success).toBe(true)
      })
    })
  })
})