import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { applicationService } from "@/lib/services/application";
import { UserRole, ApplicationStatus } from "@prisma/client";
import { z } from "zod";

interface RouteParams {
  params: {
    id: string;
  };
}

const updateApplicationSchema = z.object({
  status: z.nativeEnum(ApplicationStatus),
});

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const application = await applicationService.getApplicationById(params.id);

    if (!application) {
      return NextResponse.json(
        { success: false, error: "Application not found" },
        { status: 404 }
      );
    }

    // Check access permissions
    const canAccess = 
      session.user.id === application.nurseId || // Nurse who applied
      (session.user.role === UserRole.ORGANIZER && 
       application.job?.organizerId === session.user.id); // Job organizer

    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: "Access denied" },
        { status: 403 }
      );
    }

    return NextResponse.json({
      success: true,
      data: application,
    });
  } catch (error) {
    console.error("Error fetching application:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch application" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { status } = updateApplicationSchema.parse(body);

    let updatedApplication;

    if (session.user.role === UserRole.ORGANIZER) {
      // Organizer updating application status
      updatedApplication = await applicationService.updateApplicationStatus(
        params.id,
        session.user.id,
        status
      );
    } else if (session.user.role === UserRole.NURSE && status === ApplicationStatus.WITHDRAWN) {
      // Nurse withdrawing their application
      updatedApplication = await applicationService.withdrawApplication(
        params.id,
        session.user.id
      );
    } else {
      return NextResponse.json(
        { success: false, error: "Invalid operation" },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedApplication,
      message: "Application updated successfully",
    });
  } catch (error) {
    console.error("Error updating application:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update application" },
      { status: 500 }
    );
  }
}