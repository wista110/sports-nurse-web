"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FileText } from "lucide-react";
import type { Application } from "@/types/domain";
import { ApplicationStatus } from "@prisma/client";

export function NurseDashboard() {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/applications");
      
      if (!response.ok) {
        throw new Error("Failed to fetch applications");
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setApplications(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch applications");
      }
    } catch (err) {
      console.error("Error fetching applications:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("ja-JP", {
      style: "currency",
      currency: "JPY",
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("ja-JP", {
      year: "numeric",
      month: "short",
      day: "numeric",
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

  const getApplicationStats = () => {
    const stats = {
      total: applications.length,
      pending: applications.filter(a => a.status === ApplicationStatus.PENDING).length,
      accepted: applications.filter(a => a.status === ApplicationStatus.ACCEPTED).length,
      rejected: applications.filter(a => a.status === ApplicationStatus.REJECTED).length,
    };
    return stats;
  };

  const stats = getApplicationStats();
  const recentApplications = applications.slice(0, 5);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ダッシュボード</h1>
          <p className="text-gray-600 mt-2">応募状況と求人情報を確認できます</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/jobs">
            <Button variant="outline">
              <Search className="h-4 w-4 mr-2" />
              求人を探す
            </Button>
          </Link>
          <Link href="/inbox">
            <Button variant="outline">
              <FileText className="h-4 w-4 mr-2" />
              メッセージ
            </Button>
          </Link>
          <Link href="/applications">
            <Button>
              <FileText className="h-4 w-4 mr-2" />
              応募履歴
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">総応募数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
            <div className="text-sm text-gray-600">審査中</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{stats.accepted}</div>
            <div className="text-sm text-gray-600">採用</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-red-600">{stats.rejected}</div>
            <div className="text-sm text-gray-600">不採用</div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Applications */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>最近の応募</CardTitle>
            <Link href="/applications">
              <Button variant="outline" size="sm">すべて見る</Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchApplications}>再試行</Button>
            </div>
          ) : recentApplications.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">まだ応募していません</p>
              <Link href="/jobs">
                <Button>
                  <Search className="h-4 w-4 mr-2" />
                  求人を探す
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {recentApplications.map((application) => (
                <div key={application.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {application.job?.title || "求人タイトル"}
                        </h3>
                        {getStatusBadge(application.status)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        {application.job && (
                          <>
                            <p>開催日: {formatDate(application.job.startAt)}</p>
                            <p>場所: {application.job.location.prefecture} {application.job.location.city}</p>
                            <p>報酬: {formatCurrency(application.job.compensation.amount)}{application.job.compensation.type === "hourly" && "/時間"}</p>
                          </>
                        )}
                        <p>応募日: {formatDate(application.createdAt)}</p>
                      </div>
                    </div>
                    <div className="ml-4">
                      <Link href={`/jobs/${application.jobId}`}>
                        <Button variant="outline" size="sm">
                          詳細を見る
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">求人を探す</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              新しいスポーツイベントでの看護師求人を探して応募しましょう。
            </p>
            <Link href="/jobs">
              <Button className="w-full">
                <Search className="h-4 w-4 mr-2" />
                求人一覧を見る
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">プロフィール</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              プロフィールを充実させて、より多くの求人にマッチしましょう。
            </p>
            <Link href="/profile/edit">
              <Button variant="outline" className="w-full">
                プロフィールを編集
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}