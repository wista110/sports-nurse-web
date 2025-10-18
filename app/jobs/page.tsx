import { Suspense } from "react";
import { JobListings } from "@/components/jobs/job-listings";
import { JobFilters } from "@/components/jobs/job-filters";

export default function JobsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">求人一覧</h1>
          <p className="mt-2 text-gray-600">
            スポーツイベントでの看護師求人を検索・応募できます
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Filters Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-8">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">検索条件</h2>
              <Suspense fallback={<div>Loading filters...</div>}>
                <JobFilters />
              </Suspense>
            </div>
          </div>

          {/* Job Listings */}
          <div className="lg:col-span-3">
            <Suspense fallback={<div>Loading jobs...</div>}>
              <JobListings />
            </Suspense>
          </div>
        </div>
      </div>
    </div>
  );
}