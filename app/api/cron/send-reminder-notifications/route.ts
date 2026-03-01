import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { auditService } from '@/lib/services/audit';
import { addDays, isAfter, isBefore } from 'date-fns';

const prisma = new PrismaClient();

/**
 * リマインダー通知送信
 * 毎日午前9時に実行
 */
export async function POST(request: NextRequest) {
  // Vercel Cronからの認証確認
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const now = new Date();
    const tomorrow = addDays(now, 1);
    const threeDaysFromNow = addDays(now, 3);
    
    let notificationsSent = 0;

    // 1. 明日開始予定の求人のリマインダー
    const jobsStartingTomorrow = await prisma.job.findMany({
      where: {
        startAt: {
          gte: tomorrow,
          lt: addDays(tomorrow, 1)
        },
        status: 'CONTRACTED'
      },
      include: {
        organizer: true,
        applications: {
          where: { status: 'ACCEPTED' },
          include: { nurse: true }
        }
      }
    });

    for (const job of jobsStartingTomorrow) {
      // 主催者への通知
      // TODO: 実際の通知送信実装
      console.log(`📧 主催者通知: ${job.organizer.email} - 明日開始予定の求人: ${job.title}`);
      
      // 看護師への通知
      for (const application of job.applications) {
        console.log(`📧 看護師通知: ${application.nurse.email} - 明日開始予定の求人: ${job.title}`);
        notificationsSent++;
      }
      notificationsSent++;
    }

    // 2. 応募期限が3日後の求人のリマインダー
    const jobsDeadlineIn3Days = await prisma.job.findMany({
      where: {
        deadline: {
          gte: threeDaysFromNow,
          lt: addDays(threeDaysFromNow, 1)
        },
        status: 'OPEN'
      },
      include: {
        organizer: true
      }
    });

    for (const job of jobsDeadlineIn3Days) {
      // 主催者への応募期限リマインダー
      console.log(`📧 主催者通知: ${job.organizer.email} - 応募期限3日前: ${job.title}`);
      notificationsSent++;
    }

    // 3. 評価未提出のリマインダー（イベント終了から3日後）
    const jobsNeedingReviews = await prisma.job.findMany({
      where: {
        endAt: {
          gte: addDays(now, -4),
          lt: addDays(now, -3)
        },
        status: 'IN_PROGRESS'
      },
      include: {
        organizer: true,
        applications: {
          where: { status: 'ACCEPTED' },
          include: { nurse: true }
        },
        reviews: true
      }
    });

    for (const job of jobsNeedingReviews) {
      const organizerReview = job.reviews.find(r => r.authorId === job.organizerId);
      const nurseReviews = job.applications.map(app => 
        job.reviews.find(r => r.authorId === app.nurseId)
      );

      if (!organizerReview) {
        console.log(`📧 主催者通知: ${job.organizer.email} - 評価未提出: ${job.title}`);
        notificationsSent++;
      }

      job.applications.forEach((app, index) => {
        if (!nurseReviews[index]) {
          console.log(`📧 看護師通知: ${app.nurse.email} - 評価未提出: ${job.title}`);
          notificationsSent++;
        }
      });
    }

    // 監査ログ記録
    await auditService.logAction({
      actorId: 'system',
      action: 'SEND_REMINDER_NOTIFICATIONS',
      target: 'notifications',
      metadata: {
        notificationsSent,
        jobsStartingTomorrow: jobsStartingTomorrow.length,
        jobsDeadlineIn3Days: jobsDeadlineIn3Days.length,
        jobsNeedingReviews: jobsNeedingReviews.length,
        executedAt: now.toISOString()
      }
    });

    console.log(`✅ リマインダー通知送信完了: ${notificationsSent}件`);

    return NextResponse.json({
      success: true,
      notificationsSent,
      jobsStartingTomorrow: jobsStartingTomorrow.length,
      jobsDeadlineIn3Days: jobsDeadlineIn3Days.length,
      jobsNeedingReviews: jobsNeedingReviews.length,
      executedAt: now.toISOString()
    });

  } catch (error) {
    console.error('❌ リマインダー通知送信エラー:', error);
    
    return NextResponse.json({
      success: false,
      error: 'Notification sending failed',
      executedAt: new Date().toISOString()
    }, { status: 500 });
    
  } finally {
    await prisma.$disconnect();
  }
}