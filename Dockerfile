# Sports Nurse Matching Platform Dockerfile
# Bunランタイムを使用したNext.jsアプリケーション

FROM oven/bun:1 as base
WORKDIR /app

# 依存関係のインストール
FROM base AS deps
COPY package.json bun.lockb ./
RUN bun install --frozen-lockfile

# ビルド段階
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# 環境変数設定
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Prismaクライアント生成
RUN bunx prisma generate

# アプリケーションビルド
RUN bun run build

# 本番実行段階
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# システムユーザー作成
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# 必要なファイルをコピー
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma

# ファイル権限設定
RUN chown -R nextjs:nodejs /app
USER nextjs

# ポート公開
EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# ヘルスチェック
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

# アプリケーション起動
CMD ["node", "server.js"]