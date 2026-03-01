import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // Edge Runtime用の軽量設定
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.05 : 1.0,
  
  // 環境設定
  environment: process.env.NODE_ENV || 'development',
  
  // Edge Runtime制限に対応
  debug: false,
  
  // エラーフィルタリング
  beforeSend(event, hint) {
    // 開発環境では送信しない
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    return event;
  },
  
  // ユーザーコンテキスト設定
  initialScope: {
    tags: {
      component: 'edge'
    }
  }
});