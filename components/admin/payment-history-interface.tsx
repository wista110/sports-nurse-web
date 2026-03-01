'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  Clock, 
  Zap, 
  Calendar, 
  User, 
  Building, 
  CheckCircle, 
  XCircle,
  Search,
  Filter,
  Download,
  Eye
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface PaymentHistory {
  id: string;
  jobId: string;
  nurseId: string;
  amount: number;
  fee: number;
  netAmount: number;
  method: 'instant' | 'scheduled';
  status: 'PENDING' | 'COMPLETED' | 'FAILED';
  executedAt: Date;
  notes?: string;
  createdAt: Date;
  job: {
    id: string;
    title: string;
  };
  nurse: {
    id: string;
    name: string;
  };
}

interface PaymentHistoryInterfaceProps {
  className?: string;
}

export function PaymentHistoryInterface({ className }: PaymentHistoryInterfaceProps) {
  const [paymentHistory, setPaymentHistory] = useState<PaymentHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('');
  const [dateRange, setDateRange] = useState<string>('');
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const loadPaymentHistory = async (reset = false) => {
    try {
      const params = new URLSearchParams();
      
      if (statusFilter) params.append('status', statusFilter);
      if (dateRange) {
        const now = new Date();
        let startDate: Date;
        
        switch (dateRange) {
          case '7days':
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            break;
          case '30days':
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
            break;
          case '90days':
            startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
            break;
          default:
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        
        params.append('startDate', startDate.toISOString());
      }
      
      if (!reset) params.append('offset', (page * 20).toString());
      params.append('limit', '20');
      
      const response = await fetch(`/api/admin/payments/history?${params}`);
      
      if (!response.ok) {
        throw new Error('支払い履歴の取得に失敗しました');
      }

      const data = await response.json();
      const newHistory = data.data || [];

      if (reset) {
        setPaymentHistory(newHistory);
        setPage(0);
      } else {
        setPaymentHistory(prev => [...prev, ...newHistory]);
      }

      setHasMore(newHistory.length === 20);
    } catch (error) {
      console.error('Error loading payment history:', error);
      toast.error('支払い履歴の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentHistory(true);
  }, [statusFilter, methodFilter, dateRange]);

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    loadPaymentHistory(false);
  };

  const exportHistory = async () => {
    try {
      // 実際の実装では、CSVエクスポート機能を実装
      toast.info('エクスポート機能は開発中です');
    } catch (error) {
      toast.error('エクスポートに失敗しました');
    }
  };

  const filteredHistory = paymentHistory.filter(payment => {
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      return (
        payment.job.title.toLowerCase().includes(searchLower) ||
        payment.nurse.name.toLowerCase().includes(searchLower) ||
        payment.id.toLowerCase().includes(searchLower)
      );
    }
    return true;
  }).filter(payment => {
    if (methodFilter) {
      return payment.method === methodFilter;
    }
    return true;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            完了
          </Badge>
        );
      case 'PENDING':
        return (
          <Badge className="bg-yellow-100 text-yellow-800">
            <Clock className="w-3 h-3 mr-1" />
            処理中
          </Badge>
        );
      case 'FAILED':
        return (
          <Badge className="bg-red-100 text-red-800">
            <XCircle className="w-3 h-3 mr-1" />
            失敗
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getMethodBadge = (method: string) => {
    switch (method) {
      case 'instant':
        return (
          <Badge variant="outline" className="text-orange-600">
            <Zap className="w-3 h-3 mr-1" />
            即時振込
          </Badge>
        );
      case 'scheduled':
        return (
          <Badge variant="outline" className="text-blue-600">
            <Clock className="w-3 h-3 mr-1" />
            定期振込
          </Badge>
        );
      default:
        return <Badge variant="outline">{method}</Badge>;
    }
  };

  const totalAmount = filteredHistory.reduce((sum, payment) => sum + payment.amount, 0);
  const totalFees = filteredHistory.reduce((sum, payment) => sum + payment.fee, 0);
  const totalNet = filteredHistory.reduce((sum, payment) => sum + payment.netAmount, 0);

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
      {/* 統計カード */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">支払い件数</p>
                <p className="text-2xl font-bold">{filteredHistory.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">総支払い額</p>
                <p className="text-2xl font-bold">¥{totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">総手数料</p>
                <p className="text-2xl font-bold">¥{totalFees.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">総振込額</p>
                <p className="text-2xl font-bold">¥{totalNet.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
              onClick={exportHistory}
              className="flex items-center space-x-1"
            >
              <Download className="w-4 h-4" />
              <span>エクスポート</span>
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="案件・看護師・IDを検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="ステータス" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべてのステータス</SelectItem>
                <SelectItem value="COMPLETED">完了</SelectItem>
                <SelectItem value="PENDING">処理中</SelectItem>
                <SelectItem value="FAILED">失敗</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={methodFilter} onValueChange={setMethodFilter}>
              <SelectTrigger>
                <SelectValue placeholder="支払い方法" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべての方法</SelectItem>
                <SelectItem value="instant">即時振込</SelectItem>
                <SelectItem value="scheduled">定期振込</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <SelectValue placeholder="期間" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">すべての期間</SelectItem>
                <SelectItem value="7days">過去7日</SelectItem>
                <SelectItem value="30days">過去30日</SelectItem>
                <SelectItem value="90days">過去90日</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* 支払い履歴一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>支払い履歴 ({filteredHistory.length}件)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>支払い履歴が見つかりませんでした。</p>
              </div>
            ) : (
              <>
                {filteredHistory.map((payment) => (
                  <Card key={payment.id} className="border-l-4 border-l-green-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center space-x-2">
                            <h3 className="font-medium">{payment.job.title}</h3>
                            {getStatusBadge(payment.status)}
                            {getMethodBadge(payment.method)}
                          </div>
                          
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <User className="w-4 h-4" />
                              <span>看護師: {payment.nurse.name}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Calendar className="w-4 h-4" />
                              <span>
                                実行: {formatDistanceToNow(new Date(payment.executedAt), {
                                  addSuffix: true,
                                  locale: ja
                                })}
                              </span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Eye className="w-4 h-4" />
                              <span>ID: {payment.id.substring(0, 8)}...</span>
                            </div>
                          </div>
                          
                          {payment.notes && (
                            <div className="p-2 bg-muted rounded text-sm">
                              <span className="font-medium">備考: </span>
                              {payment.notes}
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right space-y-1">
                          <div className="text-lg font-bold">
                            ¥{payment.amount.toLocaleString()}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            手数料: ¥{payment.fee.toLocaleString()}
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            振込: ¥{payment.netAmount.toLocaleString()}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
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
        </CardContent>
      </Card>
    </div>
  );
}