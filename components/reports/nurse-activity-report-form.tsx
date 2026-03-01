'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Clock, AlertTriangle, FileText } from 'lucide-react';
import { ActivityIncident } from '@/lib/validations/review';
import { toast } from 'sonner';

interface NurseActivityReportFormProps {
  jobId: string;
  jobTitle: string;
  onSuccess?: () => void;
}

const EQUIPMENT_OPTIONS = [
  'AED', '血圧計', '体温計', '聴診器', 'パルスオキシメーター',
  '救急箱', 'テーピング用品', '氷嚢', '担架', '車椅子',
  '酸素ボンベ', '点滴セット', '包帯', 'ガーゼ', '消毒液'
];

export function NurseActivityReportForm({ jobId, jobTitle, onSuccess }: NurseActivityReportFormProps) {
  const router = useRouter();
  const [incidents, setIncidents] = useState<ActivityIncident[]>([]);
  const [overallSummary, setOverallSummary] = useState('');
  const [recommendations, setRecommendations] = useState('');
  const [selectedEquipment, setSelectedEquipment] = useState<string[]>([]);
  const [participantCount, setParticipantCount] = useState<number | undefined>();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addIncident = () => {
    setIncidents([...incidents, { time: '', description: '', action: '' }]);
  };

  const updateIncident = (index: number, field: keyof ActivityIncident, value: string) => {
    const updated = [...incidents];
    updated[index] = { ...updated[index], [field]: value };
    setIncidents(updated);
  };

  const removeIncident = (index: number) => {
    setIncidents(incidents.filter((_, i) => i !== index));
  };

  const toggleEquipment = (equipment: string) => {
    setSelectedEquipment(prev =>
      prev.includes(equipment)
        ? prev.filter(e => e !== equipment)
        : [...prev, equipment]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (overallSummary.length < 10) {
      toast.error('全体的な所感は10文字以上入力してください');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch('/api/reports/nurse-activity', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          incidents: incidents.filter(i => i.time && i.description && i.action),
          overallSummary,
          recommendations: recommendations || undefined,
          equipmentUsed: selectedEquipment,
          participantCount
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '活動報告の作成に失敗しました');
      }

      toast.success('活動報告が作成されました');
      onSuccess?.();
      router.refresh();
    } catch (error) {
      console.error('Activity report creation error:', error);
      toast.error(error instanceof Error ? error.message : '活動報告の作成に失敗しました');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>看護師活動報告</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          {jobTitle} - 活動内容をご報告ください
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* インシデント記録 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">インシデント・対応記録</Label>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addIncident}
                className="flex items-center space-x-1"
              >
                <Plus className="w-4 h-4" />
                <span>追加</span>
              </Button>
            </div>
            
            {incidents.map((incident, index) => (
              <Card key={index} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <AlertTriangle className="w-4 h-4 text-orange-500" />
                    <span className="font-medium">インシデント {index + 1}</span>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIncident(index)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor={`time-${index}`}>時刻</Label>
                    <Input
                      id={`time-${index}`}
                      type="time"
                      value={incident.time}
                      onChange={(e) => updateIncident(index, 'time', e.target.value)}
                      placeholder="14:30"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`description-${index}`}>事象・状況</Label>
                    <Input
                      id={`description-${index}`}
                      value={incident.description}
                      onChange={(e) => updateIncident(index, 'description', e.target.value)}
                      placeholder="参加者が転倒"
                    />
                  </div>
                  <div>
                    <Label htmlFor={`action-${index}`}>対応・処置</Label>
                    <Input
                      id={`action-${index}`}
                      value={incident.action}
                      onChange={(e) => updateIncident(index, 'action', e.target.value)}
                      placeholder="応急処置を実施"
                    />
                  </div>
                </div>
              </Card>
            ))}
            
            {incidents.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>インシデントがない場合は記録不要です</p>
              </div>
            )}
          </div>

          {/* 参加者数 */}
          <div className="space-y-2">
            <Label htmlFor="participantCount">参加者数（概算）</Label>
            <Input
              id="participantCount"
              type="number"
              min="0"
              value={participantCount || ''}
              onChange={(e) => setParticipantCount(e.target.value ? parseInt(e.target.value) : undefined)}
              placeholder="50"
              className="w-32"
            />
          </div>

          {/* 使用機材 */}
          <div className="space-y-2">
            <Label>使用した機材・備品</Label>
            <div className="flex flex-wrap gap-2">
              {EQUIPMENT_OPTIONS.map((equipment) => (
                <Badge
                  key={equipment}
                  variant={selectedEquipment.includes(equipment) ? 'default' : 'outline'}
                  className="cursor-pointer hover:bg-primary/80"
                  onClick={() => toggleEquipment(equipment)}
                >
                  {equipment}
                </Badge>
              ))}
            </div>
            <p className="text-xs text-muted-foreground">
              選択済み: {selectedEquipment.length}個
            </p>
          </div>

          {/* 全体的な所感 */}
          <div className="space-y-2">
            <Label htmlFor="overallSummary">全体的な所感・活動内容 *</Label>
            <Textarea
              id="overallSummary"
              placeholder="イベント全体の様子、参加者の状況、安全管理について記載してください（10文字以上）"
              value={overallSummary}
              onChange={(e) => setOverallSummary(e.target.value)}
              rows={5}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {overallSummary.length}/1000文字
            </p>
          </div>

          {/* 改善提案 */}
          <div className="space-y-2">
            <Label htmlFor="recommendations">改善提案・今後への提言</Label>
            <Textarea
              id="recommendations"
              placeholder="今後のイベントに向けた改善提案があれば記載してください"
              value={recommendations}
              onChange={(e) => setRecommendations(e.target.value)}
              rows={3}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              {recommendations.length}/500文字
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
              disabled={isSubmitting || overallSummary.length < 10}
            >
              {isSubmitting ? '送信中...' : '活動報告を送信'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}