import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { 
  SAMPLE_USERS, 
  SAMPLE_JOBS, 
  SAMPLE_MESSAGES, 
  SAMPLE_REVIEWS,
  SPORT_CATEGORIES,
  PREFECTURES,
  NURSE_SKILLS
} from './data';

const prisma = new PrismaClient();

/**
 * データベースをクリアする
 */
async function clearDatabase() {
  console.log('🗑️  データベースをクリアしています...');
  
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
  
  console.log('✅ データベースのクリアが完了しました');
}

/**
 * ユーザーとプロフィールを作成
 */
async function seedUsers() {
  console.log('👥 ユーザーデータを作成しています...');
  
  const users = [];
  
  for (const userData of SAMPLE_USERS) {
    const hashedPassword = await bcrypt.hash(userData.password, 12);
    
    const user = await prisma.user.create({
      data: {
        email: userData.email,
        password: hashedPassword,
        role: userData.role,
        profile: {
          create: {
            name: userData.profile.name,
            phone: userData.profile.phone,
            prefecture: userData.profile.prefecture,
            city: userData.profile.city,
            licenseNumber: userData.profile.licenseNumber || null,
            skills: userData.profile.skills || [],
            experience: userData.profile.experience || null,
            organizationName: userData.profile.organizationName || null,
            organizationType: userData.profile.organizationType || null,
            isVerified: userData.profile.isVerified || false,
            bio: userData.profile.bio || null,
          }
        },
        include: {
          profile: true
        }
      }
    });
    
    users.push(user);
    console.log(`  ✅ ${user.profile?.name} (${user.role})`);
  }
  
  return users;
}

/**
 * 求人を作成
 */
async function seedJobs(users: any[]) {
  console.log('💼 求人データを作成しています...');
  
  const organizers = users.filter(user => user.role === 'ORGANIZER');
  const jobs = [];
  
  for (let i = 0; i < SAMPLE_JOBS.length; i++) {
    const jobData = SAMPLE_JOBS[i];
    const organizer = organizers[i % organizers.length];
    
    const job = await prisma.job.create({
      data: {
        ...jobData,
        organizerId: organizer.id,
        requirements: jobData.requirements,
      }
    });
    
    jobs.push(job);
    console.log(`  ✅ ${job.title}`);
  }
  
  return jobs;
}

/**
 * 応募を作成
 */
async function seedApplications(users: any[], jobs: any[]) {
  console.log('📝 応募データを作成しています...');
  
  const nurses = users.filter(user => user.role === 'NURSE');
  const applications = [];
  
  // 各看護師が複数の求人に応募
  for (const nurse of nurses) {
    const jobsToApply = jobs.slice(0, Math.floor(Math.random() * 3) + 1);
    
    for (const job of jobsToApply) {
      const application = await prisma.application.create({
        data: {
          nurseId: nurse.id,
          jobId: job.id,
          message: `${job.title}に応募いたします。${nurse.profile?.experience || 0}年の経験があり、特に${nurse.profile?.skills?.[0] || '救急処置'}を得意としています。`,
          customQuote: job.compensation + Math.floor(Math.random() * 5000),
          status: ['PENDING', 'ACCEPTED', 'REJECTED'][Math.floor(Math.random() * 3)] as any,
        }
      });
      
      applications.push(application);
    }
  }
  
  console.log(`  ✅ ${applications.length}件の応募を作成しました`);
  return applications;
}

/**
 * メッセージスレッドとメッセージを作成
 */
async function seedMessages(applications: any[]) {
  console.log('💬 メッセージデータを作成しています...');
  
  const threads = [];
  
  // 承認された応募に対してメッセージスレッドを作成
  const acceptedApplications = applications.filter(app => app.status === 'ACCEPTED');
  
  for (const application of acceptedApplications.slice(0, 5)) {
    const thread = await prisma.thread.create({
      data: {
        applicationId: application.id,
        lastMessageAt: new Date(),
      }
    });
    
    // サンプルメッセージを作成
    for (let i = 0; i < SAMPLE_MESSAGES.length; i++) {
      const messageData = SAMPLE_MESSAGES[i];
      await prisma.message.create({
        data: {
          threadId: thread.id,
          senderId: messageData.isFromNurse ? application.nurseId : application.job?.organizerId,
          content: messageData.content,
          isRead: Math.random() > 0.3, // 70%の確率で既読
        }
      });
    }
    
    threads.push(thread);
  }
  
  console.log(`  ✅ ${threads.length}件のメッセージスレッドを作成しました`);
  return threads;
}

/**
 * 求人オーダー（契約）を作成
 */
async function seedJobOrders(applications: any[]) {
  console.log('📋 求人オーダーデータを作成しています...');
  
  const acceptedApplications = applications.filter(app => app.status === 'ACCEPTED');
  const jobOrders = [];
  
  for (const application of acceptedApplications.slice(0, 3)) {
    const jobOrder = await prisma.jobOrder.create({
      data: {
        applicationId: application.id,
        finalCompensation: application.customQuote || application.job?.compensation || 15000,
        terms: '標準的な医療サポート業務契約です。',
        status: ['PENDING', 'CONFIRMED', 'COMPLETED'][Math.floor(Math.random() * 3)] as any,
      }
    });
    
    jobOrders.push(jobOrder);
  }
  
  console.log(`  ✅ ${jobOrders.length}件の求人オーダーを作成しました`);
  return jobOrders;
}

/**
 * エスクロー取引を作成
 */
async function seedEscrowTransactions(jobOrders: any[]) {
  console.log('💰 エスクロー取引データを作成しています...');
  
  const confirmedOrders = jobOrders.filter(order => order.status === 'CONFIRMED');
  const escrowTransactions = [];
  
  for (const order of confirmedOrders) {
    const escrow = await prisma.escrowTransaction.create({
      data: {
        jobOrderId: order.id,
        amount: order.finalCompensation,
        platformFee: Math.floor(order.finalCompensation * 0.1), // 10%の手数料
        status: ['PENDING', 'HELD', 'RELEASED'][Math.floor(Math.random() * 3)] as any,
      }
    });
    
    escrowTransactions.push(escrow);
  }
  
  console.log(`  ✅ ${escrowTransactions.length}件のエスクロー取引を作成しました`);
  return escrowTransactions;
}

/**
 * 出席記録を作成
 */
async function seedAttendanceRecords(jobOrders: any[]) {
  console.log('📅 出席記録データを作成しています...');
  
  const completedOrders = jobOrders.filter(order => order.status === 'COMPLETED');
  const attendanceRecords = [];
  
  for (const order of completedOrders) {
    const checkInTime = new Date(order.application?.job?.startDate);
    const checkOutTime = new Date(order.application?.job?.endDate);
    
    const attendance = await prisma.attendanceRecord.create({
      data: {
        jobOrderId: order.id,
        checkInTime,
        checkOutTime,
        location: order.application?.job?.location || '会場',
        notes: '正常に業務を完了しました。',
      }
    });
    
    attendanceRecords.push(attendance);
  }
  
  console.log(`  ✅ ${attendanceRecords.length}件の出席記録を作成しました`);
  return attendanceRecords;
}

/**
 * レビューを作成
 */
async function seedReviews(jobOrders: any[], users: any[]) {
  console.log('⭐ レビューデータを作成しています...');
  
  const completedOrders = jobOrders.filter(order => order.status === 'COMPLETED');
  const reviews = [];
  
  for (let i = 0; i < completedOrders.length && i < SAMPLE_REVIEWS.length; i++) {
    const order = completedOrders[i];
    const reviewData = SAMPLE_REVIEWS[i];
    
    // 主催者から看護師へのレビュー
    const organizerReview = await prisma.review.create({
      data: {
        jobOrderId: order.id,
        reviewerId: order.application?.job?.organizerId,
        revieweeId: order.application?.nurseId,
        rating: reviewData.rating,
        comment: reviewData.comment,
        tags: reviewData.tags,
        type: 'ORGANIZER_TO_NURSE',
      }
    });
    
    // 看護師から主催者へのレビュー
    const nurseReview = await prisma.review.create({
      data: {
        jobOrderId: order.id,
        reviewerId: order.application?.nurseId,
        revieweeId: order.application?.job?.organizerId,
        rating: 4 + Math.floor(Math.random() * 2), // 4-5の評価
        comment: 'スムーズな運営で、安心して業務に取り組むことができました。',
        tags: ['運営良好', '安心感', 'コミュニケーション良好'],
        type: 'NURSE_TO_ORGANIZER',
      }
    });
    
    reviews.push(organizerReview, nurseReview);
  }
  
  console.log(`  ✅ ${reviews.length}件のレビューを作成しました`);
  return reviews;
}

/**
 * 監査ログを作成
 */
async function seedAuditLogs(users: any[]) {
  console.log('📊 監査ログデータを作成しています...');
  
  const auditActions = [
    'USER_REGISTERED',
    'LOGIN_SUCCESS',
    'PROFILE_UPDATED',
    'JOB_CREATED',
    'APPLICATION_SUBMITTED',
    'JOB_ORDER_CREATED',
    'ESCROW_CREATED',
    'PAYMENT_PROCESSED'
  ];
  
  const auditLogs = [];
  
  for (let i = 0; i < 50; i++) {
    const user = users[Math.floor(Math.random() * users.length)];
    const action = auditActions[Math.floor(Math.random() * auditActions.length)];
    
    const auditLog = await prisma.auditLog.create({
      data: {
        actorId: user.id,
        action,
        target: `${action.toLowerCase()}:${user.id}`,
        metadata: {
          userRole: user.role,
          timestamp: new Date().toISOString(),
          ipAddress: '127.0.0.1',
        },
      }
    });
    
    auditLogs.push(auditLog);
  }
  
  console.log(`  ✅ ${auditLogs.length}件の監査ログを作成しました`);
  return auditLogs;
}

/**
 * メインのシード関数
 */
async function main() {
  console.log('🌱 データベースシードを開始します...\n');
  
  try {
    // データベースをクリア
    await clearDatabase();
    
    // ユーザーを作成
    const users = await seedUsers();
    
    // 求人を作成
    const jobs = await seedJobs(users);
    
    // 応募を作成
    const applications = await seedApplications(users, jobs);
    
    // メッセージを作成
    await seedMessages(applications);
    
    // 求人オーダーを作成
    const jobOrders = await seedJobOrders(applications);
    
    // エスクロー取引を作成
    await seedEscrowTransactions(jobOrders);
    
    // 出席記録を作成
    await seedAttendanceRecords(jobOrders);
    
    // レビューを作成
    await seedReviews(jobOrders, users);
    
    // 監査ログを作成
    await seedAuditLogs(users);
    
    console.log('\n🎉 データベースシードが完了しました！');
    console.log('\n📋 作成されたデータ:');
    console.log(`  👥 ユーザー: ${users.length}人`);
    console.log(`  💼 求人: ${jobs.length}件`);
    console.log(`  📝 応募: ${applications.length}件`);
    console.log(`  📋 求人オーダー: ${jobOrders.length}件`);
    console.log('\n🔐 ログイン情報:');
    console.log('  管理者: admin@sportsnurse.jp / admin123');
    console.log('  看護師: nurse1@example.com / nurse123');
    console.log('  主催者: organizer1@example.com / organizer123');
    
  } catch (error) {
    console.error('❌ シード処理中にエラーが発生しました:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// スクリプトとして実行された場合
if (require.main === module) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}

export { main as seedDatabase };