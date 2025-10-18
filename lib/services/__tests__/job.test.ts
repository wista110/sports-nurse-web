import { JobService } from '../job';
import { JobStatus } from '@prisma/client';
import { prisma } from '@/lib/prisma';
import { auditService } from '../audit';
import type { CreateJobInput, UpdateJobInput } from '@/types/domain';

// Mock dependencies
jest.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      create: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

jest.mock('../audit', () => ({
  auditService: {
    logAction: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockAuditService = auditService as jest.Mocked<typeof auditService>;

describe('JobService', () => {
  let jobService: JobService;
  const mockOrganizerId = 'organizer-123';
  const mockJobId = 'job-123';

  beforeEach(() => {
    jobService = new JobService();
    jest.clearAllMocks();
  });

  describe('createJob', () => {
    const validJobData: CreateJobInput = {
      title: 'Test Sports Event',
      description: 'A test sports event requiring medical support',
      categories: ['サッカー'],
      location: {
        prefecture: '東京都',
        city: '渋谷区',
        venue: 'Test Stadium',
        address: '1-1-1 Test Address',
      },
      startAt: new Date('2024-12-01T10:00:00Z'),
      endAt: new Date('2024-12-01T18:00:00Z'),
      headcount: 2,
      compensation: {
        type: 'hourly' as const,
        amount: 3000,
        currency: 'JPY' as const,
      },
      deadline: new Date('2024-11-30T23:59:59Z'),
    };

    it('should create a job with valid data', async () => {
      const mockCreatedJob = {
        id: mockJobId,
        organizerId: mockOrganizerId,
        ...validJobData,
        status: JobStatus.DRAFT,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.job.create.mockResolvedValue(mockCreatedJob);

      const result = await jobService.createJob(mockOrganizerId, validJobData);

      expect(mockPrisma.job.create).toHaveBeenCalledWith({
        data: {
          title: validJobData.title,
          description: validJobData.description,
          categories: validJobData.categories,
          location: validJobData.location,
          startAt: validJobData.startAt,
          endAt: validJobData.endAt,
          headcount: validJobData.headcount,
          compensation: validJobData.compensation,
          deadline: validJobData.deadline,
          organizerId: mockOrganizerId,
          status: JobStatus.DRAFT,
        },
      });

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        actorId: mockOrganizerId,
        action: 'job_created',
        target: `job:${mockJobId}`,
        metadata: { jobTitle: validJobData.title, status: JobStatus.DRAFT },
      });

      expect(result.id).toBe(mockJobId);
      expect(result.status).toBe(JobStatus.DRAFT);
    });

    it('should handle database errors during job creation', async () => {
      mockPrisma.job.create.mockRejectedValue(new Error('Database error'));

      await expect(
        jobService.createJob(mockOrganizerId, validJobData)
      ).rejects.toThrow('Database error');

      expect(mockAuditService.logAction).not.toHaveBeenCalled();
    });
  });

  describe('updateJob', () => {
    const existingJob = {
      id: mockJobId,
      organizerId: mockOrganizerId,
      title: 'Original Title',
      status: JobStatus.DRAFT,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const updateData: UpdateJobInput = {
      title: 'Updated Title',
      status: JobStatus.OPEN,
    };

    it('should update job when organizer owns the job', async () => {
      mockPrisma.job.findFirst.mockResolvedValue(existingJob);
      mockPrisma.job.update.mockResolvedValue({
        ...existingJob,
        ...updateData,
        updatedAt: new Date(),
      });

      const result = await jobService.updateJob(mockJobId, mockOrganizerId, updateData);

      expect(mockPrisma.job.findFirst).toHaveBeenCalledWith({
        where: { id: mockJobId, organizerId: mockOrganizerId },
      });

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId },
        data: updateData,
      });

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        actorId: mockOrganizerId,
        action: 'job_updated',
        target: `job:${mockJobId}`,
        metadata: {
          changes: updateData,
          previousStatus: existingJob.status,
          newStatus: updateData.status,
        },
      });

      expect(result.title).toBe(updateData.title);
    });

    it('should throw error when job not found or access denied', async () => {
      mockPrisma.job.findFirst.mockResolvedValue(null);

      await expect(
        jobService.updateJob(mockJobId, mockOrganizerId, updateData)
      ).rejects.toThrow('Job not found or access denied');

      expect(mockPrisma.job.update).not.toHaveBeenCalled();
      expect(mockAuditService.logAction).not.toHaveBeenCalled();
    });

    it('should handle complex location and compensation updates', async () => {
      const complexUpdateData: UpdateJobInput = {
        location: {
          prefecture: '大阪府',
          city: '大阪市',
          venue: 'New Stadium',
        },
        compensation: {
          type: 'fixed' as const,
          amount: 50000,
          currency: 'JPY' as const,
        },
      };

      mockPrisma.job.findFirst.mockResolvedValue(existingJob);
      mockPrisma.job.update.mockResolvedValue({
        ...existingJob,
        ...complexUpdateData,
      });

      await jobService.updateJob(mockJobId, mockOrganizerId, complexUpdateData);

      expect(mockPrisma.job.update).toHaveBeenCalledWith({
        where: { id: mockJobId },
        data: {
          ...complexUpdateData,
          location: complexUpdateData.location,
          compensation: complexUpdateData.compensation,
        },
      });
    });
  });

  describe('publishJob', () => {
    it('should update job status to OPEN', async () => {
      const existingJob = {
        id: mockJobId,
        organizerId: mockOrganizerId,
        status: JobStatus.DRAFT,
      };

      mockPrisma.job.findFirst.mockResolvedValue(existingJob);
      mockPrisma.job.update.mockResolvedValue({
        ...existingJob,
        status: JobStatus.OPEN,
      });

      const result = await jobService.publishJob(mockJobId, mockOrganizerId);

      expect(result.status).toBe(JobStatus.OPEN);
    });
  });

  describe('searchJobs', () => {
    const mockJobs = [
      {
        id: 'job-1',
        title: 'Soccer Event',
        categories: ['サッカー'],
        location: { prefecture: '東京都', city: '渋谷区' },
        compensation: { type: 'hourly', amount: 3000 },
        status: JobStatus.OPEN,
        createdAt: new Date('2024-01-01'),
        organizer: { id: 'org-1', profile: { name: 'Organizer 1' } },
      },
      {
        id: 'job-2',
        title: 'Basketball Event',
        categories: ['バスケットボール'],
        location: { prefecture: '大阪府', city: '大阪市' },
        compensation: { type: 'fixed', amount: 50000 },
        status: JobStatus.OPEN,
        createdAt: new Date('2024-01-02'),
        organizer: { id: 'org-2', profile: { name: 'Organizer 2' } },
      },
    ];

    beforeEach(() => {
      mockPrisma.job.findMany.mockResolvedValue(mockJobs);
      mockPrisma.job.count.mockResolvedValue(2);
    });

    it('should search jobs with basic filters', async () => {
      const filters = {
        prefecture: '東京都',
        categories: ['サッカー'],
        page: 1,
        limit: 20,
      };

      const result = await jobService.searchJobs(filters);

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith({
        where: {
          status: { in: [JobStatus.OPEN] },
          location: { path: ['prefecture'], equals: '東京都' },
          categories: { hasSome: ['サッカー'] },
        },
        skip: 0,
        take: 20,
        orderBy: { createdAt: 'desc' },
        include: {
          organizer: {
            select: { id: true, profile: true },
          },
        },
      });

      expect(result.success).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.pagination.total).toBe(2);
    });

    it('should handle compensation filters', async () => {
      const filters = {
        minCompensation: 2000,
        maxCompensation: 5000,
        compensationType: 'hourly' as const,
      };

      await jobService.searchJobs(filters);

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            compensation: { path: ['type'], equals: 'hourly' },
          }),
        })
      );
    });

    it('should handle date range filters', async () => {
      const startDate = new Date('2024-01-01');
      const endDate = new Date('2024-12-31');

      const filters = {
        startDate,
        endDate,
      };

      await jobService.searchJobs(filters);

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            startAt: { gte: startDate },
            endAt: { lte: endDate },
          }),
        })
      );
    });

    it('should handle search text', async () => {
      const filters = {
        search: 'soccer',
      };

      await jobService.searchJobs(filters);

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            OR: [
              { title: { contains: 'soccer', mode: 'insensitive' } },
              { description: { contains: 'soccer', mode: 'insensitive' } },
            ],
          }),
        })
      );
    });

    it('should handle different sort options', async () => {
      // Test deadline sort
      await jobService.searchJobs({ sort: 'deadline' });
      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { deadline: 'asc' },
        })
      );

      // Test compensation high to low
      await jobService.searchJobs({ sort: 'compensation_high' });
      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { compensation: { path: ['amount'], sort: 'desc' } },
        })
      );

      // Test compensation low to high
      await jobService.searchJobs({ sort: 'compensation_low' });
      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          orderBy: { compensation: { path: ['amount'], sort: 'asc' } },
        })
      );
    });

    it('should handle pagination correctly', async () => {
      const filters = {
        page: 2,
        limit: 10,
      };

      await jobService.searchJobs(filters);

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 10, // (page - 1) * limit
          take: 10,
        })
      );
    });
  });

  describe('deleteJob', () => {
    it('should delete job when conditions are met', async () => {
      const existingJob = {
        id: mockJobId,
        organizerId: mockOrganizerId,
        title: 'Test Job',
        status: JobStatus.DRAFT,
      };

      mockPrisma.job.findFirst.mockResolvedValue(existingJob);
      mockPrisma.job.delete.mockResolvedValue(existingJob);

      await jobService.deleteJob(mockJobId, mockOrganizerId);

      expect(mockPrisma.job.findFirst).toHaveBeenCalledWith({
        where: {
          id: mockJobId,
          organizerId: mockOrganizerId,
          status: { in: [JobStatus.DRAFT, JobStatus.OPEN] },
        },
      });

      expect(mockPrisma.job.delete).toHaveBeenCalledWith({
        where: { id: mockJobId },
      });

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        actorId: mockOrganizerId,
        action: 'job_deleted',
        target: `job:${mockJobId}`,
        metadata: { jobTitle: existingJob.title, status: existingJob.status },
      });
    });

    it('should throw error when job cannot be deleted', async () => {
      mockPrisma.job.findFirst.mockResolvedValue(null);

      await expect(
        jobService.deleteJob(mockJobId, mockOrganizerId)
      ).rejects.toThrow('Job not found, access denied, or cannot be deleted');

      expect(mockPrisma.job.delete).not.toHaveBeenCalled();
      expect(mockAuditService.logAction).not.toHaveBeenCalled();
    });

    it('should not delete job with invalid status', async () => {
      const existingJob = {
        id: mockJobId,
        organizerId: mockOrganizerId,
        status: JobStatus.IN_PROGRESS, // Cannot delete in-progress jobs
      };

      mockPrisma.job.findFirst.mockResolvedValue(null); // Simulates status filter rejection

      await expect(
        jobService.deleteJob(mockJobId, mockOrganizerId)
      ).rejects.toThrow('Job not found, access denied, or cannot be deleted');
    });
  });

  describe('getJobById', () => {
    it('should return job when found', async () => {
      const mockJob = {
        id: mockJobId,
        title: 'Test Job',
        organizer: { id: 'org-1', profile: { name: 'Test Organizer' } },
      };

      mockPrisma.job.findUnique.mockResolvedValue(mockJob);

      const result = await jobService.getJobById(mockJobId);

      expect(mockPrisma.job.findUnique).toHaveBeenCalledWith({
        where: { id: mockJobId },
        include: {
          organizer: {
            select: { id: true, profile: true },
          },
        },
      });

      expect(result).toBeTruthy();
      expect(result?.id).toBe(mockJobId);
    });

    it('should return null when job not found', async () => {
      mockPrisma.job.findUnique.mockResolvedValue(null);

      const result = await jobService.getJobById(mockJobId);

      expect(result).toBeNull();
    });
  });

  describe('getJobsByOrganizer', () => {
    it('should return jobs for organizer', async () => {
      const mockJobs = [
        { id: 'job-1', organizerId: mockOrganizerId, title: 'Job 1' },
        { id: 'job-2', organizerId: mockOrganizerId, title: 'Job 2' },
      ];

      mockPrisma.job.findMany.mockResolvedValue(mockJobs);

      const result = await jobService.getJobsByOrganizer(mockOrganizerId);

      expect(mockPrisma.job.findMany).toHaveBeenCalledWith({
        where: { organizerId: mockOrganizerId },
        orderBy: { createdAt: 'desc' },
      });

      expect(result).toHaveLength(2);
    });
  });
});