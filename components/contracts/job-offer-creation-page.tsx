"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { JobOfferForm } from "./job-offer-form";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { Job } from "@/types/domain";

interface JobOfferCreationPageProps {
  job: Job;
}

export function JobOfferCreationPage({ job }: JobOfferCreationPageProps) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(true);

  const handleSuccess = () => {
    router.push(`/jobs/${job.id}`);
  };

  const handleClose = () => {
    router.push(`/jobs/${job.id}`);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push(`/jobs/${job.id}`)}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Job Details
          </Button>
          
          <h1 className="text-2xl font-bold text-gray-900">Create Job Offer</h1>
          <p className="text-gray-600 mt-2">
            Create a formal job offer for "{job.title}"
          </p>
        </div>

        {/* Job Summary Card */}
        <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Job Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium text-gray-700">Title</h3>
              <p className="text-gray-900">{job.title}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Location</h3>
              <p className="text-gray-900">
                {job.location.venue}, {job.location.city}, {job.location.prefecture}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Date & Time</h3>
              <p className="text-gray-900">
                {new Date(job.startAt).toLocaleDateString()} - {new Date(job.endAt).toLocaleDateString()}
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Compensation</h3>
              <p className="text-gray-900">
                ¥{job.compensation.amount.toLocaleString()} ({job.compensation.type})
              </p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Nurses Needed</h3>
              <p className="text-gray-900">{job.headcount}</p>
            </div>
            <div>
              <h3 className="font-medium text-gray-700">Categories</h3>
              <p className="text-gray-900">{job.categories.join(", ")}</p>
            </div>
          </div>
          <div className="mt-4">
            <h3 className="font-medium text-gray-700">Description</h3>
            <p className="text-gray-900 mt-1">{job.description}</p>
          </div>
        </div>

        {/* Form */}
        <JobOfferForm
          job={job}
          isOpen={showForm}
          onClose={handleClose}
          onSuccess={handleSuccess}
        />
      </div>
    </div>
  );
}