# Sports Nurse Matching Platform

スポーツイベント向け看護師マッチングプラットフォーム

## 概要

Sports Nurse Matching Platformは、スポーツイベント主催者と看護師をマッチングするWebアプリケーションです。安全なスポーツイベントの運営をサポートし、医療専門家による適切なサポートを提供します。

## 主な機能

### 👥 ユーザー管理
- 看護師・主催者・管理者の3つの役割
- プロフィール管理とスキル登録
- 認証・認可システム

### 💼 求人管理
- 求人の作成・編集・公開
- 詳細な検索・フィルタリング機能
- 応募管理システム

### 💬 コミュニケーション
- メッセージング機能
- ファイル添付対応
- リアルタイム通知

### 📋 契約管理
- 求人オファーの作成・管理
- 契約条件の交渉
- 電子契約システム

### 💰 決済・エスクロー
- 安全な決済システム
- エスクロー機能
- 手数料計算

### 📅 出席管理
- チェックイン・チェックアウト
- 位置情報記録
- 勤務時間管理

### ⭐ 評価システム
- 相互評価機能
- レビュー・レーティング
- 実績管理

### 🔒 セキュリティ
- 包括的な監査ログ
- セキュリティダッシュボード
- データ暗号化

## 技術スタック

- **フロントエンド**: Next.js 14 (App Router), React, TypeScript
- **スタイリング**: Tailwind CSS, Radix UI
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL + Prisma ORM
- **認証**: NextAuth.js
- **ランタイム**: Bun
- **デプロイ**: Vercel

## クイックスタート

### 前提条件

- Node.js 18.0.0以上
- Bun (推奨)
- PostgreSQL

### インストール

```bash
# リポジトリのクローン
git clone https://github.com/wista110/sports-nurse-web.git
cd sports-nurse-web

# 依存関係のインストール
bun install

# 環境変数の設定
cp .env.example .env
# .envファイルを編集してデータベース接続情報を設定

# 開発環境のセットアップ（自動）
bun run dev:setup
```

### 開発サーバーの起動

```bash
bun run dev
```

アプリケーションは http://localhost:3000 で利用できます。

## サンプルアカウント

| 役割 | メールアドレス | パスワード |
|------|----------------|------------|
| 管理者 | admin@sportsnurse.jp | admin123 |
| 看護師 | nurse1@example.com | nurse123 |
| 主催者 | organizer1@example.com | organizer123 |

## 開発コマンド

### データベース管理
```bash
bun run db:reset      # データベースリセット + シードデータ
bun run db:migrate    # マイグレーション実行
bun run db:studio     # Prisma Studio起動
bun run seed          # シードデータ投入
```

### 開発ツール
```bash
bun run dev:setup     # 開発環境セットアップ
bun run env:check     # 環境変数チェック
bun run test:data     # テストデータ生成
```

### コード品質
```bash
bun run lint          # リンティング
bun run format        # フォーマット
bun run type-check    # 型チェック
```

### テスト
```bash
bun run test          # 単体テスト
bun run test:e2e      # E2Eテスト
bun run test:all      # 全テスト実行
```

## プロジェクト構造

```
sports-nurse-web/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── admin/             # 管理者画面
│   ├── dashboard/         # ダッシュボード
│   ├── jobs/              # 求人関連ページ
│   └── ...                # その他のページ
├── components/            # Reactコンポーネント
│   ├── ui/               # 基本UIコンポーネント
│   ├── forms/            # フォームコンポーネント
│   ├── admin/            # 管理者用コンポーネント
│   └── ...               # 機能別コンポーネント
├── lib/                  # ユーティリティとサービス
│   ├── services/         # ビジネスロジック
│   ├── validations/      # Zodスキーマ
│   ├── seed/            # シードデータ
│   └── ...              # その他のユーティリティ
├── prisma/              # Prismaスキーマ
├── scripts/             # 開発用スクリプト
├── tests/               # テストファイル
└── docs/                # ドキュメント
```

## 主要な機能フロー

### 1. 求人応募フロー
1. 主催者が求人を作成・公開
2. 看護師が求人を検索・応募
3. 主催者が応募を確認・承認
4. メッセージでやり取り
5. 契約条件を確定

### 2. 決済フロー
1. 契約確定時にエスクロー作成
2. イベント実施
3. 出席確認
4. 相互評価
5. 決済実行

### 3. 管理フロー
1. 管理者がユーザー・求人を監視
2. セキュリティダッシュボードで異常検知
3. 監査ログで操作履歴確認
4. 必要に応じて介入・サポート

## セキュリティ

- 全ての重要操作を監査ログに記録
- PII（個人識別情報）の暗号化
- レート制限による攻撃防止
- セキュリティヘッダーの設定
- 不審なアクティビティの自動検知

## ライセンス

このプロジェクトはプライベートリポジトリです。

## サポート

問題や質問がある場合は、以下を確認してください：

1. [開発環境セットアップガイド](./docs/development-setup.md)
2. GitHubのIssues
3. 開発チームへの連絡

## 貢献

1. 機能ブランチを作成
2. 変更を実装
3. テストを実行
4. プルリクエストを作成

詳細は [CONTRIBUTING.md](./CONTRIBUTING.md) を参照してください。