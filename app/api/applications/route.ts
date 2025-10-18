import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { applicationService } from "@/lib/services/application";
import { createApplicationSchema } from "@/lib/validations/job";
import { UserRole } from "@prisma/client";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== UserRole.NURSE) {
      return NextResponse.json(
        { success: false, error: "Only nurses can apply to jobs" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createApplicationSchema.parse(body);

    const application = await applicationService.createApplication(
      session.user.id, 
      validatedData
    );

    return NextResponse.json({
      success: true,
      data: application,
      message: "Application submitted successfully",
    });
  } catch (error) {
    console.error("Error creating application:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create application" },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== UserRole.NURSE) {
      return NextResponse.json(
        { success: false, error: "Only nurses can view their applications" },
        { status: 403 }
      );
    }

    const applications = await applicationService.getApplicationsByNurse(session.user.id);

    return NextResponse.json({
      success: true,
      data: applications,
    });
  } catch (error) {
    console.error("Error fetching applications:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch applications" },
      { status: 500 }
    );
  }
}