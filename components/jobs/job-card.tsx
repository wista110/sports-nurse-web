"use client";

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import type { Job } from "@/types/domain";

interface JobCardProps {
  job: Job;
}

export function JobCard({ job }: JobCardProps) {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(date));
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
    }).format(new Date(date));
  };

  const isDeadlineSoon = () => {
    const deadline = new Date(job.deadline);
    const now = new Date();
    const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    return diffDays <= 3;
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Link href={`/jobs/${job.id}`}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                {job.title}
              </h3>
            </Link>
            <div className="flex flex-wrap gap-2 mt-2">
              {job.categories.map((category, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-right ml-4">
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(job.compensation.amount)}
              {job.compensation.type === "hourly" && "/時間"}
            </div>
            <div className={`text-sm ${isDeadlineSoon() ? "text-red-600 font-medium" : "text-gray-500"}`}>
              締切: {formatDate(job.deadline)}
              {isDeadlineSoon() && " ⚠️"}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <div className="text-sm text-gray-600 mb-1">開催日時</div>
            <div className="text-sm text-gray-900">
              {formatDateTime(job.startAt)} - {formatDateTime(job.endAt)}
            </div>
          </div>
          <div>
            <div className="text-sm text-gray-600 mb-1">開催場所</div>
            <div className="text-sm text-gray-900">
              {job.location.prefecture} {job.location.city}
            </div>
            <div className="text-sm text-gray-700">
              {job.location.venue}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-1">募集人数</div>
          <div className="text-sm text-gray-900">{job.headcount}名</div>
        </div>

        <div>
          <p className="text-sm text-gray-800 leading-relaxed line-clamp-2">
            {job.description}
          </p>
        </div>
      </CardContent>

      <CardFooter className="pt-4 border-t">
        <div className="flex justify-between items-center w-full">
          <div className="text-xs text-gray-500">
            投稿日: {formatDate(job.createdAt)}
          </div>
          <div className="flex space-x-2">
            <Link href={`/jobs/${job.id}`}>
              <Button variant="outline" size="sm">
                詳細を見る
              </Button>
            </Link>
            <Link href={`/jobs/${job.id}#apply`}>
              <Button size="sm">
                応募する
              </Button>
            </Link>
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}