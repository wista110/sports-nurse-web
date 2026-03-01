#!/usr/bin/env bun

/**
 * データベースシードスクリプト
 * 
 * 使用方法:
 *   bun run scripts/seed.ts
 *   または
 *   bun run seed
 */

import { seedDatabase } from '../lib/seed';

async function runSeed() {
  console.log('🌱 Sports Nurse データベースシード');
  console.log('=====================================\n');
  
  try {
    await seedDatabase();
    console.log('\n✅ シード処理が正常に完了しました');
    process.exit(0);
  } catch (error) {
    console.error('\n❌ シード処理が失敗しました:', error);
    process.exit(1);
  }
}

runSeed();