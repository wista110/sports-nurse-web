import { prisma } from '@/lib/prisma';
import { auditService } from '@/lib/services/audit';
import {
  CreateEscrowInput,
  CalculateFeesInput,
  ReleaseEscrowInput,
  RefundEscrowInput,
  ExecutePaymentInput,
  FeeCalculation,
  EscrowDetails,
  PaymentHistory,
} from '@/lib/validations/payment';
import { AppError, ErrorType } from '@/lib/errors';

// 手数料設定（MVP用の固定値）
const FEE_CONFIG = {
  platformFeeRate: 0.10, // 10%
  instantPaymentFeeRate: 0.03, // 3%
  scheduledPaymentFeeRate: 0.01, // 1%
  minimumFee: 100, // 100円
  maximumFee: 10000, // 10,000円
};

export class PaymentService {
  /**
   * 手数料を計算する
   */
  static async calculateFees(input: CalculateFeesInput): Promise<FeeCalculation> {
    const { amount, paymentMethod } = input;

    // プラットフォーム手数料
    const platformFee = Math.max(
      Math.min(amount * FEE_CONFIG.platformFeeRate, FEE_CONFIG.maximumFee),
      FEE_CONFIG.minimumFee
    );

    // 支払い手数料
    const paymentFeeRate = paymentMethod === 'instant' 
      ? FEE_CONFIG.instantPaymentFeeRate 
      : FEE_CONFIG.scheduledPaymentFeeRate;
    
    const paymentFee = Math.max(
      Math.min(amount * paymentFeeRate, FEE_CONFIG.maximumFee),
      FEE_CONFIG.minimumFee
    );

    const totalFee = platformFee + paymentFee;
    const netAmount = amount - totalFee;

    return {
      baseAmount: amount,
      platformFee,
      paymentFee,
      totalFee,
      netAmount,
      feeBreakdown: {
        platformFeeRate: FEE_CONFIG.platformFeeRate,
        paymentFeeRate,
        description: paymentMethod === 'instant' 
          ? '即時振込（高手数料）' 
          : '自動払い（翌月15日・低手数料）'
      }
    };
  }

  /**
   * エスクロー取引を作成する
   */
  static async createEscrow(input: CreateEscrowInput, actorId: string): Promise<EscrowDetails> {
    const { jobId, amount, platformFee } = input;

    // 案件の存在確認
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        organizer: {
          select: { id: true, profile: true }
        },
        escrow: true
      }
    });

    if (!job) {
      throw new AppError(
        ErrorType.NOT_FOUND,
        'JOB_NOT_FOUND',
        '指定された案件が見つかりません',
        404
      );
    }

    // 既存のエスクロー取引確認
    if (job.escrow) {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'ESCROW_ALREADY_EXISTS',
        'この案件には既にエスクロー取引が存在します',
        400
      );
    }

    // 案件ステータス確認
    if (job.status !== 'CONTRACTED') {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'INVALID_JOB_STATUS',
        'エスクロー取引は契約済みの案件でのみ作成できます',
        400
      );
    }

    try {
      // トランザクション内でエスクロー作成と案件ステータス更新
      const result = await prisma.$transaction(async (tx) => {
        // エスクロー取引作成
        const escrow = await tx.escrowTransaction.create({
          data: {
            jobId,
            amount,
            platformFee,
            status: 'AWAITING'
          }
        });

        // 案件ステータス更新
        await tx.job.update({
          where: { id: jobId },
          data: { status: 'ESCROW_HOLDING' }
        });

        return escrow;
      });

      // 監査ログ記録
      await auditService.logAction({
        actorId,
        action: 'ESCROW_CREATED',
        target: `escrow:${result.id}`,
        metadata: {
          jobId,
          amount,
          platformFee,
          status: 'AWAITING'
        }
      });

      // 詳細情報を含めて返却
      return {
        id: result.id,
        jobId: result.jobId,
        amount: result.amount,
        platformFee: result.platformFee,
        status: result.status as 'AWAITING' | 'HOLDING' | 'RELEASED' | 'REFUNDED',
        createdAt: result.createdAt,
        job: {
          id: job.id,
          title: job.title,
          organizer: {
            id: job.organizer.id,
            name: (job.organizer.profile as any)?.name || '名前未設定'
          }
        }
      };
    } catch (error) {
      throw new AppError(
        ErrorType.SYSTEM,
        'ESCROW_CREATION_FAILED',
        'エスクロー取引の作成に失敗しました',
        500,
        { originalError: error }
      );
    }
  }

  /**
   * モック決済処理を実行する
   */
  static async processPayment(escrowId: string, actorId: string): Promise<{ success: boolean; transactionId: string }> {
    // エスクロー取引の存在確認
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new AppError(
        ErrorType.NOT_FOUND,
        'ESCROW_NOT_FOUND',
        '指定されたエスクロー取引が見つかりません',
        404
      );
    }

    if (escrow.status !== 'AWAITING') {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'INVALID_ESCROW_STATUS',
        'この取引は既に処理済みです',
        400
      );
    }

    try {
      // モック決済処理（常に成功）
      const transactionId = `mock_tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      // エスクロー状態を更新
      await prisma.escrowTransaction.update({
        where: { id: escrowId },
        data: { status: 'HOLDING' }
      });

      // 監査ログ記録
      await auditService.logAction({
        actorId,
        action: 'PAYMENT_PROCESSED',
        target: `escrow:${escrowId}`,
        metadata: {
          transactionId,
          amount: escrow.amount,
          status: 'HOLDING',
          paymentMethod: 'mock'
        }
      });

      return {
        success: true,
        transactionId
      };
    } catch (error) {
      throw new AppError(
        ErrorType.SYSTEM,
        'PAYMENT_PROCESSING_FAILED',
        '決済処理に失敗しました',
        500,
        { originalError: error }
      );
    }
  }

  /**
   * エスクローを解放する
   */
  static async releaseEscrow(input: ReleaseEscrowInput, actorId: string): Promise<void> {
    const { escrowId, releaseAmount, reason } = input;

    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
      include: {
        job: {
          include: {
            applications: {
              where: { status: 'ACCEPTED' },
              include: { nurse: true }
            }
          }
        }
      }
    });

    if (!escrow) {
      throw new AppError(
        ErrorType.NOT_FOUND,
        'ESCROW_NOT_FOUND',
        '指定されたエスクロー取引が見つかりません',
        404
      );
    }

    if (escrow.status !== 'HOLDING') {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'INVALID_ESCROW_STATUS',
        'エスクローの解放はHOLDING状態でのみ可能です',
        400
      );
    }

    if (releaseAmount > escrow.amount) {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'INVALID_RELEASE_AMOUNT',
        '解放金額がエスクロー金額を超えています',
        400
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        // エスクロー状態更新
        await tx.escrowTransaction.update({
          where: { id: escrowId },
          data: { 
            status: 'RELEASED',
            releasedAt: new Date()
          }
        });

        // 案件ステータス更新
        await tx.job.update({
          where: { id: escrow.jobId },
          data: { status: 'PAID' }
        });
      });

      // 監査ログ記録
      await auditService.logAction({
        actorId,
        action: 'ESCROW_RELEASED',
        target: `escrow:${escrowId}`,
        metadata: {
          releaseAmount,
          reason,
          jobId: escrow.jobId
        }
      });
    } catch (error) {
      throw new AppError(
        ErrorType.SYSTEM,
        'ESCROW_RELEASE_FAILED',
        'エスクローの解放に失敗しました',
        500,
        { originalError: error }
      );
    }
  }

  /**
   * エスクローを返金する
   */
  static async refundEscrow(input: RefundEscrowInput, actorId: string): Promise<void> {
    const { escrowId, refundAmount, reason } = input;

    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId }
    });

    if (!escrow) {
      throw new AppError(
        ErrorType.NOT_FOUND,
        'ESCROW_NOT_FOUND',
        '指定されたエスクロー取引が見つかりません',
        404
      );
    }

    if (escrow.status !== 'HOLDING') {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'INVALID_ESCROW_STATUS',
        'エスクローの返金はHOLDING状態でのみ可能です',
        400
      );
    }

    if (refundAmount > escrow.amount) {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'INVALID_REFUND_AMOUNT',
        '返金金額がエスクロー金額を超えています',
        400
      );
    }

    try {
      await prisma.$transaction(async (tx) => {
        // エスクロー状態更新
        await tx.escrowTransaction.update({
          where: { id: escrowId },
          data: { 
            status: 'REFUNDED',
            refundedAt: new Date()
          }
        });

        // 案件ステータス更新
        await tx.job.update({
          where: { id: escrow.jobId },
          data: { status: 'CANCELLED' }
        });
      });

      // 監査ログ記録
      await auditService.logAction({
        actorId,
        action: 'ESCROW_REFUNDED',
        target: `escrow:${escrowId}`,
        metadata: {
          refundAmount,
          reason,
          jobId: escrow.jobId
        }
      });
    } catch (error) {
      throw new AppError(
        ErrorType.SYSTEM,
        'ESCROW_REFUND_FAILED',
        'エスクローの返金に失敗しました',
        500,
        { originalError: error }
      );
    }
  }

  /**
   * エスクロー取引詳細を取得する
   */
  static async getEscrowDetails(escrowId: string): Promise<EscrowDetails | null> {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
      include: {
        job: {
          include: {
            organizer: {
              select: { id: true, profile: true }
            }
          }
        }
      }
    });

    if (!escrow) {
      return null;
    }

    return {
      id: escrow.id,
      jobId: escrow.jobId,
      amount: escrow.amount,
      platformFee: escrow.platformFee,
      status: escrow.status as 'AWAITING' | 'HOLDING' | 'RELEASED' | 'REFUNDED',
      createdAt: escrow.createdAt,
      releasedAt: escrow.releasedAt || undefined,
      refundedAt: escrow.refundedAt || undefined,
      job: {
        id: escrow.job.id,
        title: escrow.job.title,
        organizer: {
          id: escrow.job.organizer.id,
          name: (escrow.job.organizer.profile as any)?.name || '名前未設定'
        }
      }
    };
  }

  /**
   * 案件のエスクロー取引を取得する
   */
  static async getEscrowByJobId(jobId: string): Promise<EscrowDetails | null> {
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { jobId },
      include: {
        job: {
          include: {
            organizer: {
              select: { id: true, profile: true }
            }
          }
        }
      }
    });

    if (!escrow) {
      return null;
    }

    return {
      id: escrow.id,
      jobId: escrow.jobId,
      amount: escrow.amount,
      platformFee: escrow.platformFee,
      status: escrow.status as 'AWAITING' | 'HOLDING' | 'RELEASED' | 'REFUNDED',
      createdAt: escrow.createdAt,
      releasedAt: escrow.releasedAt || undefined,
      refundedAt: escrow.refundedAt || undefined,
      job: {
        id: escrow.job.id,
        title: escrow.job.title,
        organizer: {
          id: escrow.job.organizer.id,
          name: (escrow.job.organizer.profile as any)?.name || '名前未設定'
        }
      }
    };
  }

  /**
   * 最終支払い処理を実行する（管理者用）
   */
  static async executeFinalPayment(input: ExecutePaymentInput, actorId: string): Promise<PaymentHistory> {
    const { jobId, paymentMethod, notes } = input;

    // 案件とエスクロー情報を取得
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        escrow: true,
        applications: {
          where: { status: 'ACCEPTED' },
          include: {
            nurse: {
              include: { profile: true }
            }
          }
        },
        reviews: true
      }
    });

    if (!job) {
      throw new AppError(
        ErrorType.NOT_FOUND,
        'JOB_NOT_FOUND',
        '指定された案件が見つかりません',
        404
      );
    }

    if (!job.escrow) {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'NO_ESCROW_FOUND',
        'この案件にはエスクロー取引が存在しません',
        400
      );
    }

    if (job.escrow.status !== 'HOLDING') {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'INVALID_ESCROW_STATUS',
        '最終支払いはエスクロー預り中の案件でのみ実行できます',
        400
      );
    }

    // レビューが完了していることを確認
    const expectedReviews = job.applications.length * 2; // 依頼者→看護師、看護師→依頼者
    if (job.reviews.length < expectedReviews) {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'REVIEWS_INCOMPLETE',
        'すべてのレビューが完了していません',
        400
      );
    }

    const acceptedApplication = job.applications[0];
    if (!acceptedApplication) {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'NO_ACCEPTED_APPLICATION',
        '承認された応募が見つかりません',
        400
      );
    }

    // 手数料計算
    const feeCalculation = await this.calculateFees({
      amount: job.escrow.amount,
      paymentMethod
    });

    try {
      const result = await prisma.$transaction(async (tx) => {
        // 支払い記録作成
        const payout = await tx.payout.create({
          data: {
            jobId,
            nurseId: acceptedApplication.nurseId,
            amount: job.escrow.amount,
            fee: feeCalculation.totalFee,
            netAmount: feeCalculation.netAmount,
            method: paymentMethod,
            status: 'COMPLETED',
            executedAt: new Date(),
            notes
          }
        });

        // エスクロー解放
        await tx.escrowTransaction.update({
          where: { id: job.escrow.id },
          data: { 
            status: 'RELEASED',
            releasedAt: new Date()
          }
        });

        // 案件ステータス更新
        await tx.job.update({
          where: { id: jobId },
          data: { status: 'PAID' }
        });

        return payout;
      });

      // 監査ログ記録
      await auditService.logAction({
        actorId,
        action: 'FINAL_PAYMENT_EXECUTED',
        target: `payout:${result.id}`,
        metadata: {
          jobId,
          nurseId: acceptedApplication.nurseId,
          amount: job.escrow.amount,
          netAmount: feeCalculation.netAmount,
          paymentMethod,
          feeCalculation
        }
      });

      return {
        id: result.id,
        jobId: result.jobId,
        nurseId: result.nurseId,
        amount: result.amount,
        fee: result.fee,
        netAmount: result.netAmount,
        method: result.method as 'instant' | 'scheduled',
        status: result.status as 'PENDING' | 'COMPLETED' | 'FAILED',
        executedAt: result.executedAt,
        notes: result.notes,
        createdAt: result.createdAt,
        job: {
          id: job.id,
          title: job.title
        },
        nurse: {
          id: acceptedApplication.nurse.id,
          name: acceptedApplication.nurse.profile?.name || '名前未設定'
        }
      };
    } catch (error) {
      throw new AppError(
        ErrorType.SYSTEM,
        'FINAL_PAYMENT_FAILED',
        '最終支払い処理に失敗しました',
        500,
        { originalError: error }
      );
    }
  }

  /**
   * 支払い可能な案件一覧を取得する（管理者用）
   */
  static async getPayableJobs(): Promise<Array<{
    id: string;
    title: string;
    amount: number;
    nurseId: string;
    nurseName: string;
    organizerId: string;
    organizerName: string;
    completedAt: Date;
    reviewsCompleted: boolean;
  }>> {
    const jobs = await prisma.job.findMany({
      where: {
        status: 'REVIEW_PENDING',
        escrow: {
          status: 'HOLDING'
        }
      },
      include: {
        escrow: true,
        organizer: {
          include: { profile: true }
        },
        applications: {
          where: { status: 'ACCEPTED' },
          include: {
            nurse: {
              include: { profile: true }
            }
          }
        },
        reviews: true,
        attendanceRecords: {
          where: {
            checkOutAt: { not: null }
          }
        }
      }
    });

    return jobs
      .filter(job => {
        // 承認された応募があることを確認
        const acceptedApplication = job.applications.find(app => app.status === 'ACCEPTED');
        if (!acceptedApplication) return false;

        // 出勤記録があることを確認
        const hasAttendance = job.attendanceRecords.length > 0;
        if (!hasAttendance) return false;

        // レビューが完了していることを確認
        const expectedReviews = job.applications.length * 2;
        const reviewsCompleted = job.reviews.length >= expectedReviews;

        return reviewsCompleted;
      })
      .map(job => {
        const acceptedApplication = job.applications[0];
        const latestAttendance = job.attendanceRecords
          .sort((a, b) => new Date(b.checkOutAt!).getTime() - new Date(a.checkOutAt!).getTime())[0];

        return {
          id: job.id,
          title: job.title,
          amount: job.escrow!.amount,
          nurseId: acceptedApplication.nurseId,
          nurseName: acceptedApplication.nurse.profile?.name || '名前未設定',
          organizerId: job.organizerId,
          organizerName: job.organizer.profile?.name || '名前未設定',
          completedAt: latestAttendance.checkOutAt!,
          reviewsCompleted: true
        };
      });
  }

  /**
   * 支払い履歴を取得する
   */
  static async getPaymentHistory(filters: {
    nurseId?: string;
    organizerId?: string;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
    offset?: number;
  }): Promise<PaymentHistory[]> {
    const { nurseId, organizerId, status, startDate, endDate, limit = 50, offset = 0 } = filters;

    const whereClause: any = {};

    if (nurseId) whereClause.nurseId = nurseId;
    if (status) whereClause.status = status;

    if (startDate || endDate) {
      whereClause.executedAt = {};
      if (startDate) whereClause.executedAt.gte = startDate;
      if (endDate) whereClause.executedAt.lte = endDate;
    }

    if (organizerId) {
      whereClause.job = {
        organizerId
      };
    }

    const payouts = await prisma.payout.findMany({
      where: whereClause,
      include: {
        job: {
          select: {
            id: true,
            title: true
          }
        },
        nurse: {
          select: {
            id: true,
            profile: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { executedAt: 'desc' },
      take: limit,
      skip: offset
    });

    return payouts.map(payout => ({
      id: payout.id,
      jobId: payout.jobId,
      nurseId: payout.nurseId,
      amount: payout.amount,
      fee: payout.fee,
      netAmount: payout.netAmount,
      method: payout.method as 'instant' | 'scheduled',
      status: payout.status as 'PENDING' | 'COMPLETED' | 'FAILED',
      executedAt: payout.executedAt,
      notes: payout.notes,
      createdAt: payout.createdAt,
      job: {
        id: payout.job.id,
        title: payout.job.title
      },
      nurse: {
        id: payout.nurse.id,
        name: payout.nurse.profile?.name || '名前未設定'
      }
    }));
  }
}

export const paymentService = PaymentService;