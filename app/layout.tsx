import { Metadata, Viewport } from 'next';
import RootClientLayout from './RootClientLayout';
import '../index.css';

export const metadata: Metadata = {
  title: {
    default: 'TREFA - Autos Seminuevos con Financiamiento en Monterrey',
    template: '%s | TREFA',
  },
  description: 'Compra el auto de tus suenos con el mejor financiamiento en Mexico. Autos seminuevos certificados con garantia, inspeccion de 150 puntos y respuesta en 24 horas.',
  keywords: ['autos seminuevos', 'financiamiento automotriz', 'monterrey', 'autos usados', 'credito automotriz', 'TREFA'],
  authors: [{ name: 'TREFA' }],
  creator: 'TREFA',
  publisher: 'TREFA',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL('https://trefa.mx'),
  alternates: {
    canonical: '/',
  },
  openGraph: {
    title: 'TREFA - Autos Seminuevos con Financiamiento',
    description: 'Encuentra tu auto ideal con financiamiento. Autos seminuevos certificados en Monterrey.',
    url: 'https://trefa.mx',
    siteName: 'TREFA',
    locale: 'es_MX',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TREFA - Autos Seminuevos',
    description: 'Autos seminuevos con financiamiento en Monterrey',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#f97316',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Preconnect to external domains for faster loading */}
        <link rel="preconnect" href="https://pemgwyymodlwabaexxrb.supabase.co" />
        <link rel="preconnect" href="https://r2.trefa.mx" />
        <link rel="dns-prefetch" href="https://pemgwyymodlwabaexxrb.supabase.co" />
        <link rel="dns-prefetch" href="https://r2.trefa.mx" />
      </head>
      <body className="antialiased">
        <RootClientLayout>
          {children}
        </RootClientLayout>
      </body>
    </html>
  );
}
