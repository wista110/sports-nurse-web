import { Suspense } from 'react';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ReviewModeration } from '@/components/admin/review-moderation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Shield, AlertTriangle, Eye, Flag } from 'lucide-react';

export default async function AdminReviewsPage() {
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
            <h1 className="text-3xl font-bold">レビュー管理</h1>
            <p className="text-muted-foreground">
              プラットフォーム上のレビューを監視・管理します
            </p>
          </div>
          <Badge variant="secondary" className="flex items-center space-x-1">
            <Shield className="w-4 h-4" />
            <span>管理者</span>
          </Badge>
        </div>

        {/* 統計カード */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Eye className="w-5 h-5 text-blue-500" />
                <div>
                  <p className="text-sm text-muted-foreground">総レビュー数</p>
                  <p className="text-2xl font-bold">1,234</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <AlertTriangle className="w-5 h-5 text-orange-500" />
                <div>
                  <p className="text-sm text-muted-foreground">要確認</p>
                  <p className="text-2xl font-bold">23</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Flag className="w-5 h-5 text-red-500" />
                <div>
                  <p className="text-sm text-muted-foreground">フラグ済み</p>
                  <p className="text-2xl font-bold">5</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Shield className="w-5 h-5 text-green-500" />
                <div>
                  <p className="text-sm text-muted-foreground">平均評価</p>
                  <p className="text-2xl font-bold">4.2</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* モデレーション機能 */}
        <Suspense fallback={
          <Card>
            <CardContent className="p-8 text-center">
              <p>読み込み中...</p>
            </CardContent>
          </Card>
        }>
          <ReviewModeration />
        </Suspense>
      </div>
    </div>
  );
}