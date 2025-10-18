import { prisma } from "@/lib/prisma";
import type { AuditAction, AuditLog, AuditFilters } from "@/types/domain";

export class AuditService {
  /**
   * Log an audit action
   */
  static async logAction(action: AuditAction): Promise<AuditLog> {
    try {
      const auditLog = await prisma.auditLog.create({
        data: {
          actorId: action.actorId,
          action: action.action,
          target: action.target,
          metadata: action.metadata as any, // Prisma Json type
        },
      });

      return {
        id: auditLog.id,
        actorId: auditLog.actorId,
        action: auditLog.action,
        target: auditLog.target,
        metadata: auditLog.metadata as Record<string, any>,
        createdAt: auditLog.createdAt,
      };
    } catch (error) {
      console.error("Failed to log audit action:", error);
      throw new Error("Audit logging failed");
    }
  }

  /**
   * Get audit logs with optional filtering
   */
  static async getAuditLogs(filters: AuditFilters = {}): Promise<AuditLog[]> {
    try {
      const where: any = {};

      if (filters.actorId) {
        where.actorId = filters.actorId;
      }

      if (filters.action) {
        where.action = filters.action;
      }

      if (filters.target) {
        where.target = {
          contains: filters.target,
        };
      }

      if (filters.startDate || filters.endDate) {
        where.createdAt = {};
        if (filters.startDate) {
          where.createdAt.gte = filters.startDate;
        }
        if (filters.endDate) {
          where.createdAt.lte = filters.endDate;
        }
      }

      const auditLogs = await prisma.auditLog.findMany({
        where,
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              role: true,
              profile: true,
            },
          },
        },
        orderBy: {
          createdAt: "desc",
        },
        take: 100, // Limit to prevent large queries
      });

      return auditLogs.map((log) => ({
        id: log.id,
        actorId: log.actorId,
        action: log.action,
        target: log.target,
        metadata: log.metadata as Record<string, any>,
        createdAt: log.createdAt,
      }));
    } catch (error) {
      console.error("Failed to fetch audit logs:", error);
      throw new Error("Failed to fetch audit logs");
    }
  }

  /**
   * Get audit logs for a specific user
   */
  static async getUserAuditLogs(userId: string): Promise<AuditLog[]> {
    return this.getAuditLogs({ actorId: userId });
  }

  /**
   * Get audit logs for a specific target
   */
  static async getTargetAuditLogs(target: string): Promise<AuditLog[]> {
    return this.getAuditLogs({ target });
  }

  /**
   * Common audit actions for user management
   */
  static async logUserRegistration(userId: string, role: string, metadata: Record<string, any> = {}) {
    return this.logAction({
      actorId: userId,
      action: "user_registered",
      target: `user:${userId}`,
      metadata: {
        role,
        ...metadata,
      },
    });
  }

  static async logUserLogin(userId: string, metadata: Record<string, any> = {}) {
    return this.logAction({
      actorId: userId,
      action: "user_login",
      target: `user:${userId}`,
      metadata,
    });
  }

  static async logProfileUpdate(userId: string, previousProfile: any, newProfile: any) {
    return this.logAction({
      actorId: userId,
      action: "profile_updated",
      target: `user:${userId}`,
      metadata: {
        previousProfile,
        newProfile,
      },
    });
  }

  static async logRoleChange(actorId: string, targetUserId: string, previousRole: string, newRole: string) {
    return this.logAction({
      actorId,
      action: "role_changed",
      target: `user:${targetUserId}`,
      metadata: {
        previousRole,
        newRole,
      },
    });
  }
}

export const auditService = AuditService;