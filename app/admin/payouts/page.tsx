import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { PayoutManagementInterface } from '@/components/admin/payout-management-interface';

export const metadata: Metadata = {
  title: '支払い管理 | Sports Nurse Admin',
  description: '看護師への支払い管理システム',
};

export default async function AdminPayoutsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">支払い管理</h1>
        <p className="text-gray-600">
          看護師への支払い処理と履歴管理
        </p>
      </div>

      <PayoutManagementInterface />
    </div>
  );
}