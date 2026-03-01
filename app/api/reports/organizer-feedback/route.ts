import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reviewService } from '@/lib/services/review';
import { organizerFeedbackSchema } from '@/lib/validations/review';
import { handleApiError } from '@/lib/errors';

// 依頼者フィードバック作成
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
    const validatedData = organizerFeedbackSchema.parse(body);

    const feedback = await reviewService.createOrganizerFeedback(validatedData, session.user.id);

    return NextResponse.json({
      success: true,
      data: feedback,
      message: 'フィードバックが作成されました'
    });
  } catch (error) {
    return handleApiError(error);
  }
}