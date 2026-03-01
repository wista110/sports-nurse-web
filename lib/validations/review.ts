import { z } from 'zod';

// レビュー作成
export const createReviewSchema = z.object({
  jobId: z.string().uuid('有効な案件IDを入力してください'),
  targetId: z.string().uuid('有効なユーザーIDを入力してください'),
  rating: z.number().min(1, '評価は1以上である必要があります').max(5, '評価は5以下である必要があります'),
  tags: z.array(z.string()).min(1, '少なくとも1つのタグを選択してください').max(10, 'タグは10個以下にしてください'),
  comment: z.string().min(10, 'コメントは10文字以上入力してください').max(1000, 'コメントは1000文字以内で入力してください')
});

// レビュー更新
export const updateReviewSchema = z.object({
  rating: z.number().min(1).max(5).optional(),
  tags: z.array(z.string()).min(1).max(10).optional(),
  comment: z.string().min(10).max(1000).optional()
});

// レビュー検索
export const reviewSearchSchema = z.object({
  jobId: z.string().uuid().optional(),
  authorId: z.string().uuid().optional(),
  targetId: z.string().uuid().optional(),
  minRating: z.number().min(1).max(5).optional(),
  maxRating: z.number().min(1).max(5).optional(),
  tags: z.array(z.string()).optional(),
  limit: z.number().min(1).max(100).default(50),
  offset: z.number().min(0).default(0)
});

// 看護師活動報告
export const nurseActivityReportSchema = z.object({
  jobId: z.string().uuid('有効な案件IDを入力してください'),
  incidents: z.array(z.object({
    time: z.string().min(1, '時刻を入力してください'),
    description: z.string().min(1, '内容を入力してください').max(500, '内容は500文字以内で入力してください'),
    action: z.string().min(1, '対応を入力してください').max(500, '対応は500文字以内で入力してください')
  })).optional(),
  overallSummary: z.string().min(10, '全体的な所感は10文字以上入力してください').max(1000, '全体的な所感は1000文字以内で入力してください'),
  recommendations: z.string().max(500, '改善提案は500文字以内で入力してください').optional(),
  equipmentUsed: z.array(z.string()).optional(),
  participantCount: z.number().min(0, '参加者数は0以上である必要があります').optional()
});

// 依頼者フィードバック
export const organizerFeedbackSchema = z.object({
  jobId: z.string().uuid('有効な案件IDを入力してください'),
  nursePerformance: z.object({
    punctuality: z.number().min(1).max(5),
    professionalism: z.number().min(1).max(5),
    communication: z.number().min(1).max(5),
    technicalSkills: z.number().min(1).max(5)
  }),
  eventSummary: z.string().min(10, 'イベント概要は10文字以上入力してください').max(1000, 'イベント概要は1000文字以内で入力してください'),
  issues: z.string().max(500, '問題・課題は500文字以内で入力してください').optional(),
  overtime: z.object({
    occurred: z.boolean(),
    duration: z.number().min(0).optional(),
    reason: z.string().max(200).optional()
  }).optional(),
  wouldRecommend: z.boolean(),
  additionalComments: z.string().max(500, '追加コメントは500文字以内で入力してください').optional()
});

// 型定義
export type CreateReviewInput = z.infer<typeof createReviewSchema>;
export type UpdateReviewInput = z.infer<typeof updateReviewSchema>;
export type ReviewSearchInput = z.infer<typeof reviewSearchSchema>;
export type NurseActivityReportInput = z.infer<typeof nurseActivityReportSchema>;
export type OrganizerFeedbackInput = z.infer<typeof organizerFeedbackSchema>;

// レビュー詳細
export interface ReviewDetails {
  id: string;
  jobId: string;
  authorId: string;
  targetId: string;
  rating: number;
  tags: string[];
  comment: string;
  createdAt: Date;
  job: {
    id: string;
    title: string;
    startAt: Date;
    endAt: Date;
  };
  author: {
    id: string;
    name: string;
    role: string;
  };
  target: {
    id: string;
    name: string;
    role: string;
  };
}

// レビュー統計
export interface ReviewStats {
  totalReviews: number;
  averageRating: number;
  ratingDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  commonTags: Array<{
    tag: string;
    count: number;
  }>;
  recentReviews: ReviewDetails[];
}

// 評価タグ定義
export const NURSE_EVALUATION_TAGS = [
  'コミュニケーション良好',
  '迅速な対応',
  '専門知識豊富',
  '冷静な判断',
  'チームワーク',
  '時間厳守',
  '丁寧な対応',
  '応急処置スキル',
  '衛生管理徹底',
  '参加者への配慮'
] as const;

export const ORGANIZER_EVALUATION_TAGS = [
  '事前準備充実',
  '明確な指示',
  '適切な環境整備',
  '迅速な連絡',
  '柔軟な対応',
  '安全配慮',
  '時間管理良好',
  '資料準備完備',
  '協力的',
  '信頼できる'
] as const;

export type NurseEvaluationTag = typeof NURSE_EVALUATION_TAGS[number];
export type OrganizerEvaluationTag = typeof ORGANIZER_EVALUATION_TAGS[number];

// 活動報告インシデント
export interface ActivityIncident {
  time: string;
  description: string;
  action: string;
}

// 看護師活動報告詳細
export interface NurseActivityReport {
  id: string;
  jobId: string;
  nurseId: string;
  incidents?: ActivityIncident[];
  overallSummary: string;
  recommendations?: string;
  equipmentUsed?: string[];
  participantCount?: number;
  createdAt: Date;
}

// 依頼者フィードバック詳細
export interface OrganizerFeedback {
  id: string;
  jobId: string;
  organizerId: string;
  nursePerformance: {
    punctuality: number;
    professionalism: number;
    communication: number;
    technicalSkills: number;
  };
  eventSummary: string;
  issues?: string;
  overtime?: {
    occurred: boolean;
    duration?: number;
    reason?: string;
  };
  wouldRecommend: boolean;
  additionalComments?: string;
  createdAt: Date;
}