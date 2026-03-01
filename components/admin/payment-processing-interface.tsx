'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  Clock, 
  Zap, 
  Calendar, 
  User, 
  Building, 
  CheckCircle, 
  AlertCircle,
  Search,
  Filter
} from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { ja } from 'date-fns/locale';

interface PayableJob {
  id: string;
  title: string;
  amount: number;
  nurseId: string;
  nurseName: string;
  organizerId: string;
  organizerName: string;
  completedAt: Date;
  reviewsCompleted: boolean;
}

interface PaymentProcessingInterfaceProps {
  className?: string;
}

export function PaymentProcessingInterface({ className }: PaymentProcessingInterfaceProps) {
  const [payableJobs, setPayableJobs] = useState<PayableJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState<string>('completedAt');
  const [selectedJobs, setSelectedJobs] = useState<Set<string>>(new Set());
  const [batchPaymentMethod, setBatchPaymentMethod] = useState<'instant' | 'scheduled'>('scheduled');
  const [batchNotes, setBatchNotes] = useState('');
  const [showBatchPanel, setShowBatchPanel] = useState(false);

  const loadPayableJobs = async () => {
    try {
      const response = await fetch('/api/admin/payments');
      
      if (!response.ok) {
        throw new Error('支払い可能案件の取得に失敗しました');
      }

      const data = await response.json();
      setPayableJobs(data.data || []);
    } catch (error) {
      console.error('Error loading payable jobs:', error);
      toast.error('支払い可能案件の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPayableJobs();
  }, []);

  const executePayment = async (jobId: string, paymentMethod: 'instant' | 'scheduled', notes?: string) => {
    setProcessing(prev => new Set([...prev, jobId]));

    try {
      const response = await fetch('/api/admin/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jobId,
          paymentMethod,
          notes
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || '支払い処理に失敗しました');
      }

      toast.success('支払い処理が完了しました');
      
      // リストから削除
      setPayableJobs(prev => prev.filter(job => job.id !== jobId));
      setSelectedJobs(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    } catch (error) {
      console.error('Payment execution error:', error);
      toast.error(error instanceof Error ? error.message : '支払い処理に失敗しました');
    } finally {
      setProcessing(prev => {
        const newSet = new Set(prev);
        newSet.delete(jobId);
        return newSet;
      });
    }
  };

  const executeBatchPayment = async () => {
    if (selectedJobs.size === 0) {
      toast.error('支払い対象の案件を選択してください');
      return;
    }

    const jobIds = Array.from(selectedJobs);
    let successCount = 0;
    let failureCount = 0;

    for (const jobId of jobIds) {
      try {
        await executePayment(jobId, batchPaymentMethod, batchNotes);
        successCount++;
      } catch (error) {
        failureCount++;
      }
    }

    if (successCount > 0) {
      toast.success(`${successCount}件の支払い処理が完了しました`);
    }
    if (failureCount > 0) {
      toast.error(`${failureCount}件の支払い処理に失敗しました`);
    }

    setSelectedJobs(new Set());
    setBatchNotes('');
    setShowBatchPanel(false);
  };

  const handleJobSelect = (jobId: string, selected: boolean) => {
    const newSelected = new Set(selectedJobs);
    if (selected) {
      newSelected.add(jobId);
    } else {
      newSelected.delete(jobId);
    }
    setSelectedJobs(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedJobs.size === filteredJobs.length) {
      setSelectedJobs(new Set());
    } else {
      setSelectedJobs(new Set(filteredJobs.map(job => job.id)));
    }
  };

  const filteredJobs = payableJobs
    .filter(job => {
      if (searchTerm) {
        const searchLower = searchTerm.toLowerCase();
        return (
          job.title.toLowerCase().includes(searchLower) ||
          job.nurseName.toLowerCase().includes(searchLower) ||
          job.organizerName.toLowerCase().includes(searchLower)
        );
      }
      return true;
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'amount':
          return b.amount - a.amount;
        case 'nurseName':
          return a.nurseName.localeCompare(b.nurseName);
        case 'organizerName':
          return a.organizerName.localeCompare(b.organizerName);
        case 'completedAt':
        default:
          return new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime();
      }
    });

  const totalAmount = filteredJobs.reduce((sum, job) => sum + job.amount, 0);
  const selectedAmount = Array.from(selectedJobs)
    .map(jobId => payableJobs.find(job => job.id === jobId)?.amount || 0)
    .reduce((sum, amount) => sum + amount, 0);

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
                <p className="text-sm text-muted-foreground">支払い待ち件数</p>
                <p className="text-2xl font-bold">{payableJobs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-blue-500" />
              <div>
                <p className="text-sm text-muted-foreground">総支払い金額</p>
                <p className="text-2xl font-bold">¥{totalAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">選択中</p>
                <p className="text-2xl font-bold">{selectedJobs.size}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">選択金額</p>
                <p className="text-2xl font-bold">¥{selectedAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* フィルター・検索 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="w-5 h-5" />
            <span>フィルター・操作</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="案件・看護師・依頼者を検索..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue placeholder="並び替え" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="completedAt">完了日時</SelectItem>
                <SelectItem value="amount">金額</SelectItem>
                <SelectItem value="nurseName">看護師名</SelectItem>
                <SelectItem value="organizerName">依頼者名</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={handleSelectAll}
            >
              {selectedJobs.size === filteredJobs.length ? '全選択解除' : '全選択'}
            </Button>

            <Button
              onClick={() => setShowBatchPanel(!showBatchPanel)}
              disabled={selectedJobs.size === 0}
              className="flex items-center space-x-1"
            >
              <DollarSign className="w-4 h-4" />
              <span>一括支払い ({selectedJobs.size})</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 一括支払いパネル */}
      {showBatchPanel && selectedJobs.size > 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-blue-800">
              一括支払い処理 ({selectedJobs.size}件選択中)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-blue-800">支払い方法</label>
                <Select value={batchPaymentMethod} onValueChange={(value: 'instant' | 'scheduled') => setBatchPaymentMethod(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="scheduled">
                      <div className="flex items-center space-x-2">
                        <Clock className="w-4 h-4" />
                        <span>定期振込（翌月15日・低手数料）</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="instant">
                      <div className="flex items-center space-x-2">
                        <Zap className="w-4 h-4" />
                        <span>即時振込（高手数料）</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="text-sm font-medium text-blue-800">選択金額</label>
                <div className="text-2xl font-bold text-blue-800">
                  ¥{selectedAmount.toLocaleString()}
                </div>
              </div>
            </div>
            
            <div>
              <label className="text-sm font-medium text-blue-800">備考</label>
              <Textarea
                placeholder="支払い処理に関する備考があれば入力してください"
                value={batchNotes}
                onChange={(e) => setBatchNotes(e.target.value)}
                rows={2}
              />
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setShowBatchPanel(false)}
              >
                キャンセル
              </Button>
              <Button
                onClick={executeBatchPayment}
                className="flex items-center space-x-1"
              >
                <DollarSign className="w-4 h-4" />
                <span>一括支払い実行</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 支払い待ち案件一覧 */}
      <Card>
        <CardHeader>
          <CardTitle>支払い待ち案件一覧 ({filteredJobs.length}件)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredJobs.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <DollarSign className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>支払い待ちの案件はありません。</p>
              </div>
            ) : (
              filteredJobs.map((job) => {
                const isSelected = selectedJobs.has(job.id);
                const isProcessing = processing.has(job.id);
                
                return (
                  <Card
                    key={job.id}
                    className={`cursor-pointer transition-colors ${
                      isSelected ? 'ring-2 ring-primary bg-primary/5' : ''
                    }`}
                    onClick={() => handleJobSelect(job.id, !isSelected)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3 flex-1">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={(e) => handleJobSelect(job.id, e.target.checked)}
                            onClick={(e) => e.stopPropagation()}
                            className="mt-1 rounded"
                          />
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium">{job.title}</h3>
                              <Badge variant="outline" className="text-xs">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                レビュー完了
                              </Badge>
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center space-x-1">
                                <User className="w-4 h-4" />
                                <span>看護師: {job.nurseName}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Building className="w-4 h-4" />
                                <span>依頼者: {job.organizerName}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <Calendar className="w-4 h-4" />
                                <span>
                                  完了: {formatDistanceToNow(new Date(job.completedAt), {
                                    addSuffix: true,
                                    locale: ja
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right space-y-2">
                          <div className="text-2xl font-bold text-green-600">
                            ¥{job.amount.toLocaleString()}
                          </div>
                          
                          <div className="flex space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={(e) => {
                                e.stopPropagation();
                                executePayment(job.id, 'scheduled');
                              }}
                              disabled={isProcessing}
                              className="flex items-center space-x-1"
                            >
                              <Clock className="w-3 h-3" />
                              <span>定期</span>
                            </Button>
                            
                            <Button
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                executePayment(job.id, 'instant');
                              }}
                              disabled={isProcessing}
                              className="flex items-center space-x-1"
                            >
                              <Zap className="w-3 h-3" />
                              <span>即時</span>
                            </Button>
                          </div>
                          
                          {isProcessing && (
                            <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                              <AlertCircle className="w-3 h-3 animate-spin" />
                              <span>処理中...</span>
                            </div>
                          )}
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