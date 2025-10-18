import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { UserRole } from "@prisma/client";
import { JobCreationForm } from "@/components/jobs/job-creation-form";

export default async function NewJobPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (session.user.role !== UserRole.ORGANIZER) {
    redirect("/");
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">新しい求人を作成</h1>
          <p className="mt-2 text-gray-600">
            スポーツイベントでの看護師求人を作成します
          </p>
        </div>

        <JobCreationForm />
      </div>
    </div>
  );
}