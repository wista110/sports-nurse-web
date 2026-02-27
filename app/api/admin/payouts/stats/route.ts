import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { payoutService } from '@/lib/services/payout';
import { handleApiError } from '@/lib/errors';

// 支払い統計取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者のみアクセス可能
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'この操作は管理者のみ実行できます' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const nurseId = searchParams.get('nurseId');

    const stats = await payoutService.getPaymentStats(nurseId || undefined);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    return handleApiError(error);
  }
}