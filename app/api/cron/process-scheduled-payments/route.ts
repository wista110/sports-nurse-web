import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auditService } from '@/lib/services/audit';
import { paymentService } from '@/lib/services/payment';

const prisma = new PrismaClient();

/**
 * 定期支払い処理
 * 毎月1日午前10時に実行
 */
export async function POST(request: NextRequest) {
  // Vercel Cronからの認証確認
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    let paymentsProcessed = 0;
    let totalAmount = 0;
    const errors: string[] = [];

    // 支払い準備完了の求人を取得
    const jobsReadyToPay = await prisma.job.findMany({
      where: {
        status: 'READY_TO_PAY'
      },
      include: {
        escrow: true,
        applications: {
          where: { status: 'ACCEPTED' },
          include: { nurse: true }
        },
        organizer: true
      }
    });

    console.log(`💰 処理対象の求人: ${jobsReadyToPay.length}件`);

    for (const job of jobsReadyToPay) {
      try {
        if (!job.escrow) {
          errors.push(`求人 ${job.id}: エスクロー情報が見つかりません`);
          continue;
        }

        // 定期支払い（低手数料）で処理
        const paymentResult = await paymentService.processPayment(
          job.escrow.id,
          'scheduled'
        );

        if (paymentResult.success) {
          // 求人ステータスを支払い完了に更新
          await prisma.job.update({
            where: { id: job.id },
            data: { status: 'PAID' }
          });

          paymentsProcessed++;
          totalAmount += job.escrow.amount;

          console.log(`✅ 支払い完了: 求人 ${job.id} - ¥${job.escrow.amount.toLocaleString()}`);
        } else {
          errors.push(`求人 ${job.id}: 支払い処理失敗 - ${paymentResult.error}`);
        }

      } catch (error) {
        const errorMessage = `求人 ${job.id}: ${error instanceof Error ? error.message : '不明なエラー'}`;
        errors.push(errorMessage);
        console.error(`❌ 支払い処理エラー:`, errorMessage);
      }
    }

    // 監査ログ記録
    await auditService.logAction({
      actorId: 'system',
      action: 'PROCESS_SCHEDULED_PAYMENTS',
      target: 'payments',
      metadata: {
        totalJobsProcessed: jobsReadyToPay.length,
        paymentsProcessed,
        totalAmount,
        errors: errors.length,
        errorDetails: errors,
        executedAt: now.toISOString()
      }
    });

    const summary = {
      success: true,
      totalJobsProcessed: jobsReadyToPay.length,
      paymentsProcessed,
      totalAmount,
      errors: errors.length,
      errorDetails: errors,
      executedAt: now.toISOString()
    };

    if (errors.length > 0) {
      console.warn(`⚠️  定期支払い処理完了（エラーあり）: 成功 ${paymentsProcessed}件、エラー ${errors.length}件`);
    } else {
      console.log(`✅ 定期支払い処理完了: ${paymentsProcessed}件、総額 ¥${totalAmount.toLocaleString()}`);
    }

    return NextResponse.json(summary);

  } catch (error) {
    console.error('❌ 定期支払い処理エラー:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Scheduled payment processing failed',
      executedAt: new Date().toISOString()
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}