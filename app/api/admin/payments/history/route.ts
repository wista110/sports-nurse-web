import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { paymentService } from '@/lib/services/payment';
import { handleApiError } from '@/lib/errors';

// 支払い履歴取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者のみ実行可能
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'この操作は管理者のみ実行できます' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      nurseId: searchParams.get('nurseId') || undefined,
      organizerId: searchParams.get('organizerId') || undefined,
      status: searchParams.get('status') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };

    const paymentHistory = await paymentService.getPaymentHistory(filters);

    return NextResponse.json({
      success: true,
      data: paymentHistory
    });
  } catch (error) {
    return handleApiError(error);
  }
}