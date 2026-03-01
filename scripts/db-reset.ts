#!/usr/bin/env bun

/**
 * データベースリセットスクリプト
 * 
 * 使用方法:
 *   bun run scripts/db-reset.ts
 *   または
 *   bun run db:reset
 */

import { execSync } from 'child_process';
import { seedDatabase } from '../lib/seed';

async function resetDatabase() {
  console.log('🔄 データベースリセット');
  console.log('========================\n');
  
  try {
    console.log('1️⃣  Prismaスキーマをリセットしています...');
    execSync('bunx prisma db push --force-reset', { stdio: 'inherit' });
    
    console.log('\n2️⃣  シードデータを投入しています...');
    await seedDatabase();
    
    console.log('\n✅ データベースリセットが完了しました');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ データベースリセットが失敗しました:', error);
    process.exit(1);
  }
}

resetDatabase();