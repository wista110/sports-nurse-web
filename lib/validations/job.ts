import { z } from "zod";
import { JobStatus } from "@prisma/client";

export const jobLocationSchema = z.object({
  prefecture: z.string().min(1, "Prefecture is required"),
  city: z.string().min(1, "City is required"),
  venue: z.string().min(1, "Venue is required"),
  address: z.string().optional(),
});

export const jobCompensationSchema = z.object({
  type: z.enum(["hourly", "fixed"], {
    required_error: "Compensation type is required",
  }),
  amount: z.number().min(0, "Amount must be non-negative"),
  currency: z.literal("JPY"),
});

const baseJobSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title is too long"),
  description: z
    .string()
    .min(10, "Description must be at least 10 characters")
    .max(2000, "Description is too long"),
  categories: z
    .array(z.string())
    .min(1, "At least one category is required")
    .max(5, "Maximum 5 categories allowed"),
  location: jobLocationSchema,
  startAt: z.date().min(new Date(), "Start time must be in the future"),
  endAt: z.date(),
  headcount: z.number().int().min(1, "At least 1 nurse is required"),
  compensation: jobCompensationSchema,
  deadline: z.date(),
});

export const createJobSchema = baseJobSchema.refine((data) => data.endAt > data.startAt, {
  message: "End time must be after start time",
  path: ["endAt"],
}).refine((data) => data.deadline <= data.startAt, {
  message: "Application deadline must be before or equal to start time",
  path: ["deadline"],
});

export const updateJobSchema = baseJobSchema.partial().extend({
  status: z.nativeEnum(JobStatus).optional(),
}).refine((data) => {
  if (data.startAt && data.endAt) {
    return data.endAt > data.startAt;
  }
  return true;
}, {
  message: "End time must be after start time",
  path: ["endAt"],
}).refine((data) => {
  if (data.startAt && data.deadline) {
    return data.deadline <= data.startAt;
  }
  return true;
}, {
  message: "Application deadline must be before or equal to start time",
  path: ["deadline"],
});

export const jobFiltersSchema = z.object({
  prefecture: z.string().optional(),
  city: z.string().optional(),
  categories: z.array(z.string()).optional(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
  minCompensation: z.number().min(0).optional(),
  maxCompensation: z.number().min(0).optional(),
  compensationType: z.enum(["hourly", "fixed"]).optional(),
  status: z.array(z.nativeEnum(JobStatus)).optional(),
  search: z.string().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
});

export const quoteItemSchema = z.object({
  description: z.string().min(1, "Description is required"),
  amount: z.number().min(0, "Amount must be non-negative"),
});

export const applicationQuoteSchema = z.object({
  breakdown: z.array(quoteItemSchema).min(1, "At least one quote item is required"),
  total: z.number().min(0, "Total must be non-negative"),
  currency: z.literal("JPY"),
});

export const createApplicationSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  message: z
    .string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message is too long"),
  quote: applicationQuoteSchema.optional(),
});

export type CreateJobInput = z.infer<typeof createJobSchema>;
export type UpdateJobInput = z.infer<typeof updateJobSchema>;
export type JobFiltersInput = z.infer<typeof jobFiltersSchema>;
export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type ApplicationQuoteInput = z.infer<typeof applicationQuoteSchema>;