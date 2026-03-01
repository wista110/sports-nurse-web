import { prisma } from "@/lib/prisma";
import type { AuditAction, AuditLog, AuditFilters } from "@/types/domain";
import crypto from 'crypto';

// セキュリティ設定
const SECURITY_CONFIG = {
  maxLoginAttempts: 5,
  lockoutDuration: 15 * 60 * 1000, // 15分
  sessionTimeout: 24 * 60 * 60 * 1000, // 24時間
  sensitiveActions: [
    'PAYMENT_PROCESSED',
    'ESCROW_RELEASED',
    'ESCROW_REFUNDED',
    'ROLE_CHANGED',
    'USER_DELETED',
    'ADMIN_ACCESS'
  ],
  encryptionKey: process.env.ENCRYPTION_KEY || 'default-key-change-in-production'
};

export class AuditService {
  /**
   * Log an audit action with enhanced security
   */
  static async logAction(action: AuditAction): Promise<AuditLog> {
    try {
      // PII暗号化
      const encryptedMetadata = this.encryptSensitiveData(action.metadata);
      
      // IPアドレスとUser-Agentの記録
      const securityContext = this.getSecurityContext();
      
      const auditLog = await prisma.auditLog.create({
        data: {
          actorId: action.actorId,
          action: action.action,
          target: action.target,
          metadata: {
            ...encryptedMetadata,
            ...securityContext,
            timestamp: new Date().toISOString(),
            severity: this.getActionSeverity(action.action)
          } as any,
        },
      });

      // 重要な操作の場合は追加のセキュリティログ
      if (SECURITY_CONFIG.sensitiveActions.includes(action.action)) {
        await this.logSecurityEvent({
          actorId: action.actorId,
          eventType: 'SENSITIVE_ACTION',
          action: action.action,
          target: action.target,
          metadata: encryptedMetadata
        });
      }

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
   * セキュリティイベントのログ記録
   */
  static async logSecurityEvent(event: {
    actorId: string;
    eventType: string;
    action: string;
    target: string;
    metadata: Record<string, any>;
  }): Promise<void> {
    try {
      // セキュリティイベント専用のログ記録
      console.log(`[SECURITY EVENT] ${event.eventType}: ${event.action} by ${event.actorId} on ${event.target}`);
      
      // 実際の実装では、専用のセキュリティログシステムに送信
      // await securityLogSystem.log(event);
    } catch (error) {
      console.error("Failed to log security event:", error);
    }
  }

  /**
   * ログイン試行の記録と制限
   */
  static async logLoginAttempt(email: string, success: boolean, ipAddress?: string): Promise<{ allowed: boolean; remainingAttempts?: number }> {
    try {
      const now = new Date();
      const lockoutEnd = new Date(now.getTime() - SECURITY_CONFIG.lockoutDuration);

      // 最近の失敗試行を取得
      const recentFailures = await prisma.auditLog.count({
        where: {
          action: 'LOGIN_FAILED',
          target: `email:${email}`,
          createdAt: {
            gte: lockoutEnd
          }
        }
      });

      // ログイン試行の記録
      await this.logAction({
        actorId: 'system',
        action: success ? 'LOGIN_SUCCESS' : 'LOGIN_FAILED',
        target: `email:${email}`,
        metadata: {
          email,
          ipAddress,
          userAgent: this.getUserAgent(),
          failureCount: success ? 0 : recentFailures + 1
        }
      });

      // アカウントロックアウトチェック
      if (!success && recentFailures >= SECURITY_CONFIG.maxLoginAttempts - 1) {
        await this.logSecurityEvent({
          actorId: 'system',
          eventType: 'ACCOUNT_LOCKOUT',
          action: 'LOGIN_BLOCKED',
          target: `email:${email}`,
          metadata: {
            email,
            ipAddress,
            failureCount: recentFailures + 1
          }
        });

        return { allowed: false };
      }

      return {
        allowed: recentFailures < SECURITY_CONFIG.maxLoginAttempts,
        remainingAttempts: Math.max(0, SECURITY_CONFIG.maxLoginAttempts - recentFailures - 1)
      };
    } catch (error) {
      console.error("Failed to log login attempt:", error);
      return { allowed: true }; // エラー時はログインを許可（可用性優先）
    }
  }

  /**
   * 不審なアクティビティの検出
   */
  static async detectSuspiciousActivity(userId: string): Promise<{
    suspicious: boolean;
    reasons: string[];
    riskScore: number;
  }> {
    try {
      const now = new Date();
      const oneHour = new Date(now.getTime() - 60 * 60 * 1000);
      const oneDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // 過去1時間のアクティビティ
      const recentActivity = await prisma.auditLog.findMany({
        where: {
          actorId: userId,
          createdAt: { gte: oneHour }
        }
      });

      // 過去24時間のログイン
      const recentLogins = await prisma.auditLog.findMany({
        where: {
          actorId: userId,
          action: 'LOGIN_SUCCESS',
          createdAt: { gte: oneDay }
        }
      });

      const reasons: string[] = [];
      let riskScore = 0;

      // 異常に多いアクティビティ
      if (recentActivity.length > 100) {
        reasons.push('異常に多いアクティビティ');
        riskScore += 30;
      }

      // 複数IPからのログイン
      const uniqueIPs = new Set(
        recentLogins
          .map(log => (log.metadata as any)?.ipAddress)
          .filter(ip => ip)
      );
      if (uniqueIPs.size > 3) {
        reasons.push('複数IPからのログイン');
        riskScore += 40;
      }

      // 深夜時間帯のアクティビティ
      const nightActivity = recentActivity.filter(log => {
        const hour = log.createdAt.getHours();
        return hour >= 23 || hour <= 5;
      });
      if (nightActivity.length > 10) {
        reasons.push('深夜時間帯の大量アクティビティ');
        riskScore += 20;
      }

      // 重要操作の連続実行
      const sensitiveActions = recentActivity.filter(log =>
        SECURITY_CONFIG.sensitiveActions.includes(log.action)
      );
      if (sensitiveActions.length > 5) {
        reasons.push('重要操作の連続実行');
        riskScore += 50;
      }

      return {
        suspicious: riskScore >= 50,
        reasons,
        riskScore
      };
    } catch (error) {
      console.error("Failed to detect suspicious activity:", error);
      return { suspicious: false, reasons: [], riskScore: 0 };
    }
  }

  /**
   * PII暗号化
   */
  private static encryptSensitiveData(metadata: Record<string, any>): Record<string, any> {
    const sensitiveFields = ['email', 'phone', 'licenseNumber', 'personalInfo'];
    const encrypted = { ...metadata };

    for (const field of sensitiveFields) {
      if (encrypted[field]) {
        encrypted[field] = this.encrypt(String(encrypted[field]));
      }
    }

    return encrypted;
  }

  /**
   * データ暗号化
   */
  private static encrypt(text: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(SECURITY_CONFIG.encryptionKey, 'salt', 32);
      const iv = crypto.randomBytes(16);
      
      const cipher = crypto.createCipher(algorithm, key);
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      return `${iv.toString('hex')}:${encrypted}`;
    } catch (error) {
      console.error("Encryption failed:", error);
      return '[ENCRYPTED]';
    }
  }

  /**
   * データ復号化
   */
  private static decrypt(encryptedText: string): string {
    try {
      const algorithm = 'aes-256-cbc';
      const key = crypto.scryptSync(SECURITY_CONFIG.encryptionKey, 'salt', 32);
      
      const [ivHex, encrypted] = encryptedText.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      
      const decipher = crypto.createDecipher(algorithm, key);
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      console.error("Decryption failed:", error);
      return '[DECRYPTION_FAILED]';
    }
  }

  /**
   * アクションの重要度を取得
   */
  private static getActionSeverity(action: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' {
    if (SECURITY_CONFIG.sensitiveActions.includes(action)) {
      return 'CRITICAL';
    }
    
    const highSeverityActions = ['USER_DELETED', 'ROLE_CHANGED', 'ADMIN_ACCESS'];
    if (highSeverityActions.some(a => action.includes(a))) {
      return 'HIGH';
    }
    
    const mediumSeverityActions = ['LOGIN_FAILED', 'PROFILE_UPDATED', 'PASSWORD_CHANGED'];
    if (mediumSeverityActions.some(a => action.includes(a))) {
      return 'MEDIUM';
    }
    
    return 'LOW';
  }

  /**
   * セキュリティコンテキストの取得
   */
  private static getSecurityContext(): Record<string, any> {
    // 実際の実装では、リクエストコンテキストから取得
    return {
      ipAddress: this.getClientIP(),
      userAgent: this.getUserAgent(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * クライアントIPアドレスの取得
   */
  private static getClientIP(): string {
    // 実際の実装では、リクエストヘッダーから取得
    return '127.0.0.1';
  }

  /**
   * User-Agentの取得
   */
  private static getUserAgent(): string {
    // 実際の実装では、リクエストヘッダーから取得
    return 'Unknown';
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
        take: filters.limit || 100,
        skip: filters.offset || 0,
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
   * セキュリティダッシュボード用の統計を取得
   */
  static async getSecurityStats(): Promise<{
    totalEvents: number;
    criticalEvents: number;
    failedLogins: number;
    suspiciousActivities: number;
    recentEvents: AuditLog[];
  }> {
    try {
      const now = new Date();
      const oneDay = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const [totalEvents, criticalEvents, failedLogins, recentEvents] = await Promise.all([
        prisma.auditLog.count({
          where: { createdAt: { gte: oneDay } }
        }),
        prisma.auditLog.count({
          where: {
            createdAt: { gte: oneDay },
            action: { in: SECURITY_CONFIG.sensitiveActions }
          }
        }),
        prisma.auditLog.count({
          where: {
            createdAt: { gte: oneDay },
            action: 'LOGIN_FAILED'
          }
        }),
        prisma.auditLog.findMany({
          where: { createdAt: { gte: oneDay } },
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
          orderBy: { createdAt: 'desc' },
          take: 10
        })
      ]);

      return {
        totalEvents,
        criticalEvents,
        failedLogins,
        suspiciousActivities: 0, // 実装では実際の検出結果を返す
        recentEvents: recentEvents.map(log => ({
          id: log.id,
          actorId: log.actorId,
          action: log.action,
          target: log.target,
          metadata: log.metadata as Record<string, any>,
          createdAt: log.createdAt,
        }))
      };
    } catch (error) {
      console.error("Failed to get security stats:", error);
      throw new Error("Failed to get security stats");
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
      action: "USER_REGISTERED",
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
      action: "LOGIN_SUCCESS",
      target: `user:${userId}`,
      metadata,
    });
  }

  static async logProfileUpdate(userId: string, previousProfile: any, newProfile: any) {
    return this.logAction({
      actorId: userId,
      action: "PROFILE_UPDATED",
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
      action: "ROLE_CHANGED",
      target: `user:${targetUserId}`,
      metadata: {
        previousRole,
        newRole,
      },
    });
  }
}

export const auditService = AuditService;