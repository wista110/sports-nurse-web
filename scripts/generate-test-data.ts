#!/usr/bin/env bun

/**
 * テストデータ生成スクリプト
 * 
 * 使用方法:
 *   bun run scripts/generate-test-data.ts [count]
 *   または
 *   bun run test:data [count]
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { SPORT_CATEGORIES, PREFECTURES, NURSE_SKILLS } from '../lib/seed/data';

const prisma = new PrismaClient();

interface GenerateOptions {
  userCount?: number;
  jobCount?: number;
  applicationCount?: number;
}

async function generateTestData(options: GenerateOptions = {}) {
  const {
    userCount = 20,
    jobCount = 50,
    applicationCount = 100
  } = options;
  
  console.log('🧪 テストデータ生成');
  console.log('==================\n');
  console.log(`👥 ユーザー: ${userCount}人`);
  console.log(`💼 求人: ${jobCount}件`);
  console.log(`📝 応募: ${applicationCount}件\n`);
  
  try {
    // ランダムユーザー生成
    console.log('👥 ランダムユーザーを生成しています...');
    const users = [];
    
    for (let i = 0; i < userCount; i++) {
      const role = Math.random() < 0.6 ? 'NURSE' : 'ORGANIZER';
      const hashedPassword = await bcrypt.hash('test123', 12);
      
      const user = await prisma.user.create({
        data: {
          email: `test${i + 1}@example.com`,
          password: hashedPassword,
          role,
          profile: {
            create: role === 'NURSE' ? {
              name: `テスト看護師${i + 1}`,
              phone: `090-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
              prefecture: PREFECTURES[Math.floor(Math.random() * PREFECTURES.length)],
              city: `テスト市${i + 1}`,
              licenseNumber: `N${String(Math.floor(Math.random() * 1000000000)).padStart(9, '0')}`,
              skills: NURSE_SKILLS.slice(0, Math.floor(Math.random() * 8) + 3),
              experience: Math.floor(Math.random() * 15) + 1,
              bio: `${Math.floor(Math.random() * 15) + 1}年の看護師経験があります。スポーツ医療に興味があります。`,
            } : {
              name: `テスト主催者${i + 1}`,
              phone: `03-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}-${String(Math.floor(Math.random() * 10000)).padStart(4, '0')}`,
              prefecture: PREFECTURES[Math.floor(Math.random() * PREFECTURES.length)],
              city: `テスト市${i + 1}`,
              organizationName: `テスト団体${i + 1}`,
              organizationType: ['スポーツクラブ', '協会・団体', '学校', '企業'][Math.floor(Math.random() * 4)],
              isVerified: Math.random() > 0.3,
              bio: `地域のスポーツ振興を目的とした活動を行っています。`,
            }
          }
        },
        include: { profile: true }
      });
      
      users.push(user);
    }
    
    console.log(`  ✅ ${users.length}人のユーザーを作成しました`);
    
    // ランダム求人生成
    console.log('\n💼 ランダム求人を生成しています...');
    const organizers = users.filter(u => u.role === 'ORGANIZER');
    const jobs = [];
    
    for (let i = 0; i < jobCount; i++) {
      const organizer = organizers[Math.floor(Math.random() * organizers.length)];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 90) + 1);
      const endDate = new Date(startDate);
      endDate.setHours(startDate.getHours() + Math.floor(Math.random() * 8) + 4);
      
      const job = await prisma.job.create({
        data: {
          title: `テストイベント${i + 1} - ${SPORT_CATEGORIES[Math.floor(Math.random() * SPORT_CATEGORIES.length)]}大会`,
          description: `テスト用の${SPORT_CATEGORIES[Math.floor(Math.random() * SPORT_CATEGORIES.length)]}イベントです。医療サポートをお願いします。`,
          location: `${PREFECTURES[Math.floor(Math.random() * PREFECTURES.length)]}テスト市`,
          prefecture: PREFECTURES[Math.floor(Math.random() * PREFECTURES.length)],
          city: `テスト市${i + 1}`,
          venue: `テスト会場${i + 1}`,
          startDate,
          endDate,
          category: SPORT_CATEGORIES[Math.floor(Math.random() * SPORT_CATEGORIES.length)],
          participantCount: Math.floor(Math.random() * 1000) + 50,
          requiredNurses: Math.floor(Math.random() * 10) + 1,
          compensation: (Math.floor(Math.random() * 20) + 10) * 1000,
          transportationFee: Math.floor(Math.random() * 3) * 500,
          mealProvided: Math.random() > 0.5,
          accommodationProvided: Math.random() > 0.8,
          requirements: NURSE_SKILLS.slice(0, Math.floor(Math.random() * 5) + 2),
          applicationDeadline: new Date(startDate.getTime() - 3 * 24 * 60 * 60 * 1000),
          status: ['DRAFT', 'PUBLISHED'][Math.floor(Math.random() * 2)] as any,
          isUrgent: Math.random() > 0.8,
          organizerId: organizer.id,
        }
      });
      
      jobs.push(job);
    }
    
    console.log(`  ✅ ${jobs.length}件の求人を作成しました`);
    
    // ランダム応募生成
    console.log('\n📝 ランダム応募を生成しています...');
    const nurses = users.filter(u => u.role === 'NURSE');
    const publishedJobs = jobs.filter(j => j.status === 'PUBLISHED');
    const applications = [];
    
    for (let i = 0; i < Math.min(applicationCount, nurses.length * publishedJobs.length); i++) {
      const nurse = nurses[Math.floor(Math.random() * nurses.length)];
      const job = publishedJobs[Math.floor(Math.random() * publishedJobs.length)];
      
      // 重複チェック
      const existingApplication = await prisma.application.findFirst({
        where: {
          nurseId: nurse.id,
          jobId: job.id
        }
      });
      
      if (existingApplication) continue;
      
      const application = await prisma.application.create({
        data: {
          nurseId: nurse.id,
          jobId: job.id,
          message: `${job.title}に応募いたします。よろしくお願いいたします。`,
          customQuote: job.compensation + Math.floor(Math.random() * 5000) - 2500,
          status: ['PENDING', 'ACCEPTED', 'REJECTED'][Math.floor(Math.random() * 3)] as any,
        }
      });
      
      applications.push(application);
    }
    
    console.log(`  ✅ ${applications.length}件の応募を作成しました`);
    
    console.log('\n🎉 テストデータの生成が完了しました！');
    console.log('\n📊 生成されたデータ:');
    console.log(`  👥 ユーザー: ${users.length}人`);
    console.log(`  💼 求人: ${jobs.length}件`);
    console.log(`  📝 応募: ${applications.length}件`);
    
  } catch (error) {
    console.error('\n❌ テストデータ生成中にエラーが発生しました:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// コマンドライン引数の処理
const args = process.argv.slice(2);
const count = args[0] ? parseInt(args[0]) : undefined;

const options: GenerateOptions = {};
if (count) {
  options.userCount = count;
  options.jobCount = count * 2;
  options.applicationCount = count * 3;
}

generateTestData(options).catch((error) => {
  console.error(error);
  process.exit(1);
});