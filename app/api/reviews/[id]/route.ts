import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reviewService } from '@/lib/services/review';
import { updateReviewSchema } from '@/lib/validations/review';
import { handleApiError } from '@/lib/errors';

interface RouteParams {
  params: {
    id: string;
  };
}

// レビュー更新
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { id } = params;
    const body = await request.json();
    const validatedData = updateReviewSchema.parse(body);

    const review = await reviewService.updateReview(id, validatedData, session.user.id);

    return NextResponse.json({
      success: true,
      data: review,
      message: 'レビューが更新されました'
    });
  } catch (error) {
    return handleApiError(error);
  }
}