import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { PaymentProcessingInterface } from '@/components/admin/payment-processing-interface';
import { PaymentHistoryInterface } from '@/components/admin/payment-history-interface';
import { PaymentReports } from '@/components/admin/payment-reports';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DollarSign, Clock, Zap, History, Shield, TrendingUp } from 'lucide-react';

export default async function AdminPaymentsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* ヘッダー */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">支払い管理</h1>
            <p className="text-muted-foreground">
              看護師への支払い処理と履歴を管理します
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Shield className="w-4 h-4" />
            <span>管理者</span>
          </Badge>
        </div>

        {/* 概要カード */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">支払い処理</p>
                  <p className="text-lg font-medium">完了済み案件の支払い実行</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Zap className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">即時振込</p>
                  <p className="text-lg font-medium">高手数料・即座に振込</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Clock className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">定期振込</p>
                  <p className="text-lg font-medium">低手数料・翌月15日</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* タブ */}
        <Tabs defaultValue="processing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="processing" className="flex items-center space-x-2">
              <DollarSign className="w-4 h-4" />
              <span>支払い処理</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center space-x-2">
              <History className="w-4 h-4" />
              <span>支払い履歴</span>
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center space-x-2">
              <TrendingUp className="w-4 h-4" />
              <span>レポート</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="processing">
            <Suspense fallback={
              <Card>
                <CardContent className="p-8 text-center">
                  <p>読み込み中...</p>
                </CardContent>
              </Card>
            }>
              <PaymentProcessingInterface />
            </Suspense>
          </TabsContent>

          <TabsContent value="history">
            <Suspense fallback={
              <Card>
                <CardContent className="p-8 text-center">
                  <p>読み込み中...</p>
                </CardContent>
              </Card>
            }>
              <PaymentHistoryInterface />
            </Suspense>
          <TabsContent value="reports">
            <Suspense fallback={
              <Card>
                <CardContent className="p-8 text-center">
                  <p>読み込み中...</p>
                </CardContent>
              </Card>
            }>
              <PaymentReports />
            </Suspense>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}