import { z } from 'zod';

// エスクロー取引作成
export const createEscrowSchema = z.object({
  jobId: z.string().uuid('有効な案件IDを入力してください'),
  amount: z.number().min(1, '金額は1円以上である必要があります'),
  platformFee: z.number().min(0, 'プラットフォーム手数料は0円以上である必要があります'),
});

// 手数料計算
export const calculateFeesSchema = z.object({
  amount: z.number().min(1, '金額は1円以上である必要があります'),
  paymentMethod: z.enum(['instant', 'scheduled'], {
    errorMap: () => ({ message: '支払い方法は即時振込または自動払いを選択してください' })
  }),
});

// エスクロー解放
export const releaseEscrowSchema = z.object({
  escrowId: z.string().uuid('有効なエスクローIDを入力してください'),
  releaseAmount: z.number().min(1, '解放金額は1円以上である必要があります'),
  reason: z.string().min(1, '解放理由を入力してください').max(500, '解放理由は500文字以内で入力してください'),
});

// 返金処理
export const refundEscrowSchema = z.object({
  escrowId: z.string().uuid('有効なエスクローIDを入力してください'),
  refundAmount: z.number().min(1, '返金金額は1円以上である必要があります'),
  reason: z.string().min(1, '返金理由を入力してください').max(500, '返金理由は500文字以内で入力してください'),
});

// 支払い実行
export const executePaymentSchema = z.object({
  escrowId: z.string().uuid('有効なエスクローIDを入力してください'),
  paymentMethod: z.enum(['instant', 'scheduled'], {
    errorMap: () => ({ message: '支払い方法は即時振込または自動払いを選択してください' })
  }),
  nurseId: z.string().uuid('有効な看護師IDを入力してください'),
});

// 手数料設定
export const feeConfigSchema = z.object({
  instantPaymentFeeRate: z.number().min(0).max(1, '即時振込手数料率は0-100%の範囲で入力してください'),
  scheduledPaymentFeeRate: z.number().min(0).max(1, '自動払い手数料率は0-100%の範囲で入力してください'),
  minimumFee: z.number().min(0, '最小手数料は0円以上である必要があります'),
  maximumFee: z.number().min(0, '最大手数料は0円以上である必要があります'),
});

// 型定義
export type CreateEscrowInput = z.infer<typeof createEscrowSchema>;
export type CalculateFeesInput = z.infer<typeof calculateFeesSchema>;
export type ReleaseEscrowInput = z.infer<typeof releaseEscrowSchema>;
export type RefundEscrowInput = z.infer<typeof refundEscrowSchema>;
export type ExecutePaymentInput = z.infer<typeof executePaymentSchema>;
export type FeeConfigInput = z.infer<typeof feeConfigSchema>;

// 手数料計算結果
export interface FeeCalculation {
  baseAmount: number;
  platformFee: number;
  paymentFee: number;
  totalFee: number;
  netAmount: number;
  feeBreakdown: {
    platformFeeRate: number;
    paymentFeeRate: number;
    description: string;
  };
}

// エスクロー取引詳細
export interface EscrowDetails {
  id: string;
  jobId: string;
  amount: number;
  platformFee: number;
  status: 'AWAITING' | 'HOLDING' | 'RELEASED' | 'REFUNDED';
  createdAt: Date;
  releasedAt?: Date;
  refundedAt?: Date;
  job: {
    id: string;
    title: string;
    organizer: {
      id: string;
      name: string;
    };
  };
}

// 支払い履歴
export interface PaymentHistory {
  id: string;
  escrowId: string;
  nurseId: string;
  amount: number;
  fee: number;
  netAmount: number;
  method: 'instant' | 'scheduled';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  executedAt?: Date;
  scheduledFor?: Date;
  failureReason?: string;
}