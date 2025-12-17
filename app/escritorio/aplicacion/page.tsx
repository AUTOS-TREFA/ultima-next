'use client';

import dynamic from 'next/dynamic';

const EnhancedApplication = dynamic(
  () => import('@/components/application/EnhancedApplication'),
  { ssr: false }
);

export default function Page() {
  return <EnhancedApplication />;
}
