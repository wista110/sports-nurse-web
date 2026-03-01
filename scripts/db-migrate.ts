#!/usr/bin/env bun

/**
 * データベースマイグレーションスクリプト
 * 
 * 使用方法:
 *   bun run scripts/db-migrate.ts
 *   または
 *   bun run db:migrate
 */

import { execSync } from 'child_process';

function runMigration() {
  console.log('🚀 データベースマイグレーション');
  console.log('===============================\n');
  
  try {
    console.log('📋 Prismaクライアントを生成しています...');
    execSync('bunx prisma generate', { stdio: 'inherit' });
    
    console.log('\n🔄 データベーススキーマを更新しています...');
    execSync('bunx prisma db push', { stdio: 'inherit' });
    
    console.log('\n✅ マイグレーションが完了しました');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ マイグレーションが失敗しました:', error);
    process.exit(1);
  }
}

runMigration();