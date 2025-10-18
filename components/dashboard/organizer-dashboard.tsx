"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Eye, Edit, Trash2 } from "lucide-react";
import type { Job } from "@/types/domain";
import { JobStatus } from "@prisma/client";

export function OrganizerDashboard() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/organizer/jobs");
      
      if (!response.ok) {
        throw new Error("Failed to fetch jobs");
      }

      const result = await response.json();
      
      if (result.success && result.data) {
        setJobs(result.data);
      } else {
        throw new Error(result.error || "Failed to fetch jobs");
      }
    } catch (err) {
      console.error("Error fetching jobs:", err);
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
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

  const getStatusBadge = (status: JobStatus) => {
    const statusConfig = {
      [JobStatus.DRAFT]: { label: "下書き", variant: "secondary" as const },
      [JobStatus.OPEN]: { label: "募集中", variant: "default" as const },
      [JobStatus.APPLIED]: { label: "応募あり", variant: "default" as const },
      [JobStatus.CONTRACTED]: { label: "契約済み", variant: "default" as const },
      [JobStatus.ESCROW_HOLDING]: { label: "エスクロー", variant: "default" as const },
      [JobStatus.IN_PROGRESS]: { label: "進行中", variant: "default" as const },
      [JobStatus.REVIEW_PENDING]: { label: "評価待ち", variant: "secondary" as const },
      [JobStatus.READY_TO_PAY]: { label: "支払い準備", variant: "secondary" as const },
      [JobStatus.PAID]: { label: "完了", variant: "outline" as const },
      [JobStatus.CANCELLED]: { label: "キャンセル", variant: "destructive" as const },
    };

    const config = statusConfig[status];
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const handlePublishJob = async (jobId: string) => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/publish`, {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error("Failed to publish job");
      }

      // Refresh jobs list
      fetchJobs();
    } catch (error) {
      console.error("Error publishing job:", error);
      alert("求人の公開に失敗しました");
    }
  };

  const handleDeleteJob = async (jobId: string, jobTitle: string) => {
    if (!confirm(`「${jobTitle}」を削除しますか？この操作は取り消せません。`)) {
      return;
    }

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete job");
      }

      // Refresh jobs list
      fetchJobs();
    } catch (error) {
      console.error("Error deleting job:", error);
      alert("求人の削除に失敗しました");
    }
  };

  const getJobStats = () => {
    const stats = {
      total: jobs.length,
      draft: jobs.filter(j => j.status === JobStatus.DRAFT).length,
      open: jobs.filter(j => j.status === JobStatus.OPEN).length,
      active: jobs.filter(j => [JobStatus.APPLIED, JobStatus.CONTRACTED, JobStatus.IN_PROGRESS].includes(j.status)).length,
      completed: jobs.filter(j => j.status === JobStatus.PAID).length,
    };
    return stats;
  };

  const stats = getJobStats();

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
          <h1 className="text-3xl font-bold text-gray-900">求人管理</h1>
          <p className="text-gray-600 mt-2">あなたの求人を管理できます</p>
        </div>
        <div className="flex space-x-2">
          <Link href="/inbox">
            <Button variant="outline">
              <Plus className="h-4 w-4 mr-2" />
              メッセージ
            </Button>
          </Link>
          <Link href="/jobs/new">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              新しい求人を作成
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
            <div className="text-sm text-gray-600">総求人数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-blue-600">{stats.open}</div>
            <div className="text-sm text-gray-600">募集中</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <div className="text-sm text-gray-600">進行中</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold text-gray-600">{stats.completed}</div>
            <div className="text-sm text-gray-600">完了</div>
          </CardContent>
        </Card>
      </div>

      {/* Jobs List */}
      <Card>
        <CardHeader>
          <CardTitle>求人一覧</CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={fetchJobs}>再試行</Button>
            </div>
          ) : jobs.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">まだ求人を作成していません</p>
              <Link href="/jobs/new">
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  最初の求人を作成
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {jobs.map((job) => (
                <div key={job.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                        {getStatusBadge(job.status)}
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>開催日: {formatDate(job.startAt)}</p>
                        <p>場所: {job.location.prefecture} {job.location.city}</p>
                        <p>報酬: {formatCurrency(job.compensation.amount)}{job.compensation.type === "hourly" && "/時間"}</p>
                        <p>締切: {formatDate(job.deadline)}</p>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <Link href={`/jobs/${job.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </Link>
                      {job.status === JobStatus.DRAFT && (
                        <>
                          <Link href={`/jobs/${job.id}/edit`}>
                            <Button variant="outline" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={() => handlePublishJob(job.id)}
                          >
                            公開
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleDeleteJob(job.id, job.title)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {[JobStatus.OPEN, JobStatus.APPLIED].includes(job.status) && (
                        <Link href={`/jobs/${job.id}/applications`}>
                          <Button variant="default" size="sm">
                            応募者
                          </Button>
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}