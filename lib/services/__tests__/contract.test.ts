import { ContractService } from "../contract";
import { OrderStatus } from "@prisma/client";

// Mock dependencies
jest.mock("@/lib/prisma", () => ({
  prisma: {
    jobOrder: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
    job: {
      update: jest.fn(),
    },
  },
}));

jest.mock("../audit", () => ({
  auditService: {
    logAction: jest.fn(),
  },
}));

import { prisma } from "@/lib/prisma";
import { auditService } from "../audit";

describe("ContractService", () => {
  let contractService: ContractService;

  beforeEach(() => {
    contractService = new ContractService();
    jest.clearAllMocks();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe("createJobOrder", () => {
    it("should create a job order successfully", async () => {
      const mockJobOrder = {
        id: "order-1",
        jobId: "job-1",
        templateType: "standard",
        customDocumentUrl: null,
        terms: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-02"),
          location: "Test Location",
          compensation: { type: "fixed", amount: 50000, currency: "JPY" },
          responsibilities: ["Test responsibility"],
          cancellationPolicy: "Test policy",
        },
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        acceptedAt: null,
      };

      const createData = {
        jobId: "job-1",
        templateType: "standard",
        terms: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-02"),
          location: "Test Location",
          compensation: { type: "fixed" as const, amount: 50000, currency: "JPY" as const },
          responsibilities: ["Test responsibility"],
          cancellationPolicy: "Test policy",
        },
      };

      (prisma.jobOrder.create as any).mockResolvedValue(mockJobOrder);
      (prisma.job.update as any).mockResolvedValue({});
      (auditService.logAction as any).mockResolvedValue({});

      const result = await contractService.createJobOrder(createData, "user-1");

      expect(prisma.jobOrder.create).toHaveBeenCalledWith({
        data: {
          jobId: "job-1",
          templateType: "standard",
          customDocumentUrl: undefined,
          terms: createData.terms,
          status: OrderStatus.PENDING,
        },
      });

      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: "job-1" },
        data: { status: "CONTRACTED" },
      });

      expect(auditService.logAction).toHaveBeenCalledWith({
        actorId: "user-1",
        action: "CREATE_JOB_ORDER",
        target: "job_order:order-1",
        metadata: {
          jobId: "job-1",
          templateType: "standard",
          hasCustomDocument: false,
        },
      });

      expect(result).toEqual(mockJobOrder);
    });

    it("should create a job order with custom document", async () => {
      const mockJobOrder = {
        id: "order-1",
        jobId: "job-1",
        templateType: null,
        customDocumentUrl: "https://example.com/contract.pdf",
        terms: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-02"),
          location: "Test Location",
          compensation: { type: "fixed", amount: 50000, currency: "JPY" },
          responsibilities: ["Test responsibility"],
          cancellationPolicy: "Test policy",
        },
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        acceptedAt: null,
      };

      const createData = {
        jobId: "job-1",
        customDocumentUrl: "https://example.com/contract.pdf",
        terms: {
          startDate: new Date("2024-01-01"),
          endDate: new Date("2024-01-02"),
          location: "Test Location",
          compensation: { type: "fixed" as const, amount: 50000, currency: "JPY" as const },
          responsibilities: ["Test responsibility"],
          cancellationPolicy: "Test policy",
        },
      };

      (prisma.jobOrder.create as any).mockResolvedValue(mockJobOrder);
      (prisma.job.update as any).mockResolvedValue({});
      (auditService.logAction as any).mockResolvedValue({});

      const result = await contractService.createJobOrder(createData, "user-1");

      expect(auditService.logAction).toHaveBeenCalledWith({
        actorId: "user-1",
        action: "CREATE_JOB_ORDER",
        target: "job_order:order-1",
        metadata: {
          jobId: "job-1",
          templateType: undefined,
          hasCustomDocument: true,
        },
      });

      expect(result).toEqual(mockJobOrder);
    });
  });

  describe("updateJobOrderStatus", () => {
    it("should accept a job order successfully", async () => {
      const mockJobOrder = {
        id: "order-1",
        jobId: "job-1",
        templateType: "standard",
        customDocumentUrl: null,
        terms: {},
        status: OrderStatus.ACCEPTED,
        createdAt: new Date(),
        acceptedAt: new Date(),
      };

      (prisma.jobOrder.update as any).mockResolvedValue(mockJobOrder);
      (prisma.job.update as any).mockResolvedValue({});
      (auditService.logAction as any).mockResolvedValue({});

      const result = await contractService.updateJobOrderStatus(
        "order-1",
        { status: OrderStatus.ACCEPTED },
        "user-1"
      );

      expect(prisma.jobOrder.update).toHaveBeenCalledWith({
        where: { id: "order-1" },
        data: {
          status: OrderStatus.ACCEPTED,
          acceptedAt: expect.any(Date),
        },
      });

      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: "job-1" },
        data: { status: "ESCROW_HOLDING" },
      });

      expect(auditService.logAction).toHaveBeenCalledWith({
        actorId: "user-1",
        action: "UPDATE_JOB_ORDER_STATUS",
        target: "job_order:order-1",
        metadata: {
          newStatus: OrderStatus.ACCEPTED,
          rejectionReason: undefined,
        },
      });

      expect(result).toEqual(mockJobOrder);
    });

    it("should reject a job order successfully", async () => {
      const mockJobOrder = {
        id: "order-1",
        jobId: "job-1",
        templateType: "standard",
        customDocumentUrl: null,
        terms: {},
        status: OrderStatus.REJECTED,
        createdAt: new Date(),
        acceptedAt: null,
      };

      (prisma.jobOrder.update as any).mockResolvedValue(mockJobOrder);
      (prisma.job.update as any).mockResolvedValue({});
      (auditService.logAction as any).mockResolvedValue({});

      const result = await contractService.updateJobOrderStatus(
        "order-1",
        { status: OrderStatus.REJECTED, rejectionReason: "Terms not acceptable" },
        "user-1"
      );

      expect(prisma.job.update).toHaveBeenCalledWith({
        where: { id: "job-1" },
        data: { status: "APPLIED" },
      });

      expect(auditService.logAction).toHaveBeenCalledWith({
        actorId: "user-1",
        action: "UPDATE_JOB_ORDER_STATUS",
        target: "job_order:order-1",
        metadata: {
          newStatus: OrderStatus.REJECTED,
          rejectionReason: "Terms not acceptable",
        },
      });

      expect(result).toEqual(mockJobOrder);
    });
  });

  describe("getJobOrderByJobId", () => {
    it("should return the most recent job order for a job", async () => {
      const mockJobOrder = {
        id: "order-1",
        jobId: "job-1",
        templateType: "standard",
        customDocumentUrl: null,
        terms: {},
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        acceptedAt: null,
      };

      (prisma.jobOrder.findFirst as any).mockResolvedValue(mockJobOrder);

      const result = await contractService.getJobOrderByJobId("job-1");

      expect(prisma.jobOrder.findFirst).toHaveBeenCalledWith({
        where: { jobId: "job-1" },
        orderBy: { createdAt: "desc" },
      });

      expect(result).toEqual(mockJobOrder);
    });

    it("should return null if no job order exists", async () => {
      (prisma.jobOrder.findFirst as any).mockResolvedValue(null);

      const result = await contractService.getJobOrderByJobId("job-1");

      expect(result).toBeNull();
    });
  });

  describe("getJobOrderById", () => {
    it("should return a job order by ID", async () => {
      const mockJobOrder = {
        id: "order-1",
        jobId: "job-1",
        templateType: "standard",
        customDocumentUrl: null,
        terms: {},
        status: OrderStatus.PENDING,
        createdAt: new Date(),
        acceptedAt: null,
      };

      (prisma.jobOrder.findUnique as any).mockResolvedValue(mockJobOrder);

      const result = await contractService.getJobOrderById("order-1");

      expect(prisma.jobOrder.findUnique).toHaveBeenCalledWith({
        where: { id: "order-1" },
      });

      expect(result).toEqual(mockJobOrder);
    });

    it("should return null if job order not found", async () => {
      (prisma.jobOrder.findUnique as any).mockResolvedValue(null);

      const result = await contractService.getJobOrderById("order-1");

      expect(result).toBeNull();
    });
  });

  describe("getJobOrdersForJob", () => {
    it("should return all job orders for a job", async () => {
      const mockJobOrders = [
        {
          id: "order-1",
          jobId: "job-1",
          templateType: "standard",
          customDocumentUrl: null,
          terms: {},
          status: OrderStatus.ACCEPTED,
          createdAt: new Date("2024-01-02"),
          acceptedAt: new Date(),
        },
        {
          id: "order-2",
          jobId: "job-1",
          templateType: "event",
          customDocumentUrl: null,
          terms: {},
          status: OrderStatus.REJECTED,
          createdAt: new Date("2024-01-01"),
          acceptedAt: null,
        },
      ];

      (prisma.jobOrder.findMany as any).mockResolvedValue(mockJobOrders);

      const result = await contractService.getJobOrdersForJob("job-1");

      expect(prisma.jobOrder.findMany).toHaveBeenCalledWith({
        where: { jobId: "job-1" },
        orderBy: { createdAt: "desc" },
      });

      expect(result).toEqual(mockJobOrders);
    });
  });
});