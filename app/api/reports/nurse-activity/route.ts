import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reviewService } from '@/lib/services/review';
import { nurseActivityReportSchema } from '@/lib/validations/review';
import { handleApiError } from '@/lib/errors';

// 看護師活動報告作成
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 看護師のみ実行可能
    if (session.user.role !== 'NURSE') {
      return NextResponse.json({ error: 'この操作は看護師のみ実行できます' }, { status: 403 });
    }

    const body = await request.json();
    const validatedData = nurseActivityReportSchema.parse(body);

    const report = await reviewService.createNurseActivityReport(validatedData, session.user.id);

    return NextResponse.json({
      success: true,
      data: report,
      message: '活動報告が作成されました'
    });
  } catch (error) {
    return handleApiError(error);
  }
}