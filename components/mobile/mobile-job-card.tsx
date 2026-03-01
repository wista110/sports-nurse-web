'use client';

import Link from 'next/link';
import { 
  MapPin, 
  Calendar, 
  Users, 
  Yen, 
  Clock,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface Job {
  id: string;
  title: string;
  location: string;
  startDate: Date;
  endDate: Date;
  category: string;
  compensation: number;
  requiredNurses: number;
  participantCount: number;
  applicationDeadline: Date;
  isUrgent: boolean;
  status: string;
}

interface MobileJobCardProps {
  job: Job;
  showApplyButton?: boolean;
  onApply?: (jobId: string) => void;
}

export function MobileJobCard({ job, showApplyButton = true, onApply }: MobileJobCardProps) {
  const isDeadlineSoon = new Date(job.applicationDeadline).getTime() - Date.now() < 24 * 60 * 60 * 1000;
  const isExpired = new Date(job.applicationDeadline) < new Date();

  return (
    <Card className="w-full">
      <CardContent className="p-4 space-y-3">
        {/* ヘッダー */}
        <div className="space-y-2">
          <div className="flex items-start justify-between">
            <h3 className="font-semibold text-sm leading-tight line-clamp-2">
              {job.title}
            </h3>
            {job.isUrgent && (
              <Badge variant="destructive" className="ml-2 flex-shrink-0 text-xs">
                急募
              </Badge>
            )}
          </div>
          
          <Badge variant="outline" className="text-xs">
            {job.category}
          </Badge>
        </div>

        {/* 基本情報 */}
        <div className="space-y-2 text-xs text-muted-foreground">
          <div className="flex items-center space-x-1">
            <MapPin className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{job.location}</span>
          </div>
          
          <div className="flex items-center space-x-1">
            <Calendar className="h-3 w-3 flex-shrink-0" />
            <span>
              {new Date(job.startDate).toLocaleDateString('ja-JP', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
              })}
            </span>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-1">
              <Users className="h-3 w-3 flex-shrink-0" />
              <span>{job.requiredNurses}名募集</span>
            </div>
            
            <div className="flex items-center space-x-1 font-medium text-foreground">
              <Yen className="h-3 w-3" />
              <span>{job.compensation.toLocaleString()}円</span>
            </div>
          </div>
        </div>

        {/* 締切情報 */}
        <div className="flex items-center justify-between text-xs">
          <div className={`flex items-center space-x-1 ${
            isDeadlineSoon ? 'text-orange-600' : 'text-muted-foreground'
          }`}>
            <Clock className="h-3 w-3" />
            <span>
              締切: {formatDistanceToNow(new Date(job.applicationDeadline), {
                addSuffix: true,
                locale: ja
              })}
            </span>
          </div>
          
          {isDeadlineSoon && !isExpired && (
            <div className="flex items-center space-x-1 text-orange-600">
              <AlertCircle className="h-3 w-3" />
              <span className="font-medium">まもなく締切</span>
            </div>
          )}
        </div>

        {/* アクションボタン */}
        <div className="flex space-x-2 pt-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="flex-1 text-xs h-8"
          >
            <Link href={`/jobs/${job.id}`}>
              詳細を見る
            </Link>
          </Button>
          
          {showApplyButton && !isExpired && (
            <Button
              onClick={() => onApply?.(job.id)}
              size="sm"
              className="flex-1 text-xs h-8"
              disabled={isExpired}
            >
              応募する
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}