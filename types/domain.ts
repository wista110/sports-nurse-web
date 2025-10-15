import { UserRole, JobStatus, ApplicationStatus, OrderStatus, EscrowStatus } from "@prisma/client";

// User and Profile Types
export interface UserProfile {
  name: string;
  phone?: string;
  city: string;
  prefecture: string;
  // Nurse-specific fields
  licenseNumber?: string;
  skills?: string[];
  yearsOfExperience?: number;
  specializations?: string[];
  bio?: string;
  // Organizer-specific fields
  organizationName?: string;
  organizationType?: string;
  representativeName?: string;
  businessRegistrationNumber?: string;
  website?: string;
  description?: string;
  verificationStatus?: string;
  // Common fields
  ratingAverage?: number;
  ratingCount: number;
}

export interface User {
  id: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
  createdAt: Date;
  updatedAt: Date;
}

// Job Management Types
export interface JobLocation {
  prefecture: string;
  city: string;
  venue: string;
  address?: string;
}

export interface JobCompensation {
  type: "hourly" | "fixed";
  amount: number;
  currency: "JPY";
}

export interface Job {
  id: string;
  organizerId: string;
  title: string;
  description: string;
  categories: string[];
  location: JobLocation;
  startAt: Date;
  endAt: Date;
  headcount: number;
  compensation: JobCompensation;
  deadline: Date;
  status: JobStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Application Types
export interface QuoteItem {
  description: string;
  amount: number;
}

export interface ApplicationQuote {
  breakdown: QuoteItem[];
  total: number;
  currency: "JPY";
}

export interface Application {
  id: string;
  jobId: string;
  nurseId: string;
  message: string;
  quote?: ApplicationQuote;
  status: ApplicationStatus;
  createdAt: Date;
  updatedAt: Date;
}

// Communication Types
export interface MessageAttachment {
  id: string;
  filename: string;
  url: string;
  type: string;
  size: number;
}

export interface Thread {
  id: string;
  jobId: string;
  participants: string[];
  lastMessageAt: Date;
  createdAt: Date;
}

export interface Message {
  id: string;
  threadId: string;
  senderId: string;
  content: string;
  attachments: MessageAttachment[];
  readBy: string[];
  createdAt: Date;
}

// Contract Types
export interface ContractTerms {
  startDate: Date;
  endDate: Date;
  location: string;
  compensation: JobCompensation;
  responsibilities: string[];
  cancellationPolicy: string;
  specialRequirements?: string[];
}

export interface JobOrder {
  id: string;
  jobId: string;
  templateType?: string;
  customDocumentUrl?: string;
  terms: ContractTerms;
  status: OrderStatus;
  createdAt: Date;
  acceptedAt?: Date;
}

// Payment Types
export interface EscrowTransaction {
  id: string;
  jobId: string;
  amount: number;
  platformFee: number;
  status: EscrowStatus;
  createdAt: Date;
  releasedAt?: Date;
}

export interface FeeCalculation {
  baseAmount: number;
  platformFee: number;
  paymentFee: number;
  totalAmount: number;
  nurseReceives: number;
}

export type PaymentMethod = "instant" | "scheduled";

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

// Review Types
export interface Review {
  id: string;
  jobId: string;
  authorId: string;
  targetId: string;
  rating: number;
  tags: string[];
  comment: string;
  createdAt: Date;
}

// Attendance Types
export interface AttendanceRecord {
  id: string;
  jobId: string;
  nurseId: string;
  checkInAt?: Date;
  checkOutAt?: Date;
  notes?: string;
  irregularities?: string;
}

// Audit Types
export interface AuditAction {
  actorId: string;
  action: string;
  target: string;
  metadata: Record<string, any>;
}

export interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  target: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

// Filter Types
export interface JobFilters {
  prefecture?: string;
  city?: string;
  categories?: string[];
  startDate?: Date;
  endDate?: Date;
  minCompensation?: number;
  maxCompensation?: number;
  compensationType?: "hourly" | "fixed";
  status?: JobStatus[];
  search?: string;
}

export interface AuditFilters {
  actorId?: string;
  action?: string;
  target?: string;
  startDate?: Date;
  endDate?: Date;
}

// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}