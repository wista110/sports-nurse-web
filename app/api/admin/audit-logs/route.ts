import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { auditService } from '@/lib/services/audit';
import { handleApiError } from '@/lib/errors';

// 監査ログ取得
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者のみ実行可能
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'この操作は管理者のみ実行できます' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const filters = {
      actorId: searchParams.get('actorId') || undefined,
      action: searchParams.get('action') || undefined,
      target: searchParams.get('target') || undefined,
      startDate: searchParams.get('startDate') ? new Date(searchParams.get('startDate')!) : undefined,
      endDate: searchParams.get('endDate') ? new Date(searchParams.get('endDate')!) : undefined,
      limit: searchParams.get('limit') ? parseInt(searchParams.get('limit')!) : 100,
      offset: searchParams.get('offset') ? parseInt(searchParams.get('offset')!) : 0
    };

    const auditLogs = await auditService.getAuditLogs(filters);

    // 管理者による監査ログアクセスを記録
    await auditService.logAction({
      actorId: session.user.id,
      action: 'AUDIT_LOG_ACCESSED',
      target: 'audit_logs',
      metadata: {
        filters,
        resultCount: auditLogs.length
      }
    });

    return NextResponse.json({
      success: true,
      data: auditLogs
    });
  } catch (error) {
    return handleApiError(error);
  }
}

// セキュリティ統計取得
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: '認証が必要です' }, { status: 401 });
    }

    // 管理者のみ実行可能
    if (session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'この操作は管理者のみ実行できます' }, { status: 403 });
    }

    const body = await request.json();
    const { action } = body;

    if (action === 'getSecurityStats') {
      const stats = await auditService.getSecurityStats();
      
      return NextResponse.json({
        success: true,
        data: stats
      });
    }

    if (action === 'detectSuspiciousActivity') {
      const { userId } = body;
      if (!userId) {
        return NextResponse.json({ error: 'ユーザーIDが必要です' }, { status: 400 });
      }

      const suspiciousActivity = await auditService.detectSuspiciousActivity(userId);
      
      return NextResponse.json({
        success: true,
        data: suspiciousActivity
      });
    }

    return NextResponse.json({ error: '無効なアクションです' }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}