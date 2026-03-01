#!/usr/bin/env bun

/**
 * 環境変数チェックスクリプト
 * 
 * 使用方法:
 *   bun run scripts/check-env.ts
 *   または
 *   bun run env:check
 */

import { existsSync, readFileSync } from 'fs';

interface EnvCheck {
  key: string;
  required: boolean;
  description: string;
  example?: string;
}

const ENV_CHECKS: EnvCheck[] = [
  {
    key: 'DATABASE_URL',
    required: true,
    description: 'PostgreSQLデータベースの接続URL',
    example: 'postgresql://user:password@localhost:5432/sports_nurse'
  },
  {
    key: 'NEXTAUTH_SECRET',
    required: true,
    description: 'NextAuth.jsの秘密鍵（32文字以上推奨）',
    example: 'your-super-secret-key-here-32-chars-min'
  },
  {
    key: 'NEXTAUTH_URL',
    required: true,
    description: 'アプリケーションのベースURL',
    example: 'http://localhost:3000'
  },
  {
    key: 'ENCRYPTION_KEY',
    required: false,
    description: 'データ暗号化用の秘密鍵',
    example: 'your-encryption-key-for-sensitive-data'
  },
  {
    key: 'PUSHER_APP_ID',
    required: false,
    description: 'Pusher App ID（リアルタイム機能用）'
  },
  {
    key: 'PUSHER_KEY',
    required: false,
    description: 'Pusher Key（リアルタイム機能用）'
  },
  {
    key: 'PUSHER_SECRET',
    required: false,
    description: 'Pusher Secret（リアルタイム機能用）'
  },
  {
    key: 'PUSHER_CLUSTER',
    required: false,
    description: 'Pusher Cluster（リアルタイム機能用）',
    example: 'ap3'
  },
  {
    key: 'BLOB_READ_WRITE_TOKEN',
    required: false,
    description: 'Vercel Blob ストレージトークン'
  }
];

function checkEnvironment() {
  console.log('🔍 環境変数チェック');
  console.log('==================\n');
  
  // .envファイルの存在チェック
  if (!existsSync('.env')) {
    console.log('❌ .envファイルが見つかりません');
    
    if (existsSync('.env.example')) {
      console.log('💡 .env.exampleファイルが見つかりました');
      console.log('   以下のコマンドで.envファイルを作成してください:');
      console.log('   cp .env.example .env\n');
    }
    
    console.log('📋 必要な環境変数:');
    ENV_CHECKS.filter(check => check.required).forEach(check => {
      console.log(`   ${check.key}: ${check.description}`);
      if (check.example) {
        console.log(`     例: ${check.example}`);
      }
    });
    
    process.exit(1);
  }
  
  // 環境変数の読み込み
  const envContent = readFileSync('.env', 'utf-8');
  const envVars = new Map<string, string>();
  
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=');
      if (key && valueParts.length > 0) {
        envVars.set(key.trim(), valueParts.join('=').trim());
      }
    }
  });
  
  let hasErrors = false;
  let hasWarnings = false;
  
  console.log('✅ .envファイルが見つかりました\n');
  
  // 各環境変数のチェック
  ENV_CHECKS.forEach(check => {
    const value = envVars.get(check.key);
    const hasValue = value && value.length > 0;
    
    if (check.required) {
      if (hasValue) {
        console.log(`✅ ${check.key}: 設定済み`);
        
        // 値の妥当性チェック
        if (check.key === 'NEXTAUTH_SECRET' && value!.length < 32) {
          console.log(`   ⚠️  警告: 32文字以上を推奨（現在: ${value!.length}文字）`);
          hasWarnings = true;
        }
        
        if (check.key === 'DATABASE_URL' && !value!.startsWith('postgresql://')) {
          console.log(`   ⚠️  警告: PostgreSQL URLの形式を確認してください`);
          hasWarnings = true;
        }
      } else {
        console.log(`❌ ${check.key}: 未設定（必須）`);
        console.log(`   ${check.description}`);
        if (check.example) {
          console.log(`   例: ${check.example}`);
        }
        hasErrors = true;
      }
    } else {
      if (hasValue) {
        console.log(`✅ ${check.key}: 設定済み（オプション）`);
      } else {
        console.log(`⚪ ${check.key}: 未設定（オプション）`);
        console.log(`   ${check.description}`);
      }
    }
  });
  
  console.log('\n' + '='.repeat(50));
  
  if (hasErrors) {
    console.log('❌ 必須の環境変数が不足しています');
    console.log('   .envファイルを編集して必要な値を設定してください');
    process.exit(1);
  } else if (hasWarnings) {
    console.log('⚠️  環境変数は設定されていますが、警告があります');
    console.log('   本番環境では推奨設定を使用してください');
  } else {
    console.log('✅ すべての必須環境変数が正しく設定されています');
  }
  
  console.log('\n🚀 次のステップ:');
  console.log('   bun run dev で開発サーバーを起動');
}

checkEnvironment();