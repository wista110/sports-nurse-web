import { z } from "zod";

export const messageAttachmentSchema = z.object({
  filename: z.string().min(1, "Filename is required"),
  url: z.string().url("Invalid URL"),
  type: z.string().min(1, "File type is required"),
  size: z.number().min(1, "File size must be positive"),
});

export const sendMessageSchema = z.object({
  threadId: z.string().min(1, "Thread ID is required"),
  content: z
    .string()
    .min(1, "Message content is required")
    .max(2000, "Message is too long"),
  attachments: z.array(messageAttachmentSchema).max(5, "Maximum 5 attachments allowed").default([]),
});

export const createThreadSchema = z.object({
  jobId: z.string().min(1, "Job ID is required"),
  participants: z
    .array(z.string())
    .min(2, "At least 2 participants required")
    .max(10, "Maximum 10 participants allowed"),
});

export const markAsReadSchema = z.object({
  messageIds: z.array(z.string()).min(1, "At least one message ID required"),
});

export const fileUploadSchema = z.object({
  file: z.instanceof(File),
  maxSize: z.number().default(10 * 1024 * 1024), // 10MB default
  allowedTypes: z.array(z.string()).default([
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ]),
}).refine((data) => data.file.size <= data.maxSize, {
  message: "File size exceeds maximum allowed size",
}).refine((data) => data.allowedTypes.includes(data.file.type), {
  message: "File type not allowed",
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>;
export type CreateThreadInput = z.infer<typeof createThreadSchema>;
export type MarkAsReadInput = z.infer<typeof markAsReadSchema>;
export type FileUploadInput = z.infer<typeof fileUploadSchema>;