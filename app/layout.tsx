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
      <head>
        <style dangerouslySetInnerHTML={{
          __html: `
            body { opacity: 0; }
            body.loaded { opacity: 1; transition: opacity 0.3s ease-in; }
          `
        }} />
      </head>
      <body>
        <RootClientLayout>
          {children}
        </RootClientLayout>
        <script dangerouslySetInnerHTML={{
          __html: `document.body.classList.add('loaded');`
        }} />
      </body>
    </html>
  );
}
