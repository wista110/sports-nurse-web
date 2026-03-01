#!/usr/bin/env bun

/**
 * データベースマイグレーション実行スクリプト
 * 本番環境でのマイグレーション実行時に使用
 */

import { execSync } from 'child_process';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function runMigrations() {
  try {
    console.log('🔄 データベースマイグレーションを開始します...');
    
    // データベース接続確認
    await prisma.$connect();
    console.log('✅ データベース接続確認完了');
    
    // マイグレーション実行
    console.log('📦 Prismaマイグレーションを実行中...');
    execSync('bunx prisma migrate deploy', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    // Prismaクライアント生成
    console.log('🔧 Prismaクライアントを生成中...');
    execSync('bunx prisma generate', { 
      stdio: 'inherit',
      env: { ...process.env }
    });
    
    console.log('✅ マイグレーション完了');
    
  } catch (error) {
    console.error('❌ マイグレーション中にエラーが発生しました:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// 本番環境でのみ実行
if (process.env.NODE_ENV === 'production' || process.env.VERCEL_ENV === 'production') {
  runMigrations();
} else {
  console.log('⚠️  本番環境以外では自動マイグレーションをスキップします');
  console.log('開発環境では `bun run db:push` を使用してください');
}