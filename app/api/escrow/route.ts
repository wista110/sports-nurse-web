import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { paymentService } from '@/lib/services/payment';
import { createEscrowSchema, calculateFeesSchema } from '@/lib/validations/payment';
import { AppError, handleApiError } from '@/lib/errors';

// エスクロー取引作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 依頼者のみ実行可能
    if (session.user.role !== 'ORGANIZER') {
      return NextResponse.json({ error: 'この操作は依頼者のみ実行できます' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = createEscrowSchema.parse(body);

    const escrow = await paymentService.createEscrow(validatedData, session.user.id);

    return NextResponse.json({
      success: true,
      data: escrow
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// 手数料計算
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = searchParams.get('amount');
    const paymentMethod = searchParams.get('paymentMethod');

    if (!amount || !paymentMethod) {
      return NextResponse.json({ 
        error: 'amount と paymentMethod パラメータが必要です' 
      }, { status: 400 });
    }

    const validatedData = calculateFeesSchema.parse({
      amount: parseFloat(amount),
      paymentMethod
    });

    const feeCalculation = await paymentService.calculateFees(validatedData);

    return NextResponse.json({
      success: true,
      data: feeCalculation
    });
  } catch (error) {
    return handleApiError(error);
  }
}