import { notFound } from "next/navigation";
import { JobDetail } from "@/components/jobs/job-detail";
import { jobService } from "@/lib/services/job";

interface JobDetailPageProps {
  params: {
    id: string;
  };
}

export default async function JobDetailPage({ params }: JobDetailPageProps) {
  const job = await jobService.getJobById(params.id);

  if (!job) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <JobDetail job={job} />
      </div>
    </div>
  );
}