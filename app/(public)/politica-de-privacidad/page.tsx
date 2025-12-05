import { Metadata } from 'next';
import PrivacyPolicyPage from '@/page-components/PrivacyPolicyPage';

// This page requires force-dynamic because the parent layout uses contexts
// that depend on runtime data fetching
export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Politica de Privacidad | TREFA',
  description: 'Conoce nuestra politica de privacidad y como protegemos tus datos personales en TREFA.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <PrivacyPolicyPage />;
}
