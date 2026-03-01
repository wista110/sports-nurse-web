import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { NurseActivityReportForm } from '@/components/reports/nurse-activity-report-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users } from 'lucide-react';

interface NurseActivityReportPageProps {
  params: {
    jobId: string;
  };
}

async function getJobDetails(jobId: string, nurseId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      applications: {
        where: { 
          nurseId,
          status: 'ACCEPTED'
        }
      }
    }
  });

  if (!job || job.applications.length === 0) {
    return null;
  }

  return job;
}

export default async function NurseActivityReportPage({ params }: NurseActivityReportPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  if (session.user.role !== 'NURSE') {
    redirect('/dashboard');
  }

  const job = await getJobDetails(params.jobId, session.user.id);
  
  if (!job) {
    notFound();
  }

  // 案件が完了状態でない場合はリダイレクト
  if (job.status !== 'REVIEW_PENDING' && job.status !== 'COMPLETED') {
    redirect(`/jobs/${job.id}`);
  }

  // 既に活動報告が提出済みかチェック
  const existingReport = (job.metadata as any)?.nurseActivityReport;

  if (existingReport) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>活動報告完了</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              この案件の活動報告は既に提出済みです。
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="space-y-6">
        {/* 案件情報 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <span>案件情報</span>
              <Badge variant="secondary">{job.status === 'COMPLETED' ? '完了' : 'レビュー待ち'}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h3 className="text-lg font-medium">{job.title}</h3>
              
              <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                <div className="flex items-center space-x-1">
                  <CalendarDays className="w-4 h-4" />
                  <span>
                    {new Date(job.startAt).toLocaleDateString('ja-JP')} {' '}
                    {new Date(job.startAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} - {' '}
                    {new Date(job.endAt).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {job.location.prefecture} {job.location.city} {job.location.venue}
                  </span>
                </div>
                
                <div className="flex items-center space-x-1">
                  <Users className="w-4 h-4" />
                  <span>{job.headcount}名</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 活動報告フォーム */}
        <Suspense fallback={<div>読み込み中...</div>}>
          <NurseActivityReportForm
            jobId={job.id}
            jobTitle={job.title}
            onSuccess={() => {
              // 報告完了後の処理
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}