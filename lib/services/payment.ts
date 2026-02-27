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
}

export const paymentService = PaymentService;