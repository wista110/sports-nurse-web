import {
  createEscrowSchema,
  calculateFeesSchema,
  releaseEscrowSchema,
  refundEscrowSchema,
  executePaymentSchema,
  feeConfigSchema,
} from '../payment';

describe('Payment Validation Schemas', () => {
  describe('createEscrowSchema', () => {
    it('有効なデータを受け入れる', () => {
      const validData = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 10000,
        platformFee: 1000,
      };

      const result = createEscrowSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('無効なUUIDを拒否する', () => {
      const invalidData = {
        jobId: 'invalid-uuid',
        amount: 10000,
        platformFee: 1000,
      };

      const result = createEscrowSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('有効な案件IDを入力してください');
      }
    });

    it('負の金額を拒否する', () => {
      const invalidData = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        amount: -1000,
        platformFee: 1000,
      };

      const result = createEscrowSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('金額は1円以上である必要があります');
      }
    });

    it('負のプラットフォーム手数料を拒否する', () => {
      const invalidData = {
        jobId: '123e4567-e89b-12d3-a456-426614174000',
        amount: 10000,
        platformFee: -100,
      };

      const result = createEscrowSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('プラットフォーム手数料は0円以上である必要があります');
      }
    });
  });

  describe('calculateFeesSchema', () => {
    it('有効なデータを受け入れる', () => {
      const validData = {
        amount: 10000,
        paymentMethod: 'instant' as const,
      };

      const result = calculateFeesSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('無効な支払い方法を拒否する', () => {
      const invalidData = {
        amount: 10000,
        paymentMethod: 'invalid',
      };

      const result = calculateFeesSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('支払い方法は即時振込または自動払いを選択してください');
      }
    });

    it('ゼロ以下の金額を拒否する', () => {
      const invalidData = {
        amount: 0,
        paymentMethod: 'scheduled' as const,
      };

      const result = calculateFeesSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('金額は1円以上である必要があります');
      }
    });
  });

  describe('releaseEscrowSchema', () => {
    it('有効なデータを受け入れる', () => {
      const validData = {
        escrowId: '123e4567-e89b-12d3-a456-426614174000',
        releaseAmount: 10000,
        reason: '作業完了のため解放',
      };

      const result = releaseEscrowSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('空の理由を拒否する', () => {
      const invalidData = {
        escrowId: '123e4567-e89b-12d3-a456-426614174000',
        releaseAmount: 10000,
        reason: '',
      };

      const result = releaseEscrowSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('解放理由を入力してください');
      }
    });

    it('長すぎる理由を拒否する', () => {
      const invalidData = {
        escrowId: '123e4567-e89b-12d3-a456-426614174000',
        releaseAmount: 10000,
        reason: 'a'.repeat(501), // 501文字
      };

      const result = releaseEscrowSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('解放理由は500文字以内で入力してください');
      }
    });
  });

  describe('refundEscrowSchema', () => {
    it('有効なデータを受け入れる', () => {
      const validData = {
        escrowId: '123e4567-e89b-12d3-a456-426614174000',
        refundAmount: 10000,
        reason: 'キャンセルのため返金',
      };

      const result = refundEscrowSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('無効なUUIDを拒否する', () => {
      const invalidData = {
        escrowId: 'invalid-uuid',
        refundAmount: 10000,
        reason: 'キャンセルのため返金',
      };

      const result = refundEscrowSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('有効なエスクローIDを入力してください');
      }
    });
  });

  describe('executePaymentSchema', () => {
    it('有効なデータを受け入れる', () => {
      const validData = {
        escrowId: '123e4567-e89b-12d3-a456-426614174000',
        paymentMethod: 'instant' as const,
        nurseId: '123e4567-e89b-12d3-a456-426614174001',
      };

      const result = executePaymentSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('無効な看護師IDを拒否する', () => {
      const invalidData = {
        escrowId: '123e4567-e89b-12d3-a456-426614174000',
        paymentMethod: 'scheduled' as const,
        nurseId: 'invalid-uuid',
      };

      const result = executePaymentSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('有効な看護師IDを入力してください');
      }
    });
  });

  describe('feeConfigSchema', () => {
    it('有効な手数料設定を受け入れる', () => {
      const validData = {
        instantPaymentFeeRate: 0.03,
        scheduledPaymentFeeRate: 0.01,
        minimumFee: 100,
        maximumFee: 10000,
      };

      const result = feeConfigSchema.safeParse(validData);
      expect(result.success).toBe(true);
    });

    it('100%を超える手数料率を拒否する', () => {
      const invalidData = {
        instantPaymentFeeRate: 1.5, // 150%
        scheduledPaymentFeeRate: 0.01,
        minimumFee: 100,
        maximumFee: 10000,
      };

      const result = feeConfigSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('即時振込手数料率は0-100%の範囲で入力してください');
      }
    });

    it('負の最小手数料を拒否する', () => {
      const invalidData = {
        instantPaymentFeeRate: 0.03,
        scheduledPaymentFeeRate: 0.01,
        minimumFee: -100,
        maximumFee: 10000,
      };

      const result = feeConfigSchema.safeParse(invalidData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('最小手数料は0円以上である必要があります');
      }
    });
  });
});