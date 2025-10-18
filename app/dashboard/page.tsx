import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { OrganizerDashboard } from "@/components/dashboard/organizer-dashboard";
import { NurseDashboard } from "@/components/dashboard/nurse-dashboard";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {session.user.role === UserRole.ORGANIZER && <OrganizerDashboard />}
        {session.user.role === UserRole.NURSE && <NurseDashboard />}
        {session.user.role === UserRole.ADMIN && (
          <div className="text-center py-12">
            <h1 className="text-2xl font-bold text-gray-900">管理者ダッシュボード</h1>
            <p className="text-gray-600 mt-2">管理者機能は今後実装予定です</p>
          </div>
        )}
      </div>
    </div>
  );
}