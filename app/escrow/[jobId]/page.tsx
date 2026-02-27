import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { paymentService } from '@/lib/services/payment';
import { EscrowPaymentForm } from '@/components/payment/escrow-payment-form';
import { EscrowStatusCard } from '@/components/payment/escrow-status-card';

interface PageProps {
  params: {
    jobId: string;
  };
}

export const metadata: Metadata = {
  title: 'エスクロー決済 | Sports Nurse',
  description: '安全な取引のためのエスクロー決済システム',
};

export default async function EscrowPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const { jobId } = params;

  // 案件情報取得
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      organizer: {
        select: { id: true, profile: true }
      },
      applications: {
        where: { status: 'ACCEPTED' },
        include: {
          nurse: {
            select: { id: true, profile: true }
          }
        }
      },
      orders: {
        where: { status: 'ACCEPTED' },
        orderBy: { acceptedAt: 'desc' },
        take: 1
      }
    }
  });

  if (!job) {
    redirect('/jobs');
  }

  // アクセス権限チェック
  const isOrganizer = session.user.id === job.organizerId;
  const isNurse = job.applications.some(app => app.nurseId === session.user.id);
  const isAdmin = session.user.role === 'ADMIN';

  if (!isOrganizer && !isNurse && !isAdmin) {
    redirect('/dashboard');
  }

  // 既存のエスクロー取引確認
  const existingEscrow = await paymentService.getEscrowByJobId(jobId);

  // 報酬計算（応募時の見積もりまたはデフォルト報酬）
  const acceptedApplication = job.applications[0];
  const totalAmount = acceptedApplication?.quote 
    ? (acceptedApplication.quote as any).total 
    : job.compensation.amount;

  const handlePaymentComplete = (escrowId: string) => {
    // 決済完了後の処理
    window.location.href = `/jobs/${jobId}?escrow=completed`;
  };

  const handleCancel = () => {
    // キャンセル時の処理
    window.location.href = `/jobs/${jobId}`;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">エスクロー決済</h1>
        <p className="text-gray-600">
          安全な取引のため、報酬をエスクローシステムでお預かりします
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="text-lg font-semibold mb-4">案件詳細</h2>
          <div className="bg-white border rounded-lg p-6">
            <h3 className="font-semibold mb-2">{job.title}</h3>
            <div className="space-y-2 text-sm text-gray-600">
              <p>📍 {job.location.prefecture} {job.location.city}</p>
              <p>📅 {new Date(job.startAt).toLocaleDateString('ja-JP')} - {new Date(job.endAt).toLocaleDateString('ja-JP')}</p>
              <p>👥 必要人数: {job.headcount}名</p>
              <p>💰 報酬: ¥{totalAmount.toLocaleString()}</p>
            </div>
            
            {acceptedApplication && (
              <div className="mt-4 pt-4 border-t">
                <h4 className="font-medium mb-2">担当看護師</h4>
                <p className="text-sm">
                  {(acceptedApplication.nurse.profile as any)?.name || '名前未設定'}
                </p>
              </div>
            )}
          </div>
        </div>

        <div>
          {existingEscrow ? (
            <div>
              <h2 className="text-lg font-semibold mb-4">エスクロー状況</h2>
              <EscrowStatusCard
                escrow={existingEscrow}
                userRole={session.user.role as 'ADMIN' | 'ORGANIZER' | 'NURSE'}
              />
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-semibold mb-4">仮払い手続き</h2>
              {isOrganizer && job.status === 'CONTRACTED' ? (
                <EscrowPaymentForm
                  jobId={jobId}
                  jobTitle={job.title}
                  totalAmount={totalAmount}
                  onPaymentComplete={handlePaymentComplete}
                  onCancel={handleCancel}
                />
              ) : (
                <div className="bg-gray-50 p-6 rounded-lg text-center">
                  <p className="text-gray-600">
                    {job.status !== 'CONTRACTED' 
                      ? '契約が完了していないため、エスクロー決済はまだ利用できません'
                      : 'エスクロー決済は依頼者のみ実行できます'
                    }
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 案件ステータス表示 */}
      <div className="mt-8 p-4 bg-blue-50 rounded-lg">
        <h3 className="font-medium text-blue-800 mb-2">現在のステータス</h3>
        <div className="flex items-center space-x-4 text-sm">
          <span className={`px-2 py-1 rounded text-xs font-medium ${
            job.status === 'CONTRACTED' ? 'bg-green-100 text-green-800' :
            job.status === 'ESCROW_HOLDING' ? 'bg-blue-100 text-blue-800' :
            job.status === 'IN_PROGRESS' ? 'bg-yellow-100 text-yellow-800' :
            job.status === 'PAID' ? 'bg-green-100 text-green-800' :
            'bg-gray-100 text-gray-800'
          }`}>
            {job.status === 'CONTRACTED' && '契約済み'}
            {job.status === 'ESCROW_HOLDING' && 'エスクロー預り中'}
            {job.status === 'IN_PROGRESS' && '実施中'}
            {job.status === 'PAID' && '支払い完了'}
          </span>
          <span className="text-blue-700">
            {job.status === 'CONTRACTED' && '仮払い手続きを行ってください'}
            {job.status === 'ESCROW_HOLDING' && '報酬を安全にお預かりしています'}
            {job.status === 'IN_PROGRESS' && '当日の作業が進行中です'}
            {job.status === 'PAID' && 'すべての手続きが完了しました'}
          </span>
        </div>
      </div>
    </div>
  );
}