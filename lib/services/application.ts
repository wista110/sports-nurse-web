import { prisma } from "@/lib/prisma";
import { ApplicationStatus, JobStatus } from "@prisma/client";
import type { Application } from "@/types/domain";
import { auditService } from "./audit";
import { messagingService } from "./messaging";

export interface CreateApplicationInput {
  jobId: string;
  message: string;
  quote?: {
    breakdown: Array<{
      description: string;
      amount: number;
    }>;
    total: number;
    currency: string;
  };
}

export class ApplicationService {
  async createApplication(nurseId: string, data: CreateApplicationInput): Promise<Application> {
    // Check if job exists and is open for applications
    const job = await prisma.job.findUnique({
      where: { id: data.jobId },
    });

    if (!job) {
      throw new Error("Job not found");
    }

    if (job.status !== JobStatus.OPEN) {
      throw new Error("Job is not open for applications");
    }

    if (new Date(job.deadline) < new Date()) {
      throw new Error("Application deadline has passed");
    }

    // Check if nurse has already applied
    const existingApplication = await prisma.application.findUnique({
      where: {
        jobId_nurseId: {
          jobId: data.jobId,
          nurseId,
        },
      },
    });

    if (existingApplication) {
      throw new Error("You have already applied to this job");
    }

    // Create application
    const application = await prisma.application.create({
      data: {
        jobId: data.jobId,
        nurseId,
        message: data.message,
        quote: data.quote || null,
        status: ApplicationStatus.PENDING,
      },
    });

    // Update job status to APPLIED if this is the first application
    const applicationCount = await prisma.application.count({
      where: { jobId: data.jobId },
    });

    if (applicationCount === 1) {
      await prisma.job.update({
        where: { id: data.jobId },
        data: { status: JobStatus.APPLIED },
      });
    }

    // Create or update thread for communication
    try {
      await messagingService.createThreadForApplication(
        data.jobId,
        job.organizerId,
        nurseId
      );
    } catch (error) {
      console.error("Failed to create thread for application:", error);
      // Don't fail the application creation if thread creation fails
    }

    // Create audit log
    await auditService.logAction({
      actorId: nurseId,
      action: "application_created",
      target: `job:${data.jobId}`,
      metadata: { 
        applicationId: application.id,
        hasQuote: !!data.quote,
        quoteTotal: data.quote?.total 
      },
    });

    return this.mapPrismaApplicationToApplication(application);
  }

  async getApplicationById(applicationId: string): Promise<Application | null> {
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            organizerId: true,
          },
        },
        nurse: {
          select: {
            id: true,
            profile: true,
          },
        },
      },
    });

    if (!application) return null;

    return this.mapPrismaApplicationToApplication(application);
  }

  async getApplicationsByJob(jobId: string, organizerId: string): Promise<Application[]> {
    // Verify job ownership
    const job = await prisma.job.findFirst({
      where: { id: jobId, organizerId },
    });

    if (!job) {
      throw new Error("Job not found or access denied");
    }

    const applications = await prisma.application.findMany({
      where: { jobId },
      include: {
        nurse: {
          select: {
            id: true,
            profile: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return applications.map(app => this.mapPrismaApplicationToApplication(app));
  }

  async getApplicationsByNurse(nurseId: string): Promise<Application[]> {
    const applications = await prisma.application.findMany({
      where: { nurseId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            location: true,
            startAt: true,
            endAt: true,
            compensation: true,
            status: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return applications.map(app => this.mapPrismaApplicationToApplication(app));
  }

  async updateApplicationStatus(
    applicationId: string, 
    organizerId: string, 
    status: ApplicationStatus
  ): Promise<Application> {
    // Get application with job info to verify ownership
    const application = await prisma.application.findUnique({
      where: { id: applicationId },
      include: {
        job: true,
      },
    });

    if (!application) {
      throw new Error("Application not found");
    }

    if (application.job.organizerId !== organizerId) {
      throw new Error("Access denied");
    }

    // Update application status
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status },
    });

    // Create audit log
    await auditService.logAction({
      actorId: organizerId,
      action: "application_status_updated",
      target: `application:${applicationId}`,
      metadata: { 
        previousStatus: application.status,
        newStatus: status,
        jobId: application.jobId,
        nurseId: application.nurseId 
      },
    });

    return this.mapPrismaApplicationToApplication(updatedApplication);
  }

  async withdrawApplication(applicationId: string, nurseId: string): Promise<Application> {
    // Verify ownership
    const application = await prisma.application.findFirst({
      where: { id: applicationId, nurseId },
    });

    if (!application) {
      throw new Error("Application not found or access denied");
    }

    if (application.status !== ApplicationStatus.PENDING) {
      throw new Error("Can only withdraw pending applications");
    }

    // Update status to withdrawn
    const updatedApplication = await prisma.application.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.WITHDRAWN },
    });

    // Create audit log
    await auditService.logAction({
      actorId: nurseId,
      action: "application_withdrawn",
      target: `application:${applicationId}`,
      metadata: { 
        jobId: application.jobId 
      },
    });

    return this.mapPrismaApplicationToApplication(updatedApplication);
  }

  private mapPrismaApplicationToApplication(prismaApp: any): Application {
    return {
      id: prismaApp.id,
      jobId: prismaApp.jobId,
      nurseId: prismaApp.nurseId,
      message: prismaApp.message,
      quote: prismaApp.quote,
      status: prismaApp.status,
      createdAt: prismaApp.createdAt,
      updatedAt: prismaApp.updatedAt,
    };
  }
}

export const applicationService = new ApplicationService();