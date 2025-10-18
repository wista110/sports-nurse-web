import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jobService } from "@/lib/services/job";
import { UserRole } from "@prisma/client";

interface RouteParams {
  params: {
    id: string;
  };
}

export async function POST(request: NextRequest, { params }: RouteParams) {
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
        { success: false, error: "Only organizers can publish jobs" },
        { status: 403 }
      );
    }

    const job = await jobService.publishJob(params.id, session.user.id);

    return NextResponse.json({
      success: true,
      data: job,
      message: "Job published successfully",
    });
  } catch (error) {
    console.error("Error publishing job:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to publish job" },
      { status: 500 }
    );
  }
}