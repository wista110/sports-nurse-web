'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Star, TrendingUp, Award, MessageSquare } from 'lucide-react';
import { ReviewStats } from '@/lib/validations/review';

interface ReviewStatsProps {
  stats: ReviewStats;
  className?: string;
}

export function ReviewStatsComponent({ stats, className }: ReviewStatsProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= Math.round(rating)
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
      </div>
    );
  };

  const getRatingLabel = (rating: number) => {
    if (rating >= 4.5) return { label: '優秀', color: 'bg-green-500' };
    if (rating >= 4.0) return { label: '良好', color: 'bg-blue-500' };
    if (rating >= 3.5) return { label: '普通', color: 'bg-yellow-500' };
    if (rating >= 3.0) return { label: '改善要', color: 'bg-orange-500' };
    return { label: '要注意', color: 'bg-red-500' };
  };

  const ratingInfo = getRatingLabel(stats.averageRating);

  return (
    <div className={`space-y-4 ${className}`}>
      {/* 総合評価 */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-2">
            <Award className="w-5 h-5" />
            <span>総合評価</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div>
              {renderStars(stats.averageRating)}
              <p className="text-2xl font-bold mt-1">{stats.averageRating.toFixed(1)}</p>
            </div>
            <div className="text-right">
              <Badge className={`${ratingInfo.color} text-white`}>
                {ratingInfo.label}
              </Badge>
              <p className="text-sm text-muted-foreground mt-1">
                {stats.totalReviews}件のレビュー
              </p>
            </div>
          </div>

          {/* 評価分布 */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium">評価分布</h4>
            {[5, 4, 3, 2, 1].map((rating) => {
              const count = stats.ratingDistribution[rating as keyof typeof stats.ratingDistribution];
              const percentage = stats.totalReviews > 0 ? (count / stats.totalReviews) * 100 : 0;
              
              return (
                <div key={rating} className="flex items-center space-x-2 text-sm">
                  <span className="w-8">{rating}★</span>
                  <Progress value={percentage} className="flex-1 h-2" />
                  <span className="w-8 text-right">{count}</span>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* よく使われるタグ */}
      {stats.commonTags.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>よく使われるタグ</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {stats.commonTags.slice(0, 8).map((tagInfo) => (
                <Badge key={tagInfo.tag} variant="secondary" className="text-xs">
                  {tagInfo.tag} ({tagInfo.count})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 最近のレビュー */}
      {stats.recentReviews.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center space-x-2">
              <MessageSquare className="w-5 h-5" />
              <span>最近のレビュー</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.recentReviews.slice(0, 3).map((review) => (
                <div key={review.id} className="border-l-2 border-muted pl-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{review.author.name}</span>
                    {renderStars(review.rating)}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {review.comment}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {review.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}