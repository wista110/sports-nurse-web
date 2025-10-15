import { z } from "zod";
import { UserRole } from "@prisma/client";

export const signUpSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      "Password must contain at least one uppercase letter, one lowercase letter, and one number"
    ),
  confirmPassword: z.string(),
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  role: z.nativeEnum(UserRole),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signInSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const userProfileSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name is too long"),
  phone: z.string().optional(),
  city: z.string().min(1, "City is required"),
  prefecture: z.string().min(1, "Prefecture is required"),
  licenseNumber: z.string().optional(),
  skills: z.array(z.string()).optional(),
  organizationName: z.string().optional(),
});

export const nurseProfileSchema = userProfileSchema.extend({
  licenseNumber: z.string().min(1, "License number is required for nurses"),
  skills: z.array(z.string()).min(1, "At least one skill is required"),
});

export const organizerProfileSchema = userProfileSchema.extend({
  organizationName: z.string().min(1, "Organization name is required"),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type UserProfileInput = z.infer<typeof userProfileSchema>;
export type NurseProfileInput = z.infer<typeof nurseProfileSchema>;
export type OrganizerProfileInput = z.infer<typeof organizerProfileSchema>;