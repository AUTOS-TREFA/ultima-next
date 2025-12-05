import { Metadata } from 'next';
import RegisterPage from '@/page-components/RegisterPage';

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
  return <RegisterPage />;
}
