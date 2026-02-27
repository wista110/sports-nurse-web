import { prisma } from '@/lib/prisma';
import { auditService } from '@/lib/services/audit';
import { paymentService } from '@/lib/services/payment';
import {
  ExecutePaymentInput,
  PaymentHistory,
} from '@/lib/validations/payment';
import { AppError, ErrorType } from '@/lib/errors';

export class PayoutService {
  /**
   * 支払いを実行する（モック実装）
   */
  static async executePayment(input: ExecutePaymentInput, actorId: string): Promise<PaymentHistory> {
    const { escrowId, paymentMethod, nurseId } = input;

    // エスクロー取引の確認
    const escrow = await prisma.escrowTransaction.findUnique({
      where: { id: escrowId },
      include: {
        job: {
          include: {
            applications: {
              where: { nurseId, status: 'ACCEPTED' },
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
        '支払い実行はエスクロー預り中の取引でのみ可能です',
        400
      );
    }

    // 看護師の確認
    const application = escrow.job.applications[0];
    if (!application) {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'NURSE_NOT_FOUND',
        '指定された看護師の応募が見つかりません',
        400
      );
    }

    // 手数料計算
    const feeCalculation = await paymentService.calculateFees({
      amount: escrow.amount - escrow.platformFee, // プラットフォーム手数料を除いた金額
      paymentMethod
    });

    const paymentAmount = escrow.amount - escrow.platformFee;
    const paymentFee = feeCalculation.paymentFee;
    const netAmount = paymentAmount - paymentFee;

    try {
      // 支払い履歴作成
      const paymentHistory = await prisma.$transaction(async (tx) => {
        // Payoutレコード作成（Prismaスキーマに追加が必要）
        const payout = await tx.payout.create({
          data: {
            jobId: escrow.jobId,
            nurseId,
            amount: paymentAmount,
            fee: paymentFee,
            netAmount,
            method: paymentMethod,
            status: 'COMPLETED', // モック実装では即座に完了
            executedAt: new Date(),
            scheduledFor: paymentMethod === 'scheduled' ? this.getNextScheduledDate() : undefined
          }
        });

        return payout;
      });

      // エスクロー解放
      await paymentService.releaseEscrow({
        escrowId,
        releaseAmount: escrow.amount,
        reason: `支払い実行完了 - ${paymentMethod === 'instant' ? '即時振込' : '自動払い'}`
      }, actorId);

      // 監査ログ記録
      await auditService.logAction({
        actorId,
        action: 'PAYMENT_EXECUTED',
        target: `payout:${paymentHistory.id}`,
        metadata: {
          escrowId,
          nurseId,
          paymentMethod,
          amount: paymentAmount,
          fee: paymentFee,
          netAmount
        }
      });

      return {
        id: paymentHistory.id,
        escrowId,
        nurseId,
        amount: paymentAmount,
        fee: paymentFee,
        netAmount,
        method: paymentMethod,
        status: 'COMPLETED',
        executedAt: paymentHistory.executedAt || undefined,
        scheduledFor: paymentHistory.scheduledFor || undefined
      };
    } catch (error) {
      throw new AppError(
        ErrorType.SYSTEM,
        'PAYMENT_EXECUTION_FAILED',
        '支払い実行に失敗しました',
        500,
        { originalError: error }
      );
    }
  }

  /**
   * 支払い履歴を取得する
   */
  static async getPaymentHistory(filters: {
    nurseId?: string;
    jobId?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }): Promise<PaymentHistory[]> {
    const { nurseId, jobId, status, limit = 50, offset = 0 } = filters;

    const payouts = await prisma.payout.findMany({
      where: {
        ...(nurseId && { nurseId }),
        ...(jobId && { jobId }),
        ...(status && { status }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset,
      include: {
        job: {
          select: { title: true }
        },
        nurse: {
          select: { profile: true }
        }
      }
    });

    return payouts.map(payout => ({
      id: payout.id,
      escrowId: '', // エスクロー情報が必要な場合は別途取得
      nurseId: payout.nurseId,
      amount: payout.amount,
      fee: payout.fee,
      netAmount: payout.netAmount,
      method: payout.method as 'instant' | 'scheduled',
      status: payout.status as 'PENDING' | 'COMPLETED' | 'FAILED',
      executedAt: payout.executedAt || undefined,
      scheduledFor: payout.scheduledFor || undefined,
      failureReason: payout.failureReason || undefined
    }));
  }

  /**
   * 看護師の支払い履歴を取得する
   */
  static async getNursePaymentHistory(nurseId: string): Promise<PaymentHistory[]> {
    return this.getPaymentHistory({ nurseId });
  }

  /**
   * 案件の支払い履歴を取得する
   */
  static async getJobPaymentHistory(jobId: string): Promise<PaymentHistory[]> {
    return this.getPaymentHistory({ jobId });
  }

  /**
   * 支払い統計を取得する
   */
  static async getPaymentStats(nurseId?: string): Promise<{
    totalEarnings: number;
    totalFees: number;
    completedPayments: number;
    pendingPayments: number;
    averageAmount: number;
  }> {
    const stats = await prisma.payout.aggregate({
      where: nurseId ? { nurseId } : {},
      _sum: {
        amount: true,
        fee: true,
        netAmount: true
      },
      _count: {
        id: true
      },
      _avg: {
        netAmount: true
      }
    });

    const pendingCount = await prisma.payout.count({
      where: {
        ...(nurseId && { nurseId }),
        status: 'PENDING'
      }
    });

    return {
      totalEarnings: stats._sum.netAmount || 0,
      totalFees: stats._sum.fee || 0,
      completedPayments: (stats._count.id || 0) - pendingCount,
      pendingPayments: pendingCount,
      averageAmount: stats._avg.netAmount || 0
    };
  }

  /**
   * 次回自動払い日を取得する
   */
  private static getNextScheduledDate(): Date {
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 15);
    
    // 15日が過ぎている場合は翌月の15日
    if (now.getDate() > 15) {
      nextMonth.setMonth(nextMonth.getMonth() + 1);
    }
    
    return nextMonth;
  }

  /**
   * 自動払いの一括処理（管理者用）
   */
  static async processScheduledPayments(actorId: string): Promise<{
    processed: number;
    failed: number;
    errors: string[];
  }> {
    const today = new Date();
    const errors: string[] = [];
    let processed = 0;
    let failed = 0;

    // 今日が実行予定日の支払いを取得
    const scheduledPayouts = await prisma.payout.findMany({
      where: {
        status: 'PENDING',
        method: 'scheduled',
        scheduledFor: {
          lte: today
        }
      },
      include: {
        job: true,
        nurse: true
      }
    });

    for (const payout of scheduledPayouts) {
      try {
        // モック支払い処理（実際の実装では外部API呼び出し）
        await prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: 'COMPLETED',
            executedAt: new Date()
          }
        });

        // 監査ログ記録
        await auditService.logAction({
          actorId,
          action: 'SCHEDULED_PAYMENT_PROCESSED',
          target: `payout:${payout.id}`,
          metadata: {
            nurseId: payout.nurseId,
            amount: payout.netAmount,
            jobId: payout.jobId
          }
        });

        processed++;
      } catch (error) {
        failed++;
        errors.push(`支払いID ${payout.id}: ${error instanceof Error ? error.message : '不明なエラー'}`);
        
        // 失敗をデータベースに記録
        await prisma.payout.update({
          where: { id: payout.id },
          data: {
            status: 'FAILED',
            failureReason: error instanceof Error ? error.message : '不明なエラー'
          }
        }).catch(() => {
          // ログ更新に失敗した場合は無視
        });
      }
    }

    return { processed, failed, errors };
  }
}

export const payoutService = PayoutService;