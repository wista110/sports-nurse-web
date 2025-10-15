import { z } from "zod";
import { EscrowStatus } from "@prisma/client";

export const createEscrowSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  amount: z.number().min(0, "Amount must be non-negative"),
  platformFee: z.number().min(0, "Platform fee must be non-negative"),
});

export const paymentMethodSchema = z.enum(["instant", "scheduled"], {
  required_error: "Payment method is required",
});

export const processPaymentSchema = z.object({
  escrowId: z.string().min(1, "Escrow ID is required"),
  method: paymentMethodSchema,
});

export const feeCalculationSchema = z.object({
  baseAmount: z.number().min(0, "Base amount must be non-negative"),
  paymentMethod: paymentMethodSchema,
});

export const updateEscrowStatusSchema = z.object({
  status: z.nativeEnum(EscrowStatus),
  reason: z.string().optional(),
});

export type CreateEscrowInput = z.infer<typeof createEscrowSchema>;
export type ProcessPaymentInput = z.infer<typeof processPaymentSchema>;
export type FeeCalculationInput = z.infer<typeof feeCalculationSchema>;
export type UpdateEscrowStatusInput = z.infer<typeof updateEscrowStatusSchema>;