'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Star, StarIcon } from 'lucide-react';
import { NURSE_EVALUATION_TAGS, ORGANIZER_EVALUATION_TAGS } from '@/lib/validations/review';
import { toast } from 'sonner';

interface ReviewFormProps {
  jobId: string;
  targetId: string;
  targetName: string;
  targetRole: 'NURSE' | 'ORGANIZER';
  onSuccess?: () => void;
}

export function ReviewForm({ jobId, targetId, targetName, targetRole, onSuccess }: ReviewFormProps) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const availableTags = targetRole === 'NURSE' ? NURSE_EVALUATION_TAGS : ORGANIZER_EVALUATION_TAGS;

  const handleTagToggle = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) 
        ? prev.filter(t => t !== tag)
        : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (rating === 0) {
      toast.error('評価を選択してください');
      return;
    }

    if (selectedTags.length === 0) {
      toast.error('少なくとも1つのタグを選択してください');
      return;
    }

    if (comment.length < 10) {
      toast.error('コメントは10文字以上入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          targetId,
          rating,
          tags: selectedTags,
          comment
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'レビューの作成に失敗しました');
      }

      toast.success('レビューが作成されました');
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error('Review creation error:', error);
      toast.error(error instanceof Error ? error.message : 'レビューの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>
          {targetName}さんへのレビュー
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {targetRole === 'NURSE' ? '看護師' : '依頼者'}としての評価をお聞かせください
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 評価 */}
          <div className="space-y-2">
            <Label>総合評価 *</Label>
            <div className="flex items-center space-x-1">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  className="p-1 hover:scale-110 transition-transform"
                  onMouseEnter={() => setHoveredRating(star)}
                  onMouseLeave={() => setHoveredRating(0)}
                  onClick={() => setRating(star)}
                >
                  <Star
                    className={`w-8 h-8 ${
                      star <= (hoveredRating || rating)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
              {rating > 0 && (
                <span className="ml-2 text-sm text-muted-foreground">
                  {rating}/5
                </span>
              )}
            </div>
          </div>

          {/* タグ選択 */}
          <div className="space-y-2">
            <Label>評価タグ * (該当するものを選択)</Label>
            <div className="flex flex-wrap gap-2">
              {availableTags.map((tag) => (
                <Badge
                  key={tag}
                  variant={selectedTags.includes(tag) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => handleTagToggle(tag)}
                >
                  {tag}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              選択済み: {selectedTags.length}個
            </p>
          </div>

          {/* コメント */}
          <div className="space-y-2">
            <Label htmlFor="comment">詳細コメント *</Label>
            <Textarea
              id="comment"
              placeholder="具体的な評価内容をお書きください（10文字以上）"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {comment.length}/1000文字
            </p>
          </div>

          {/* 送信ボタン */}
          <div className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              キャンセル
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || rating === 0 || selectedTags.length === 0 || comment.length < 10}
            >
              {isSubmitting ? '送信中...' : 'レビューを送信'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}