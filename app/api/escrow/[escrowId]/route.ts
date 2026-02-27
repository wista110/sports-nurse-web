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

// エスクロー取引詳細取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { escrowId } = params;
    const escrow = await paymentService.getEscrowDetails(escrowId);

    if (!escrow) {
      return NextResponse.json({ error: 'エスクロー取引が見つかりません' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: escrow
    });
  } catch (error) {
    return handleApiError(error);
  }
}