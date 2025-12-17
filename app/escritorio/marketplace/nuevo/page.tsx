'use client';

import dynamic from 'next/dynamic';

// Dynamically import the component to avoid SSR issues
const MarketplaceNewListingPage = dynamic(
  () => import('@/page-components/MarketplaceNewListingPage'),
  { ssr: false }
);

export default function Page() {
  return <MarketplaceNewListingPage />;
}
