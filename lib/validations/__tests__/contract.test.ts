import { OrderStatus } from "@prisma/client";
import {
  contractTermsSchema,
  createJobOrderSchema,
  updateJobOrderSchema,
} from "../contract";

describe("Contract Validation Schemas", () => {
  describe("contractTermsSchema", () => {
    const validTerms = {
      startDate: new Date("2024-01-01T10:00:00Z"),
      endDate: new Date("2024-01-01T18:00:00Z"),
      location: "Test Location",
      compensation: {
        type: "fixed" as const,
        amount: 50000,
        currency: "JPY" as const,
      },
      responsibilities: ["Provide medical support", "Monitor athlete health"],
      cancellationPolicy: "24 hours notice required",
    };

    it("should validate valid contract terms", () => {
      const result = contractTermsSchema.safeParse(validTerms);
      expect(result.success).toBe(true);
    });

    it("should validate contract terms with special requirements", () => {
      const termsWithSpecialRequirements = {
        ...validTerms,
        specialRequirements: ["CPR certification", "Sports medicine experience"],
      };

      const result = contractTermsSchema.safeParse(termsWithSpecialRequirements);
      expect(result.success).toBe(true);
    });

    it("should reject terms with end date before start date", () => {
      const invalidTerms = {
        ...validTerms,
        startDate: new Date("2024-01-01T18:00:00Z"),
        endDate: new Date("2024-01-01T10:00:00Z"),
      };

      const result = contractTermsSchema.safeParse(invalidTerms);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("End date must be after start date");
    });

    it("should reject terms with empty location", () => {
      const invalidTerms = {
        ...validTerms,
        location: "",
      };

      const result = contractTermsSchema.safeParse(invalidTerms);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Location is required");
    });

    it("should reject terms with empty responsibilities", () => {
      const invalidTerms = {
        ...validTerms,
        responsibilities: [],
      };

      const result = contractTermsSchema.safeParse(invalidTerms);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("At least one responsibility is required");
    });

    it("should reject terms with empty cancellation policy", () => {
      const invalidTerms = {
        ...validTerms,
        cancellationPolicy: "",
      };

      const result = contractTermsSchema.safeParse(invalidTerms);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Cancellation policy is required");
    });

    it("should reject terms with invalid compensation", () => {
      const invalidTerms = {
        ...validTerms,
        compensation: {
          type: "invalid",
          amount: -1000,
          currency: "USD",
        },
      };

      const result = contractTermsSchema.safeParse(invalidTerms);
      expect(result.success).toBe(false);
    });
  });

  describe("createJobOrderSchema", () => {
    const validJobOrder = {
      jobId: "job-123",
      templateType: "standard",
      terms: {
        startDate: new Date("2024-01-01T10:00:00Z"),
        endDate: new Date("2024-01-01T18:00:00Z"),
        location: "Test Location",
        compensation: {
          type: "fixed" as const,
          amount: 50000,
          currency: "JPY" as const,
        },
        responsibilities: ["Provide medical support"],
        cancellationPolicy: "24 hours notice required",
      },
    };

    it("should validate job order with template type", () => {
      const result = createJobOrderSchema.safeParse(validJobOrder);
      expect(result.success).toBe(true);
    });

    it("should validate job order with custom document URL", () => {
      const jobOrderWithCustomDoc = {
        jobId: "job-123",
        customDocumentUrl: "https://example.com/contract.pdf",
        terms: validJobOrder.terms,
      };

      const result = createJobOrderSchema.safeParse(jobOrderWithCustomDoc);
      expect(result.success).toBe(true);
    });

    it("should validate job order with both template and custom document", () => {
      const jobOrderWithBoth = {
        ...validJobOrder,
        customDocumentUrl: "https://example.com/contract.pdf",
      };

      const result = createJobOrderSchema.safeParse(jobOrderWithBoth);
      expect(result.success).toBe(true);
    });

    it("should reject job order without template or custom document", () => {
      const invalidJobOrder = {
        jobId: "job-123",
        terms: validJobOrder.terms,
      };

      const result = createJobOrderSchema.safeParse(invalidJobOrder);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        "Either template type or custom document URL is required"
      );
    });

    it("should reject job order with empty job ID", () => {
      const invalidJobOrder = {
        ...validJobOrder,
        jobId: "",
      };

      const result = createJobOrderSchema.safeParse(invalidJobOrder);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe("Job ID is required");
    });

    it("should reject job order with invalid custom document URL", () => {
      const invalidJobOrder = {
        jobId: "job-123",
        customDocumentUrl: "not-a-valid-url",
        terms: validJobOrder.terms,
      };

      const result = createJobOrderSchema.safeParse(invalidJobOrder);
      expect(result.success).toBe(false);
    });
  });

  describe("updateJobOrderSchema", () => {
    it("should validate order acceptance", () => {
      const updateData = {
        status: OrderStatus.ACCEPTED,
      };

      const result = updateJobOrderSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it("should validate order rejection with reason", () => {
      const updateData = {
        status: OrderStatus.REJECTED,
        rejectionReason: "Terms not acceptable",
      };

      const result = updateJobOrderSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it("should reject order rejection without reason", () => {
      const updateData = {
        status: OrderStatus.REJECTED,
      };

      const result = updateJobOrderSchema.safeParse(updateData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        "Rejection reason is required when rejecting an order"
      );
    });

    it("should reject order rejection with empty reason", () => {
      const updateData = {
        status: OrderStatus.REJECTED,
        rejectionReason: "",
      };

      const result = updateJobOrderSchema.safeParse(updateData);
      expect(result.success).toBe(false);
      expect(result.error?.issues[0].message).toBe(
        "Rejection reason is required when rejecting an order"
      );
    });

    it("should validate order cancellation", () => {
      const updateData = {
        status: OrderStatus.CANCELLED,
      };

      const result = updateJobOrderSchema.safeParse(updateData);
      expect(result.success).toBe(true);
    });

    it("should reject invalid status", () => {
      const updateData = {
        status: "INVALID_STATUS" as any,
      };

      const result = updateJobOrderSchema.safeParse(updateData);
      expect(result.success).toBe(false);
    });
  });
});