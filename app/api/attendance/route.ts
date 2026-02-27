import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { attendanceService } from '@/lib/services/attendance';
import { attendanceSearchSchema } from '@/lib/validations/attendance';
import { handleApiError } from '@/lib/errors';

// 出勤記録一覧取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      jobId: searchParams.get('jobId') || undefined,
      nurseId: searchParams.get('nurseId') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      status: searchParams.get('status') as 'checked_in' | 'checked_out' | 'incomplete' | undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };

    const validatedFilters = attendanceSearchSchema.parse(filters);

    // 権限チェック：看護師は自分の記録のみ、管理者・依頼者は全て
    if (session.user.role === 'NURSE') {
      validatedFilters.nurseId = session.user.id;
    }

    const attendanceRecords = await attendanceService.getAttendanceRecords(validatedFilters);

    return NextResponse.json({
      success: true,
      data: attendanceRecords
    });
  } catch (error) {
    return handleApiError(error);
  }
}