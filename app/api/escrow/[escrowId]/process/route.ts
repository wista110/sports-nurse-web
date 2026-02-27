import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { paymentService } from '@/lib/services/payment';
import { handleApiError } from '@/lib/errors';

interface RouteParams {
  params: {
    escrowId: string;
  };
}

// モック決済処理実行
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 依頼者のみ実行可能
    if (session.user.role !== 'ORGANIZER') {
      return NextResponse.json({ error: 'この操作は依頼者のみ実行できます' }, { status: 403 });
    }

    const { escrowId } = params;
    const result = await paymentService.processPayment(escrowId, session.user.id);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    return handleApiError(error);
  }
}