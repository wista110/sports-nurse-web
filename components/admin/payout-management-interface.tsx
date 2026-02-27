'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Modal } from '@/components/ui/modal';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { PaymentHistory } from '@/lib/validations/payment';

interface PaymentStats {
  totalEarnings: number;
  totalFees: number;
  completedPayments: number;
  pendingPayments: number;
  averageAmount: number;
}

export function PayoutManagementInterface() {
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showExecuteModal, setShowExecuteModal] = useState(false);
  const [selectedEscrow, setSelectedEscrow] = useState<string>('');
  const [filters, setFilters] = useState({
    status: '',
    nurseId: '',
    jobId: ''
  });

  // データ取得
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // 支払い履歴取得
      const historyParams = new URLSearchParams();
      if (filters.status) historyParams.append('status', filters.status);
      if (filters.nurseId) historyParams.append('nurseId', filters.nurseId);
      if (filters.jobId) historyParams.append('jobId', filters.jobId);

      const [historyResponse, statsResponse] = await Promise.all([
        fetch(`/api/admin/payouts?${historyParams}`),
        fetch('/api/admin/payouts/stats')
      ]);

      const historyResult = await historyResponse.json();
      const statsResult = await statsResponse.json();

      if (historyResult.success) {
        setPaymentHistory(historyResult.data);
      }

      if (statsResult.success) {
        setStats(statsResult.data);
      }
    } catch (error) {
      console.error('データ取得エラー:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [filters]);

  // 自動払い一括処理
  const handleScheduledPayments = async () => {
    if (!confirm('自動払いの一括処理を実行しますか？')) return;

    try {
      const response = await fetch('/api/admin/payouts/scheduled', {
        method: 'POST'
      });

      const result = await response.json();
      if (result.success) {
        alert(`処理完了: ${result.data.processed}件成功, ${result.data.failed}件失敗`);
        fetchData(); // データ再取得
      } else {
        alert('処理に失敗しました');
      }
    } catch (error) {
      console.error('自動払い処理エラー:', error);
      alert('処理に失敗しました');
    }
  };

  // 支払い実行
  const handleExecutePayment = async (escrowId: string, nurseId: string, paymentMethod: 'instant' | 'scheduled') => {
    try {
      const response = await fetch('/api/admin/payouts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          escrowId,
          nurseId,
          paymentMethod
        })
      });

      const result = await response.json();
      if (result.success) {
        alert('支払いが正常に実行されました');
        setShowExecuteModal(false);
        fetchData(); // データ再取得
      } else {
        alert(result.error || '支払い実行に失敗しました');
      }
    } catch (error) {
      console.error('支払い実行エラー:', error);
      alert('支払い実行に失敗しました');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700">処理待ち</Badge>;
      case 'COMPLETED':
        return <Badge variant="outline" className="bg-green-50 text-green-700">完了</Badge>;
      case 'FAILED':
        return <Badge variant="outline" className="bg-red-50 text-red-700">失敗</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'instant':
        return <Badge variant="outline" className="bg-blue-50 text-blue-700">即時振込</Badge>;
      case 'scheduled':
        return <Badge variant="outline" className="bg-gray-50 text-gray-700">自動払い</Badge>;
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  if (isLoading) {
    return <div className="text-center py-8">読み込み中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 統計情報 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-600">総支払額</h3>
            <p className="text-2xl font-bold">¥{stats.totalEarnings.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-600">総手数料</h3>
            <p className="text-2xl font-bold">¥{stats.totalFees.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-600">完了件数</h3>
            <p className="text-2xl font-bold">{stats.completedPayments}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-600">処理待ち</h3>
            <p className="text-2xl font-bold text-yellow-600">{stats.pendingPayments}</p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-medium text-gray-600">平均支払額</h3>
            <p className="text-2xl font-bold">¥{Math.round(stats.averageAmount).toLocaleString()}</p>
          </Card>
        </div>
      )}

      {/* 操作ボタン */}
      <div className="flex space-x-4">
        <Button onClick={handleScheduledPayments} className="bg-green-600 hover:bg-green-700">
          自動払い一括処理
        </Button>
        <Button 
          onClick={() => setShowExecuteModal(true)}
          variant="outline"
        >
          個別支払い実行
        </Button>
      </div>

      {/* フィルター */}
      <Card className="p-4">
        <h3 className="font-medium mb-4">フィルター</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">ステータス</label>
            <Select
              value={filters.status}
              onValueChange={(value) => setFilters(prev => ({ ...prev, status: value }))}
            >
              <option value="">すべて</option>
              <option value="PENDING">処理待ち</option>
              <option value="COMPLETED">完了</option>
              <option value="FAILED">失敗</option>
            </Select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">看護師ID</label>
            <Input
              value={filters.nurseId}
              onChange={(e) => setFilters(prev => ({ ...prev, nurseId: e.target.value }))}
              placeholder="看護師IDで検索"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">案件ID</label>
            <Input
              value={filters.jobId}
              onChange={(e) => setFilters(prev => ({ ...prev, jobId: e.target.value }))}
              placeholder="案件IDで検索"
            />
          </div>
        </div>
      </Card>

      {/* 支払い履歴テーブル */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">支払い履歴</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-2">支払いID</th>
                <th className="text-left py-2">看護師ID</th>
                <th className="text-left py-2">案件ID</th>
                <th className="text-left py-2">金額</th>
                <th className="text-left py-2">手数料</th>
                <th className="text-left py-2">受取額</th>
                <th className="text-left py-2">方法</th>
                <th className="text-left py-2">ステータス</th>
                <th className="text-left py-2">実行日時</th>
              </tr>
            </thead>
            <tbody>
              {paymentHistory.map((payment) => (
                <tr key={payment.id} className="border-b hover:bg-gray-50">
                  <td className="py-2 font-mono text-xs">{payment.id.slice(0, 8)}...</td>
                  <td className="py-2 font-mono text-xs">{payment.nurseId.slice(0, 8)}...</td>
                  <td className="py-2 font-mono text-xs">{payment.escrowId.slice(0, 8)}...</td>
                  <td className="py-2">¥{payment.amount.toLocaleString()}</td>
                  <td className="py-2">¥{payment.fee.toLocaleString()}</td>
                  <td className="py-2 font-semibold">¥{payment.netAmount.toLocaleString()}</td>
                  <td className="py-2">{getMethodBadge(payment.method)}</td>
                  <td className="py-2">{getStatusBadge(payment.status)}</td>
                  <td className="py-2">
                    {payment.executedAt 
                      ? new Date(payment.executedAt).toLocaleString('ja-JP')
                      : payment.scheduledFor
                      ? `予定: ${new Date(payment.scheduledFor).toLocaleDateString('ja-JP')}`
                      : '-'
                    }
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          
          {paymentHistory.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              支払い履歴がありません
            </div>
          )}
        </div>
      </Card>

      {/* 支払い実行モーダル */}
      <Modal
        isOpen={showExecuteModal}
        onClose={() => setShowExecuteModal(false)}
        title="支払い実行"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">エスクローID</label>
            <Input
              value={selectedEscrow}
              onChange={(e) => setSelectedEscrow(e.target.value)}
              placeholder="エスクローIDを入力"
            />
          </div>
          
          <div className="text-sm text-gray-600">
            ※ 実際の実装では、エスクロー一覧から選択できるUIを提供します
          </div>

          <div className="flex space-x-3">
            <Button
              onClick={() => handleExecutePayment(selectedEscrow, 'nurse-id', 'instant')}
              disabled={!selectedEscrow}
              size="sm"
            >
              即時振込で実行
            </Button>
            <Button
              onClick={() => handleExecutePayment(selectedEscrow, 'nurse-id', 'scheduled')}
              disabled={!selectedEscrow}
              variant="outline"
              size="sm"
            >
              自動払いで実行
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}