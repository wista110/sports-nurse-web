import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { auditService } from '@/lib/services/audit';
import { rateLimit } from '@/lib/utils/rate-limit';

// セキュリティ設定
const SECURITY_CONFIG = {
  // レート制限
  rateLimits: {
    login: { requests: 5, window: 15 * 60 * 1000 }, // 15分間に5回
    api: { requests: 100, window: 60 * 1000 }, // 1分間に100回
    sensitive: { requests: 10, window: 60 * 1000 }, // 1分間に10回
  },
  
  // セキュリティヘッダー
  securityHeaders: {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
  },
  
  // 重要操作のパス
  sensitiveEndpoints: [
    '/api/admin/',
    '/api/payments/',
    '/api/escrow/',
    '/api/users/',
    '/api/auth/register'
  ],
  
  // 管理者専用パス
  adminOnlyEndpoints: [
    '/api/admin/',
    '/admin/'
  ]
};

/**
 * セキュリティミドルウェア
 */
export async function securityMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const { pathname } = request.nextUrl;
  const clientIP = getClientIP(request);
  const userAgent = request.headers.get('user-agent') || 'Unknown';

  // セキュリティヘッダーの設定
  const response = NextResponse.next();
  setSecurityHeaders(response);

  try {
    // レート制限チェック
    const rateLimitResult = await checkRateLimit(request, clientIP);
    if (!rateLimitResult.allowed) {
      await auditService.logSecurityEvent({
        actorId: 'system',
        eventType: 'RATE_LIMIT_EXCEEDED',
        action: 'REQUEST_BLOCKED',
        target: pathname,
        metadata: {
          clientIP,
          userAgent,
          limit: rateLimitResult.limit,
          remaining: rateLimitResult.remaining
        }
      });

      return new NextResponse('Too Many Requests', { 
        status: 429,
        headers: {
          'Retry-After': '60',
          ...SECURITY_CONFIG.securityHeaders
        }
      });
    }

    // 管理者専用エンドポイントのチェック
    if (isAdminOnlyEndpoint(pathname)) {
      const session = await getServerSession(authOptions);
      
      if (!session?.user || session.user.role !== 'ADMIN') {
        await auditService.logSecurityEvent({
          actorId: session?.user?.id || 'anonymous',
          eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
          action: 'ADMIN_ACCESS_DENIED',
          target: pathname,
          metadata: {
            clientIP,
            userAgent,
            userId: session?.user?.id,
            role: session?.user?.role
          }
        });

        return new NextResponse('Forbidden', { 
          status: 403,
          headers: SECURITY_CONFIG.securityHeaders
        });
      }

      // 管理者アクセスのログ記録
      await auditService.logAction({
        actorId: session.user.id,
        action: 'ADMIN_ACCESS',
        target: pathname,
        metadata: {
          clientIP,
          userAgent,
          timestamp: new Date().toISOString()
        }
      });
    }

    // 重要操作の追加チェック
    if (isSensitiveEndpoint(pathname)) {
      const session = await getServerSession(authOptions);
      
      if (session?.user) {
        // 不審なアクティビティの検出
        const suspiciousActivity = await auditService.detectSuspiciousActivity(session.user.id);
        
        if (suspiciousActivity.suspicious) {
          await auditService.logSecurityEvent({
            actorId: session.user.id,
            eventType: 'SUSPICIOUS_ACTIVITY_DETECTED',
            action: 'REQUEST_FLAGGED',
            target: pathname,
            metadata: {
              clientIP,
              userAgent,
              riskScore: suspiciousActivity.riskScore,
              reasons: suspiciousActivity.reasons
            }
          });

          // 高リスクの場合はブロック
          if (suspiciousActivity.riskScore >= 80) {
            return new NextResponse('Suspicious Activity Detected', { 
              status: 403,
              headers: SECURITY_CONFIG.securityHeaders
            });
          }
        }
      }
    }

    return response;
  } catch (error) {
    console.error('Security middleware error:', error);
    
    // セキュリティエラーのログ記録
    await auditService.logSecurityEvent({
      actorId: 'system',
      eventType: 'SECURITY_MIDDLEWARE_ERROR',
      action: 'MIDDLEWARE_FAILURE',
      target: pathname,
      metadata: {
        error: error instanceof Error ? error.message : 'Unknown error',
        clientIP,
        userAgent
      }
    });

    return response;
  }
}

/**
 * レート制限チェック
 */
async function checkRateLimit(request: NextRequest, clientIP: string): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
}> {
  const { pathname } = request.nextUrl;
  
  // エンドポイントに応じたレート制限の選択
  let limitConfig = SECURITY_CONFIG.rateLimits.api;
  
  if (pathname.includes('/api/auth/')) {
    limitConfig = SECURITY_CONFIG.rateLimits.login;
  } else if (isSensitiveEndpoint(pathname)) {
    limitConfig = SECURITY_CONFIG.rateLimits.sensitive;
  }

  const key = `rate_limit:${clientIP}:${pathname}`;
  
  try {
    const result = await rateLimit(key, limitConfig.requests, limitConfig.window);
    return result;
  } catch (error) {
    console.error('Rate limit check failed:', error);
    // エラー時は制限を適用しない（可用性優先）
    return { allowed: true, limit: limitConfig.requests, remaining: limitConfig.requests };
  }
}

/**
 * セキュリティヘッダーの設定
 */
function setSecurityHeaders(response: NextResponse): void {
  Object.entries(SECURITY_CONFIG.securityHeaders).forEach(([key, value]) => {
    response.headers.set(key, value);
  });
}

/**
 * 管理者専用エンドポイントかチェック
 */
function isAdminOnlyEndpoint(pathname: string): boolean {
  return SECURITY_CONFIG.adminOnlyEndpoints.some(endpoint => 
    pathname.startsWith(endpoint)
  );
}

/**
 * 重要操作のエンドポイントかチェック
 */
function isSensitiveEndpoint(pathname: string): boolean {
  return SECURITY_CONFIG.sensitiveEndpoints.some(endpoint => 
    pathname.startsWith(endpoint)
  );
}

/**
 * クライアントIPアドレスの取得
 */
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIP = request.headers.get('x-real-ip');
  
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  
  if (realIP) {
    return realIP;
  }
  
  return request.ip || '127.0.0.1';
}

/**
 * 入力サニタイゼーション
 */
export function sanitizeInput(input: any): any {
  if (typeof input === 'string') {
    return input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // スクリプトタグ除去
      .replace(/javascript:/gi, '') // javascript:プロトコル除去
      .replace(/on\w+\s*=/gi, '') // イベントハンドラー除去
      .trim();
  }
  
  if (Array.isArray(input)) {
    return input.map(item => sanitizeInput(item));
  }
  
  if (typeof input === 'object' && input !== null) {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(input)) {
      sanitized[sanitizeInput(key)] = sanitizeInput(value);
    }
    return sanitized;
  }
  
  return input;
}

/**
 * 確認モーダル用のトークン生成
 */
export function generateConfirmationToken(action: string, userId: string): string {
  const crypto = require('crypto');
  const data = `${action}:${userId}:${Date.now()}`;
  return crypto.createHash('sha256').update(data).digest('hex');
}

/**
 * 確認トークンの検証
 */
export function verifyConfirmationToken(token: string, action: string, userId: string): boolean {
  // 実際の実装では、トークンの有効期限チェックなども行う
  const expectedToken = generateConfirmationToken(action, userId);
  return token === expectedToken;
}