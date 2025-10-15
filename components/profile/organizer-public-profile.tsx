"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import type { UserProfile } from "@/types/domain";

interface OrganizerPublicProfileProps {
  organizer: {
    id: string;
    profile: UserProfile;
  };
  compact?: boolean;
}

export function OrganizerPublicProfile({ 
  organizer, 
  compact = false 
}: OrganizerPublicProfileProps) {
  const { profile } = organizer;

  const getVerificationStatusBadge = (status?: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800 text-xs">認証済み</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800 text-xs">認証待ち</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800 text-xs">認証拒否</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800 text-xs">未認証</Badge>;
    }
  };

  const getOrganizationTypeLabel = (type?: string) => {
    const types: Record<string, string> = {
      sports_club: "スポーツクラブ・チーム",
      school: "学校・教育機関",
      municipality: "自治体・公共機関",
      private_company: "民間企業",
      npo: "NPO・非営利団体",
      other: "その他",
    };
    return type ? types[type] || type : "未設定";
  };

  if (compact) {
    return (
      <div className="flex items-center space-x-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h4 className="text-sm font-medium text-gray-900 truncate">
              {profile.organizationName || profile.name}
            </h4>
            {getVerificationStatusBadge(profile.verificationStatus)}
          </div>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs text-gray-500">
              {getOrganizationTypeLabel(profile.organizationType)}
            </span>
            <span className="text-xs text-gray-400">•</span>
            <span className="text-xs text-gray-500">
              {profile.prefecture} {profile.city}
            </span>
          </div>
          {profile.ratingCount > 0 && (
            <div className="flex items-center mt-1">
              <span className="text-xs text-yellow-500">★</span>
              <span className="text-xs text-gray-600 ml-1">
                {profile.ratingAverage?.toFixed(1)} ({profile.ratingCount}件)
              </span>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-4">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex-1">
          <div className="flex items-center space-x-2 mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {profile.organizationName || profile.name}
            </h3>
            {getVerificationStatusBadge(profile.verificationStatus)}
          </div>
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span>{getOrganizationTypeLabel(profile.organizationType)}</span>
            <span>•</span>
            <span>{profile.prefecture} {profile.city}</span>
          </div>
        </div>
      </div>

      {/* Organization Details */}
      <div className="space-y-3">
        {profile.representativeName && (
          <div>
            <span className="text-sm text-gray-600">代表者:</span>
            <span className="ml-2 text-sm text-gray-900">{profile.representativeName}</span>
          </div>
        )}

        {profile.description && (
          <div>
            <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">
              {profile.description}
            </p>
          </div>
        )}

        {profile.website && (
          <div>
            <a
              href={profile.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-blue-600 hover:underline"
            >
              ウェブサイトを見る
            </a>
          </div>
        )}

        {/* Rating */}
        {profile.ratingCount > 0 && (
          <div className="flex items-center space-x-2 pt-2 border-t border-gray-100">
            <div className="flex items-center">
              <span className="text-lg text-yellow-500">★</span>
              <span className="ml-1 text-sm font-medium text-gray-900">
                {profile.ratingAverage?.toFixed(1)}
              </span>
            </div>
            <span className="text-sm text-gray-500">
              ({profile.ratingCount}件の評価)
            </span>
          </div>
        )}
      </div>
    </div>
  );
}