import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auditService } from '@/lib/services/audit';

const prisma = new PrismaClient();

/**
 * 期限切れ求人のクリーンアップ
 * 毎日午前2時に実行
 */
export async function POST(request: NextRequest) {
  // Vercel Cronからの認証確認
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    
    // 期限切れの求人を取得
    const expiredJobs = await prisma.job.findMany({
      where: {
        deadline: {
          lt: now
        },
        status: 'OPEN'
      }
    });

    // 求人ステータスを期限切れに更新
    const updateResult = await prisma.job.updateMany({
      where: {
        id: {
          in: expiredJobs.map(job => job.id)
        }
      },
      data: {
        status: 'CANCELLED'
      }
    });

    // 監査ログ記録
    await auditService.logAction({
      actorId: 'system',
      action: 'CLEANUP_EXPIRED_JOBS',
      target: 'jobs',
      metadata: {
        expiredJobsCount: expiredJobs.length,
        updatedCount: updateResult.count,
        executedAt: now.toISOString()
      }
    });

    console.log(`✅ 期限切れ求人クリーンアップ完了: ${updateResult.count}件`);

    return NextResponse.json({
      success: true,
      expiredJobsCount: expiredJobs.length,
      updatedCount: updateResult.count,
      executedAt: now.toISOString()
    });

  } catch (error) {
    console.error('❌ 期限切れ求人クリーンアップエラー:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Cleanup failed',
      executedAt: new Date().toISOString()
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}