import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { payoutService } from '@/lib/services/payout';
import { handleApiError } from '@/lib/errors';

// 自動払いの一括処理
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者のみ実行可能
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'この操作は管理者のみ実行できます' }, { status: 403 });
    }

    const result = await payoutService.processScheduledPayments(session.user.id);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    return handleApiError(error);
  }
}