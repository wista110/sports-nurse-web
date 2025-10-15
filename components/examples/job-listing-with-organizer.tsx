"use client";

import React from "react";
import { OrganizerPublicProfile } from "@/components/profile/organizer-public-profile";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { UserProfile } from "@/types/domain";

// Example component showing how organizer profiles would be displayed in job listings
interface JobListingWithOrganizerProps {
  job: {
    id: string;
    title: string;
    description: string;
    categories: string[];
    location: {
      prefecture: string;
      city: string;
      venue: string;
    };
    startAt: Date;
    endAt: Date;
    compensation: {
      type: "hourly" | "fixed";
      amount: number;
      currency: "JPY";
    };
    deadline: Date;
  };
  organizer: {
    id: string;
    profile: UserProfile;
  };
}

export function JobListingWithOrganizer({ job, organizer }: JobListingWithOrganizerProps) {
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
    }).format(date);
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden">
      {/* Job Header */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex justify-between items-start mb-4">
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">{job.title}</h2>
            <div className="flex flex-wrap gap-2 mb-3">
              {job.categories.map((category, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {category}
                </Badge>
              ))}
            </div>
          </div>
          <div className="text-right">
            <div className="text-lg font-bold text-green-600">
              {formatCurrency(job.compensation.amount)}
              {job.compensation.type === "hourly" && "/時間"}
            </div>
            <div className="text-sm text-gray-500">
              応募締切: {formatDateTime(job.deadline)}
            </div>
          </div>
        </div>

        {/* Job Details */}
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
              {job.location.prefecture} {job.location.city} - {job.location.venue}
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="text-sm text-gray-600 mb-2">募集内容</div>
          <p className="text-sm text-gray-800 leading-relaxed line-clamp-3">
            {job.description}
          </p>
        </div>

        <div className="flex justify-end">
          <Button className="px-6">
            応募する
          </Button>
        </div>
      </div>

      {/* Organizer Profile Section */}
      <div className="p-6 bg-gray-50">
        <h3 className="text-sm font-medium text-gray-700 mb-3">主催者情報</h3>
        <OrganizerPublicProfile organizer={organizer} compact />
      </div>
    </div>
  );
}

// Example usage component with sample data
export function JobListingExample() {
  const sampleJob = {
    id: "job-1",
    title: "サッカー大会での看護師募集",
    description: "地域のサッカー大会において、選手の健康管理と応急処置を担当していただく看護師を募集しています。熱中症対応や外傷処置の経験がある方を優遇します。",
    categories: ["サッカー", "屋外スポーツ"],
    location: {
      prefecture: "東京都",
      city: "新宿区",
      venue: "新宿スポーツセンター",
    },
    startAt: new Date("2024-07-15T09:00:00"),
    endAt: new Date("2024-07-15T17:00:00"),
    compensation: {
      type: "hourly" as const,
      amount: 3000,
      currency: "JPY" as const,
    },
    deadline: new Date("2024-07-10T23:59:59"),
  };

  const sampleOrganizer = {
    id: "organizer-1",
    profile: {
      name: "田中 太郎",
      phone: "03-1234-5678",
      city: "新宿区",
      prefecture: "東京都",
      organizationName: "新宿サッカークラブ",
      organizationType: "sports_club",
      representativeName: "田中 太郎",
      businessRegistrationNumber: "1234567890123",
      website: "https://shinjuku-fc.example.com",
      description: "地域密着型のサッカークラブとして、青少年の健全育成とスポーツ振興に取り組んでいます。安全第一をモットーに、質の高い医療サポートを提供できる看護師の皆様との協力を大切にしています。",
      verificationStatus: "verified",
      ratingAverage: 4.8,
      ratingCount: 12,
    } as UserProfile,
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">求人詳細（主催者プロフィール表示例）</h1>
      <JobListingWithOrganizer job={sampleJob} organizer={sampleOrganizer} />
    </div>
  );
}