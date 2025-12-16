import PublicDocumentUploadPage from '@/page-components/PublicDocumentUploadPage';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Carga de Documentos | TREFA',
  description: 'Sube tus documentos de forma segura para tu solicitud de financiamiento',
  robots: 'noindex, nofollow', // Private page, don't index
};

export default function DocumentUploadPage() {
  return <PublicDocumentUploadPage />;
}
