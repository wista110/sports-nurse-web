import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { attendanceService } from '@/lib/services/attendance';
import { handleApiError } from '@/lib/errors';

interface RouteParams {
  params: {
    jobId: string;
  };
}

// 特定案件の出勤記録取得
export async function GET(request: NextRequest, { params }: RouteParams) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { jobId } = params;
    const { searchParams } = new URL(request.url);
    const nurseId = searchParams.get('nurseId') || session.user.id;

    // 権限チェック：看護師は自分の記録のみ
    if (session.user.role === 'NURSE' && nurseId !== session.user.id) {
      return NextResponse.json({ error: 'アクセス権限がありません' }, { status: 403 });
    }

    const attendance = await attendanceService.getAttendanceRecord(jobId, nurseId);

    return NextResponse.json({
      success: true,
      data: attendance
    });
  } catch (error) {
    return handleApiError(error);
  }
}