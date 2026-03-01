'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Star, Clock, User, MessageSquare, ThumbsUp, ThumbsDown } from 'lucide-react';
import { toast } from 'sonner';

interface OrganizerFeedbackFormProps {
  jobId: string;
  jobTitle: string;
  nurseName: string;
  onSuccess?: () => void;
}

interface PerformanceRating {
  punctuality: number;
  professionalism: number;
  communication: number;
  technicalSkills: number;
}

export function OrganizerFeedbackForm({ jobId, jobTitle, nurseName, onSuccess }: OrganizerFeedbackFormProps) {
  const router = useRouter();
  const [performance, setPerformance] = useState<PerformanceRating>({
    punctuality: 0,
    professionalism: 0,
    communication: 0,
    technicalSkills: 0
  });
  const [eventSummary, setEventSummary] = useState('');
  const [issues, setIssues] = useState('');
  const [overtimeOccurred, setOvertimeOccurred] = useState(false);
  const [overtimeDuration, setOvertimeDuration] = useState<number | undefined>();
  const [overtimeReason, setOvertimeReason] = useState('');
  const [wouldRecommend, setWouldRecommend] = useState<boolean | null>(null);
  const [additionalComments, setAdditionalComments] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const performanceLabels = {
    punctuality: '時間厳守',
    professionalism: '専門性',
    communication: 'コミュニケーション',
    technicalSkills: '技術スキル'
  };

  const updatePerformanceRating = (category: keyof PerformanceRating, rating: number) => {
    setPerformance(prev => ({ ...prev, [category]: rating }));
  };

  const renderStarRating = (category: keyof PerformanceRating, label: string) => {
    const rating = performance[category];
    
    return (
      <div className="space-y-2">
        <Label>{label} *</Label>
        <div className="flex items-center space-x-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              className="p-1 hover:scale-110 transition-transform"
              onClick={() => updatePerformanceRating(category, star)}
            >
              <Star
                className={`w-6 h-6 ${
                  star <= rating
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
    );
  };

  const isFormValid = () => {
    return Object.values(performance).every(rating => rating > 0) &&
           eventSummary.length >= 10 &&
           wouldRecommend !== null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!isFormValid()) {
      toast.error('必須項目を入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reports/organizer-feedback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          nursePerformance: performance,
          eventSummary,
          issues: issues || undefined,
          overtime: overtimeOccurred ? {
            occurred: true,
            duration: overtimeDuration,
            reason: overtimeReason || undefined
          } : { occurred: false },
          wouldRecommend,
          additionalComments: additionalComments || undefined
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'フィードバックの作成に失敗しました');
      }

      toast.success('フィードバックが作成されました');
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error('Organizer feedback creation error:', error);
      toast.error(error instanceof Error ? error.message : 'フィードバックの作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <MessageSquare className="w-5 h-5" />
          <span>依頼者フィードバック</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {jobTitle} - {nurseName}さんへのフィードバック
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* 看護師パフォーマンス評価 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <User className="w-5 h-5" />
              <span>看護師パフォーマンス評価</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Object.entries(performanceLabels).map(([key, label]) => (
                <div key={key}>
                  {renderStarRating(key as keyof PerformanceRating, label)}
                </div>
              ))}
            </div>
          </div>

          {/* イベント概要 */}
          <div className="space-y-2">
            <Label htmlFor="eventSummary">イベント概要・実施状況 *</Label>
            <Textarea
              id="eventSummary"
              placeholder="イベントの実施状況、参加者の様子、看護師の活動について記載してください（10文字以上）"
              value={eventSummary}
              onChange={(e) => setEventSummary(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {eventSummary.length}/1000文字
            </p>
          </div>

          {/* 問題・課題 */}
          <div className="space-y-2">
            <Label htmlFor="issues">問題・課題（あった場合）</Label>
            <Textarea
              id="issues"
              placeholder="何か問題や改善点があれば記載してください"
              value={issues}
              onChange={(e) => setIssues(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {issues.length}/500文字
            </p>
          </div>

          {/* 延長・残業 */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <Switch
                id="overtime"
                checked={overtimeOccurred}
                onCheckedChange={setOvertimeOccurred}
              />
              <Label htmlFor="overtime" className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>予定時間を超過した延長・残業が発生した</span>
              </Label>
            </div>
            
            {overtimeOccurred && (
              <div className="ml-6 space-y-4 p-4 bg-muted rounded-lg">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="overtimeDuration">延長時間（分）</Label>
                    <Input
                      id="overtimeDuration"
                      type="number"
                      min="0"
                      value={overtimeDuration || ''}
                      onChange={(e) => setOvertimeDuration(e.target.value ? parseInt(e.target.value) : undefined)}
                      placeholder="30"
                    />
                  </div>
                  <div>
                    <Label htmlFor="overtimeReason">延長理由</Label>
                    <Input
                      id="overtimeReason"
                      value={overtimeReason}
                      onChange={(e) => setOvertimeReason(e.target.value)}
                      placeholder="イベント終了時間の延長"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* 推薦意向 */}
          <div className="space-y-3">
            <Label>この看護師を他の依頼者に推薦しますか？ *</Label>
            <div className="flex space-x-4">
              <Button
                type="button"
                variant={wouldRecommend === true ? 'default' : 'outline'}
                onClick={() => setWouldRecommend(true)}
                className="flex items-center space-x-2"
              >
                <ThumbsUp className="w-4 h-4" />
                <span>はい、推薦します</span>
              </Button>
              <Button
                type="button"
                variant={wouldRecommend === false ? 'destructive' : 'outline'}
                onClick={() => setWouldRecommend(false)}
                className="flex items-center space-x-2"
              >
                <ThumbsDown className="w-4 h-4" />
                <span>いいえ、推薦しません</span>
              </Button>
            </div>
          </div>

          {/* 追加コメント */}
          <div className="space-y-2">
            <Label htmlFor="additionalComments">追加コメント</Label>
            <Textarea
              id="additionalComments"
              placeholder="その他、お気づきの点やコメントがあれば記載してください"
              value={additionalComments}
              onChange={(e) => setAdditionalComments(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {additionalComments.length}/500文字
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
              disabled={isSubmitting || !isFormValid()}
            >
              {isSubmitting ? '送信中...' : 'フィードバックを送信'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}