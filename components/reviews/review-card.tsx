'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Star } from 'lucide-react';
import { ReviewDetails } from '@/lib/validations/review';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ReviewCardProps {
  review: ReviewDetails;
  showJobInfo?: boolean;
}

export function ReviewCard({ review, showJobInfo = false }: ReviewCardProps) {
  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'fill-yellow-400 text-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
        <span className="ml-1 text-sm font-medium">{rating}/5</span>
      </div>
    );
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'NURSE':
        return '看護師';
      case 'ORGANIZER':
        return '依頼者';
      case 'ADMIN':
        return '管理者';
      default:
        return role;
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback>
                {review.author.name.charAt(0)}
              </AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center space-x-2">
                <h4 className="font-medium">{review.author.name}</h4>
                <Badge variant="secondary" className="text-xs">
                  {getRoleLabel(review.author.role)}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {review.target.name}さんへの評価
              </p>
            </div>
          </div>
          <div className="text-right">
            {renderStars(review.rating)}
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(review.createdAt), {
                addSuffix: true,
                locale: ja
              })}
            </p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* 案件情報 */}
        {showJobInfo && (
          <div className="p-3 bg-muted rounded-lg">
            <h5 className="font-medium text-sm">{review.job.title}</h5>
            <p className="text-xs text-muted-foreground">
              {new Date(review.job.startAt).toLocaleDateString('ja-JP')} - {' '}
              {new Date(review.job.endAt).toLocaleDateString('ja-JP')}
            </p>
          </div>
        )}

        {/* タグ */}
        <div className="flex flex-wrap gap-1">
          {review.tags.map((tag) => (
            <Badge key={tag} variant="outline" className="text-xs">
              {tag}
            </Badge>
          ))}
        </div>

        {/* コメント */}
        <div className="space-y-2">
          <p className="text-sm leading-relaxed">{review.comment}</p>
        </div>
      </CardContent>
    </Card>
  );
}