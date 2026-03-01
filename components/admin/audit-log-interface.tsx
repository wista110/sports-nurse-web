'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Shield, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  AlertTriangle,
  Clock,
  User,
  Activity,
  Database,
  Lock
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface AuditLog {
  id: string;
  actorId: string;
  action: string;
  target: string;
  metadata: Record<string, any>;
  createdAt: Date;
  actor?: {
    id: string;
    email: string;
    role: string;
    profile?: {
      name: string;
    };
  };
}

interface AuditLogInterfaceProps {
  className?: string;
}

export function AuditLogInterface({ className }: AuditLogInterfaceProps) {
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');
  const [severityFilter, setSeverityFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('24h');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadAuditLogs = async (reset = false) => {
    try {
      const params = new URLSearchParams();
      
      if (actionFilter) params.append('action', actionFilter);
      if (dateRange) {
        const now = new Date();
        let startDate: Date;
        
        switch (dateRange) {
          case '1h':
            startDate = new Date(now.getTime() - 60 * 60 * 1000);
            break;
          case '24h':
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            break;
          case '7d':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30d':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        }
        
        params.append('startDate', startDate.toISOString());
      }
      
      if (!reset) params.append('offset', (page * 50).toString());
      params.append('limit', '50');
      
      const response = await fetch(`/api/admin/audit-logs?${params}`);
      
      if (!response.ok) {
        throw new Error('監査ログの取得に失敗しました');
      }

      const data = await response.json();
      const newLogs = data.data || [];

      if (reset) {
        setAuditLogs(newLogs);
        setPage(0);
      } else {
        setAuditLogs(prev => [...prev, ...newLogs]);
      }

      setHasMore(newLogs.length === 50);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      // 監査ログの読み込みに失敗しました
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs(true);
  }, [actionFilter, severityFilter, dateRange]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    loadAuditLogs(false);
  };

  const exportLogs = async () => {
    try {
      // 実際の実装では、監査ログのエクスポート機能を実装
      console.log('エクスポート機能は開発中です');
    } catch (error) {
      console.error('エクスポートに失敗しました');
    }
  };

  const filteredLogs = auditLogs.filter(log => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        log.action.toLowerCase().includes(searchLower) ||
        log.target.toLowerCase().includes(searchLower) ||
        log.actor?.email?.toLowerCase().includes(searchLower) ||
        log.actor?.profile?.name?.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }).filter(log => {
    if (severityFilter) {
      const severity = getSeverity(log.action);
      return severity === severityFilter;
    }
    return true;
  });

  const getSeverity = (action: string): 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' => {
    const criticalActions = ['PAYMENT_PROCESSED', 'ESCROW_RELEASED', 'USER_DELETED', 'ROLE_CHANGED'];
    const highActions = ['ADMIN_ACCESS', 'LOGIN_FAILED', 'SUSPICIOUS_ACTIVITY'];
    const mediumActions = ['PROFILE_UPDATED', 'PASSWORD_CHANGED', 'JOB_CREATED'];
    
    if (criticalActions.some(a => action.includes(a))) return 'CRITICAL';
    if (highActions.some(a => action.includes(a))) return 'HIGH';
    if (mediumActions.some(a => action.includes(a))) return 'MEDIUM';
    return 'LOW';
  };

  const getSeverityBadge = (action: string) => {
    const severity = getSeverity(action);
    
    switch (severity) {
      case 'CRITICAL':
        return <Badge className="bg-red-100 text-red-800">重大</Badge>;
      case 'HIGH':
        return <Badge className="bg-orange-100 text-orange-800">高</Badge>;
      case 'MEDIUM':
        return <Badge className="bg-yellow-100 text-yellow-800">中</Badge>;
      case 'LOW':
        return <Badge className="bg-green-100 text-green-800">低</Badge>;
    }
  };

  const getActionIcon = (action: string) => {
    if (action.includes('LOGIN')) return <User className="w-4 h-4" />;
    if (action.includes('PAYMENT') || action.includes('ESCROW')) return <Database className="w-4 h-4" />;
    if (action.includes('ADMIN')) return <Shield className="w-4 h-4" />;
    if (action.includes('SECURITY') || action.includes('SUSPICIOUS')) return <AlertTriangle className="w-4 h-4" />;
    return <Activity className="w-4 h-4" />;
  };

  const formatMetadata = (metadata: Record<string, any>) => {
    const filtered = { ...metadata };
    
    // セキュリティ上の理由で一部のフィールドを除外
    delete filtered.password;
    delete filtered.token;
    delete filtered.secret;
    
    return JSON.stringify(filtered, null, 2);
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
      {/* フィルター・検索 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Filter className="w-5 h-5" />
              <span>フィルター・検索</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={exportLogs}
              className="flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>エクスポート</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="アクション・ユーザーを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={actionFilter} onValueChange={setActionFilter}>
              <SelectTrigger>
                <SelectValue placeholder="アクション" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべてのアクション</SelectItem>
                <SelectItem value="LOGIN">ログイン関連</SelectItem>
                <SelectItem value="PAYMENT">支払い関連</SelectItem>
                <SelectItem value="ADMIN">管理者操作</SelectItem>
                <SelectItem value="SECURITY">セキュリティ</SelectItem>
                <SelectItem value="USER">ユーザー操作</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={severityFilter} onValueChange={setSeverityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="重要度" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべての重要度</SelectItem>
                <SelectItem value="CRITICAL">重大</SelectItem>
                <SelectItem value="HIGH">高</SelectItem>
                <SelectItem value="MEDIUM">中</SelectItem>
                <SelectItem value="LOW">低</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="期間" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1h">過去1時間</SelectItem>
                <SelectItem value="24h">過去24時間</SelectItem>
                <SelectItem value="7d">過去7日</SelectItem>
                <SelectItem value="30d">過去30日</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Badge variant="outline">
                {filteredLogs.length}件
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 監査ログ一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>監査ログ</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {filteredLogs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Shield className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>監査ログが見つかりませんでした。</p>
              </div>
            ) : (
              <>
                {filteredLogs.map((log) => (
                  <Card
                    key={log.id}
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedLog(log)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <div className="mt-1">
                            {getActionIcon(log.action)}
                          </div>
                          
                          <div className="flex-1 space-y-1">
                            <div className="flex items-center space-x-2">
                              <span className="font-medium">{log.action}</span>
                              {getSeverityBadge(log.action)}
                            </div>
                            
                            <div className="text-sm text-muted-foreground">
                              <span>対象: {log.target}</span>
                              {log.actor && (
                                <span className="ml-4">
                                  実行者: {log.actor.profile?.name || log.actor.email}
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>
                                  {formatDistanceToNow(new Date(log.createdAt), {
                                    addSuffix: true,
                                    locale: ja
                                  })}
                                </span>
                              </div>
                              
                              <div className="flex items-center space-x-1">
                                <Eye className="w-3 h-3" />
                                <span>ID: {log.id.substring(0, 8)}...</span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedLog(log);
                          }}
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                {hasMore && (
                  <div className="text-center pt-4">
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
        </CardContent>
      </Card>

      {/* 詳細モーダル */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <Card className="w-full max-w-2xl max-h-[80vh] overflow-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="w-5 h-5" />
                  <span>監査ログ詳細</span>
                </CardTitle>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedLog(null)}
                >
                  ✕
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium">アクション</label>
                  <div className="flex items-center space-x-2">
                    <span>{selectedLog.action}</span>
                    {getSeverityBadge(selectedLog.action)}
                  </div>
                </div>
                
                <div>
                  <label className="text-sm font-medium">対象</label>
                  <p className="text-sm">{selectedLog.target}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium">実行者</label>
                  <p className="text-sm">
                    {selectedLog.actor?.profile?.name || selectedLog.actor?.email || selectedLog.actorId}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium">実行時刻</label>
                  <p className="text-sm">
                    {new Date(selectedLog.createdAt).toLocaleString('ja-JP')}
                  </p>
                </div>
              </div>
              
              <div>
                <label className="text-sm font-medium">メタデータ</label>
                <pre className="text-xs bg-muted p-3 rounded mt-1 overflow-auto">
                  {formatMetadata(selectedLog.metadata)}
                </pre>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}