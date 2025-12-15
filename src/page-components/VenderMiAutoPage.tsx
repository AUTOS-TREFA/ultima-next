'use client';

/**
 * VenderMiAutoPage
 *
 * Página de valuación de vehículos con diseño hero inspirado en hero-section-22.
 * SEO copy integrado para posicionamiento orgánico.
 * Formulario integrado sin bounding boxes.
 */

import React from 'react';
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
// Note: Some icons used in Benefits section below

const VenderMiAutoPage: React.FC = () => {
  return (
    <main className="flex-1 overflow-hidden bg-white">
      {/* Hero Section - Full viewport height */}
      <section className="relative overflow-hidden min-h-[calc(100vh-80px)]">
        {/* Right Column - Image absolutely positioned at bottom right */}
        <MotionPreset
          fade
          slide={{ direction: 'right', offset: 50 }}
          blur
          transition={{ duration: 0.5 }}
          delay={0.1}
          className="hidden lg:block absolute bottom-0 right-0 w-[35%] max-w-[450px] pointer-events-none"
        >
          <div className="relative pr-8">
            <Image
              src="/images/trefa-vender-derecha.png"
              alt="Vende tu auto con TREFA"
              width={450}
              height={400}
              className="w-full h-auto object-contain"
              priority
            />
            {/* Fade to white at bottom */}
            <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-white to-transparent" />
          </div>
        </MotionPreset>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20 h-full">
          <div className="lg:mr-[38%] lg:max-w-2xl">
            {/* Content & Form (now on left) */}
            <div className="flex flex-col gap-4 justify-center">
              <MotionPreset fade slide={{ offset: 30 }} blur transition={{ duration: 0.4 }} delay={0.1}>
                <Badge variant="outline" className="w-fit px-2.5 py-0.5 bg-primary-50 text-primary-700 border-primary-200 text-xs">
                  <Zap className="w-3 h-3 mr-1" />
                  Instantáneo
                </Badge>
              </MotionPreset>

              <MotionPreset fade slide={{ offset: 30 }} blur transition={{ duration: 0.4 }} delay={0.15}>
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-800 leading-tight">
                  Recibe una oferta por tu auto.
                  <span className="block text-primary-600 font-medium text-lg sm:text-xl lg:text-2xl mt-1">Es fácil, rápido y sin costo.</span>
                </h1>
              </MotionPreset>

              <MotionPreset fade slide={{ offset: 30 }} blur transition={{ duration: 0.4 }} delay={0.2}>
                <p className="text-base text-slate-500 max-w-md">
                  Completa el formulario y obtén una cotización basada en datos reales del mercado mexicano.
                </p>
              </MotionPreset>

              {/* Inline Form */}
              <MotionPreset fade slide={{ offset: 30 }} blur transition={{ duration: 0.4 }} delay={0.25}>
                <AutometricaValuationForm embedded compact />
              </MotionPreset>
            </div>
          </div>
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
                    Ingresa los datos de tu vehículo y recibe una oferta instantánea basada en el mercado.
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
                Valuación de auto gratis: Descubre cuánto vale tu vehículo
              </h2>

              <p className="text-slate-600 mb-4">
                ¿Te preguntas <strong>cuánto vale mi auto</strong>? Con TREFA puedes obtener una <strong>valuación de auto instantánea y gratuita</strong> basada en datos reales del mercado mexicano. Nuestra herramienta utiliza la <strong>Guía Autométrica</strong>, la referencia más confiable para conocer el valor de tu vehículo.
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
                    La cotización inicial es un estimado basado en los datos que proporcionas. El precio final se confirma después de la inspección física del vehículo.
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
              Obtén tu cotización gratuita ahora y descubre cuánto vale tu vehículo.
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
