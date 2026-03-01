import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reviewService } from '@/lib/services/review';
import { createReviewSchema, reviewSearchSchema } from '@/lib/validations/review';
import { handleApiError } from '@/lib/errors';

// レビュー一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      jobId: searchParams.get('jobId') || undefined,
      authorId: searchParams.get('authorId') || undefined,
      targetId: searchParams.get('targetId') || undefined,
      minRating: searchParams.get('minRating') ? parseInt(searchParams.get('minRating')!) : undefined,
      maxRating: searchParams.get('maxRating') ? parseInt(searchParams.get('maxRating')!) : undefined,
      tags: searchParams.get('tags') ? searchParams.get('tags')!.split(',') : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };

    const validatedFilters = reviewSearchSchema.parse(filters);
    const reviews = await reviewService.getReviews(validatedFilters);

    return NextResponse.json({
      success: true,
      data: reviews
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// レビュー作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = createReviewSchema.parse(body);

    const review = await reviewService.createReview(validatedData, session.user.id);

    return NextResponse.json({
      success: true,
      data: review,
      message: 'レビューが作成されました'
    });
  } catch (error) {
    return handleApiError(error);
  }
}