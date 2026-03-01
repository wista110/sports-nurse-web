import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { ReviewForm } from '@/components/reviews/review-form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarDays, MapPin, Users } from 'lucide-react';

interface ReviewPageProps {
  params: {
    jobId: string;
  };
}

async function getJobDetails(jobId: string, userId: string) {
  const job = await prisma.job.findUnique({
    where: { id: jobId },
    include: {
      organizer: {
        include: { profile: true }
      },
      applications: {
        where: { status: 'ACCEPTED' },
        include: {
          nurse: {
            include: { profile: true }
          }
        }
      },
      reviews: {
        where: {
          OR: [
            { authorId: userId },
            { targetId: userId }
          ]
        }
      }
    }
  });

  if (!job) {
    return null;
  }

  // ユーザーがこの案件に関与しているかチェック
  const isOrganizer = job.organizer.id === userId;
  const acceptedApplication = job.applications.find(app => app.nurse.id === userId);
  const isNurse = !!acceptedApplication;

  if (!isOrganizer && !isNurse) {
    return null;
  }

  return {
    job,
    isOrganizer,
    isNurse,
    acceptedApplication
  };
}

export default async function ReviewPage({ params }: ReviewPageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/auth/signin');
  }

  const jobDetails = await getJobDetails(params.jobId, session.user.id);
  
  if (!jobDetails) {
    notFound();
  }

  const { job, isOrganizer, isNurse, acceptedApplication } = jobDetails;

  // 案件が完了状態でない場合はリダイレクト
  if (job.status !== 'REVIEW_PENDING' && job.status !== 'COMPLETED') {
    redirect(`/jobs/${job.id}`);
  }

  // レビュー対象を決定
  let targetUser = null;
  let targetRole: 'NURSE' | 'ORGANIZER' | null = null;

  if (isOrganizer && acceptedApplication) {
    // 依頼者 → 看護師へのレビュー
    targetUser = acceptedApplication.nurse;
    targetRole = 'NURSE';
  } else if (isNurse) {
    // 看護師 → 依頼者へのレビュー
    targetUser = job.organizer;
    targetRole = 'ORGANIZER';
  }

  if (!targetUser || !targetRole) {
    notFound();
  }

  // 既にレビュー済みかチェック
  const existingReview = job.reviews.find(
    review => review.authorId === session.user.id && review.targetId === targetUser.id
  );

  if (existingReview) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle>レビュー完了</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              この案件のレビューは既に完了しています。
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

        {/* レビューフォーム */}
        <Suspense fallback={<div>読み込み中...</div>}>
          <ReviewForm
            jobId={job.id}
            targetId={targetUser.id}
            targetName={targetUser.profile?.name || '名前未設定'}
            targetRole={targetRole}
            onSuccess={() => {
              // レビュー完了後の処理
            }}
          />
        </Suspense>
      </div>
    </div>
  );
}