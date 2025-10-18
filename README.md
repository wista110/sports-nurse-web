# Sports Nurse Matching Platform

スポーツイベント向け看護師マッチングプラットフォーム（MVP）

## 🎯 プロジェクト概要

スポーツ分野の知見を持つ看護師と大会・イベント主催者をマッチングするプラットフォーム。タイミー風の単発マッチングシステムにエスクロー決済機能を組み合わせた安全な取引環境を提供。

### 主要機能
- 👥 **3つの役割**: 看護師・依頼者・運営者
- 📋 **案件管理**: 掲載・検索・応募・契約 ✅
- 💬 **アプリ内メッセージ**: リアルタイム通信・ファイル添付 ✅
- 📄 **契約システム**: テンプレート・カスタム契約書・承認ワークフロー ✅
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

#### Task 3-5: 案件管理・メッセージング・契約システム (100%)
- [x] 案件作成フォーム（場所・時間・種目・報酬）
- [x] 案件検索・フィルタ・ソート機能
- [x] 応募システム（メッセージ・見積もり）
- [x] アプリ内メッセージング（リアルタイム通信）
- [x] ファイル添付機能（PDF/画像）
- [x] 契約書作成・送付システム
- [x] 契約承認・差戻しワークフロー
- [x] 確認モーダル・通知システム
- [x] ダッシュボード（看護師・依頼者）

### 🔄 次のタスク

#### Task 6: エスクロー・決済システム（モック実装） (0%)
- [ ] エスクロー取引管理システム
- [ ] 手数料計算ユーティリティ
- [ ] モック決済処理・ステータス管理
- [ ] 決済履歴・取引追跡

#### Task 7: 出勤管理・当日実施 (0%)
- [ ] チェックイン/アウト機能
- [ ] 出勤記録管理
- [ ] イレギュラー報告システム

#### Task 8: 評価・レビューシステム (0%)
- [ ] 5段階評価・タグシステム
- [ ] 活動報告・受入報告フォーム
- [ ] レビュー集計・表示

### 📊 全体進捗: 54% (7/13 フェーズ完了)

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
**Version**: MVP v0.2.0  
**Status**: 🚧 Active Development (Core Features Complete)