import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { ApplicationsList } from "@/components/applications/applications-list";

export default async function ApplicationsPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (session.user.role !== UserRole.NURSE) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">応募履歴</h1>
          <p className="mt-2 text-gray-600">
            あなたが応募した求人の一覧と状況を確認できます
          </p>
        </div>

        <ApplicationsList />
      </div>
    </div>
  );
}