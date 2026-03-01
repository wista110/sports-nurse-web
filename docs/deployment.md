# デプロイメントガイド

## 概要

Sports Nurse Matching Platformのデプロイメント手順とCI/CDパイプラインについて説明します。

## 前提条件

### 必要なアカウント・サービス
- [Vercel](https://vercel.com) アカウント
- [GitHub](https://github.com) リポジトリ
- [Neon](https://neon.tech) PostgreSQLデータベース（推奨）
- [Sentry](https://sentry.io) エラートラッキング（オプション）

### 必要な環境変数
以下の環境変数をVercelプロジェクトに設定してください：

```bash
# データベース
DATABASE_URL="postgresql://..."

# 認証
NEXTAUTH_URL="https://your-domain.vercel.app"
NEXTAUTH_SECRET="your-production-secret"

# Cronジョブ認証
CRON_SECRET="your-cron-secret"

# 監視（オプション）
SENTRY_DSN="https://..."
SENTRY_ORG="your-org"
SENTRY_PROJECT="your-project"

# その他の設定
NODE_ENV="production"
```

## Vercelデプロイ

### 1. 手動デプロイ

```bash
# Vercel CLIインストール
npm i -g vercel

# プロジェクトリンク
vercel link

# プレビューデプロイ
vercel

# 本番デプロイ
vercel --prod
```

### 2. GitHub連携による自動デプロイ

1. VercelダッシュボードでGitHubリポジトリを連携
2. 環境変数を設定
3. `main`ブランチへのプッシュで自動デプロイ

## CI/CDパイプライン

### GitHub Actionsワークフロー

`.github/workflows/ci.yml`で以下のジョブを実行：

1. **quality-check**: コード品質チェック
   - TypeScript型チェック
   - ESLint
   - Prettier

2. **unit-tests**: 単体テスト
   - Jest実行
   - カバレッジレポート

3. **build-test**: ビルドテスト
   - Next.jsビルド確認

4. **e2e-tests**: E2Eテスト
   - Playwright実行
   - テストレポート生成

5. **security-scan**: セキュリティスキャン
   - 依存関係の脆弱性チェック

6. **deploy**: 本番デプロイ（mainブランチのみ）
   - Vercelデプロイ
   - データベースマイグレーション

### 必要なGitHub Secrets

```bash
VERCEL_TOKEN=your-vercel-token
VERCEL_ORG_ID=your-org-id
VERCEL_PROJECT_ID=your-project-id
VERCEL_DEPLOY_HOOK_MIGRATE=your-migration-hook-url
```

## データベースマイグレーション

### 開発環境

```bash
# スキーマ変更をデータベースに反映
bun run db:push

# マイグレーションファイル生成
bunx prisma migrate dev --name your-migration-name
```

### 本番環境

```bash
# 本番データベースマイグレーション
bun run db:migrate
```

マイグレーションは以下のタイミングで自動実行：
- GitHub Actionsでの本番デプロイ時
- Vercel Deploy Hookによる手動実行

## 監視とログ

### Sentry設定

1. Sentryプロジェクト作成
2. 環境変数設定
3. エラー自動収集開始

### ヘルスチェック

- エンドポイント: `/health`
- データベース接続確認
- システム状態監視

### Cronジョブ

Vercel Cronで以下のジョブを実行：

1. **期限切れ求人クリーンアップ** (毎日2:00)
   - `/api/cron/cleanup-expired-jobs`

2. **リマインダー通知送信** (毎日9:00)
   - `/api/cron/send-reminder-notifications`

3. **定期支払い処理** (毎月1日10:00)
   - `/api/cron/process-scheduled-payments`

## セキュリティ設定

### セキュリティヘッダー

`vercel.json`で以下のヘッダーを設定：
- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: 1; mode=block
- Referrer-Policy: strict-origin-when-cross-origin

### 環境変数の管理

- 機密情報は環境変数で管理
- `.env.example`でテンプレート提供
- 本番環境では強力なシークレット使用

## パフォーマンス最適化

### ビルド最適化

```bash
# バンドルサイズ分析
bun run build:analyze

# サイトマップ生成
bun run postbuild
```

### キャッシュ戦略

- 静的アセット: 長期キャッシュ
- API レスポンス: 適切なCache-Control
- データベースクエリ: Prismaキャッシュ

## トラブルシューティング

### よくある問題

1. **ビルドエラー**
   ```bash
   # 型チェック
   bun run type-check
   
   # 依存関係確認
   bun install
   ```

2. **データベース接続エラー**
   ```bash
   # 接続確認
   bunx prisma db pull
   
   # マイグレーション状態確認
   bunx prisma migrate status
   ```

3. **環境変数エラー**
   ```bash
   # 環境変数チェック
   bun run env:check
   ```

### ログ確認

- Vercelダッシュボード: Functions タブ
- Sentry: エラー詳細とスタックトレース
- GitHub Actions: ワークフロー実行ログ

## ロールバック手順

### Vercelロールバック

1. Vercelダッシュボードで Deployments タブ
2. 前のデプロイメントを選択
3. "Promote to Production" をクリック

### データベースロールバック

```bash
# マイグレーション履歴確認
bunx prisma migrate status

# 特定のマイグレーションまでロールバック
bunx prisma migrate reset --to 20231201000000_migration_name
```

## スケーリング

### Vercel設定

- Function実行時間: 30秒（設定済み）
- リージョン: Asia-Pacific (Tokyo)
- 同時実行数: 自動スケーリング

### データベース最適化

- 接続プーリング設定
- インデックス最適化
- クエリパフォーマンス監視

## 本番環境チェックリスト

- [ ] 環境変数設定完了
- [ ] データベースマイグレーション実行
- [ ] Sentry設定完了
- [ ] Cronジョブ動作確認
- [ ] ヘルスチェック正常
- [ ] SSL証明書有効
- [ ] セキュリティヘッダー設定
- [ ] パフォーマンステスト実行
- [ ] バックアップ設定完了

## サポート

デプロイメントに関する問題は以下を確認：

1. [Vercelドキュメント](https://vercel.com/docs)
2. [Next.jsデプロイガイド](https://nextjs.org/docs/deployment)
3. プロジェクトのGitHub Issues
4. 開発チームへの連絡