#!/usr/bin/env bun

/**
 * 開発環境セットアップスクリプト
 * 
 * 使用方法:
 *   bun run scripts/dev-setup.ts
 *   または
 *   bun run dev:setup
 */

import { execSync } from 'child_process';
import { existsSync, copyFileSync } from 'fs';
import { seedDatabase } from '../lib/seed';

async function setupDevelopment() {
  console.log('🚀 Sports Nurse 開発環境セットアップ');
  console.log('=====================================\n');
  
  try {
    // 1. 環境変数ファイルのチェック
    console.log('1️⃣  環境変数ファイルをチェックしています...');
    if (!existsSync('.env')) {
      if (existsSync('.env.example')) {
        copyFileSync('.env.example', '.env');
        console.log('   ✅ .env.exampleから.envを作成しました');
        console.log('   ⚠️  .envファイルを編集してデータベース接続情報を設定してください');
      } else {
        console.log('   ❌ .env.exampleファイルが見つかりません');
        throw new Error('.env.exampleファイルが必要です');
      }
    } else {
      console.log('   ✅ .envファイルが存在します');
    }
    
    // 2. 依存関係のインストール
    console.log('\n2️⃣  依存関係をインストールしています...');
    execSync('bun install', { stdio: 'inherit' });
    
    // 3. Prismaクライアントの生成
    console.log('\n3️⃣  Prismaクライアントを生成しています...');
    execSync('bunx prisma generate', { stdio: 'inherit' });
    
    // 4. データベーススキーマの適用
    console.log('\n4️⃣  データベーススキーマを適用しています...');
    execSync('bunx prisma db push', { stdio: 'inherit' });
    
    // 5. シードデータの投入
    console.log('\n5️⃣  シードデータを投入しています...');
    await seedDatabase();
    
    console.log('\n🎉 開発環境のセットアップが完了しました！');
    console.log('\n📋 次のステップ:');
    console.log('  1. .envファイルでデータベース接続情報を確認');
    console.log('  2. bun run dev で開発サーバーを起動');
    console.log('  3. http://localhost:3000 でアプリケーションにアクセス');
    console.log('\n🔐 サンプルログイン情報:');
    console.log('  管理者: admin@sportsnurse.jp / admin123');
    console.log('  看護師: nurse1@example.com / nurse123');
    console.log('  主催者: organizer1@example.com / organizer123');
    
  } catch (error) {
    console.error('\n❌ セットアップ中にエラーが発生しました:', error);
    console.log('\n🔧 トラブルシューティング:');
    console.log('  1. PostgreSQLが起動していることを確認');
    console.log('  2. .envファイルのDATABASE_URLを確認');
    console.log('  3. データベースが存在することを確認');
    process.exit(1);
  }
}

setupDevelopment();