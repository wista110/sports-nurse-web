import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { UserRole } from "@prisma/client";

export interface AuthenticatedRequest extends NextRequest {
  user: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export function requireAuth() {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    // Add user info to request
    (request as AuthenticatedRequest).user = {
      id: token.sub!,
      email: token.email!,
      role: token.role as UserRole,
    };

    return null; // Allow request to proceed
  };
}

export function requireRole(allowedRoles: UserRole[]) {
  return async (request: NextRequest): Promise<NextResponse | null> => {
    const token = await getToken({ req: request });

    if (!token) {
      return NextResponse.json(
        { error: "Authentication required" },
        { status: 401 }
      );
    }

    const userRole = token.role as UserRole;
    if (!allowedRoles.includes(userRole)) {
      return NextResponse.json(
        { error: "Insufficient permissions" },
        { status: 403 }
      );
    }

    // Add user info to request
    (request as AuthenticatedRequest).user = {
      id: token.sub!,
      email: token.email!,
      role: userRole,
    };

    return null; // Allow request to proceed
  };
}

export function requireAdmin() {
  return requireRole([UserRole.ADMIN]);
}

export function requireOrganizer() {
  return requireRole([UserRole.ADMIN, UserRole.ORGANIZER]);
}

export function requireNurse() {
  return requireRole([UserRole.ADMIN, UserRole.NURSE]);
}

export function requireOrganizerOrNurse() {
  return requireRole([UserRole.ADMIN, UserRole.ORGANIZER, UserRole.NURSE]);
}