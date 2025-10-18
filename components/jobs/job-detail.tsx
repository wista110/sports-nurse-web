"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { JobApplicationForm } from "./job-application-form";
import type { Job } from "@/types/domain";
import { UserRole } from "@prisma/client";

interface JobDetailProps {
  job: Job;
}

export function JobDetail({ job }: JobDetailProps) {
  const { data: session } = useSession();
  const [showApplicationForm, setShowApplicationForm] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      weekday: "short",
    }).format(new Date(date));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "short",
    }).format(new Date(date));
  };

  const isDeadlinePassed = () => {
    return new Date(job.deadline) < new Date();
  };

  const canApply = () => {
    return (
      session?.user?.role === UserRole.NURSE &&
      !isDeadlinePassed() &&
      job.status === "OPEN"
    );
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <div>
        <Link href="/jobs">
          <Button variant="ghost" className="mb-4">
            ← 求人一覧に戻る
          </Button>
        </Link>
      </div>

      {/* Job Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <CardTitle className="text-2xl mb-3">{job.title}</CardTitle>
              <div className="flex flex-wrap gap-2 mb-4">
                {job.categories.map((category, index) => (
                  <Badge key={index} variant="secondary">
                    {category}
                  </Badge>
                ))}
                <Badge 
                  variant={job.status === "OPEN" ? "default" : "secondary"}
                  className="ml-2"
                >
                  {job.status === "OPEN" ? "募集中" : "募集終了"}
                </Badge>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600 mb-2">
                {formatCurrency(job.compensation.amount)}
                {job.compensation.type === "hourly" && "/時間"}
              </div>
              <div className={`text-sm ${isDeadlinePassed() ? "text-red-600 font-medium" : "text-gray-600"}`}>
                応募締切: {formatDate(job.deadline)}
                {isDeadlinePassed() && " (締切済み)"}
              </div>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <h4 className="font-medium text-gray-900 mb-2">開催日時</h4>
              <p className="text-gray-700">
                {formatDateTime(job.startAt)}
                <br />
                〜 {formatDateTime(job.endAt)}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">開催場所</h4>
              <p className="text-gray-700">
                {job.location.prefecture} {job.location.city}
                <br />
                {job.location.venue}
                {job.location.address && (
                  <>
                    <br />
                    {job.location.address}
                  </>
                )}
              </p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">募集人数</h4>
              <p className="text-gray-700">{job.headcount}名</p>
            </div>
            <div>
              <h4 className="font-medium text-gray-900 mb-2">報酬</h4>
              <p className="text-gray-700">
                {formatCurrency(job.compensation.amount)}
                {job.compensation.type === "hourly" ? "/時間" : " (固定額)"}
              </p>
            </div>
          </div>

          <Separator className="my-6" />

          <div>
            <h4 className="font-medium text-gray-900 mb-3">募集内容</h4>
            <div className="prose prose-sm max-w-none">
              <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                {job.description}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Application Section */}
      <Card id="apply">
        <CardHeader>
          <CardTitle>応募について</CardTitle>
        </CardHeader>
        <CardContent>
          {!session ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">応募するにはログインが必要です</p>
              <Link href="/auth/signin">
                <Button>ログイン</Button>
              </Link>
            </div>
          ) : session.user.role !== UserRole.NURSE ? (
            <div className="text-center py-8">
              <p className="text-gray-600">看護師アカウントでのみ応募できます</p>
            </div>
          ) : isDeadlinePassed() ? (
            <div className="text-center py-8">
              <p className="text-red-600 font-medium">応募締切を過ぎています</p>
            </div>
          ) : job.status !== "OPEN" ? (
            <div className="text-center py-8">
              <p className="text-gray-600">この求人は現在募集を停止しています</p>
            </div>
          ) : showApplicationForm ? (
            <JobApplicationForm 
              job={job} 
              onCancel={() => setShowApplicationForm(false)}
              onSuccess={() => {
                setShowApplicationForm(false);
                // Could show success message or redirect
              }}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">
                この求人に応募しますか？メッセージや見積もりを添えて応募できます。
              </p>
              <Button onClick={() => setShowApplicationForm(true)}>
                応募する
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}