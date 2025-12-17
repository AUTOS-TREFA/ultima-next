'use client';

/**
 * VenderMiAutoPage
 *
 * Página de valuación de vehículos con diseño hero inspirado en hero-section-22.
 * SEO copy integrado para posicionamiento orgánico.
 * Formulario integrado sin bounding boxes.
 */

import React, { useRef, useEffect } from 'react';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';
import { MotionPreset } from '@/components/ui/motion-preset';
import AutometricaValuationForm from '@/components/AutometricaValuationForm';
import {
  DollarSign,
  Clock,
  Shield,
  CheckCircle2,
  Zap,
  Car
} from 'lucide-react';

// Brands we work with (displayed in carousel)
const BRAND_NAMES = [
  'Audi', 'BMW', 'Chevrolet', 'Dodge', 'Ford', 'GMC', 'Honda',
  'Hyundai', 'Jeep', 'Kia', 'Mazda', 'Mercedes-Benz', 'Mitsubishi',
  'Nissan', 'Peugeot', 'RAM', 'Renault', 'SEAT', 'Suzuki', 'Tesla',
  'Toyota', 'Volkswagen', 'Volvo',
];
// Note: Some icons used in Benefits section below

// Brand Carousel Component with infinite scroll and fade effects
const BrandCarousel: React.FC = () => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Duplicate brands for seamless infinite scroll
  const allBrands = [...BRAND_NAMES, ...BRAND_NAMES, ...BRAND_NAMES];

  useEffect(() => {
    const scrollContainer = scrollRef.current;
    if (!scrollContainer) return;

    let animationId: number;
    let scrollPos = 0;
    const speed = 0.4; // pixels per frame

    const animate = () => {
      scrollPos += speed;
      // Reset when reaching the middle set of brands
      if (scrollPos >= scrollContainer.scrollWidth / 3) {
        scrollPos = 0;
      }
      scrollContainer.scrollLeft = scrollPos;
      animationId = requestAnimationFrame(animate);
    };

    animationId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animationId);
  }, []);

  return (
    <div className="relative w-full overflow-hidden py-4">
      {/* Left fade */}
      <div
        className="absolute left-0 top-0 bottom-0 w-20 sm:w-32 lg:w-48 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to right, white 0%, transparent 100%)',
        }}
      />
      {/* Right fade */}
      <div
        className="absolute right-0 top-0 bottom-0 w-20 sm:w-32 lg:w-48 z-10 pointer-events-none"
        style={{
          background: 'linear-gradient(to left, white 0%, transparent 100%)',
        }}
      />
      {/* Scrolling container */}
      <div
        ref={scrollRef}
        className="flex gap-6 sm:gap-10 overflow-x-hidden px-4"
        style={{ scrollBehavior: 'auto' }}
      >
        {allBrands.map((brand, idx) => (
          <div
            key={`${brand}-${idx}`}
            className="flex-shrink-0 flex items-center justify-center px-3 py-1.5 rounded-full border border-gray-200 bg-gray-50/50"
          >
            <span className="text-xs sm:text-sm font-medium text-gray-500 whitespace-nowrap">
              {brand}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

const VenderMiAutoPage: React.FC = () => {
  return (
    <main className="flex-1 overflow-hidden bg-white">
      {/* Hero Section - With top padding for breathing room */}
      <section className="relative overflow-hidden pt-6 sm:pt-8 lg:pt-12">
        <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 w-full">
          <div className="grid lg:grid-cols-[1.3fr_1fr] gap-4 lg:gap-8 items-start">

            {/* Left Column - Content & Form */}
            <div className="flex flex-col gap-3">
              <MotionPreset
                fade
                slide={{ direction: 'left', offset: 40 }}
                blur
                transition={{ duration: 0.5, ease: 'easeOut' }}
                delay={0}
              >
                <Badge variant="outline" className="w-fit px-2.5 py-0.5 bg-primary-50 text-primary-700 border-primary-200 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Instantáneo
                </Badge>
              </MotionPreset>

              <MotionPreset
                fade
                slide={{ direction: 'left', offset: 40 }}
                blur
                transition={{ duration: 0.5, ease: 'easeOut' }}
                delay={0.1}
              >
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 leading-tight">
                  Recibe una oferta por tu auto.
                  <span className="block text-primary-600 font-medium text-lg sm:text-xl lg:text-2xl mt-1">Es fácil, rápido y sin costo.</span>
                </h1>
              </MotionPreset>

              <MotionPreset
                fade
                slide={{ direction: 'left', offset: 40 }}
                blur
                transition={{ duration: 0.5, ease: 'easeOut' }}
                delay={0.15}
              >
                <p className="text-sm sm:text-base text-slate-500 max-w-lg">
                  Completa el formulario y obtén una cotización basada en datos reales del mercado mexicano.
                </p>
              </MotionPreset>

              {/* Inline Form - fixed min-height to prevent content shift */}
              <MotionPreset
                fade
                slide={{ direction: 'left', offset: 40 }}
                blur
                transition={{ duration: 0.6, ease: 'easeOut' }}
                delay={0.2}
              >
                <div className="min-h-[200px] pt-2">
                  <AutometricaValuationForm embedded compact />
                </div>
              </MotionPreset>
            </div>

            {/* Right Column - Hero Image */}
            <MotionPreset
              fade
              slide={{ direction: 'right', offset: 60 }}
              blur
              transition={{ duration: 0.7, ease: 'easeOut' }}
              delay={0.3}
              className="hidden lg:flex items-start justify-center relative"
            >
              <div className="relative w-full max-w-[500px] -mt-4">
                <Image
                  src="/images/trefa-vender-derecha.png"
                  alt="Vende tu auto con TREFA"
                  width={500}
                  height={450}
                  className="w-full h-auto object-contain"
                  style={{
                    maskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                    WebkitMaskImage: 'linear-gradient(to bottom, black 70%, transparent 100%)',
                  }}
                  priority
                />
              </div>
            </MotionPreset>

          </div>
        </div>
      </section>

      {/* Brand Carousel - With horizontal fade effects */}
      <section className="py-4 sm:py-6 border-t border-gray-100">
        <div className="mx-auto max-w-7xl">
          <p className="text-center text-xs text-gray-400 mb-2">Compramos autos de las mejores marcas</p>
          <BrandCarousel />
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionPreset fade blur transition={{ duration: 0.5 }}>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">
                ¿Por qué vender tu auto con TREFA?
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Somos la forma más rápida y segura de vender tu auto en México.
                Sin intermediarios, sin comisiones ocultas.
              </p>
            </div>
          </MotionPreset>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <MotionPreset fade slide={{ offset: 30 }} blur transition={{ duration: 0.5 }} delay={0.1}>
              <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-green-100 flex items-center justify-center mb-4">
                  <DollarSign className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Mejor precio del mercado</h3>
                <p className="text-sm text-slate-600">
                  Precios competitivos basados en datos reales de la Guía Autométrica.
                </p>
              </div>
            </MotionPreset>

            <MotionPreset fade slide={{ offset: 30 }} blur transition={{ duration: 0.5 }} delay={0.2}>
              <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                  <Clock className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Pago en 24 horas</h3>
                <p className="text-sm text-slate-600">
                  Recibe tu dinero al día siguiente. Sin esperas, sin complicaciones.
                </p>
              </div>
            </MotionPreset>

            <MotionPreset fade slide={{ offset: 30 }} blur transition={{ duration: 0.5 }} delay={0.3}>
              <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                  <Shield className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">100% seguro</h3>
                <p className="text-sm text-slate-600">
                  Nos encargamos de todo el papeleo. Transacción segura y transparente.
                </p>
              </div>
            </MotionPreset>

            <MotionPreset fade slide={{ offset: 30 }} blur transition={{ duration: 0.5 }} delay={0.4}>
              <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7 text-orange-600" />
                </div>
                <h3 className="font-bold text-lg text-slate-800 mb-2">Sin comisiones ocultas</h3>
                <p className="text-sm text-slate-600">
                  El precio que te ofrecemos es lo que recibes. Sin sorpresas.
                </p>
              </div>
            </MotionPreset>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 bg-gray-50">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionPreset fade blur transition={{ duration: 0.5 }}>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-4">
                Vende tu auto en 3 simples pasos
              </h2>
              <p className="text-slate-600 max-w-2xl mx-auto">
                Un proceso rápido y sin complicaciones para que vendas tu auto hoy mismo.
              </p>
            </div>
          </MotionPreset>

          <div className="grid md:grid-cols-3 gap-8">
            <MotionPreset fade slide={{ offset: 30 }} blur transition={{ duration: 0.5 }} delay={0.1}>
              <div className="relative">
                <div className="absolute -left-4 -top-4 w-12 h-12 rounded-full bg-primary-600 text-white font-bold text-xl flex items-center justify-center">
                  1
                </div>
                <div className="bg-white rounded-2xl p-6 pt-10 shadow-sm border border-gray-100">
                  <div className="w-full h-40 bg-gray-100 rounded-xl mb-4 overflow-hidden">
                    <Image
                      src="/images/landing-asset-1.png"
                      alt="Cotiza tu auto"
                      width={300}
                      height={160}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2">Cotiza tu auto</h3>
                  <p className="text-sm text-slate-600">
                    Ingresa los datos de tu auto y recibe una oferta instantánea basada en el mercado.
                  </p>
                </div>
              </div>
            </MotionPreset>

            <MotionPreset fade slide={{ offset: 30 }} blur transition={{ duration: 0.5 }} delay={0.2}>
              <div className="relative">
                <div className="absolute -left-4 -top-4 w-12 h-12 rounded-full bg-primary-600 text-white font-bold text-xl flex items-center justify-center">
                  2
                </div>
                <div className="bg-white rounded-2xl p-6 pt-10 shadow-sm border border-gray-100">
                  <div className="w-full h-40 bg-gray-100 rounded-xl mb-4 overflow-hidden">
                    <Image
                      src="/images/landing-asset-2.png"
                      alt="Agenda inspección"
                      width={300}
                      height={160}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2">Agenda inspección</h3>
                  <p className="text-sm text-slate-600">
                    Programa una cita en tu ubicación. Nosotros vamos a ti.
                  </p>
                </div>
              </div>
            </MotionPreset>

            <MotionPreset fade slide={{ offset: 30 }} blur transition={{ duration: 0.5 }} delay={0.3}>
              <div className="relative">
                <div className="absolute -left-4 -top-4 w-12 h-12 rounded-full bg-primary-600 text-white font-bold text-xl flex items-center justify-center">
                  3
                </div>
                <div className="bg-white rounded-2xl p-6 pt-10 shadow-sm border border-gray-100">
                  <div className="w-full h-40 bg-gray-100 rounded-xl mb-4 overflow-hidden">
                    <Image
                      src="/images/landing-asset-4.png"
                      alt="Recibe tu pago"
                      width={300}
                      height={160}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <h3 className="font-bold text-lg text-slate-800 mb-2">Recibe tu pago</h3>
                  <p className="text-sm text-slate-600">
                    Firma los documentos y recibe tu dinero en 24 horas. Así de fácil.
                  </p>
                </div>
              </div>
            </MotionPreset>
          </div>
        </div>
      </section>

      {/* SEO Content Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
          <MotionPreset fade blur transition={{ duration: 0.5 }}>
            <div className="prose prose-lg max-w-none">
              <h2 className="text-2xl font-bold text-slate-800 mb-6">
                Valuación de auto gratis: Descubre cuánto vale tu auto
              </h2>

              <p className="text-slate-600 mb-4">
                ¿Te preguntas <strong>cuánto vale mi auto</strong>? Con TREFA puedes obtener una <strong>valuación de auto instantánea y gratuita</strong> basada en datos reales del mercado mexicano. Nuestra herramienta utiliza la <strong>Guía Autométrica</strong>, la referencia más confiable para conocer el valor de tu auto.
              </p>

              <p className="text-slate-600 mb-4">
                Ya sea que quieras <strong>vender tu auto usado</strong>, conocer su valor de mercado, o simplemente curiosear, nuestra <strong>cotización de auto en línea</strong> te da un estimado preciso en segundos. Sin costo, sin compromiso, sin necesidad de agendar citas.
              </p>

              <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">
                ¿Cómo funciona la valuación de autos?
              </h3>

              <p className="text-slate-600 mb-4">
                Nuestro sistema de <strong>tasación de autos</strong> considera múltiples factores: marca, modelo, año, versión y kilometraje. Cruzamos esta información con los precios actuales del mercado para darte una <strong>oferta de compra real</strong> que puedes aceptar hoy mismo.
              </p>

              <div className="bg-primary-50 rounded-2xl p-6 my-8 border border-primary-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Car className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-800 mb-2">
                      ¿Listo para cotizar tu auto?
                    </h4>
                    <p className="text-sm text-slate-600 mb-0">
                      Usa nuestro formulario arriba y recibe una oferta de compra instantánea.
                      Es gratis, rápido y sin compromiso.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-slate-800 mt-8 mb-4">
                Preguntas frecuentes sobre venta de autos
              </h3>

              <div className="space-y-4">
                <details className="group bg-gray-50 rounded-xl p-4">
                  <summary className="font-semibold text-slate-800 cursor-pointer list-none flex justify-between items-center">
                    ¿Cuánto tiempo tarda el proceso de venta?
                    <span className="ml-2 text-primary-600 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-slate-600 mt-3 text-sm">
                    El proceso completo puede completarse en tan solo 24-48 horas. Desde la cotización hasta el pago, nos encargamos de todo para que sea lo más rápido posible.
                  </p>
                </details>

                <details className="group bg-gray-50 rounded-xl p-4">
                  <summary className="font-semibold text-slate-800 cursor-pointer list-none flex justify-between items-center">
                    ¿Qué documentos necesito para vender mi auto?
                    <span className="ml-2 text-primary-600 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-slate-600 mt-3 text-sm">
                    Necesitas: factura original o carta factura, identificación oficial vigente, comprobante de domicilio, y tarjeta de circulación. Nosotros te ayudamos con el resto del papeleo.
                  </p>
                </details>

                <details className="group bg-gray-50 rounded-xl p-4">
                  <summary className="font-semibold text-slate-800 cursor-pointer list-none flex justify-between items-center">
                    ¿El precio cotizado es negociable?
                    <span className="ml-2 text-primary-600 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-slate-600 mt-3 text-sm">
                    La cotización inicial es un estimado basado en los datos que proporcionas. El precio final se confirma después de la inspección física del auto.
                  </p>
                </details>

                <details className="group bg-gray-50 rounded-xl p-4">
                  <summary className="font-semibold text-slate-800 cursor-pointer list-none flex justify-between items-center">
                    ¿Compran autos con adeudos o problemas legales?
                    <span className="ml-2 text-primary-600 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-slate-600 mt-3 text-sm">
                    Evaluamos cada caso de manera individual. Contáctanos para conocer las opciones disponibles para tu situación específica.
                  </p>
                </details>
              </div>
            </div>
          </MotionPreset>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-16 bg-gradient-to-br from-primary-600 to-primary-700">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <MotionPreset fade blur transition={{ duration: 0.5 }}>
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-4">
              ¿Listo para vender tu auto?
            </h2>
            <p className="text-primary-100 mb-8 max-w-xl mx-auto">
              Obtén tu cotización gratuita ahora y descubre cuánto vale tu auto.
              El proceso toma menos de 2 minutos.
            </p>
            <a
              href="#top"
              className="inline-flex items-center gap-2 bg-white text-primary-600 font-bold py-4 px-8 rounded-xl hover:bg-gray-100 transition-all hover:scale-105 active:scale-95 shadow-lg"
              onClick={(e) => {
                e.preventDefault();
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
            >
              Cotizar mi auto gratis
              <Car className="w-5 h-5" />
            </a>
          </MotionPreset>
        </div>
      </section>
    </main>
  );
};

export default VenderMiAutoPage;
