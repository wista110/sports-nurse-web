import { PaymentService } from '../payment';
import { prisma } from '@/lib/prisma';
import { auditService } from '../audit';
import { AppError } from '@/lib/errors';

// モック
jest.mock('@/lib/prisma', () => ({
  prisma: {
    job: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    escrowTransaction: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

jest.mock('../audit', () => ({
  auditService: {
    logAction: jest.fn(),
  },
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockAuditService = auditService as jest.Mocked<typeof auditService>;

describe('PaymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('calculateFees', () => {
    it('即時振込の手数料を正しく計算する', async () => {
      const result = await PaymentService.calculateFees({
        amount: 10000,
        paymentMethod: 'instant'
      });

      expect(result.baseAmount).toBe(10000);
      expect(result.platformFee).toBe(1000); // 10%
      expect(result.paymentFee).toBe(300); // 3%
      expect(result.totalFee).toBe(1300);
      expect(result.netAmount).toBe(8700);
      expect(result.feeBreakdown.paymentFeeRate).toBe(0.03);
      expect(result.feeBreakdown.description).toBe('即時振込（高手数料）');
    });

    it('自動払いの手数料を正しく計算する', async () => {
      const result = await PaymentService.calculateFees({
        amount: 10000,
        paymentMethod: 'scheduled'
      });

      expect(result.baseAmount).toBe(10000);
      expect(result.platformFee).toBe(1000); // 10%
      expect(result.paymentFee).toBe(100); // 1%
      expect(result.totalFee).toBe(1100);
      expect(result.netAmount).toBe(8900);
      expect(result.feeBreakdown.paymentFeeRate).toBe(0.01);
      expect(result.feeBreakdown.description).toBe('自動払い（翌月15日・低手数料）');
    });

    it('最小手数料を適用する', async () => {
      const result = await PaymentService.calculateFees({
        amount: 500, // 小額
        paymentMethod: 'scheduled'
      });

      expect(result.platformFee).toBe(100); // 最小手数料
      expect(result.paymentFee).toBe(100); // 最小手数料
    });

    it('最大手数料を適用する', async () => {
      const result = await PaymentService.calculateFees({
        amount: 1000000, // 高額
        paymentMethod: 'instant'
      });

      expect(result.platformFee).toBe(10000); // 最大手数料
      expect(result.paymentFee).toBe(10000); // 最大手数料
    });
  });

  describe('createEscrow', () => {
    const mockJob = {
      id: 'job-1',
      title: 'テスト案件',
      status: 'CONTRACTED',
      organizer: {
        id: 'organizer-1',
        profile: { name: 'テスト依頼者' }
      },
      escrow: null
    };

    it('エスクロー取引を正常に作成する', async () => {
      const mockEscrow = {
        id: 'escrow-1',
        jobId: 'job-1',
        amount: 10000,
        platformFee: 1000,
        status: 'AWAITING',
        createdAt: new Date()
      };

      mockPrisma.job.findUnique.mockResolvedValue(mockJob as any);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          escrowTransaction: {
            create: jest.fn().mockResolvedValue(mockEscrow)
          },
          job: {
            update: jest.fn()
          }
        } as any);
      });

      const result = await PaymentService.createEscrow({
        jobId: 'job-1',
        amount: 10000,
        platformFee: 1000
      }, 'actor-1');

      expect(result.id).toBe('escrow-1');
      expect(result.amount).toBe(10000);
      expect(result.status).toBe('AWAITING');
      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        actorId: 'actor-1',
        action: 'ESCROW_CREATED',
        target: 'escrow:escrow-1',
        metadata: {
          jobId: 'job-1',
          amount: 10000,
          platformFee: 1000,
          status: 'AWAITING'
        }
      });
    });

    it('案件が見つからない場合はエラーを投げる', async () => {
      mockPrisma.job.findUnique.mockResolvedValue(null);

      await expect(
        PaymentService.createEscrow({
          jobId: 'invalid-job',
          amount: 10000,
          platformFee: 1000
        }, 'actor-1')
      ).rejects.toThrow(AppError);
    });

    it('既存のエスクロー取引がある場合はエラーを投げる', async () => {
      const jobWithEscrow = {
        ...mockJob,
        escrow: { id: 'existing-escrow' }
      };

      mockPrisma.job.findUnique.mockResolvedValue(jobWithEscrow as any);

      await expect(
        PaymentService.createEscrow({
          jobId: 'job-1',
          amount: 10000,
          platformFee: 1000
        }, 'actor-1')
      ).rejects.toThrow(AppError);
    });

    it('案件ステータスが不正な場合はエラーを投げる', async () => {
      const invalidStatusJob = {
        ...mockJob,
        status: 'OPEN'
      };

      mockPrisma.job.findUnique.mockResolvedValue(invalidStatusJob as any);

      await expect(
        PaymentService.createEscrow({
          jobId: 'job-1',
          amount: 10000,
          platformFee: 1000
        }, 'actor-1')
      ).rejects.toThrow(AppError);
    });
  });

  describe('processPayment', () => {
    const mockEscrow = {
      id: 'escrow-1',
      jobId: 'job-1',
      amount: 10000,
      platformFee: 1000,
      status: 'AWAITING'
    };

    it('モック決済処理を正常に実行する', async () => {
      mockPrisma.escrowTransaction.findUnique.mockResolvedValue(mockEscrow as any);
      mockPrisma.escrowTransaction.update.mockResolvedValue({
        ...mockEscrow,
        status: 'HOLDING'
      } as any);

      const result = await PaymentService.processPayment('escrow-1', 'actor-1');

      expect(result.success).toBe(true);
      expect(result.transactionId).toMatch(/^mock_tx_/);
      expect(mockPrisma.escrowTransaction.update).toHaveBeenCalledWith({
        where: { id: 'escrow-1' },
        data: { status: 'HOLDING' }
      });
      expect(mockAuditService.logAction).toHaveBeenCalled();
    });

    it('エスクロー取引が見つからない場合はエラーを投げる', async () => {
      mockPrisma.escrowTransaction.findUnique.mockResolvedValue(null);

      await expect(
        PaymentService.processPayment('invalid-escrow', 'actor-1')
      ).rejects.toThrow(AppError);
    });

    it('エスクロー状態が不正な場合はエラーを投げる', async () => {
      const invalidStatusEscrow = {
        ...mockEscrow,
        status: 'HOLDING'
      };

      mockPrisma.escrowTransaction.findUnique.mockResolvedValue(invalidStatusEscrow as any);

      await expect(
        PaymentService.processPayment('escrow-1', 'actor-1')
      ).rejects.toThrow(AppError);
    });
  });

  describe('releaseEscrow', () => {
    const mockEscrow = {
      id: 'escrow-1',
      jobId: 'job-1',
      amount: 10000,
      status: 'HOLDING',
      job: {
        applications: [{
          status: 'ACCEPTED',
          nurse: { id: 'nurse-1' }
        }]
      }
    };

    it('エスクローを正常に解放する', async () => {
      mockPrisma.escrowTransaction.findUnique.mockResolvedValue(mockEscrow as any);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          escrowTransaction: {
            update: jest.fn()
          },
          job: {
            update: jest.fn()
          }
        } as any);
      });

      await PaymentService.releaseEscrow({
        escrowId: 'escrow-1',
        releaseAmount: 10000,
        reason: '作業完了'
      }, 'admin-1');

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        actorId: 'admin-1',
        action: 'ESCROW_RELEASED',
        target: 'escrow:escrow-1',
        metadata: {
          releaseAmount: 10000,
          reason: '作業完了',
          jobId: 'job-1'
        }
      });
    });

    it('解放金額がエスクロー金額を超える場合はエラーを投げる', async () => {
      mockPrisma.escrowTransaction.findUnique.mockResolvedValue(mockEscrow as any);

      await expect(
        PaymentService.releaseEscrow({
          escrowId: 'escrow-1',
          releaseAmount: 15000, // エスクロー金額を超過
          reason: '作業完了'
        }, 'admin-1')
      ).rejects.toThrow(AppError);
    });
  });

  describe('refundEscrow', () => {
    const mockEscrow = {
      id: 'escrow-1',
      jobId: 'job-1',
      amount: 10000,
      status: 'HOLDING'
    };

    it('エスクローを正常に返金する', async () => {
      mockPrisma.escrowTransaction.findUnique.mockResolvedValue(mockEscrow as any);
      mockPrisma.$transaction.mockImplementation(async (callback) => {
        return callback({
          escrowTransaction: {
            update: jest.fn()
          },
          job: {
            update: jest.fn()
          }
        } as any);
      });

      await PaymentService.refundEscrow({
        escrowId: 'escrow-1',
        refundAmount: 10000,
        reason: 'キャンセル'
      }, 'admin-1');

      expect(mockAuditService.logAction).toHaveBeenCalledWith({
        actorId: 'admin-1',
        action: 'ESCROW_REFUNDED',
        target: 'escrow:escrow-1',
        metadata: {
          refundAmount: 10000,
          reason: 'キャンセル',
          jobId: 'job-1'
        }
      });
    });

    it('返金金額がエスクロー金額を超える場合はエラーを投げる', async () => {
      mockPrisma.escrowTransaction.findUnique.mockResolvedValue(mockEscrow as any);

      await expect(
        PaymentService.refundEscrow({
          escrowId: 'escrow-1',
          refundAmount: 15000, // エスクロー金額を超過
          reason: 'キャンセル'
        }, 'admin-1')
      ).rejects.toThrow(AppError);
    });
  });
});