'use client';

import { useState, useEffect } from 'react';
import { ReviewCard } from './review-card';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search, Filter, Star } from 'lucide-react';
import { ReviewDetails } from '@/lib/validations/review';
import { toast } from 'sonner';

interface ReviewListProps {
  userId?: string;
  jobId?: string;
  showFilters?: boolean;
  className?: string;
}

export function ReviewList({ userId, jobId, showFilters = true, className }: ReviewListProps) {
  const [reviews, setReviews] = useState<ReviewDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadReviews = async (reset = false) => {
    try {
      const params = new URLSearchParams();
      
      if (userId) params.append('targetId', userId);
      if (jobId) params.append('jobId', jobId);
      if (ratingFilter) params.append('minRating', ratingFilter);
      if (!reset) params.append('offset', (page * 10).toString());
      
      const response = await fetch(`/api/reviews?${params}`);
      
      if (!response.ok) {
        throw new Error('レビューの取得に失敗しました');
      }

      const data = await response.json();
      const newReviews = data.data || [];

      if (reset) {
        setReviews(newReviews);
        setPage(0);
      } else {
        setReviews(prev => [...prev, ...newReviews]);
      }

      setHasMore(newReviews.length === 10);
    } catch (error) {
      console.error('Error loading reviews:', error);
      toast.error('レビューの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReviews(true);
  }, [userId, jobId, ratingFilter, roleFilter]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    loadReviews(false);
  };

  const filteredReviews = reviews.filter(review => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        review.comment.toLowerCase().includes(searchLower) ||
        review.author.name.toLowerCase().includes(searchLower) ||
        review.target.name.toLowerCase().includes(searchLower) ||
        review.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }
    return true;
  }).filter(review => {
    if (roleFilter) {
      return review.author.role === roleFilter;
    }
    return true;
  });

  const getRatingStats = () => {
    if (filteredReviews.length === 0) return null;
    
    const totalRating = filteredReviews.reduce((sum, review) => sum + review.rating, 0);
    const averageRating = totalRating / filteredReviews.length;
    
    return {
      average: averageRating,
      total: filteredReviews.length
    };
  };

  const stats = getRatingStats();

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-3">
                <div className="h-4 bg-muted rounded w-1/4"></div>
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* 統計情報 */}
      {stats && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-1">
                  <Star className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                  <span className="text-lg font-medium">{stats.average.toFixed(1)}</span>
                </div>
                <Badge variant="secondary">
                  {stats.total}件のレビュー
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* フィルター */}
      {showFilters && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>フィルター</span>
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
                  <SelectItem value="5">5つ星</SelectItem>
                  <SelectItem value="4">4つ星以上</SelectItem>
                  <SelectItem value="3">3つ星以上</SelectItem>
                  <SelectItem value="2">2つ星以上</SelectItem>
                  <SelectItem value="1">1つ星以上</SelectItem>
                </SelectContent>
              </Select>
              
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="投稿者で絞り込み" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">すべての投稿者</SelectItem>
                  <SelectItem value="NURSE">看護師</SelectItem>
                  <SelectItem value="ORGANIZER">依頼者</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      )}

      {/* レビュー一覧 */}
      <div className="space-y-4">
        {filteredReviews.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-muted-foreground">レビューが見つかりませんでした。</p>
            </CardContent>
          </Card>
        ) : (
          <>
            {filteredReviews.map((review) => (
              <ReviewCard
                key={review.id}
                review={review}
                showJobInfo={!jobId}
              />
            ))}
            
            {hasMore && (
              <div className="text-center">
                <Button
                  variant="outline"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? '読み込み中...' : 'さらに読み込む'}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}