import { Metadata } from 'next';
import ProteccionDatosPage from '@/page-components/ProteccionDatosPage';

export const metadata: Metadata = {
  title: 'Protección de Datos Personales | TREFA',
  description: 'Conoce cómo TREFA protege y gestiona tus datos personales. Información sobre tus derechos ARCO, medidas de seguridad y nuestro compromiso con tu privacidad.',
  robots: {
    index: true,
    follow: true,
  },
  openGraph: {
    title: 'Protección de Datos Personales | TREFA',
    description: 'Tu privacidad es nuestra prioridad. Conoce cómo protegemos tu información personal.',
    type: 'website',
  },
};

export default function Page() {
  return <ProteccionDatosPage />;
}
