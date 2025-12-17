'use client';

import { useParams } from 'next/navigation';
import MarketplaceFormPage from '@/page-components/MarketplaceFormPage';

export default function EditMarketplaceListing() {
  const params = useParams<{ id: string }>();

  return <MarketplaceFormPage mode="edit" listingId={params.id} />;
}
