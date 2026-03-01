'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from 'recharts';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  Download,
  Users,
  Building,
  Clock,
  Zap
} from 'lucide-react';
import { toast } from 'sonner';

interface PaymentReportsProps {
  className?: string;
}

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  totalFees: number;
  averageAmount: number;
  instantPayments: number;
  scheduledPayments: number;
  monthlyData: Array<{
    month: string;
    amount: number;
    count: number;
    fees: number;
  }>;
  methodDistribution: Array<{
    method: string;
    count: number;
    amount: number;
  }>;
  topNurses: Array<{
    nurseId: string;
    nurseName: string;
    totalAmount: number;
    paymentCount: number;
  }>;
  topOrganizers: Array<{
    organizerId: string;
    organizerName: string;
    totalAmount: number;
    jobCount: number;
  }>;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export function PaymentReports({ className }: PaymentReportsProps) {
  const [stats, setStats] = useState<PaymentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<string>('6months');

  const loadPaymentStats = async () => {
    try {
      // モックデータ（実際の実装では API から取得）
      const mockStats: PaymentStats = {
        totalPayments: 156,
        totalAmount: 2340000,
        totalFees: 234000,
        averageAmount: 15000,
        instantPayments: 45,
        scheduledPayments: 111,
        monthlyData: [
          { month: '2024-08', amount: 380000, count: 25, fees: 38000 },
          { month: '2024-09', amount: 420000, count: 28, fees: 42000 },
          { month: '2024-10', amount: 390000, count: 26, fees: 39000 },
          { month: '2024-11', amount: 450000, count: 30, fees: 45000 },
          { month: '2024-12', amount: 480000, count: 32, fees: 48000 },
          { month: '2025-01', amount: 220000, count: 15, fees: 22000 }
        ],
        methodDistribution: [
          { method: '定期振込', count: 111, amount: 1665000 },
          { method: '即時振込', count: 45, amount: 675000 }
        ],
        topNurses: [
          { nurseId: '1', nurseName: '田中花子', totalAmount: 180000, paymentCount: 12 },
          { nurseId: '2', nurseName: '佐藤太郎', totalAmount: 165000, paymentCount: 11 },
          { nurseId: '3', nurseName: '鈴木美咲', totalAmount: 150000, paymentCount: 10 },
          { nurseId: '4', nurseName: '高橋健一', totalAmount: 135000, paymentCount: 9 },
          { nurseId: '5', nurseName: '渡辺由美', totalAmount: 120000, paymentCount: 8 }
        ],
        topOrganizers: [
          { organizerId: '1', organizerName: '東京スポーツクラブ', totalAmount: 450000, jobCount: 30 },
          { organizerId: '2', organizerName: '横浜マラソン協会', totalAmount: 380000, jobCount: 25 },
          { organizerId: '3', organizerName: '大阪サッカー連盟', totalAmount: 320000, jobCount: 22 },
          { organizerId: '4', organizerName: '名古屋バスケ協会', totalAmount: 280000, jobCount: 18 },
          { organizerId: '5', organizerName: '福岡テニス連盟', totalAmount: 240000, jobCount: 16 }
        ]
      };

      setStats(mockStats);
    } catch (error) {
      console.error('Error loading payment stats:', error);
      toast.error('統計データの読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPaymentStats();
  }, [period]);

  const exportReport = async () => {
    try {
      // 実際の実装では、レポートのエクスポート機能を実装
      toast.info('レポートエクスポート機能は開発中です');
    } catch (error) {
      toast.error('レポートのエクスポートに失敗しました');
    }
  };

  if (loading || !stats) {
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

  return (
    <div className={`space-y-6 ${className}`}>
      {/* ヘッダー */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>支払いレポート</span>
            </CardTitle>
            <div className="flex items-center space-x-2">
              <Select value={period} onValueChange={setPeriod}>
                <SelectTrigger className="w-32">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3months">過去3ヶ月</SelectItem>
                  <SelectItem value="6months">過去6ヶ月</SelectItem>
                  <SelectItem value="12months">過去12ヶ月</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={exportReport}
                className="flex items-center space-x-1"
              >
                <Download className="w-4 h-4" />
                <span>エクスポート</span>
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* 統計サマリー */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">総支払い件数</p>
                <p className="text-2xl font-bold">{stats.totalPayments}</p>
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
                <p className="text-2xl font-bold">¥{stats.totalAmount.toLocaleString()}</p>
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
                <p className="text-2xl font-bold">¥{stats.totalFees.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2">
              <DollarSign className="w-5 h-5 text-purple-500" />
              <div>
                <p className="text-sm text-muted-foreground">平均支払い額</p>
                <p className="text-2xl font-bold">¥{stats.averageAmount.toLocaleString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* チャート */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 月別支払い推移 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>月別支払い推移</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'amount' ? `¥${Number(value).toLocaleString()}` : value,
                    name === 'amount' ? '支払い金額' : '件数'
                  ]}
                />
                <Line 
                  type="monotone" 
                  dataKey="amount" 
                  stroke="#8884d8" 
                  strokeWidth={2}
                  name="amount"
                />
                <Line 
                  type="monotone" 
                  dataKey="count" 
                  stroke="#82ca9d" 
                  strokeWidth={2}
                  name="count"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 支払い方法分布 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Zap className="w-5 h-5" />
              <span>支払い方法分布</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={stats.methodDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ method, count }) => `${method}: ${count}件`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {stats.methodDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4 text-blue-500" />
                  <span className="text-sm">定期振込</span>
                </div>
                <Badge variant="outline">{stats.scheduledPayments}件</Badge>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-4 h-4 text-orange-500" />
                  <span className="text-sm">即時振込</span>
                </div>
                <Badge variant="outline">{stats.instantPayments}件</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ランキング */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 看護師ランキング */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>看護師別支払いランキング</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topNurses.map((nurse, index) => (
                <div key={nurse.nurseId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{nurse.nurseName}</p>
                      <p className="text-sm text-muted-foreground">{nurse.paymentCount}件</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">¥{nurse.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* 依頼者ランキング */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Building className="w-5 h-5" />
              <span>依頼者別案件ランキング</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.topOrganizers.map((organizer, index) => (
                <div key={organizer.organizerId} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline" className="w-8 h-8 rounded-full flex items-center justify-center">
                      {index + 1}
                    </Badge>
                    <div>
                      <p className="font-medium">{organizer.organizerName}</p>
                      <p className="text-sm text-muted-foreground">{organizer.jobCount}案件</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold">¥{organizer.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}