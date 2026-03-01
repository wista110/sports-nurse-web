import { prisma } from '@/lib/prisma';
import { auditService } from '@/lib/services/audit';
import {
  CreateReviewInput,
  UpdateReviewInput,
  ReviewSearchInput,
  NurseActivityReportInput,
  OrganizerFeedbackInput,
  ReviewDetails,
  ReviewStats,
  NurseActivityReport,
  OrganizerFeedback
} from '@/lib/validations/review';
import { AppError, ErrorType } from '@/lib/errors';

export class ReviewService {
  /**
   * レビューを作成
   */
  static async createReview(input: CreateReviewInput, authorId: string): Promise<ReviewDetails> {
    const { jobId, targetId, rating, tags, comment } = input;

    // 案件の確認
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          where: { 
            OR: [
              { nurseId: authorId },
              { nurseId: targetId }
            ],
            status: 'ACCEPTED'
          }
        },
        organizer: true
      }
    });

    if (!job) {
      throw new AppError(
        ErrorType.NOT_FOUND,
        'JOB_NOT_FOUND',
        '指定された案件が見つかりません',
        404
      );
    }

    // 案件が完了状態であることを確認
    if (job.status !== 'REVIEW_PENDING' && job.status !== 'COMPLETED') {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'INVALID_JOB_STATUS',
        'レビューは案件完了後のみ可能です',
        400
      );
    }

    // レビュー権限の確認
    const isAuthorNurse = job.applications.some(app => app.nurseId === authorId);
    const isAuthorOrganizer = job.organizer.id === authorId;
    
    if (!isAuthorNurse && !isAuthorOrganizer) {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'REVIEW_NOT_AUTHORIZED',
        'この案件のレビューを作成する権限がありません',
        403
      );
    }

    // 既存レビューの確認
    const existingReview = await prisma.review.findUnique({
      where: {
        jobId_authorId_targetId: {
          jobId,
          authorId,
          targetId
        }
      }
    });

    if (existingReview) {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'REVIEW_ALREADY_EXISTS',
        '既にこの相手へのレビューが存在します',
        400
      );
    }

    try {
      const review = await prisma.review.create({
        data: {
          jobId,
          authorId,
          targetId,
          rating,
          tags,
          comment
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              startAt: true,
              endAt: true
            }
          },
          author: {
            select: {
              id: true,
              role: true,
              profile: {
                select: { name: true }
              }
            }
          },
          target: {
            select: {
              id: true,
              role: true,
              profile: {
                select: { name: true }
              }
            }
          }
        }
      });

      // 監査ログ記録
      await auditService.logAction({
        actorId: authorId,
        action: 'REVIEW_CREATED',
        target: `review:${review.id}`,
        metadata: {
          jobId,
          targetId,
          rating,
          tags
        }
      });

      // レビュー完了チェック
      await this.checkReviewCompletion(jobId);

      return this.formatReviewDetails(review);
    } catch (error) {
      throw new AppError(
        ErrorType.SYSTEM,
        'REVIEW_CREATE_FAILED',
        'レビューの作成に失敗しました',
        500,
        { originalError: error }
      );
    }
  }

  /**
   * レビューを更新
   */
  static async updateReview(
    reviewId: string,
    input: UpdateReviewInput,
    actorId: string
  ): Promise<ReviewDetails> {
    const review = await prisma.review.findUnique({
      where: { id: reviewId },
      include: {
        job: true,
        author: { include: { profile: true } },
        target: { include: { profile: true } }
      }
    });

    if (!review) {
      throw new AppError(
        ErrorType.NOT_FOUND,
        'REVIEW_NOT_FOUND',
        '指定されたレビューが見つかりません',
        404
      );
    }

    if (review.authorId !== actorId) {
      throw new AppError(
        ErrorType.BUSINESS_LOGIC,
        'REVIEW_UPDATE_NOT_AUTHORIZED',
        'このレビューを更新する権限がありません',
        403
      );
    }

    try {
      const updatedReview = await prisma.review.update({
        where: { id: reviewId },
        data: {
          ...(input.rating && { rating: input.rating }),
          ...(input.tags && { tags: input.tags }),
          ...(input.comment && { comment: input.comment })
        },
        include: {
          job: {
            select: {
              id: true,
              title: true,
              startAt: true,
              endAt: true
            }
          },
          author: {
            select: {
              id: true,
              role: true,
              profile: {
                select: { name: true }
              }
            }
          },
          target: {
            select: {
              id: true,
              role: true,
              profile: {
                select: { name: true }
              }
            }
          }
        }
      });

      // 監査ログ記録
      await auditService.logAction({
        actorId,
        action: 'REVIEW_UPDATED',
        target: `review:${reviewId}`,
        metadata: {
          changes: input,
          jobId: review.jobId
        }
      });

      return this.formatReviewDetails(updatedReview);
    } catch (error) {
      throw new AppError(
        ErrorType.SYSTEM,
        'REVIEW_UPDATE_FAILED',
        'レビューの更新に失敗しました',
        500,
        { originalError: error }
      );
    }
  }

  /**
   * レビュー一覧を取得
   */
  static async getReviews(filters: ReviewSearchInput): Promise<ReviewDetails[]> {
    const { jobId, authorId, targetId, minRating, maxRating, tags, limit, offset } = filters;

    const whereClause: any = {};

    if (jobId) whereClause.jobId = jobId;
    if (authorId) whereClause.authorId = authorId;
    if (targetId) whereClause.targetId = targetId;

    if (minRating || maxRating) {
      whereClause.rating = {};
      if (minRating) whereClause.rating.gte = minRating;
      if (maxRating) whereClause.rating.lte = maxRating;
    }

    if (tags && tags.length > 0) {
      whereClause.tags = {
        hasSome: tags
      };
    }

    const reviews = await prisma.review.findMany({
      where: whereClause,
      include: {
        job: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true
          }
        },
        author: {
          select: {
            id: true,
            role: true,
            profile: {
              select: { name: true }
            }
          }
        },
        target: {
          select: {
            id: true,
            role: true,
            profile: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: offset
    });

    return reviews.map(review => this.formatReviewDetails(review));
  }

  /**
   * ユーザーのレビュー統計を取得
   */
  static async getReviewStats(userId: string): Promise<ReviewStats> {
    const reviews = await prisma.review.findMany({
      where: { targetId: userId },
      include: {
        job: {
          select: {
            id: true,
            title: true,
            startAt: true,
            endAt: true
          }
        },
        author: {
          select: {
            id: true,
            role: true,
            profile: {
              select: { name: true }
            }
          }
        },
        target: {
          select: {
            id: true,
            role: true,
            profile: {
              select: { name: true }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews 
      : 0;

    // 評価分布
    const ratingDistribution = {
      1: reviews.filter(r => r.rating === 1).length,
      2: reviews.filter(r => r.rating === 2).length,
      3: reviews.filter(r => r.rating === 3).length,
      4: reviews.filter(r => r.rating === 4).length,
      5: reviews.filter(r => r.rating === 5).length
    };

    // よく使われるタグ
    const tagCounts: { [key: string]: number } = {};
    reviews.forEach(review => {
      review.tags.forEach(tag => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1;
      });
    });

    const commonTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // 最近のレビュー
    const recentReviews = reviews
      .slice(0, 5)
      .map(review => this.formatReviewDetails(review));

    return {
      totalReviews,
      averageRating: Math.round(averageRating * 10) / 10,
      ratingDistribution,
      commonTags,
      recentReviews
    };
  }

  /**
   * 看護師活動報告を作成
   */
  static async createNurseActivityReport(
    input: NurseActivityReportInput,
    nurseId: string
  ): Promise<NurseActivityReport> {
    const { jobId, incidents, overallSummary, recommendations, equipmentUsed, participantCount } = input;

    // 案件と権限の確認
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          where: { nurseId, status: 'ACCEPTED' }
        }
      }
    });

    if (!job || job.applications.length === 0) {
      throw new AppError(
        ErrorType.NOT_FOUND,
        'JOB_NOT_FOUND_OR_NOT_AUTHORIZED',
        '指定された案件が見つからないか、権限がありません',
        404
      );
    }

    try {
      // 活動報告をJSONとして保存（簡易実装）
      const reportData = {
        incidents: incidents || [],
        overallSummary,
        recommendations,
        equipmentUsed: equipmentUsed || [],
        participantCount
      };

      // 案件のメタデータに保存
      await prisma.job.update({
        where: { id: jobId },
        data: {
          metadata: {
            ...((job.metadata as any) || {}),
            nurseActivityReport: reportData
          }
        }
      });

      // 監査ログ記録
      await auditService.logAction({
        actorId: nurseId,
        action: 'NURSE_ACTIVITY_REPORT_CREATED',
        target: `job:${jobId}`,
        metadata: {
          reportSummary: overallSummary.substring(0, 100),
          incidentCount: incidents?.length || 0
        }
      });

      return {
        id: `${jobId}-${nurseId}`,
        jobId,
        nurseId,
        ...reportData,
        createdAt: new Date()
      };
    } catch (error) {
      throw new AppError(
        ErrorType.SYSTEM,
        'ACTIVITY_REPORT_CREATE_FAILED',
        '活動報告の作成に失敗しました',
        500,
        { originalError: error }
      );
    }
  }

  /**
   * 依頼者フィードバックを作成
   */
  static async createOrganizerFeedback(
    input: OrganizerFeedbackInput,
    organizerId: string
  ): Promise<OrganizerFeedback> {
    const { jobId, nursePerformance, eventSummary, issues, overtime, wouldRecommend, additionalComments } = input;

    // 案件と権限の確認
    const job = await prisma.job.findUnique({
      where: { id: jobId, organizerId }
    });

    if (!job) {
      throw new AppError(
        ErrorType.NOT_FOUND,
        'JOB_NOT_FOUND_OR_NOT_AUTHORIZED',
        '指定された案件が見つからないか、権限がありません',
        404
      );
    }

    try {
      // フィードバックをJSONとして保存（簡易実装）
      const feedbackData = {
        nursePerformance,
        eventSummary,
        issues,
        overtime,
        wouldRecommend,
        additionalComments
      };

      // 案件のメタデータに保存
      await prisma.job.update({
        where: { id: jobId },
        data: {
          metadata: {
            ...((job.metadata as any) || {}),
            organizerFeedback: feedbackData
          }
        }
      });

      // 監査ログ記録
      await auditService.logAction({
        actorId: organizerId,
        action: 'ORGANIZER_FEEDBACK_CREATED',
        target: `job:${jobId}`,
        metadata: {
          averagePerformance: Object.values(nursePerformance).reduce((a, b) => a + b, 0) / 4,
          wouldRecommend
        }
      });

      return {
        id: `${jobId}-${organizerId}`,
        jobId,
        organizerId,
        ...feedbackData,
        createdAt: new Date()
      };
    } catch (error) {
      throw new AppError(
        ErrorType.SYSTEM,
        'ORGANIZER_FEEDBACK_CREATE_FAILED',
        'フィードバックの作成に失敗しました',
        500,
        { originalError: error }
      );
    }
  }

  /**
   * レビュー完了チェック
   */
  private static async checkReviewCompletion(jobId: string): Promise<void> {
    const job = await prisma.job.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          where: { status: 'ACCEPTED' }
        },
        reviews: true
      }
    });

    if (!job) return;

    // 必要なレビュー数（依頼者→看護師、看護師→依頼者）
    const expectedReviews = job.applications.length * 2;
    const actualReviews = job.reviews.length;

    // 全てのレビューが完了した場合、案件ステータスを更新
    if (actualReviews >= expectedReviews && job.status === 'REVIEW_PENDING') {
      await prisma.job.update({
        where: { id: jobId },
        data: { status: 'COMPLETED' }
      });
    }
  }

  /**
   * レビュー詳細をフォーマット
   */
  private static formatReviewDetails(review: any): ReviewDetails {
    return {
      id: review.id,
      jobId: review.jobId,
      authorId: review.authorId,
      targetId: review.targetId,
      rating: review.rating,
      tags: review.tags,
      comment: review.comment,
      createdAt: review.createdAt,
      job: {
        id: review.job.id,
        title: review.job.title,
        startAt: review.job.startAt,
        endAt: review.job.endAt
      },
      author: {
        id: review.author.id,
        name: review.author.profile?.name || '名前未設定',
        role: review.author.role
      },
      target: {
        id: review.target.id,
        name: review.target.profile?.name || '名前未設定',
        role: review.target.role
      }
    };
  }
}

export const reviewService = ReviewService;