import { z } from "zod";
import { OrderStatus } from "@prisma/client";
import { jobCompensationSchema } from "./job";

export const contractTermsSchema = z.object({
  startDate: z.date(),
  endDate: z.date(),
  location: z.string().min(1, "Location is required"),
  compensation: jobCompensationSchema,
  responsibilities: z
    .array(z.string())
    .min(1, "At least one responsibility is required"),
  cancellationPolicy: z.string().min(1, "Cancellation policy is required"),
  specialRequirements: z.array(z.string()).optional(),
}).refine((data) => data.endDate > data.startDate, {
  message: "End date must be after start date",
  path: ["endDate"],
});

export const createJobOrderSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  templateType: z.string().optional(),
  customDocumentUrl: z.string().url().optional(),
  terms: contractTermsSchema,
}).refine((data) => data.templateType || data.customDocumentUrl, {
  message: "Either template type or custom document URL is required",
});

export const updateJobOrderSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  rejectionReason: z.string().optional(),
}).refine((data) => {
  if (data.status === OrderStatus.REJECTED && !data.rejectionReason) {
    return false;
  }
  return true;
}, {
  message: "Rejection reason is required when rejecting an order",
  path: ["rejectionReason"],
});

export type ContractTermsInput = z.infer<typeof contractTermsSchema>;
export type CreateJobOrderInput = z.infer<typeof createJobOrderSchema>;
export type UpdateJobOrderInput = z.infer<typeof updateJobOrderSchema>;