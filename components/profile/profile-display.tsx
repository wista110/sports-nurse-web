"use client";

import React from "react";
import { UserRole } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Badge } from "../ui/badge";
import type { UserProfile } from "@/types/domain";

interface ProfileDisplayProps {
  user: {
    id: string;
    email: string;
    role: UserRole;
    profile: UserProfile;
    createdAt: Date;
  };
  isOwnProfile?: boolean;
  onEdit?: () => void;
}

export function ProfileDisplay({ user, isOwnProfile = false, onEdit }: ProfileDisplayProps) {
  const { profile, role } = user;

  const getRoleLabel = (role: UserRole) => {
    switch (role) {
      case UserRole.NURSE:
        return "看護師";
      case UserRole.ORGANIZER:
        return "主催者";
      case UserRole.ADMIN:
        return "管理者";
      default:
        return "ユーザー";
    }
  };

  const getVerificationStatusBadge = (status?: string) => {
    switch (status) {
      case "verified":
        return <Badge className="bg-green-100 text-green-800">認証済み</Badge>;
      case "pending":
        return <Badge className="bg-yellow-100 text-yellow-800">認証待ち</Badge>;
      case "rejected":
        return <Badge className="bg-red-100 text-red-800">認証拒否</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">未認証</Badge>;
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{profile.name}</h1>
          <div className="flex items-center space-x-2 mt-2">
            <Badge variant="outline">{getRoleLabel(role)}</Badge>
            {role === UserRole.ORGANIZER && getVerificationStatusBadge(profile.verificationStatus)}
          </div>
        </div>
        {isOwnProfile && onEdit && (
          <Button onClick={onEdit} variant="outline">
            プロフィール編集
          </Button>
        )}
      </div>

      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div>
          <h3 className="text-lg font-semibold mb-3">基本情報</h3>
          <div className="space-y-2">
            <div>
              <span className="text-sm text-gray-600">所在地:</span>
              <span className="ml-2">{profile.prefecture} {profile.city}</span>
            </div>
            {profile.phone && (
              <div>
                <span className="text-sm text-gray-600">電話番号:</span>
                <span className="ml-2">{profile.phone}</span>
              </div>
            )}
          </div>
        </div>

        {/* Rating Display */}
        {profile.ratingCount > 0 && (
          <div>
            <h3 className="text-lg font-semibold mb-3">評価</h3>
            <div className="flex items-center space-x-2">
              <div className="flex items-center">
                <span className="text-2xl font-bold text-yellow-500">
                  ★ {profile.ratingAverage?.toFixed(1)}
                </span>
              </div>
              <span className="text-sm text-gray-600">
                ({profile.ratingCount}件の評価)
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Role-specific Information */}
      {role === UserRole.NURSE && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">専門情報</h3>
          <div className="space-y-4">
            {profile.licenseNumber && (
              <div>
                <span className="text-sm text-gray-600">免許番号:</span>
                <span className="ml-2 font-mono">{profile.licenseNumber}</span>
              </div>
            )}
            
            {profile.yearsOfExperience !== undefined && (
              <div>
                <span className="text-sm text-gray-600">経験年数:</span>
                <span className="ml-2">{profile.yearsOfExperience}年</span>
              </div>
            )}

            {profile.skills && profile.skills.length > 0 && (
              <div>
                <span className="text-sm text-gray-600 block mb-2">スキル・専門分野:</span>
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.specializations && profile.specializations.length > 0 && (
              <div>
                <span className="text-sm text-gray-600 block mb-2">専門分野:</span>
                <div className="flex flex-wrap gap-2">
                  {profile.specializations.map((spec, index) => (
                    <Badge key={index} variant="outline">
                      {spec}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {profile.bio && (
              <div>
                <span className="text-sm text-gray-600 block mb-2">自己紹介:</span>
                <p className="text-gray-800 leading-relaxed">{profile.bio}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {role === UserRole.ORGANIZER && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-3">組織情報</h3>
          <div className="space-y-4">
            {profile.organizationName && (
              <div>
                <span className="text-sm text-gray-600">組織名:</span>
                <span className="ml-2 font-semibold">{profile.organizationName}</span>
              </div>
            )}

            {profile.organizationType && (
              <div>
                <span className="text-sm text-gray-600">組織タイプ:</span>
                <span className="ml-2">{getOrganizationTypeLabel(profile.organizationType)}</span>
              </div>
            )}

            {profile.representativeName && (
              <div>
                <span className="text-sm text-gray-600">代表者:</span>
                <span className="ml-2">{profile.representativeName}</span>
              </div>
            )}

            {profile.businessRegistrationNumber && (
              <div>
                <span className="text-sm text-gray-600">事業者登録番号:</span>
                <span className="ml-2 font-mono">{profile.businessRegistrationNumber}</span>
              </div>
            )}

            {profile.website && (
              <div>
                <span className="text-sm text-gray-600">ウェブサイト:</span>
                <a
                  href={profile.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-2 text-blue-600 hover:underline"
                >
                  {profile.website}
                </a>
              </div>
            )}

            {profile.description && (
              <div>
                <span className="text-sm text-gray-600 block mb-2">組織説明:</span>
                <p className="text-gray-800 leading-relaxed">{profile.description}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Account Information */}
      <div className="border-t pt-4">
        <h3 className="text-lg font-semibold mb-3">アカウント情報</h3>
        <div className="text-sm text-gray-600">
          <div>登録日: {new Date(user.createdAt).toLocaleDateString("ja-JP")}</div>
          {!isOwnProfile && (
            <div>メール: {user.email}</div>
          )}
        </div>
      </div>
    </div>
  );
}

function getOrganizationTypeLabel(type: string) {
  const types: Record<string, string> = {
    sports_club: "スポーツクラブ・チーム",
    school: "学校・教育機関",
    municipality: "自治体・公共機関",
    private_company: "民間企業",
    npo: "NPO・非営利団体",
    other: "その他",
  };
  return types[type] || type;
}