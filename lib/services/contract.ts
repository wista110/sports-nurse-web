import { prisma } from "@/lib/prisma";
import { OrderStatus } from "@prisma/client";
import { auditService } from "./audit";
import type { CreateJobOrderInput, UpdateJobOrderInput } from "@/lib/validations/contract";
import type { JobOrder, ContractTerms } from "@/types/domain";

export class ContractService {
  async createJobOrder(data: CreateJobOrderInput, actorId: string): Promise<JobOrder> {
    const jobOrder = await prisma.jobOrder.create({
      data: {
        jobId: data.jobId,
        templateType: data.templateType,
        customDocumentUrl: data.customDocumentUrl,
        terms: data.terms as any,
        status: OrderStatus.PENDING,
      },
    });

    // Update job status to contracted
    await prisma.job.update({
      where: { id: data.jobId },
      data: { status: "CONTRACTED" },
    });

    // Create audit log
    await auditService.logAction({
      actorId,
      action: "CREATE_JOB_ORDER",
      target: `job_order:${jobOrder.id}`,
      metadata: {
        jobId: data.jobId,
        templateType: data.templateType,
        hasCustomDocument: !!data.customDocumentUrl,
      },
    });

    return {
      ...jobOrder,
      terms: jobOrder.terms as ContractTerms,
    };
  }

  async updateJobOrderStatus(
    orderId: string,
    data: UpdateJobOrderInput,
    actorId: string
  ): Promise<JobOrder> {
    const jobOrder = await prisma.jobOrder.update({
      where: { id: orderId },
      data: {
        status: data.status,
        acceptedAt: data.status === OrderStatus.ACCEPTED ? new Date() : undefined,
      },
    });

    // Update job status based on order status
    if (data.status === OrderStatus.ACCEPTED) {
      await prisma.job.update({
        where: { id: jobOrder.jobId },
        data: { status: "ESCROW_HOLDING" },
      });
    } else if (data.status === OrderStatus.REJECTED) {
      await prisma.job.update({
        where: { id: jobOrder.jobId },
        data: { status: "APPLIED" },
      });
    }

    // Create audit log
    await auditService.logAction({
      actorId,
      action: "UPDATE_JOB_ORDER_STATUS",
      target: `job_order:${orderId}`,
      metadata: {
        newStatus: data.status,
        rejectionReason: data.rejectionReason,
      },
    });

    return {
      ...jobOrder,
      terms: jobOrder.terms as ContractTerms,
    };
  }

  async getJobOrderByJobId(jobId: string): Promise<JobOrder | null> {
    const jobOrder = await prisma.jobOrder.findFirst({
      where: { jobId },
      orderBy: { createdAt: "desc" },
    });

    if (!jobOrder) return null;

    return {
      ...jobOrder,
      terms: jobOrder.terms as ContractTerms,
    };
  }

  async getJobOrderById(orderId: string): Promise<JobOrder | null> {
    const jobOrder = await prisma.jobOrder.findUnique({
      where: { id: orderId },
    });

    if (!jobOrder) return null;

    return {
      ...jobOrder,
      terms: jobOrder.terms as ContractTerms,
    };
  }

  async getJobOrdersForJob(jobId: string): Promise<JobOrder[]> {
    const jobOrders = await prisma.jobOrder.findMany({
      where: { jobId },
      orderBy: { createdAt: "desc" },
    });

    return jobOrders.map((order) => ({
      ...order,
      terms: order.terms as ContractTerms,
    }));
  }
}

export const contractService = new ContractService();