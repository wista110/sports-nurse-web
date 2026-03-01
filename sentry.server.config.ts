import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  
  // パフォーマンス監視
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  
  // 環境設定
  environment: process.env.NODE_ENV || 'development',
  
  // サーバーサイド設定
  debug: process.env.NODE_ENV === 'development',
  
  // エラーフィルタリング
  beforeSend(event, hint) {
    // 開発環境では送信しない
    if (process.env.NODE_ENV === 'development') {
      return null;
    }
    
    // 機密情報をマスク
    if (event.request?.headers) {
      delete event.request.headers.authorization;
      delete event.request.headers.cookie;
    }
    
    return event;
  },
  
  // 統合設定
  integrations: [
    new Sentry.Integrations.Http({ tracing: true }),
    new Sentry.Integrations.Prisma({ client: undefined })
  ],
  
  // ユーザーコンテキスト設定
  initialScope: {
    tags: {
      component: 'server'
    }
  }
});