import { ZodError } from "zod";
import { PrismaClientKnownRequestError } from "@prisma/client/runtime/library";

export enum ErrorType {
  VALIDATION = "VALIDATION",
  AUTHORIZATION = "AUTHORIZATION",
  NOT_FOUND = "NOT_FOUND",
  BUSINESS_LOGIC = "BUSINESS_LOGIC",
  EXTERNAL_SERVICE = "EXTERNAL_SERVICE",
  SYSTEM = "SYSTEM",
}

export interface AppError {
  type: ErrorType;
  code: string;
  message: string;
  details?: Record<string, any>;
  statusCode: number;
}

export class BusinessLogicError extends Error {
  public readonly type = ErrorType.BUSINESS_LOGIC;
  public readonly code: string;
  public readonly statusCode: number;
  public readonly details?: Record<string, any>;

  constructor(
    code: string,
    message: string,
    statusCode: number = 400,
    details?: Record<string, any>
  ) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.name = "BusinessLogicError";
  }
}

export class NotFoundError extends Error {
  public readonly type = ErrorType.NOT_FOUND;
  public readonly code = "NOT_FOUND";
  public readonly statusCode = 404;

  constructor(resource: string, id?: string) {
    const message = id ? `${resource} with ID ${id} not found` : `${resource} not found`;
    super(message);
    this.name = "NotFoundError";
  }
}

export class AuthorizationError extends Error {
  public readonly type = ErrorType.AUTHORIZATION;
  public readonly code: string;
  public readonly statusCode: number;

  constructor(code: string = "UNAUTHORIZED", message: string = "Unauthorized", statusCode: number = 401) {
    super(message);
    this.code = code;
    this.statusCode = statusCode;
    this.name = "AuthorizationError";
  }
}

export function handlePrismaError(error: PrismaClientKnownRequestError): AppError {
  switch (error.code) {
    case "P2002":
      return {
        type: ErrorType.VALIDATION,
        code: "UNIQUE_CONSTRAINT_VIOLATION",
        message: "A record with this information already exists",
        details: { fields: error.meta?.target },
        statusCode: 409,
      };
    case "P2025":
      return {
        type: ErrorType.NOT_FOUND,
        code: "RECORD_NOT_FOUND",
        message: "The requested record was not found",
        statusCode: 404,
      };
    case "P2003":
      return {
        type: ErrorType.VALIDATION,
        code: "FOREIGN_KEY_CONSTRAINT_VIOLATION",
        message: "Referenced record does not exist",
        details: { field: error.meta?.field_name },
        statusCode: 400,
      };
    default:
      return {
        type: ErrorType.SYSTEM,
        code: "DATABASE_ERROR",
        message: "A database error occurred",
        details: { prismaCode: error.code },
        statusCode: 500,
      };
  }
}

export function handleZodError(error: ZodError): AppError {
  return {
    type: ErrorType.VALIDATION,
    code: "VALIDATION_FAILED",
    message: "Input validation failed",
    details: error.flatten(),
    statusCode: 400,
  };
}

export function globalErrorHandler(error: unknown): AppError {
  if (error instanceof ZodError) {
    return handleZodError(error);
  }

  if (error instanceof PrismaClientKnownRequestError) {
    return handlePrismaError(error);
  }

  if (error instanceof BusinessLogicError || error instanceof NotFoundError || error instanceof AuthorizationError) {
    return {
      type: error.type,
      code: error.code,
      message: error.message,
      details: error.details,
      statusCode: error.statusCode,
    };
  }

  if (error instanceof Error) {
    return {
      type: ErrorType.SYSTEM,
      code: "INTERNAL_ERROR",
      message: process.env.NODE_ENV === "production" ? "An unexpected error occurred" : error.message,
      statusCode: 500,
    };
  }

  return {
    type: ErrorType.SYSTEM,
    code: "UNKNOWN_ERROR",
    message: "An unknown error occurred",
    statusCode: 500,
  };
}

export function createErrorResponse(error: AppError) {
  return Response.json(
    {
      success: false,
      error: error.message,
      code: error.code,
      ...(error.details && { details: error.details }),
    },
    { status: error.statusCode }
  );
}