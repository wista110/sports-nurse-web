# 開発環境セットアップガイド

## 前提条件

- Node.js 18.0.0以上
- Bun (推奨) または npm/yarn
- PostgreSQL データベース
- Git

## 初期セットアップ

### 1. リポジトリのクローン

```bash
git clone https://github.com/wista110/sports-nurse-web.git
cd sports-nurse-web
```

### 2. 依存関係のインストール

```bash
# Bunを使用（推奨）
bun install

# または npm
npm install
```

### 3. 環境変数の設定

`.env.example`をコピーして`.env`を作成し、必要な値を設定してください。

```bash
cp .env.example .env
```

主要な環境変数：
- `DATABASE_URL`: PostgreSQLデータベースの接続URL
- `NEXTAUTH_SECRET`: NextAuth.jsの秘密鍵
- `NEXTAUTH_URL`: アプリケーションのベースURL

### 4. データベースのセットアップ

```bash
# Prismaクライアントの生成
bun run db:generate

# データベーススキーマの適用
bun run db:push

# サンプルデータの投入
bun run seed
```

### 5. 開発サーバーの起動

```bash
bun run dev
```

アプリケーションは http://localhost:3000 で利用できます。

## 開発用コマンド

### データベース管理

```bash
# データベースリセット（スキーマ + シードデータ）
bun run db:reset

# マイグレーション実行
bun run db:migrate

# Prisma Studio（データベースGUI）
bun run db:studio

# シードデータのみ再投入
bun run seed
```

### コード品質

```bash
# リンティング
bun run lint
bun run lint:fix

# フォーマット
bun run format
bun run format:check

# 型チェック
bun run type-check
```

### テスト

```bash
# 単体テスト
bun run test
bun run test:watch

# 統合テスト
bun run test:integration

# E2Eテスト
bun run test:e2e

# 全テスト実行
bun run test:all
```

## サンプルデータ

シードスクリプトにより以下のサンプルデータが作成されます：

### ユーザーアカウント

| 役割 | メールアドレス | パスワード |
|------|----------------|------------|
| 管理者 | admin@sportsnurse.jp | admin123 |
| 看護師 | nurse1@example.com | nurse123 |
| 看護師 | nurse2@example.com | nurse123 |
| 看護師 | nurse3@example.com | nurse123 |
| 主催者 | organizer1@example.com | organizer123 |
| 主催者 | organizer2@example.com | organizer123 |
| 主催者 | organizer3@example.com | organizer123 |

### サンプルデータ内容

- **求人**: 4件（マラソン、サッカー、バスケ、テニス）
- **応募**: 各看護師が複数の求人に応募
- **メッセージ**: 承認された応募に対するメッセージ履歴
- **契約**: 一部の応募が契約まで進行
- **レビュー**: 完了した業務に対する相互評価
- **監査ログ**: システム操作の履歴

## ディレクトリ構造

```
sports-nurse-web/
├── app/                    # Next.js App Router
│   ├── api/               # API Routes
│   ├── admin/             # 管理者画面
│   └── ...                # その他のページ
├── components/            # Reactコンポーネント
│   ├── ui/               # 基本UIコンポーネント
│   ├── forms/            # フォームコンポーネント
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

## トラブルシューティング

### データベース接続エラー

1. PostgreSQLが起動していることを確認
2. `.env`の`DATABASE_URL`が正しいことを確認
3. データベースが存在することを確認

### Prismaエラー

```bash
# Prismaクライアントの再生成
bun run db:generate

# スキーマの強制適用
bun run db:push --force-reset
```

### 依存関係エラー

```bash
# node_modulesの削除と再インストール
rm -rf node_modules bun.lockb
bun install
```

## 本番環境への展開

### Vercelへのデプロイ

1. Vercelアカウントでリポジトリを接続
2. 環境変数を設定
3. 自動デプロイが実行される

### 環境変数（本番）

- `DATABASE_URL`: 本番データベースURL
- `NEXTAUTH_SECRET`: 本番用秘密鍵（強力なランダム文字列）
- `NEXTAUTH_URL`: 本番ドメイン

## 開発ガイドライン

### コミット規約

Conventional Commitsを使用：

```
feat: 新機能追加
fix: バグ修正
docs: ドキュメント更新
style: コードスタイル修正
refactor: リファクタリング
test: テスト追加・修正
chore: その他の変更
```

### プルリクエスト

1. 機能ブランチを作成
2. 変更を実装
3. テストを実行
4. プルリクエストを作成
5. レビュー後にマージ

## サポート

問題が発生した場合は、以下を確認してください：

1. このドキュメントのトラブルシューティング
2. GitHubのIssues
3. 開発チームへの連絡