import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  
  // パフォーマンス監視
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // セッションリプレイ
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  
  // 環境設定
  environment: process.env.NODE_ENV || 'development',
  
  // エラーフィルタリング
  beforeSend(event, hint) {
    // 開発環境では送信しない
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    // 特定のエラーを除外
    const error = hint.originalException;
    if (error instanceof Error) {
      // ネットワークエラーなど一時的なエラーを除外
      if (error.message.includes('Network Error') || 
          error.message.includes('fetch')) {
        return null;
      }
    }
    
    return event;
  },
  
  // ユーザーコンテキスト設定
  initialScope: {
    tags: {
      component: 'client'
    }
  }
});