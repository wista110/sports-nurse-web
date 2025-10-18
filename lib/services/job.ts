import { prisma } from "@/lib/prisma";
import { JobStatus, UserRole } from "@prisma/client";
import type { 
  Job, 
  JobFilters, 
  CreateJobInput, 
  UpdateJobInput,
  PaginatedResponse 
} from "@/types/domain";
import { auditService } from "./audit";

export class JobService {
  async createJob(organizerId: string, data: CreateJobInput): Promise<Job> {
    const job = await prisma.job.create({
      data: {
        title: data.title,
        description: data.description,
        categories: data.categories,
        location: data.location as any,
        startAt: data.startAt,
        endAt: data.endAt,
        headcount: data.headcount,
        compensation: data.compensation as any,
        deadline: data.deadline,
        organizerId,
        status: JobStatus.DRAFT,
      },
    });

    await auditService.logAction({
      actorId: organizerId,
      action: "job_created",
      target: `job:${job.id}`,
      metadata: { jobTitle: data.title, status: JobStatus.DRAFT },
    });

    return this.mapPrismaJobToJob(job);
  }

  async updateJob(jobId: string, organizerId: string, data: UpdateJobInput): Promise<Job> {
    // Verify ownership
    const existingJob = await prisma.job.findFirst({
      where: { id: jobId, organizerId },
    });

    if (!existingJob) {
      throw new Error("Job not found or access denied");
    }

    const updatedJob = await prisma.job.update({
      where: { id: jobId },
      data: {
        ...data,
        location: data.location ? (data.location as any) : undefined,
        compensation: data.compensation ? (data.compensation as any) : undefined,
      },
    });

    await auditService.logAction({
      actorId: organizerId,
      action: "job_updated",
      target: `job:${jobId}`,
      metadata: { 
        changes: data,
        previousStatus: existingJob.status,
        newStatus: data.status || existingJob.status 
      },
    });

    return this.mapPrismaJobToJob(updatedJob);
  }

  async publishJob(jobId: string, organizerId: string): Promise<Job> {
    return this.updateJob(jobId, organizerId, { status: JobStatus.OPEN });
  }

  async getJobById(jobId: string): Promise<Job | null> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        organizer: {
          select: {
            id: true,
            profile: true,
          },
        },
      },
    });

    if (!job) return null;

    return this.mapPrismaJobToJob(job);
  }

  async searchJobs(filters: JobFilters & { sort?: string }): Promise<PaginatedResponse<Job>> {
    const {
      prefecture,
      city,
      categories,
      startDate,
      endDate,
      minCompensation,
      maxCompensation,
      compensationType,
      status = [JobStatus.OPEN],
      search,
      page = 1,
      limit = 20,
      sort = "newest",
    } = filters;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {
      status: { in: status },
    };

    if (prefecture) {
      where.location = {
        path: ["prefecture"],
        equals: prefecture,
      };
    }

    if (city) {
      where.location = {
        path: ["city"],
        equals: city,
      };
    }

    if (categories && categories.length > 0) {
      where.categories = {
        hasSome: categories,
      };
    }

    if (startDate) {
      where.startAt = {
        gte: startDate,
      };
    }

    if (endDate) {
      where.endAt = {
        lte: endDate,
      };
    }

    if (minCompensation || maxCompensation) {
      const compensationFilter: any = {};
      if (minCompensation) {
        compensationFilter.path = ["amount"];
        compensationFilter.gte = minCompensation;
      }
      if (maxCompensation) {
        compensationFilter.path = ["amount"];
        compensationFilter.lte = maxCompensation;
      }
      where.compensation = compensationFilter;
    }

    if (compensationType) {
      where.compensation = {
        path: ["type"],
        equals: compensationType,
      };
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    // Build order by clause
    let orderBy: any = { createdAt: "desc" };
    switch (sort) {
      case "deadline":
        orderBy = { deadline: "asc" };
        break;
      case "compensation_high":
        orderBy = { compensation: { path: ["amount"], sort: "desc" } };
        break;
      case "compensation_low":
        orderBy = { compensation: { path: ["amount"], sort: "asc" } };
        break;
      default:
        orderBy = { createdAt: "desc" };
    }

    const [jobs, total] = await Promise.all([
      prisma.job.findMany({
        where,
        skip,
        take: limit,
        orderBy,
        include: {
          organizer: {
            select: {
              id: true,
              profile: true,
            },
          },
        },
      }),
      prisma.job.count({ where }),
    ]);

    const mappedJobs = jobs.map(job => this.mapPrismaJobToJob(job));

    return {
      success: true,
      data: mappedJobs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getJobsByOrganizer(organizerId: string): Promise<Job[]> {
    const jobs = await prisma.job.findMany({
      where: { organizerId },
      orderBy: { createdAt: "desc" },
    });

    return jobs.map(job => this.mapPrismaJobToJob(job));
  }

  async deleteJob(jobId: string, organizerId: string): Promise<void> {
    // Verify ownership and that job can be deleted
    const job = await prisma.job.findFirst({
      where: { 
        id: jobId, 
        organizerId,
        status: { in: [JobStatus.DRAFT, JobStatus.OPEN] }
      },
    });

    if (!job) {
      throw new Error("Job not found, access denied, or cannot be deleted");
    }

    await prisma.job.delete({
      where: { id: jobId },
    });

    await auditService.logAction({
      actorId: organizerId,
      action: "job_deleted",
      target: `job:${jobId}`,
      metadata: { jobTitle: job.title, status: job.status },
    });
  }

  private mapPrismaJobToJob(prismaJob: any): Job {
    return {
      id: prismaJob.id,
      organizerId: prismaJob.organizerId,
      title: prismaJob.title,
      description: prismaJob.description,
      categories: prismaJob.categories,
      location: prismaJob.location,
      startAt: prismaJob.startAt,
      endAt: prismaJob.endAt,
      headcount: prismaJob.headcount,
      compensation: prismaJob.compensation,
      deadline: prismaJob.deadline,
      status: prismaJob.status,
      createdAt: prismaJob.createdAt,
      updatedAt: prismaJob.updatedAt,
    };
  }
}

export const jobService = new JobService();