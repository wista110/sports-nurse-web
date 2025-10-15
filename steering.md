# Steering / Constraints (Web)
- Stack: TypeScript, Next.js (App Router), Bun, Node 18+
- UI: TailwindCSS, A11y
- DB/ORM: PostgreSQL + Prisma (UUID)
- Auth: NextAuth, RBAC(admin/organizer/nurse)
- Payments: Escrow（MVPはモック）
- Infra: Vercel/Neon, .env / .env.example
- Quality: ESLint/Prettier, Jest + Playwright, CI=GitHub Actions
- Commits: Conventional Commits, 1タスク=1PR, diff-before-apply
- Security: PII最小, 監査ログ, 重要操作=2段階確認
