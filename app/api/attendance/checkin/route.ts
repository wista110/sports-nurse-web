import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { attendanceService } from '@/lib/services/attendance';
import { checkInSchema } from '@/lib/validations/attendance';
import { handleApiError } from '@/lib/errors';

// チェックイン
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
    const validatedData = checkInSchema.parse({
      ...body,
      nurseId: session.user.id // セッションから看護師IDを取得
    });

    const attendance = await attendanceService.checkIn(validatedData, session.user.id);

    return NextResponse.json({
      success: true,
      data: attendance,
      message: 'チェックインが完了しました'
    });
  } catch (error) {
    return handleApiError(error);
  }
}