"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { UserRole } from "@prisma/client";
import { NurseProfileForm } from "@/components/profile/nurse-profile-form";
import { OrganizerProfileForm } from "@/components/profile/organizer-profile-form";
import type { NurseProfileInput, OrganizerProfileInput } from "@/lib/validations/profile";

export default function ProfileEditPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/login");
      return;
    }
  }, [session, status, router]);

  const handleNurseProfileSubmit = async (data: NurseProfileInput) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: UserRole.NURSE,
          profile: data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Profile update failed");
      }

      setSuccess(true);
      // Optionally redirect after a delay
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Profile update failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrganizerProfileSubmit = async (data: OrganizerProfileInput) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          role: UserRole.ORGANIZER,
          profile: data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Profile update failed");
      }

      setSuccess(true);
      // Optionally redirect after a delay
      setTimeout(() => {
        router.push("/profile");
      }, 2000);
    } catch (error) {
      setError(error instanceof Error ? error.message : "Profile update failed");
    } finally {
      setIsLoading(false);
    }
  };

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const userRole = session.user.role;
  const currentProfile = session.user.profile;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            プロフィール編集
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            プロフィール情報を更新してください
          </p>
        </div>

        <div className="bg-white shadow rounded-lg p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
              {error}
            </div>
          )}

          {success && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded">
              プロフィールが正常に更新されました。プロフィールページにリダイレクトします...
            </div>
          )}

          {userRole === UserRole.NURSE ? (
            <NurseProfileForm
              initialData={currentProfile as any}
              onSubmit={handleNurseProfileSubmit}
              isLoading={isLoading}
            />
          ) : userRole === UserRole.ORGANIZER ? (
            <OrganizerProfileForm
              initialData={currentProfile as any}
              onSubmit={handleOrganizerProfileSubmit}
              isLoading={isLoading}
            />
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">
                このユーザータイプではプロフィール編集は利用できません。
              </p>
              <button
                onClick={() => router.push("/profile")}
                className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                プロフィールに戻る
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}