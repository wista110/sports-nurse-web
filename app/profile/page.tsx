"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ProfileDisplay } from "@/components/profile/profile-display";

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, status } = useSession();

  useEffect(() => {
    if (status === "loading") return;
    
    if (!session) {
      router.push("/login");
      return;
    }
  }, [session, status, router]);

  const handleEdit = () => {
    router.push("/profile/edit");
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

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold text-gray-900">
            マイプロフィール
          </h1>
        </div>

        <ProfileDisplay
          user={{
            id: session.user.id,
            email: session.user.email!,
            role: session.user.role,
            profile: session.user.profile,
            createdAt: new Date(session.user.createdAt || Date.now()),
          }}
          isOwnProfile={true}
          onEdit={handleEdit}
        />
      </div>
    </div>
  );
}