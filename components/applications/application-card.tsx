"use client";

import { useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ApplicationStatus } from "@prisma/client";
import type { Application } from "@/types/domain";

interface ApplicationCardProps {
  application: Application;
  onUpdate: (applicationId: string, newStatus: string) => void;
}

export function ApplicationCard({ application, onUpdate }: ApplicationCardProps) {
  const [isWithdrawing, setIsWithdrawing] = useState(false);

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

  const getStatusBadge = (status: ApplicationStatus) => {
    const statusConfig = {
      [ApplicationStatus.PENDING]: { label: "審査中", variant: "secondary" as const },
      [ApplicationStatus.ACCEPTED]: { label: "採用", variant: "default" as const },
      [ApplicationStatus.REJECTED]: { label: "不採用", variant: "destructive" as const },
      [ApplicationStatus.WITHDRAWN]: { label: "取り下げ", variant: "outline" as const },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const canWithdraw = () => {
    return application.status === ApplicationStatus.PENDING;
  };

  const handleWithdraw = async () => {
    if (!confirm("本当に応募を取り下げますか？この操作は取り消せません。")) {
      return;
    }

    try {
      setIsWithdrawing(true);

      const response = await fetch(`/api/applications/${application.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: ApplicationStatus.WITHDRAWN }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || "Failed to withdraw application");
      }

      onUpdate(application.id, ApplicationStatus.WITHDRAWN);
    } catch (error) {
      console.error("Error withdrawing application:", error);
      alert(error instanceof Error ? error.message : "応募の取り下げに失敗しました");
    } finally {
      setIsWithdrawing(false);
    }
  };

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <Link href={`/jobs/${application.jobId}`}>
              <h3 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                {application.job?.title || "求人タイトル"}
              </h3>
            </Link>
            <div className="flex items-center space-x-2 mt-2">
              {getStatusBadge(application.status)}
              <span className="text-sm text-gray-500">
                応募日: {formatDateTime(application.createdAt)}
              </span>
            </div>
          </div>
          <div className="text-right ml-4">
            {application.job?.compensation && (
              <div className="text-lg font-bold text-green-600">
                {formatCurrency(application.job.compensation.amount)}
                {application.job.compensation.type === "hourly" && "/時間"}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        {application.job && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <div className="text-sm text-gray-600 mb-1">開催日時</div>
              <div className="text-sm text-gray-900">
                {formatDateTime(application.job.startAt)} - {formatDateTime(application.job.endAt)}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-600 mb-1">開催場所</div>
              <div className="text-sm text-gray-900">
                {application.job.location.prefecture} {application.job.location.city}
              </div>
            </div>
          </div>
        )}

        <Separator className="my-4" />

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">応募メッセージ</div>
          <p className="text-sm text-gray-800 leading-relaxed line-clamp-3">
            {application.message}
          </p>
        </div>

        {application.quote && (
          <>
            <Separator className="my-4" />
            <div>
              <div className="text-sm text-gray-600 mb-2">提示見積もり</div>
              <div className="space-y-1">
                {application.quote.breakdown.map((item, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-gray-700">{item.description}</span>
                    <span className="text-gray-900">{formatCurrency(item.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold border-t pt-1">
                  <span>合計</span>
                  <span className="text-green-600">{formatCurrency(application.quote.total)}</span>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>

      <CardFooter className="pt-4 border-t">
        <div className="flex justify-between items-center w-full">
          <div className="text-xs text-gray-500">
            最終更新: {formatDateTime(application.updatedAt)}
          </div>
          <div className="flex space-x-2">
            <Link href={`/jobs/${application.jobId}`}>
              <Button variant="outline" size="sm">
                求人詳細
              </Button>
            </Link>
            {canWithdraw() && (
              <Button 
                variant="destructive" 
                size="sm"
                onClick={handleWithdraw}
                disabled={isWithdrawing}
              >
                {isWithdrawing ? "処理中..." : "取り下げ"}
              </Button>
            )}
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}