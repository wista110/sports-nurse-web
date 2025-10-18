import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jobService } from "@/lib/services/job";
import { updateJobSchema } from "@/lib/validations/job";
import { UserRole } from "@prisma/client";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const job = await jobService.getJobById(params.id);

    if (!job) {
      return NextResponse.json(
        { success: false, error: "Job not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: job,
    });
  } catch (error) {
    console.error("Error fetching job:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch job" },
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

    if (session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json(
        { success: false, error: "Only organizers can update jobs" },
        { status: 403 }
      );
    }

    const body = await request.json();
    
    // Convert date strings to Date objects if present
    const processedBody = { ...body };
    if (body.startAt) processedBody.startAt = new Date(body.startAt);
    if (body.endAt) processedBody.endAt = new Date(body.endAt);
    if (body.deadline) processedBody.deadline = new Date(body.deadline);

    const validatedData = updateJobSchema.parse(processedBody);
    const job = await jobService.updateJob(params.id, session.user.id, validatedData);

    return NextResponse.json({
      success: true,
      data: job,
      message: "Job updated successfully",
    });
  } catch (error) {
    console.error("Error updating job:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to update job" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    if (session.user.role !== UserRole.ORGANIZER) {
      return NextResponse.json(
        { success: false, error: "Only organizers can delete jobs" },
        { status: 403 }
      );
    }

    await jobService.deleteJob(params.id, session.user.id);

    return NextResponse.json({
      success: true,
      message: "Job deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting job:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to delete job" },
      { status: 500 }
    );
  }
}