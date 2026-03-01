import { PrismaClient } from '@prisma/client';
import { seedDatabase } from '@/lib/seed';

const prisma = new PrismaClient();

/**
 * テスト用データベースのセットアップ
 */
export async function setupTestDatabase() {
  console.log('🧪 テスト用データベースをセットアップしています...');
  
  try {
    // データベースをクリア
    await clearDatabase();
    
    // シードデータを投入
    await seedDatabase();
    
    console.log('✅ テスト用データベースのセットアップが完了しました');
  } catch (error) {
    console.error('❌ テスト用データベースのセットアップに失敗しました:', error);
    throw error;
  }
}

/**
 * テスト用データベースのクリーンアップ
 */
export async function cleanupTestDatabase() {
  console.log('🧹 テスト用データベースをクリーンアップしています...');
  
  try {
    await clearDatabase();
    console.log('✅ テスト用データベースのクリーンアップが完了しました');
  } catch (error) {
    console.error('❌ テスト用データベースのクリーンアップに失敗しました:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * データベースをクリア
 */
async function clearDatabase() {
  // 外部キー制約の順序を考慮して削除
  await prisma.review.deleteMany();
  await prisma.message.deleteMany();
  await prisma.thread.deleteMany();
  await prisma.application.deleteMany();
  await prisma.jobOrder.deleteMany();
  await prisma.escrowTransaction.deleteMany();
  await prisma.attendanceRecord.deleteMany();
  await prisma.job.deleteMany();
  await prisma.auditLog.deleteMany();
  await prisma.profile.deleteMany();
  await prisma.user.deleteMany();
}

/**
 * テスト用ユーザーの取得
 */
export async function getTestUsers() {
  const users = await prisma.user.findMany({
    include: {
      profile: true
    }
  });

  return {
    admin: users.find(u => u.role === 'ADMIN'),
    nurses: users.filter(u => u.role === 'NURSE'),
    organizers: users.filter(u => u.role === 'ORGANIZER'),
  };
}

/**
 * テスト用求人の取得
 */
export async function getTestJobs() {
  return await prisma.job.findMany({
    include: {
      organizer: {
        include: {
          profile: true
        }
      }
    }
  });
}