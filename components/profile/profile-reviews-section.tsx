'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ReviewStatsComponent } from '@/components/reviews/review-stats';
import { ReviewList } from '@/components/reviews/review-list';
import { Star, MessageSquare, TrendingUp } from 'lucide-react';
import { ReviewStats } from '@/lib/validations/review';
import { toast } from 'sonner';

interface ProfileReviewsSectionProps {
  userId: string;
  userName: string;
  className?: string;
}

export function ProfileReviewsSection({ userId, userName, className }: ProfileReviewsSectionProps) {
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllReviews, setShowAllReviews] = useState(false);

  const loadStats = async () => {
    try {
      const response = await fetch(`/api/reviews/stats/${userId}`);
      
      if (!response.ok) {
        throw new Error('統計の取得に失敗しました');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error loading review stats:', error);
      toast.error('レビュー統計の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, [userId]);

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats || stats.totalReviews === 0) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-8 text-center">
            <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-medium mb-2">まだレビューがありません</h3>
            <p className="text-muted-foreground">
              {userName}さんへのレビューはまだ投稿されていません。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* レビュー統計 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>{userName}さんへの評価</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ReviewStatsComponent stats={stats} />
        </CardContent>
      </Card>

      {/* レビュー一覧 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>レビュー一覧</span>
            </CardTitle>
            {!showAllReviews && stats.totalReviews > 3 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllReviews(true)}
              >
                すべて表示 ({stats.totalReviews}件)
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {showAllReviews ? (
            <ReviewList
              userId={userId}
              showFilters={true}
            />
          ) : (
            <div className="space-y-4">
              {stats.recentReviews.slice(0, 3).map((review) => (
                <Card key={review.id} className="border-l-4 border-l-primary">
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{review.author.name}</span>
                          <span className="text-sm text-muted-foreground">
                            ({review.author.role === 'NURSE' ? '看護師' : '依頼者'})
                          </span>
                        </div>
                        <div className="flex items-center space-x-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star
                              key={star}
                              className={`w-4 h-4 ${
                                star <= review.rating
                                  ? 'fill-yellow-400 text-yellow-400'
                                  : 'text-gray-300'
                              }`}
                            />
                          ))}
                          <span className="ml-1 text-sm">{review.rating}/5</span>
                        </div>
                      </div>
                      
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {review.comment}
                      </p>
                      
                      <div className="flex flex-wrap gap-1">
                        {review.tags.slice(0, 3).map((tag) => (
                          <span
                            key={tag}
                            className="inline-block px-2 py-1 text-xs bg-muted rounded"
                          >
                            {tag}
                          </span>
                        ))}
                        {review.tags.length > 3 && (
                          <span className="inline-block px-2 py-1 text-xs bg-muted rounded">
                            +{review.tags.length - 3}
                          </span>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {stats.totalReviews > 3 && (
                <div className="text-center pt-4">
                  <Button
                    variant="outline"
                    onClick={() => setShowAllReviews(true)}
                  >
                    さらに{stats.totalReviews - 3}件のレビューを表示
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}