import { z } from "zod";

export const createReviewSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  targetId: z.string().min(1, "Target user ID is required"),
  rating: z.number().int().min(1, "Rating must be at least 1").max(5, "Rating must be at most 5"),
  tags: z
    .array(z.string())
    .min(1, "At least one tag is required")
    .max(10, "Maximum 10 tags allowed"),
  comment: z
    .string()
    .min(10, "Comment must be at least 10 characters")
    .max(1000, "Comment is too long"),
});

export const attendanceRecordSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  nurseId: z.string().min(1, "Nurse ID is required"),
  checkInAt: z.date().optional(),
  checkOutAt: z.date().optional(),
  notes: z.string().max(500, "Notes are too long").optional(),
  irregularities: z.string().max(500, "Irregularities description is too long").optional(),
}).refine((data) => {
  if (data.checkInAt && data.checkOutAt) {
    return data.checkOutAt > data.checkInAt;
  }
  return true;
}, {
  message: "Check-out time must be after check-in time",
  path: ["checkOutAt"],
});

export const updateAttendanceSchema = attendanceRecordSchema.partial().omit({
  jobId: true,
  nurseId: true,
});

export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type AttendanceRecordInput = z.infer<typeof attendanceRecordSchema>;
export type UpdateAttendanceInput = z.infer<typeof updateAttendanceSchema>;