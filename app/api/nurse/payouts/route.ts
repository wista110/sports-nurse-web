import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { payoutService } from '@/lib/services/payout';
import { handleApiError } from '@/lib/errors';

// 看護師の支払い履歴取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 看護師のみアクセス可能
    if (session.user.role !== 'NURSE') {
      return NextResponse.json({ error: 'この操作は看護師のみ実行できます' }, { status: 403 });
    }

    const paymentHistory = await payoutService.getNursePaymentHistory(session.user.id);

    return NextResponse.json({
      success: true,
      data: paymentHistory
    });
  } catch (error) {
    return handleApiError(error);
  }
}