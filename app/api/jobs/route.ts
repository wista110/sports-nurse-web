import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jobService } from "@/lib/services/job";
import { createJobSchema, jobFiltersSchema } from "@/lib/validations/job";
import { UserRole } from "@prisma/client";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Parse query parameters
    const filters = {
      prefecture: searchParams.get("prefecture") || undefined,
      city: searchParams.get("city") || undefined,
      categories: searchParams.get("categories")?.split(",") || undefined,
      startDate: searchParams.get("startDate") ? new Date(searchParams.get("startDate")!) : undefined,
      endDate: searchParams.get("endDate") ? new Date(searchParams.get("endDate")!) : undefined,
      minCompensation: searchParams.get("minCompensation") ? Number(searchParams.get("minCompensation")) : undefined,
      maxCompensation: searchParams.get("maxCompensation") ? Number(searchParams.get("maxCompensation")) : undefined,
      compensationType: searchParams.get("compensationType") as "hourly" | "fixed" | undefined,
      search: searchParams.get("search") || undefined,
      page: searchParams.get("page") ? Number(searchParams.get("page")) : 1,
      limit: searchParams.get("limit") ? Number(searchParams.get("limit")) : 20,
      sort: searchParams.get("sort") || undefined,
    };

    const validatedFilters = jobFiltersSchema.parse(filters);
    const result = await jobService.searchJobs(validatedFilters);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error searching jobs:", error);
    return NextResponse.json(
      { success: false, error: "Failed to search jobs" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
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
        { success: false, error: "Only organizers can create jobs" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const validatedData = createJobSchema.parse({
      ...body,
      startAt: new Date(body.startAt),
      endAt: new Date(body.endAt),
      deadline: new Date(body.deadline),
    });

    const job = await jobService.createJob(session.user.id, validatedData);

    return NextResponse.json({
      success: true,
      data: job,
      message: "Job created successfully",
    });
  } catch (error) {
    console.error("Error creating job:", error);
    
    if (error instanceof Error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: "Failed to create job" },
      { status: 500 }
    );
  }
}