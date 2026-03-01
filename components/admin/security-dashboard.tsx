'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Shield, 
  AlertTriangle, 
  Activity, 
  Lock, 
  Eye, 
  TrendingUp,
  Clock,
  Database
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface SecurityStats {
  totalEvents: number;
  criticalEvents: number;
  failedLogins: number;
  suspiciousActivities: number;
  recentEvents: Array<{
    id: string;
    action: string;
    target: string;
    createdAt: Date;
    actor?: {
      profile?: { name: string };
      email: string;
    };
  }>;
}

interface SecurityDashboardProps {
  className?: string;
}

export function SecurityDashboard({ className }: SecurityDashboardProps) {
  const [stats, setStats] = useState<SecurityStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSecurityStats = async () => {
    try {
      const response = await fetch('/api/admin/audit-logs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'getSecurityStats' }),
      });

      if (!response.ok) {
        throw new Error('セキュリティ統計の取得に失敗しました');
      }

      const data = await response.json();
      setStats(data.data);
    } catch (error) {
      console.error('Error loading security stats:', error);
      // セキュリティ統計の読み込みに失敗しました
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSecurityStats();
    
    // 5分ごとに自動更新
    const interval = setInterval(loadSecurityStats, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSecurityStats();
  };

  const getSeverityBadge = (action: string) => {
    if (action.includes('PAYMENT') || action.includes('ADMIN')) {
      return <Badge className="bg-red-100 text-red-800">重大</Badge>;
    }
    if (action.includes('LOGIN_FAILED') || action.includes('SECURITY')) {
      return <Badge className="bg-orange-100 text-orange-800">高</Badge>;
    }
    return <Badge className="bg-yellow-100 text-yellow-800">中</Badge>;
  };

  if (loading) {
    return (
      <div className={`space-y-4 ${className}`}>
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-3">
              <div className="h-4 bg-muted rounded w-1/4"></div>
              <div className="h-32 bg-muted rounded"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={className}>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p>セキュリティ統計を読み込めませんでした。</p>
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
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>セキュリティダッシュボード</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={handleRefresh}
              disabled={refreshing}
              className="flex items-center space-x-1"
            >
              <Activity className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? '更新中...' : '更新'}</span>
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Activity className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">総イベント数</p>
                <p className="text-2xl font-bold">{stats.totalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <div>
                <p className="text-sm text-muted-foreground">重大イベント</p>
                <p className="text-2xl font-bold">{stats.criticalEvents}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Lock className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">ログイン失敗</p>
                <p className="text-2xl font-bold">{stats.failedLogins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <Eye className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">不審なアクティビティ</p>
                <p className="text-2xl font-bold">{stats.suspiciousActivities}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* セキュリティ概要 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* セキュリティレベル */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>セキュリティレベル</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>全体的なセキュリティ</span>
                <Badge className="bg-green-100 text-green-800">良好</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>ログイン試行</span>
                <Badge className={stats.failedLogins > 10 ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"}>
                  {stats.failedLogins > 10 ? '注意' : '正常'}
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>重要操作</span>
                <Badge className={stats.criticalEvents > 5 ? "bg-orange-100 text-orange-800" : "bg-green-100 text-green-800"}>
                  {stats.criticalEvents > 5 ? '監視中' : '正常'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* アクティビティサマリー */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>24時間のアクティビティ</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span>総アクセス数</span>
                <span className="font-bold">{stats.totalEvents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>管理者操作</span>
                <span className="font-bold">{stats.criticalEvents}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>失敗したログイン</span>
                <span className="font-bold text-red-600">{stats.failedLogins}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>不審なアクティビティ</span>
                <span className="font-bold text-orange-600">{stats.suspiciousActivities}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 最近のセキュリティイベント */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>最近のセキュリティイベント</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {stats.recentEvents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>最近のセキュリティイベントはありません。</p>
              </div>
            ) : (
              stats.recentEvents.map((event) => (
                <Card key={event.id} className="border-l-4 border-l-orange-500">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-medium">{event.action}</span>
                          {getSeverityBadge(event.action)}
                        </div>
                        
                        <div className="text-sm text-muted-foreground">
                          <span>対象: {event.target}</span>
                          {event.actor && (
                            <span className="ml-4">
                              実行者: {event.actor.profile?.name || event.actor.email}
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          <span>
                            {formatDistanceToNow(new Date(event.createdAt), {
                              addSuffix: true,
                              locale: ja
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}