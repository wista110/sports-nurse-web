import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';
import { authOptions } from '@/lib/auth';
import { SecurityDashboard } from '@/components/admin/security-dashboard';
import { AuditLogInterface } from '@/components/admin/audit-log-interface';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, FileText } from 'lucide-react';

export const metadata: Metadata = {
  title: 'セキュリティ管理 | Sports Nurse',
  description: 'セキュリティダッシュボードと監査ログの管理',
};

export default async function SecurityPage() {
  const session = await getServerSession(authOptions);

  // 管理者のみアクセス可能
  if (!session?.user || session.user.role !== 'ADMIN') {
    redirect('/dashboard');
  }

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center space-x-2">
        <Shield className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-3xl font-bold">セキュリティ管理</h1>
          <p className="text-muted-foreground">
            システムのセキュリティ状況と監査ログを管理します
          </p>
        </div>
      </div>

      <Tabs defaultValue="dashboard" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="dashboard" className="flex items-center space-x-2">
            <Shield className="w-4 h-4" />
            <span>セキュリティダッシュボード</span>
          </TabsTrigger>
          <TabsTrigger value="audit-logs" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>監査ログ</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>セキュリティ概要</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                システム全体のセキュリティ状況をリアルタイムで監視します。
                不審なアクティビティや重要なセキュリティイベントを確認できます。
              </p>
            </CardContent>
          </Card>
          
          <SecurityDashboard />
        </TabsContent>

        <TabsContent value="audit-logs" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>監査ログ管理</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                システム内で実行されたすべての重要な操作を記録・管理します。
                フィルタリングや検索機能を使用して特定のイベントを確認できます。
              </p>
            </CardContent>
          </Card>
          
          <AuditLogInterface />
        </TabsContent>
      </Tabs>
    </div>
  );
}