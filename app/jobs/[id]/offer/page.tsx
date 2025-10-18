import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { jobService } from "@/lib/services/job";
import { JobOfferCreationPage } from "@/components/contracts/job-offer-creation-page";

interface PageProps {
  params: {
    id: string;
  };
}

export default async function CreateJobOfferPage({ params }: PageProps) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect("/auth/signin");
  }

  if (session.user.role !== "ORGANIZER") {
    redirect("/dashboard");
  }

  const job = await jobService.getJobById(params.id);
  
  if (!job) {
    redirect("/jobs");
  }

  // Only allow job offers for jobs owned by the current organizer
  if (job.organizerId !== session.user.id) {
    redirect("/jobs");
  }

  // Only allow job offers for jobs with applications
  if (job.status !== "APPLIED") {
    redirect(`/jobs/${job.id}`);
  }

  return <JobOfferCreationPage job={job} />;
}