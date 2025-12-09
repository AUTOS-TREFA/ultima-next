import { Metadata } from 'next';
import ContactPage from '@/page-components/ContactPage';

export const metadata: Metadata = {
  title: 'Contacto | TREFA - Autos Seminuevos',
  description: 'Contactanos por WhatsApp, telefono o correo electronico. Estamos aqui para ayudarte a encontrar el auto perfecto.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function Page() {
  return <ContactPage />;
}
