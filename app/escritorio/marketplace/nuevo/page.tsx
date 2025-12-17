'use client';

import MarketplaceNewListingPage from '@/page-components/MarketplaceNewListingPage';

// Force dynamic rendering to avoid static generation errors
export const dynamic = 'force-dynamic';

export default function Page() {
  return <MarketplaceNewListingPage />;
}
