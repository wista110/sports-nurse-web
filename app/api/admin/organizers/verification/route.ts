import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { OrganizerService } from "@/lib/services/organizer";
import { z } from "zod";

const verificationUpdateSchema = z.object({
  organizerId: z.string().min(1, "Organizer ID is required"),
  status: z.enum(["pending", "verified", "rejected"], {
    errorMap: () => ({ message: "Invalid verification status" })
  }),
  reason: z.string().optional(),
});

// GET /api/admin/organizers/verification - Get pending verifications
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const pendingOrganizers = await OrganizerService.getPendingVerifications();
    const statistics = await OrganizerService.getVerificationStatistics();

    return NextResponse.json({
      success: true,
      data: {
        pendingOrganizers,
        statistics,
      },
    });
  } catch (error) {
    console.error("Pending verifications fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// PUT /api/admin/organizers/verification - Update verification status
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if user is admin
    if (session.user.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { error: "Forbidden - Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Validate the request body
    const validation = verificationUpdateSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { 
          error: "Validation failed",
          details: validation.error.flatten()
        },
        { status: 400 }
      );
    }

    const { organizerId, status, reason } = validation.data;

    const updatedOrganizer = await OrganizerService.updateVerificationStatus({
      organizerId,
      status,
      adminId: session.user.id,
      reason,
    });

    return NextResponse.json({
      success: true,
      data: updatedOrganizer,
      message: `Organizer verification status updated to ${status}`,
    });
  } catch (error) {
    console.error("Verification status update error:", error);
    
    if (error instanceof Error && error.message === "Organizer not found") {
      return NextResponse.json(
        { error: "Organizer not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}