import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { paymentService } from '@/lib/services/payment';
import { refundEscrowSchema } from '@/lib/validations/payment';
import { handleApiError } from '@/lib/errors';

interface RouteParams {
  params: {
    escrowId: string;
  };
}

// エスクロー返金
export async function POST(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者のみ実行可能
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'この操作は管理者のみ実行できます' }, { status: 403 });
    }

    const { escrowId } = params;
    const body = await request.json();
    
    const validatedData = refundEscrowSchema.parse({
      escrowId,
      ...body
    });

    await paymentService.refundEscrow(validatedData, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'エスクローが正常に返金されました'
    });
  } catch (error) {
    return handleApiError(error);
  }
}