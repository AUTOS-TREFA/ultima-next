import { Metadata } from 'next';
import RootClientLayout from './RootClientLayout';
import '../index.css';

export const metadata: Metadata = {
  title: 'TREFA - Financiamiento Automotriz',
  description: 'Compra el auto de tus sueños con el mejor financiamiento en México',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <RootClientLayout>
          {children}
        </RootClientLayout>
      </body>
    </html>
  );
}
