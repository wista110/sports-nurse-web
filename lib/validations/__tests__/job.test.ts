import {
  createJobSchema,
  updateJobSchema,
  jobFiltersSchema,
  createApplicationSchema,
  applicationQuoteSchema,
  jobLocationSchema,
  jobCompensationSchema,
} from '../job';
import { JobStatus } from '@prisma/client';

describe('Job Validation Schemas', () => {
  describe('jobLocationSchema', () => {
    it('should validate valid location data', () => {
      const validLocation = {
        prefecture: '東京都',
        city: '渋谷区',
        venue: 'Test Stadium',
        address: '1-1-1 Test Address',
      };

      const result = jobLocationSchema.safeParse(validLocation);
      expect(result.success).toBe(true);
    });

    it('should require prefecture, city, and venue', () => {
      const invalidLocation = {
        prefecture: '',
        city: '',
        venue: '',
      };

      const result = jobLocationSchema.safeParse(invalidLocation);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues).toHaveLength(3);
        expect(result.error.issues.map(i => i.path[0])).toContain('prefecture');
        expect(result.error.issues.map(i => i.path[0])).toContain('city');
        expect(result.error.issues.map(i => i.path[0])).toContain('venue');
      }
    });

    it('should allow optional address', () => {
      const locationWithoutAddress = {
        prefecture: '東京都',
        city: '渋谷区',
        venue: 'Test Stadium',
      };

      const result = jobLocationSchema.safeParse(locationWithoutAddress);
      expect(result.success).toBe(true);
    });
  });

  describe('jobCompensationSchema', () => {
    it('should validate hourly compensation', () => {
      const hourlyCompensation = {
        type: 'hourly' as const,
        amount: 3000,
        currency: 'JPY' as const,
      };

      const result = jobCompensationSchema.safeParse(hourlyCompensation);
      expect(result.success).toBe(true);
    });

    it('should validate fixed compensation', () => {
      const fixedCompensation = {
        type: 'fixed' as const,
        amount: 50000,
        currency: 'JPY' as const,
      };

      const result = jobCompensationSchema.safeParse(fixedCompensation);
      expect(result.success).toBe(true);
    });

    it('should reject negative amounts', () => {
      const invalidCompensation = {
        type: 'hourly' as const,
        amount: -1000,
        currency: 'JPY' as const,
      };

      const result = jobCompensationSchema.safeParse(invalidCompensation);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Amount must be non-negative');
      }
    });

    it('should require valid compensation type', () => {
      const invalidCompensation = {
        type: 'invalid' as any,
        amount: 3000,
        currency: 'JPY' as const,
      };

      const result = jobCompensationSchema.safeParse(invalidCompensation);
      expect(result.success).toBe(false);
    });

    it('should only accept JPY currency', () => {
      const invalidCompensation = {
        type: 'hourly' as const,
        amount: 3000,
        currency: 'USD' as any,
      };

      const result = jobCompensationSchema.safeParse(invalidCompensation);
      expect(result.success).toBe(false);
    });
  });

  describe('createJobSchema', () => {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    const validJobData = {
      title: 'Test Sports Event',
      description: 'A test sports event requiring medical support with detailed information',
      categories: ['サッカー'],
      location: {
        prefecture: '東京都',
        city: '渋谷区',
        venue: 'Test Stadium',
        address: '1-1-1 Test Address',
      },
      startAt: tomorrow,
      endAt: dayAfterTomorrow,
      headcount: 2,
      compensation: {
        type: 'hourly' as const,
        amount: 3000,
        currency: 'JPY' as const,
      },
      deadline: tomorrow,
    };

    it('should validate complete valid job data', () => {
      const result = createJobSchema.safeParse(validJobData);
      expect(result.success).toBe(true);
    });

    it('should require title', () => {
      const invalidData = { ...validJobData, title: '' };
      const result = createJobSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is required');
      }
    });

    it('should limit title length', () => {
      const longTitle = 'a'.repeat(201);
      const invalidData = { ...validJobData, title: longTitle };
      const result = createJobSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Title is too long');
      }
    });

    it('should require minimum description length', () => {
      const invalidData = { ...validJobData, description: 'short' };
      const result = createJobSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Description must be at least 10 characters');
      }
    });

    it('should limit description length', () => {
      const longDescription = 'a'.repeat(2001);
      const invalidData = { ...validJobData, description: longDescription };
      const result = createJobSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Description is too long');
      }
    });

    it('should require at least one category', () => {
      const invalidData = { ...validJobData, categories: [] };
      const result = createJobSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one category is required');
      }
    });

    it('should limit maximum categories', () => {
      const tooManyCategories = ['サッカー', 'バスケ', 'テニス', '野球', 'バレー', '水泳'];
      const invalidData = { ...validJobData, categories: tooManyCategories };
      const result = createJobSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Maximum 5 categories allowed');
      }
    });

    it('should require future start time', () => {
      const pastDate = new Date('2020-01-01T10:00:00Z');
      const invalidData = { ...validJobData, startAt: pastDate };
      const result = createJobSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Start time must be in the future');
      }
    });

    it('should require end time after start time', () => {
      const futureDate1 = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const futureDate2 = new Date(Date.now() + 12 * 60 * 60 * 1000); // Earlier than futureDate1
      
      const invalidData = {
        ...validJobData,
        startAt: futureDate1,
        endAt: futureDate2,
      };
      const result = createJobSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const endTimeError = result.error.issues.find(issue => issue.path.includes('endAt'));
        expect(endTimeError?.message).toBe('End time must be after start time');
      }
    });

    it('should require deadline before or equal to start time', () => {
      const futureStartDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const evenLaterDate = new Date(Date.now() + 48 * 60 * 60 * 1000);
      
      const invalidData = {
        ...validJobData,
        startAt: futureStartDate,
        endAt: evenLaterDate,
        deadline: evenLaterDate, // After start time
      };
      const result = createJobSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        const deadlineError = result.error.issues.find(issue => issue.path.includes('deadline'));
        expect(deadlineError?.message).toBe('Application deadline must be before or equal to start time');
      }
    });

    it('should require minimum headcount', () => {
      const invalidData = { ...validJobData, headcount: 0 };
      const result = createJobSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least 1 nurse is required');
      }
    });

    it('should require integer headcount', () => {
      const invalidData = { ...validJobData, headcount: 2.5 };
      const result = createJobSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
    });
  });

  describe('updateJobSchema', () => {
    it('should allow partial updates', () => {
      const partialUpdate = {
        title: 'Updated Title',
        status: JobStatus.OPEN,
      };

      const result = updateJobSchema.safeParse(partialUpdate);
      expect(result.success).toBe(true);
    });

    it('should allow status updates', () => {
      const statusUpdate = {
        status: JobStatus.CANCELLED,
      };

      const result = updateJobSchema.safeParse(statusUpdate);
      expect(result.success).toBe(true);
    });

    it('should validate partial data with same rules', () => {
      const invalidUpdate = {
        title: '', // Invalid empty title
      };

      const result = updateJobSchema.safeParse(invalidUpdate);
      expect(result.success).toBe(false);
    });

    it('should allow empty updates', () => {
      const emptyUpdate = {};
      const result = updateJobSchema.safeParse(emptyUpdate);
      expect(result.success).toBe(true);
    });
  });

  describe('jobFiltersSchema', () => {
    it('should validate basic filters', () => {
      const filters = {
        prefecture: '東京都',
        city: '渋谷区',
        categories: ['サッカー', 'バスケ'],
        page: 1,
        limit: 20,
      };

      const result = jobFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);
    });

    it('should validate date filters', () => {
      const filters = {
        startDate: new Date('2024-01-01'),
        endDate: new Date('2024-12-31'),
      };

      const result = jobFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);
    });

    it('should validate compensation filters', () => {
      const filters = {
        minCompensation: 2000,
        maxCompensation: 5000,
        compensationType: 'hourly' as const,
      };

      const result = jobFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);
    });

    it('should validate status filters', () => {
      const filters = {
        status: [JobStatus.OPEN, JobStatus.APPLIED],
      };

      const result = jobFiltersSchema.safeParse(filters);
      expect(result.success).toBe(true);
    });

    it('should set default pagination values', () => {
      const filters = {};
      const result = jobFiltersSchema.safeParse(filters);
      
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.page).toBe(1);
        expect(result.data.limit).toBe(20);
      }
    });

    it('should enforce minimum page number', () => {
      const filters = { page: 0 };
      const result = jobFiltersSchema.safeParse(filters);
      expect(result.success).toBe(false);
    });

    it('should enforce maximum limit', () => {
      const filters = { limit: 101 };
      const result = jobFiltersSchema.safeParse(filters);
      expect(result.success).toBe(false);
    });

    it('should reject negative compensation values', () => {
      const filters = { minCompensation: -100 };
      const result = jobFiltersSchema.safeParse(filters);
      expect(result.success).toBe(false);
    });
  });

  describe('applicationQuoteSchema', () => {
    it('should validate valid quote', () => {
      const validQuote = {
        breakdown: [
          { description: 'Base hourly rate', amount: 3000 },
          { description: 'Emergency response premium', amount: 500 },
        ],
        total: 3500,
        currency: 'JPY' as const,
      };

      const result = applicationQuoteSchema.safeParse(validQuote);
      expect(result.success).toBe(true);
    });

    it('should require at least one quote item', () => {
      const invalidQuote = {
        breakdown: [],
        total: 0,
        currency: 'JPY' as const,
      };

      const result = applicationQuoteSchema.safeParse(invalidQuote);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('At least one quote item is required');
      }
    });

    it('should validate quote item descriptions', () => {
      const invalidQuote = {
        breakdown: [
          { description: '', amount: 3000 }, // Empty description
        ],
        total: 3000,
        currency: 'JPY' as const,
      };

      const result = applicationQuoteSchema.safeParse(invalidQuote);
      expect(result.success).toBe(false);
    });

    it('should reject negative amounts in quote items', () => {
      const invalidQuote = {
        breakdown: [
          { description: 'Base rate', amount: -1000 },
        ],
        total: -1000,
        currency: 'JPY' as const,
      };

      const result = applicationQuoteSchema.safeParse(invalidQuote);
      expect(result.success).toBe(false);
    });

    it('should only accept JPY currency', () => {
      const invalidQuote = {
        breakdown: [
          { description: 'Base rate', amount: 3000 },
        ],
        total: 3000,
        currency: 'USD' as any,
      };

      const result = applicationQuoteSchema.safeParse(invalidQuote);
      expect(result.success).toBe(false);
    });
  });

  describe('createApplicationSchema', () => {
    it('should validate valid application', () => {
      const validApplication = {
        jobId: 'job-123',
        message: 'I am interested in this position and have relevant experience.',
        quote: {
          breakdown: [
            { description: 'Base hourly rate', amount: 3000 },
          ],
          total: 3000,
          currency: 'JPY' as const,
        },
      };

      const result = createApplicationSchema.safeParse(validApplication);
      expect(result.success).toBe(true);
    });

    it('should require job ID', () => {
      const invalidApplication = {
        jobId: '',
        message: 'I am interested in this position.',
      };

      const result = createApplicationSchema.safeParse(invalidApplication);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Job ID is required');
      }
    });

    it('should require minimum message length', () => {
      const invalidApplication = {
        jobId: 'job-123',
        message: 'short',
      };

      const result = createApplicationSchema.safeParse(invalidApplication);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Message must be at least 10 characters');
      }
    });

    it('should limit message length', () => {
      const longMessage = 'a'.repeat(1001);
      const invalidApplication = {
        jobId: 'job-123',
        message: longMessage,
      };

      const result = createApplicationSchema.safeParse(invalidApplication);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('Message is too long');
      }
    });

    it('should allow application without quote', () => {
      const applicationWithoutQuote = {
        jobId: 'job-123',
        message: 'I am interested in this position and have relevant experience.',
      };

      const result = createApplicationSchema.safeParse(applicationWithoutQuote);
      expect(result.success).toBe(true);
    });
  });

  describe('Edge Cases and Complex Scenarios', () => {
    it('should handle timezone-aware date validation', () => {
      const now = new Date();
      const futureDate = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours from now
      const evenLaterDate = new Date(now.getTime() + 48 * 60 * 60 * 1000); // 48 hours from now

      const validJobData = {
        title: 'Test Event',
        description: 'A test event with proper timing',
        categories: ['サッカー'],
        location: {
          prefecture: '東京都',
          city: '渋谷区',
          venue: 'Test Stadium',
        },
        startAt: futureDate,
        endAt: evenLaterDate,
        headcount: 1,
        compensation: {
          type: 'hourly' as const,
          amount: 3000,
          currency: 'JPY' as const,
        },
        deadline: futureDate, // Same as start time (valid)
      };

      const result = createJobSchema.safeParse(validJobData);
      expect(result.success).toBe(true);
    });

    it('should handle multiple validation errors', () => {
      const invalidJobData = {
        title: '', // Invalid
        description: 'short', // Invalid
        categories: [], // Invalid
        location: {
          prefecture: '',
          city: '',
          venue: '',
        },
        startAt: new Date('2020-01-01'), // Invalid (past)
        endAt: new Date('2019-01-01'), // Invalid (before start)
        headcount: 0, // Invalid
        compensation: {
          type: 'invalid' as any,
          amount: -100,
          currency: 'USD' as any,
        },
        deadline: new Date('2025-01-01'), // Invalid (after start)
      };

      const result = createJobSchema.safeParse(invalidJobData);
      expect(result.success).toBe(false);
      
      if (!result.success) {
        expect(result.error.issues.length).toBeGreaterThan(5);
      }
    });
  });
});