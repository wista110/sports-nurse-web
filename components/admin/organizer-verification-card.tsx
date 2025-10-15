"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import type { UserProfile } from "@/types/domain";

interface OrganizerVerificationCardProps {
  organizer: {
    id: string;
    email: string;
    profile: UserProfile;
    createdAt: Date;
    updatedAt: Date;
  };
  onStatusUpdate: (organizerId: string, status: "verified" | "rejected", reason?: string) => Promise<void>;
  isLoading?: boolean;
}

export function OrganizerVerificationCard({
  organizer,
  onStatusUpdate,
  isLoading = false,
}: OrganizerVerificationCardProps) {
  const [showReasonInput, setShowReasonInput] = useState(false);
  const [reason, setReason] = useState("");
  const [actionType, setActionType] = useState<"verified" | "rejected" | null>(null);

  const { profile } = organizer;

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

  const handleStatusUpdate = async (status: "verified" | "rejected") => {
    if (status === "rejected" && !reason.trim()) {
      setActionType(status);
      setShowReasonInput(true);
      return;
    }

    try {
      await onStatusUpdate(organizer.id, status, reason.trim() || undefined);
      setShowReasonInput(false);
      setReason("");
      setActionType(null);
    } catch (error) {
      console.error("Status update failed:", error);
    }
  };

  const handleCancel = () => {
    setShowReasonInput(false);
    setReason("");
    setActionType(null);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {profile.organizationName || profile.name}
          </h3>
          <div className="flex items-center space-x-2 mt-1">
            <Badge variant="outline" className="text-xs">
              {getOrganizationTypeLabel(profile.organizationType)}
            </Badge>
            <Badge className="bg-yellow-100 text-yellow-800 text-xs">
              認証待ち
            </Badge>
          </div>
        </div>
        <div className="text-sm text-gray-500">
          登録日: {new Date(organizer.createdAt).toLocaleDateString("ja-JP")}
        </div>
      </div>

      {/* Organization Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <div className="space-y-2">
          <div>
            <span className="text-sm font-medium text-gray-600">メールアドレス:</span>
            <span className="ml-2 text-sm text-gray-900">{organizer.email}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600">所在地:</span>
            <span className="ml-2 text-sm text-gray-900">
              {profile.prefecture} {profile.city}
            </span>
          </div>
          {profile.representativeName && (
            <div>
              <span className="text-sm font-medium text-gray-600">代表者:</span>
              <span className="ml-2 text-sm text-gray-900">{profile.representativeName}</span>
            </div>
          )}
        </div>
        <div className="space-y-2">
          {profile.phone && (
            <div>
              <span className="text-sm font-medium text-gray-600">電話番号:</span>
              <span className="ml-2 text-sm text-gray-900">{profile.phone}</span>
            </div>
          )}
          {profile.businessRegistrationNumber && (
            <div>
              <span className="text-sm font-medium text-gray-600">事業者登録番号:</span>
              <span className="ml-2 text-sm font-mono text-gray-900">
                {profile.businessRegistrationNumber}
              </span>
            </div>
          )}
          {profile.website && (
            <div>
              <span className="text-sm font-medium text-gray-600">ウェブサイト:</span>
              <a
                href={profile.website}
                target="_blank"
                rel="noopener noreferrer"
                className="ml-2 text-sm text-blue-600 hover:underline"
              >
                {profile.website}
              </a>
            </div>
          )}
        </div>
      </div>

      {/* Organization Description */}
      {profile.description && (
        <div className="mb-4">
          <span className="text-sm font-medium text-gray-600 block mb-2">組織説明:</span>
          <p className="text-sm text-gray-700 leading-relaxed bg-gray-50 p-3 rounded">
            {profile.description}
          </p>
        </div>
      )}

      {/* Reason Input */}
      {showReasonInput && (
        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
          <Label htmlFor="reason" className="text-sm font-medium">
            {actionType === "rejected" ? "拒否理由 (必須)" : "承認理由 (任意)"}
          </Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder={
              actionType === "rejected"
                ? "認証を拒否する理由を入力してください..."
                : "承認理由があれば入力してください..."
            }
            rows={3}
            className="mt-2"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex justify-end space-x-3">
        {showReasonInput ? (
          <>
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
            >
              キャンセル
            </Button>
            <Button
              onClick={() => actionType && handleStatusUpdate(actionType)}
              disabled={isLoading || (actionType === "rejected" && !reason.trim())}
              className={
                actionType === "verified"
                  ? "bg-green-600 hover:bg-green-700"
                  : "bg-red-600 hover:bg-red-700"
              }
            >
              {isLoading ? "処理中..." : actionType === "verified" ? "承認" : "拒否"}
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="outline"
              onClick={() => handleStatusUpdate("rejected")}
              disabled={isLoading}
              className="text-red-600 border-red-300 hover:bg-red-50"
            >
              拒否
            </Button>
            <Button
              onClick={() => handleStatusUpdate("verified")}
              disabled={isLoading}
              className="bg-green-600 hover:bg-green-700"
            >
              {isLoading ? "処理中..." : "承認"}
            </Button>
          </>
        )}
      </div>
    </div>
  );
}