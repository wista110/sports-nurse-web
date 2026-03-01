/**
 * レート制限ユーティリティ
 * メモリベースの簡易実装（本番環境ではRedisを使用）
 */

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// メモリストア（本番環境ではRedisを使用）
const store = new Map<string, RateLimitEntry>();

/**
 * レート制限チェック
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): Promise<{
  allowed: boolean;
  limit: number;
  remaining: number;
  resetTime?: number;
}> {
  const now = Date.now();
  const entry = store.get(key);

  // エントリが存在しないか、ウィンドウが過ぎている場合は新規作成
  if (!entry || now > entry.resetTime) {
    const newEntry: RateLimitEntry = {
      count: 1,
      resetTime: now + windowMs
    };
    store.set(key, newEntry);
    
    return {
      allowed: true,
      limit,
      remaining: limit - 1,
      resetTime: newEntry.resetTime
    };
  }

  // 制限に達している場合
  if (entry.count >= limit) {
    return {
      allowed: false,
      limit,
      remaining: 0,
      resetTime: entry.resetTime
    };
  }

  // カウントを増加
  entry.count++;
  store.set(key, entry);

  return {
    allowed: true,
    limit,
    remaining: limit - entry.count,
    resetTime: entry.resetTime
  };
}

/**
 * レート制限をリセット
 */
export function resetRateLimit(key: string): void {
  store.delete(key);
}

/**
 * 期限切れエントリのクリーンアップ
 */
export function cleanupExpiredEntries(): void {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now > entry.resetTime) {
      store.delete(key);
    }
  }
}

// 定期的なクリーンアップ（5分ごと）
setInterval(cleanupExpiredEntries, 5 * 60 * 1000);