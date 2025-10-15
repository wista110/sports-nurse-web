import { prisma } from "@/lib/prisma";
import { UserRole } from "@prisma/client";
import { AuditService } from "./audit";
import type { UserProfile } from "@/types/domain";

export interface OrganizerVerificationUpdate {
  organizerId: string;
  status: "pending" | "verified" | "rejected";
  adminId: string;
  reason?: string;
}

export class OrganizerService {
  /**
   * Update organizer verification status
   */
  static async updateVerificationStatus({
    organizerId,
    status,
    adminId,
    reason,
  }: OrganizerVerificationUpdate) {
    try {
      // Verify the organizer exists and is an organizer
      const organizer = await prisma.user.findUnique({
        where: { 
          id: organizerId,
          role: UserRole.ORGANIZER 
        },
        select: {
          id: true,
          profile: true,
        },
      });

      if (!organizer) {
        throw new Error("Organizer not found");
      }

      // Update the verification status in the profile
      const currentProfile = organizer.profile as unknown as UserProfile;
      const updatedProfile = {
        ...currentProfile,
        verificationStatus: status,
      };

      const updatedOrganizer = await prisma.user.update({
        where: { id: organizerId },
        data: {
          profile: updatedProfile as any,
        },
        select: {
          id: true,
          email: true,
          role: true,
          profile: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Log the verification status change
      await AuditService.logAction({
        actorId: adminId,
        action: "organizer_verification_updated",
        target: `user:${organizerId}`,
        metadata: {
          previousStatus: currentProfile.verificationStatus || "pending",
          newStatus: status,
          reason: reason || null,
        },
      });

      return updatedOrganizer;
    } catch (error) {
      console.error("Organizer verification update error:", error);
      throw error;
    }
  }

  /**
   * Get organizers pending verification
   */
  static async getPendingVerifications() {
    try {
      const pendingOrganizers = await prisma.user.findMany({
        where: {
          role: UserRole.ORGANIZER,
        },
        select: {
          id: true,
          email: true,
          profile: true,
          createdAt: true,
          updatedAt: true,
        },
      });

      // Filter by verification status in profile JSON
      const filtered = pendingOrganizers.filter(organizer => {
        const profile = organizer.profile as unknown as UserProfile;
        return profile.verificationStatus === "pending" || !profile.verificationStatus;
      });

      return filtered;
    } catch (error) {
      console.error("Pending verifications fetch error:", error);
      throw error;
    }
  }

  /**
   * Get public organizer profile for job listings
   */
  static async getPublicProfile(organizerId: string) {
    try {
      const organizer = await prisma.user.findUnique({
        where: { 
          id: organizerId,
          role: UserRole.ORGANIZER 
        },
        select: {
          id: true,
          profile: true,
          createdAt: true,
          receivedReviews: {
            select: {
              rating: true,
            },
          },
        },
      });

      if (!organizer) {
        return null;
      }

      // Calculate rating statistics
      const reviews = organizer.receivedReviews;
      const ratingCount = reviews.length;
      const ratingAverage = ratingCount > 0 
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / ratingCount
        : 0;

      // Update profile with calculated ratings
      const profileWithRatings = {
        ...(organizer.profile as unknown as UserProfile),
        ratingCount,
        ratingAverage: ratingCount > 0 ? ratingAverage : undefined,
      } as UserProfile;

      return {
        id: organizer.id,
        profile: profileWithRatings,
        createdAt: organizer.createdAt,
      };
    } catch (error) {
      console.error("Public organizer profile fetch error:", error);
      throw error;
    }
  }

  /**
   * Get organizer statistics for admin dashboard
   */
  static async getVerificationStatistics() {
    try {
      const stats = await prisma.user.findMany({
        where: {
          role: UserRole.ORGANIZER,
        },
        select: {
          profile: true,
        },
      });

      const verificationCounts = stats.reduce(
        (acc, organizer) => {
          const profile = organizer.profile as unknown as UserProfile;
          const status = profile.verificationStatus || "pending";
          acc[status] = (acc[status] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        total: stats.length,
        pending: verificationCounts.pending || 0,
        verified: verificationCounts.verified || 0,
        rejected: verificationCounts.rejected || 0,
      };
    } catch (error) {
      console.error("Verification statistics fetch error:", error);
      throw error;
    }
  }
}