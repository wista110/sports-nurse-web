import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { payoutService } from '@/lib/services/payout';
import { executePaymentSchema } from '@/lib/validations/payment';
import { handleApiError } from '@/lib/errors';

// 支払い履歴取得
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
    const jobId = searchParams.get('jobId');
    const status = searchParams.get('status');
    const limit = searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50;
    const offset = searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0;

    const paymentHistory = await payoutService.getPaymentHistory({
      nurseId: nurseId || undefined,
      jobId: jobId || undefined,
      status: status || undefined,
      limit,
      offset
    });

    return NextResponse.json({
      success: true,
      data: paymentHistory
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// 支払い実行
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

    const body = await request.json();
    const validatedData = executePaymentSchema.parse(body);

    const paymentResult = await payoutService.executePayment(validatedData, session.user.id);

    return NextResponse.json({
      success: true,
      data: paymentResult
    });
  } catch (error) {
    return handleApiError(error);
  }
}