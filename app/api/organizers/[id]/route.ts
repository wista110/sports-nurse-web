import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    if (!id) {
      return NextResponse.json(
        { error: "Organizer ID is required" },
        { status: 400 }
      );
    }

    // Fetch organizer profile (public information only)
    const organizer = await prisma.user.findUnique({
      where: { 
        id,
        role: UserRole.ORGANIZER 
      },
      select: {
        id: true,
        profile: true,
        createdAt: true,
        // Include aggregated review data
        receivedReviews: {
          select: {
            rating: true,
          },
        },
      },
    });

    if (!organizer) {
      return NextResponse.json(
        { error: "Organizer not found" },
        { status: 404 }
      );
    }

    // Calculate rating statistics
    const reviews = organizer.receivedReviews;
    const ratingCount = reviews.length;
    const ratingAverage = ratingCount > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / ratingCount
      : 0;

    // Update profile with calculated ratings
    const profileWithRatings = {
      ...organizer.profile,
      ratingCount,
      ratingAverage: ratingCount > 0 ? ratingAverage : undefined,
    };

    const publicOrganizerData = {
      id: organizer.id,
      profile: profileWithRatings,
      createdAt: organizer.createdAt,
    };

    return NextResponse.json({
      success: true,
      data: publicOrganizerData,
    });
  } catch (error) {
    console.error("Organizer profile fetch error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}