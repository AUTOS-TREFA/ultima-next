import React from 'react';
import { useSearchParams } from 'react-router-dom';
import ValuationApp from '../Valuation/App';
import useSEO from '../hooks/useSEO';

const GetAQuotePage: React.FC = () => {
    useSEO({
    title: 'Vende tu Auto Usado en Monterrey | Recibe una Oferta en 24 Horas | TREFA',
    description: 'Vende tu auto seminuevo de forma rápida y segura en Monterrey. Recibe una oferta competitiva en menos de 24 horas. Proceso 100% transparente, sin complicaciones. Valuación inmediata y el mejor precio por tu vehículo. TREFA compra tu auto hoy.',
    keywords: 'vender auto monterrey, vender carro usado, vender mi auto seminuevo, compra venta autos monterrey, valuación auto gratis, vender vehículo rápido, mejor precio auto usado, venta auto inmediata, trefa monterrey, oferta por mi auto',
    canonical: 'https://trefa.mx/vender-mi-auto',
    openGraph: {
      title: 'Vende tu Auto Usado en Monterrey | Mejor Precio Garantizado | TREFA',
      description: 'Recibe una oferta competitiva por tu auto en menos de 24 horas. Proceso transparente, pago rápido y sin complicaciones en Monterrey.',
      type: 'website',
      url: 'https://trefa.mx/vender-mi-auto'
    }
  });

    const [searchParams] = useSearchParams();
    const initialSearch = searchParams.get('search');

    return (
        <div className="w-full flex justify-center items-start py-8 sm:py-12">
             <ValuationApp initialSearchQuery={initialSearch} />
        </div>
    );
};

export default GetAQuotePage;
