'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { EscrowDetails } from '@/lib/validations/payment';

interface EscrowStatusCardProps {
  escrow: EscrowDetails;
  userRole: 'ADMIN' | 'ORGANIZER' | 'NURSE';
  onRelease?: () => void;
  onRefund?: () => void;
}

export function EscrowStatusCard({ 
  escrow, 
  userRole, 
  onRelease, 
  onRefund 
}: EscrowStatusCardProps) {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AWAITING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">決済待ち</Badge>;
      case 'HOLDING':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">預り中</Badge>;
      case 'RELEASED':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">解放済み</Badge>;
      case 'REFUNDED':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">返金済み</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'AWAITING':
        return '依頼者による決済処理をお待ちしています';
      case 'HOLDING':
        return '報酬を安全にお預かりしています。作業完了後に看護師へ支払われます';
      case 'RELEASED':
        return '報酬が看護師に支払われました';
      case 'REFUNDED':
        return '報酬が依頼者に返金されました';
      default:
        return '';
    }
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">エスクロー取引</h3>
          {getStatusBadge(escrow.status)}
        </div>

        <div className="bg-gray-50 p-4 rounded-lg">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">取引ID</span>
              <p className="font-mono text-xs mt-1">{escrow.id}</p>
            </div>
            <div>
              <span className="text-gray-600">作成日時</span>
              <p className="mt-1">{new Date(escrow.createdAt).toLocaleString('ja-JP')}</p>
            </div>
            <div>
              <span className="text-gray-600">預り金額</span>
              <p className="font-semibold mt-1">¥{escrow.amount.toLocaleString()}</p>
            </div>
            <div>
              <span className="text-gray-600">プラットフォーム手数料</span>
              <p className="mt-1">¥{escrow.platformFee.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-lg">
          <h4 className="font-medium text-blue-800 mb-2">案件情報</h4>
          <p className="text-sm text-blue-700">{escrow.job.title}</p>
          <p className="text-xs text-blue-600 mt-1">
            依頼者: {escrow.job.organizer.name}
          </p>
        </div>

        <div className="text-sm text-gray-600">
          {getStatusDescription(escrow.status)}
        </div>

        {escrow.releasedAt && (
          <div className="text-sm text-green-600">
            解放日時: {new Date(escrow.releasedAt).toLocaleString('ja-JP')}
          </div>
        )}

        {escrow.refundedAt && (
          <div className="text-sm text-red-600">
            返金日時: {new Date(escrow.refundedAt).toLocaleString('ja-JP')}
          </div>
        )}

        {/* 管理者用操作ボタン */}
        {userRole === 'ADMIN' && escrow.status === 'HOLDING' && (
          <div className="flex space-x-3 pt-4 border-t">
            <Button
              onClick={onRelease}
              size="sm"
              className="bg-green-600 hover:bg-green-700"
            >
              エスクロー解放
            </Button>
            <Button
              onClick={onRefund}
              size="sm"
              variant="outline"
              className="border-red-200 text-red-600 hover:bg-red-50"
            >
              返金処理
            </Button>
          </div>
        )}

        {/* 依頼者用決済ボタン */}
        {userRole === 'ORGANIZER' && escrow.status === 'AWAITING' && (
          <div className="pt-4 border-t">
            <p className="text-sm text-amber-600 mb-3">
              ⚠️ 決済処理が完了していません。下記ボタンから決済を完了してください。
            </p>
            <Button size="sm" className="w-full">
              決済を完了する
            </Button>
          </div>
        )}
      </div>
    </Card>
  );
}