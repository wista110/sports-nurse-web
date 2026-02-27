'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Modal } from '@/components/ui/modal';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { FeeCalculation } from '@/lib/validations/payment';

interface EscrowPaymentFormProps {
  jobId: string;
  jobTitle: string;
  totalAmount: number;
  onPaymentComplete: (escrowId: string) => void;
  onCancel: () => void;
}

export function EscrowPaymentForm({
  jobId,
  jobTitle,
  totalAmount,
  onPaymentComplete,
  onCancel
}: EscrowPaymentFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [feeCalculation, setFeeCalculation] = useState<FeeCalculation | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'instant' | 'scheduled'>('scheduled');

  // 手数料計算
  const calculateFees = async (method: 'instant' | 'scheduled') => {
    try {
      const response = await fetch(`/api/escrow?amount=${totalAmount}&paymentMethod=${method}`);
      const result = await response.json();
      
      if (result.success) {
        setFeeCalculation(result.data);
      }
    } catch (error) {
      console.error('手数料計算エラー:', error);
    }
  };

  // 初回読み込み時に手数料計算
  useState(() => {
    calculateFees(paymentMethod);
  });

  // 支払い方法変更時に手数料再計算
  const handlePaymentMethodChange = (method: 'instant' | 'scheduled') => {
    setPaymentMethod(method);
    calculateFees(method);
  };

  // エスクロー作成と決済処理
  const handlePayment = async () => {
    if (!feeCalculation) return;

    setIsLoading(true);
    try {
      // 1. エスクロー取引作成
      const escrowResponse = await fetch('/api/escrow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jobId,
          amount: totalAmount,
          platformFee: feeCalculation.platformFee
        })
      });

      const escrowResult = await escrowResponse.json();
      if (!escrowResult.success) {
        throw new Error(escrowResult.error || 'エスクロー作成に失敗しました');
      }

      const escrowId = escrowResult.data.id;

      // 2. モック決済処理
      const paymentResponse = await fetch(`/api/escrow/${escrowId}/process`, {
        method: 'POST'
      });

      const paymentResult = await paymentResponse.json();
      if (!paymentResult.success) {
        throw new Error(paymentResult.error || '決済処理に失敗しました');
      }

      onPaymentComplete(escrowId);
    } catch (error) {
      console.error('決済エラー:', error);
      alert(error instanceof Error ? error.message : '決済処理に失敗しました');
    } finally {
      setIsLoading(false);
      setShowConfirmModal(false);
    }
  };

  return (
    <>
      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-lg font-semibold mb-2">仮払い（エスクロー）</h3>
            <p className="text-sm text-gray-600">
              安全な取引のため、報酬を一時的にお預かりします。
              作業完了後に看護師へ支払われます。
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-medium mb-2">案件情報</h4>
            <p className="text-sm">{jobTitle}</p>
            <p className="text-lg font-semibold mt-2">
              報酬総額: ¥{totalAmount.toLocaleString()}
            </p>
          </div>

          <div>
            <h4 className="font-medium mb-3">支払い方法選択</h4>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="scheduled"
                  checked={paymentMethod === 'scheduled'}
                  onChange={() => handlePaymentMethodChange('scheduled')}
                  className="text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">自動払い（翌月15日）</span>
                    <Badge variant="secondary">推奨</Badge>
                  </div>
                  <p className="text-sm text-gray-600">低手数料でお得です</p>
                </div>
              </label>

              <label className="flex items-center space-x-3 p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="paymentMethod"
                  value="instant"
                  checked={paymentMethod === 'instant'}
                  onChange={() => handlePaymentMethodChange('instant')}
                  className="text-blue-600"
                />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-medium">即時振込</span>
                    <Badge variant="outline">高手数料</Badge>
                  </div>
                  <p className="text-sm text-gray-600">すぐに振込処理されます</p>
                </div>
              </label>
            </div>
          </div>

          {feeCalculation && (
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium mb-3">料金詳細</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>基本報酬</span>
                  <span>¥{feeCalculation.baseAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>プラットフォーム手数料 (10%)</span>
                  <span>¥{feeCalculation.platformFee.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>{feeCalculation.feeBreakdown.description}</span>
                  <span>¥{feeCalculation.paymentFee.toLocaleString()}</span>
                </div>
                <Separator />
                <div className="flex justify-between font-semibold">
                  <span>看護師受取額</span>
                  <span>¥{feeCalculation.netAmount.toLocaleString()}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={() => setShowConfirmModal(true)}
              disabled={isLoading || !feeCalculation}
              className="flex-1"
            >
              {isLoading ? '処理中...' : '仮払いを実行'}
            </Button>
            <Button variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
          </div>
        </div>
      </Card>

      {/* 確認モーダル */}
      <Modal
        isOpen={showConfirmModal}
        onClose={() => setShowConfirmModal(false)}
        title="仮払い確認"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded-lg">
            <h4 className="font-medium text-yellow-800 mb-2">重要な確認事項</h4>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 仮払い後のキャンセルには手数料が発生する場合があります</li>
              <li>• 作業完了・検収後に看護師へ支払われます</li>
              <li>• 支払い方法の変更はできません</li>
            </ul>
          </div>

          {feeCalculation && (
            <div className="border p-4 rounded-lg">
              <h4 className="font-medium mb-2">最終確認</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>案件</span>
                  <span>{jobTitle}</span>
                </div>
                <div className="flex justify-between">
                  <span>仮払い金額</span>
                  <span className="font-semibold">¥{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>支払い方法</span>
                  <span>{feeCalculation.feeBreakdown.description}</span>
                </div>
              </div>
            </div>
          )}

          <div className="flex space-x-3">
            <Button
              onClick={handlePayment}
              disabled={isLoading}
              className="flex-1"
            >
              {isLoading ? '処理中...' : '確定して仮払い実行'}
            </Button>
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
              disabled={isLoading}
            >
              戻る
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}