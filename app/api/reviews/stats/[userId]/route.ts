import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reviewService } from '@/lib/services/review';
import { handleApiError } from '@/lib/errors';

interface RouteParams {
  params: {
    userId: string;
  };
}

// ユーザーのレビュー統計取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { userId } = params;
    const stats = await reviewService.getReviewStats(userId);

    return NextResponse.json({
      success: true,
      data: stats
    });
  } catch (error) {
    return handleApiError(error);
  }
}