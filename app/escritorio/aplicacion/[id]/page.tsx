'use client';

import EnhancedApplication from '@/components/application/EnhancedApplication';

export default function Page() {
  // EnhancedApplication uses useParams() internally to get the application ID
  return <EnhancedApplication />;
}
