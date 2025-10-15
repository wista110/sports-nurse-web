# Sports Nurse Matching Platform

スポーツイベント向け看護師マッチングプラットフォーム（MVP）

## 🎯 プロジェクト概要

スポーツ分野の知見を持つ看護師と大会・イベント主催者をマッチングするプラットフォーム。タイミー風の単発マッチングシステムにエスクロー決済機能を組み合わせた安全な取引環境を提供。

### 主要機能
- 👥 **3つの役割**: 看護師・依頼者・運営者
- 📋 **案件管理**: 掲載・検索・応募・契約
- 💬 **アプリ内メッセージ**: リアルタイム通信
- 💰 **エスクロー決済**: 安全な支払いシステム（MVP版はモック実装）
- 📊 **評価システム**: 双方向レビューと実績管理

## 🚀 技術スタック

- **Frontend**: Next.js 14 (App Router), TypeScript, TailwindCSS
- **Backend**: Next.js API Routes, Prisma ORM
- **Database**: PostgreSQL (Neon)
- **Authentication**: NextAuth.js (Email/Password + OAuth)
- **Testing**: Jest (Unit), Playwright (E2E)
- **Deployment**: Vercel
- **Runtime**: Bun, Node 18+ compatible

## 📋 開発進捗

### ✅ 完了済みタスク

#### Task 1: プロジェクト基盤 (100%)
- [x] Next.js + TypeScript + Bun セットアップ
- [x] TailwindCSS + アクセシビリティ設定
- [x] ESLint + Prettier 厳格設定
- [x] 環境変数構造 (.env.example)
- [x] Prisma スキーマ完全実装
- [x] NextAuth.js 認証システム
- [x] RBAC ミドルウェア
- [x] Zod バリデーションスキーマ
- [x] Jest + Playwright テスト環境

#### Task 2-3: ユーザー管理・プロフィールシステム (100%)
- [x] ユーザー登録・ログイン機能
- [x] 役割別プロフィール管理
- [x] 看護師専用フィールド（免許番号、スキル、地域）
- [x] 依頼者プロフィール・認証ステータス
- [x] プロフィール表示・編集UI
- [x] 包括的テストスイート

### 🔄 次のタスク

#### Task 3: 案件管理システム (0%)
- [ ] 案件作成フォーム（場所・時間・種目・報酬）
- [ ] バリデーションロジック（時間制約・報酬ルール）
- [ ] ドラフト保存・公開機能
- [ ] 案件ステータス管理

#### Task 3.1: 案件検索・発見 (0%)
- [ ] 案件一覧ページ
- [ ] 検索・フィルタ機能（場所・日付・種目・報酬）
- [ ] ソート機能
- [ ] 案件詳細ページ

#### Task 3.2: 応募システム (0%)
- [ ] 応募フォーム（メッセージ・見積もり）
- [ ] 見積もり内訳システム
- [ ] 応募ステータス管理

### 📊 全体進捗: 23% (3/13 フェーズ完了)

## 🛠️ 開発環境セットアップ

### 前提条件
- Node.js 18+
- Bun
- PostgreSQL

### インストール・起動
```bash
# 依存関係インストール
bun install

# 環境変数設定
cp .env.example .env
# .env ファイルを編集してデータベース接続情報を設定

# データベースマイグレーション
bunx prisma migrate dev

# 開発サーバー起動
bun dev
```

### テスト実行
```bash
# 単体テスト
bun test

# E2Eテスト
bun test:e2e

# 全テスト
bun test:all
```

## 🗄️ データベース

### 主要モデル
- **User**: ユーザー（admin/organizer/nurse）
- **Job**: 案件情報
- **Application**: 応募情報
- **Thread/Message**: メッセージング
- **JobOrder**: 契約書
- **EscrowTransaction**: エスクロー取引
- **Review**: 評価・レビュー
- **AuditLog**: 監査ログ

### シード データ
```bash
# デモデータ投入
bunx prisma db seed
```

## 🔐 認証・認可

### 役割定義
- **Admin**: システム管理者
- **Organizer**: イベント主催者
- **Nurse**: スポーツ看護師

### アクセス制御
- RBAC ミドルウェアによる役割ベースアクセス制御
- セッション管理（NextAuth.js）
- API エンドポイント保護

## 🧪 テスト戦略

### 単体テスト (Jest)
- バリデーション関数
- ビジネスロジック
- ユーティリティ関数

### E2Eテスト (Playwright)
- ユーザー登録・ログイン
- プロフィール管理
- 案件ライフサイクル（予定）

## 📝 開発ルール

### コミット規約
- [Conventional Commits](https://www.conventionalcommits.org/) 準拠
- 1タスク = 1PR
- 差分レビュー必須

### コード品質
- ESLint + Prettier 厳格適用
- TypeScript strict mode
- アクセシビリティ準拠 (WCAG 2.1)

## 🚀 デプロイ

### 本番環境
- **Platform**: Vercel
- **Database**: Neon PostgreSQL
- **Domain**: TBD

### 環境変数
```bash
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=your-secret-key
# その他の設定は .env.example を参照
```

## 📚 ドキュメント

- [要件定義](.kiro/specs/sports-nurse-matching/requirements.md)
- [設計書](.kiro/specs/sports-nurse-matching/design.md)
- [実装計画](.kiro/specs/sports-nurse-matching/tasks.md)
- [テスト仕様](tests/README.md)

## 🤝 コントリビューション

1. Issue作成またはタスクリストから選択
2. フィーチャーブランチ作成
3. 実装・テスト
4. PR作成（テンプレート使用）
5. コードレビュー・マージ

## 📞 サポート

- **Repository**: https://github.com/wista110/sports-nurse-web
- **Issues**: GitHub Issues を使用
- **Code Owner**: @wista110

---

**Last Updated**: 2025/01/15  
**Version**: MVP v0.1.0  
**Status**: 🚧 Active Development