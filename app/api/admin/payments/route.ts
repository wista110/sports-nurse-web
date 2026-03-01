import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { paymentService } from '@/lib/services/payment';
import { executePaymentSchema } from '@/lib/validations/payment';
import { handleApiError } from '@/lib/errors';

// 支払い可能な案件一覧取得
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

    const payableJobs = await paymentService.getPayableJobs();

    return NextResponse.json({
      success: true,
      data: payableJobs
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// 最終支払い処理実行
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

    const paymentResult = await paymentService.executeFinalPayment(validatedData, session.user.id);

    return NextResponse.json({
      success: true,
      data: paymentResult,
      message: '支払い処理が完了しました'
    });
  } catch (error) {
    return handleApiError(error);
  }
}