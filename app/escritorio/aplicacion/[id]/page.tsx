'use client';

import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';

// Loading skeleton that matches the EnhancedApplication layout
const ApplicationSkeleton = () => (
  <div className="w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-4">
    <div className="md:grid md:max-lg:grid-cols-6 lg:grid-cols-5 gap-0">
      {/* Sidebar skeleton */}
      <div className="col-span-6 p-3 sm:p-4 md:p-5 md:max-lg:col-span-2 lg:col-span-1 bg-white md:rounded-l-xl md:shadow-sm border-b md:border-b-0 md:border-r border-gray-200">
        <div className="flex md:flex-col gap-2 md:gap-y-3 overflow-x-auto md:overflow-visible">
          {[1, 2, 3, 4, 5, 6, 7].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2 flex-shrink-0">
              <div className="w-8 h-8 rounded-full bg-gray-200 animate-pulse" />
              <div className="hidden md:block space-y-1.5">
                <div className="w-16 h-3 bg-gray-200 rounded animate-pulse" />
                <div className="w-24 h-2 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Content skeleton */}
      <div className="col-span-6 md:col-span-4 p-4 sm:p-5 bg-gray-50/50">
        <div className="flex justify-center items-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    </div>
  </div>
);

const EnhancedApplication = dynamic(
  () => import('@/components/application/EnhancedApplication'),
  {
    ssr: false,
    loading: () => <ApplicationSkeleton />
  }
);

export default function Page() {
  // EnhancedApplication uses useParams() internally to get the application ID
  return <EnhancedApplication />;
}
