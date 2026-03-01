'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertTriangle, Eye, EyeOff, Flag, Search, Star, Trash2 } from 'lucide-react';
import { ReviewDetails } from '@/lib/validations/review';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface ReviewModerationProps {
  className?: string;
}

interface ModerationAction {
  reviewId: string;
  action: 'hide' | 'show' | 'delete' | 'flag';
  reason?: string;
}

export function ReviewModeration({ className }: ReviewModerationProps) {
  const [reviews, setReviews] = useState<ReviewDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [selectedReviews, setSelectedReviews] = useState<Set<string>>(new Set());
  const [moderationReason, setModerationReason] = useState('');
  const [showModerationPanel, setShowModerationPanel] = useState(false);

  const loadReviews = async () => {
    try {
      const params = new URLSearchParams();
      if (ratingFilter) params.append('maxRating', ratingFilter);
      params.append('limit', '50');
      
      const response = await fetch(`/api/reviews?${params}`);
      
      if (!response.ok) {
        throw new Error('レビューの取得に失敗しました');
      }

      const data = await response.json();
      setReviews(data.data || []);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('レビューの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews();
  }, [ratingFilter]);

  const handleReviewSelect = (reviewId: string, selected: boolean) => {
    const newSelected = new Set(selectedReviews);
    if (selected) {
      newSelected.add(reviewId);
    } else {
      newSelected.delete(reviewId);
    }
    setSelectedReviews(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedReviews.size === filteredReviews.length) {
      setSelectedReviews(new Set());
    } else {
      setSelectedReviews(new Set(filteredReviews.map(r => r.id)));
    }
  };

  const executeModerationAction = async (action: ModerationAction['action']) => {
    if (selectedReviews.size === 0) {
      toast.error('レビューを選択してください');
      return;
    }

    if ((action === 'hide' || action === 'flag' || action === 'delete') && !moderationReason.trim()) {
      toast.error('モデレーション理由を入力してください');
      return;
    }

    try {
      // 実際のAPIエンドポイントは未実装のため、ここではモック処理
      console.log('Moderation action:', {
        action,
        reviewIds: Array.from(selectedReviews),
        reason: moderationReason
      });

      toast.success(`${selectedReviews.size}件のレビューに${action}を実行しました`);
      setSelectedReviews(new Set());
      setModerationReason('');
      setShowModerationPanel(false);
      
      // レビューリストを再読み込み
      loadReviews();
    } catch (error) {
      console.error('Moderation error:', error);
      toast.error('モデレーション処理に失敗しました');
    }
  };

  const filteredReviews = reviews.filter(review => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        review.comment.toLowerCase().includes(searchLower) ||
        review.author.name.toLowerCase().includes(searchLower) ||
        review.target.name.toLowerCase().includes(searchLower)
      );
    }
    return true;
  });

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
        <span className="ml-1 text-sm">{rating}/5</span>
      </div>
    );
  };

  const getRiskLevel = (review: ReviewDetails) => {
    // 簡易的なリスク判定ロジック
    if (review.rating <= 2) return 'high';
    if (review.comment.length < 20) return 'medium';
    return 'low';
  };

  const getRiskBadge = (level: string) => {
    switch (level) {
      case 'high':
        return <Badge variant="destructive">高リスク</Badge>;
      case 'medium':
        return <Badge variant="secondary">中リスク</Badge>;
      default:
        return <Badge variant="outline">低リスク</Badge>;
    }
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>レビューモデレーション</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="レビューを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={ratingFilter} onValueChange={setRatingFilter}>
              <SelectTrigger>
                <SelectValue placeholder="評価で絞り込み" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべての評価</SelectItem>
                <SelectItem value="2">2つ星以下</SelectItem>
                <SelectItem value="1">1つ星</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModerationPanel(!showModerationPanel)}
              >
                モデレーション ({selectedReviews.size})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* モデレーションパネル */}
      {showModerationPanel && selectedReviews.size > 0 && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800">
              モデレーション操作 ({selectedReviews.size}件選択中)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium text-orange-800">理由</label>
              <Textarea
                placeholder="モデレーション理由を入力してください"
                value={moderationReason}
                onChange={(e) => setModerationReason(e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="flex flex-wrap gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => executeModerationAction('hide')}
                className="flex items-center space-x-1"
              >
                <EyeOff className="w-4 h-4" />
                <span>非表示</span>
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => executeModerationAction('flag')}
                className="flex items-center space-x-1"
              >
                <Flag className="w-4 h-4" />
                <span>フラグ</span>
              </Button>
              
              <Button
                variant="destructive"
                size="sm"
                onClick={() => executeModerationAction('delete')}
                className="flex items-center space-x-1"
              >
                <Trash2 className="w-4 h-4" />
                <span>削除</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* レビュー一覧 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>レビュー一覧 ({filteredReviews.length}件)</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleSelectAll}
            >
              {selectedReviews.size === filteredReviews.length ? '全選択解除' : '全選択'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredReviews.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                レビューが見つかりませんでした。
              </p>
            ) : (
              filteredReviews.map((review) => {
                const riskLevel = getRiskLevel(review);
                const isSelected = selectedReviews.has(review.id);
                
                return (
                  <Card
                    key={review.id}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                    } ${riskLevel === 'high' ? 'border-red-200' : ''}`}
                    onClick={() => handleReviewSelect(review.id, !isSelected)}
                  >
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {/* ヘッダー */}
                        <div className="flex items-start justify-between">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => handleReviewSelect(review.id, e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                              className="rounded"
                            />
                            <div>
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">{review.author.name}</span>
                                <Badge variant="outline" className="text-xs">
                                  {review.author.role === 'NURSE' ? '看護師' : '依頼者'}
                                </Badge>
                                {getRiskBadge(riskLevel)}
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

                        {/* 案件情報 */}
                        <div className="p-2 bg-muted rounded text-sm">
                          <span className="font-medium">{review.job.title}</span>
                          <span className="text-muted-foreground ml-2">
                            {new Date(review.job.startAt).toLocaleDateString('ja-JP')}
                          </span>
                        </div>

                        {/* タグ */}
                        <div className="flex flex-wrap gap-1">
                          {review.tags.map((tag) => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>

                        {/* コメント */}
                        <div className="p-3 bg-gray-50 rounded">
                          <p className="text-sm">{review.comment}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}