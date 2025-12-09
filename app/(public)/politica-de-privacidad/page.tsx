import { Metadata } from 'next';
import PrivacyPolicyPage from '@/page-components/PrivacyPolicyPage';

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
