import { Metadata } from 'next';
import { Suspense } from 'react';
import RegisterPageNew from '@/page-components/RegisterPageNew';
import { Loader2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Crear Cuenta | Portal TREFA',
  description: 'Crea tu cuenta en TREFA para acceder a nuestros servicios de financiamiento automotriz.',
  keywords: 'registro trefa, crear cuenta, nueva cuenta',
  openGraph: {
    title: 'Crear Cuenta | Portal TREFA',
    description: 'Crea tu cuenta en TREFA para acceder a nuestros servicios de financiamiento automotriz.',
    type: 'website',
  },
};

export default function Page() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-screen w-full bg-white">
        <Loader2 className="h-10 w-10 animate-spin text-[#003161]" />
      </div>
    }>
      <RegisterPageNew />
    </Suspense>
  );
}
