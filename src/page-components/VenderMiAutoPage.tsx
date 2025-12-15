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
  Star,
  Users,
  TrendingUp,
  Zap,
  Car
} from 'lucide-react';

const VenderMiAutoPage: React.FC = () => {
  return (
    <main className="flex-1 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
      {/* Hero Section */}
      <section className="relative">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
          <div className="grid gap-8 lg:grid-cols-2 lg:gap-16 items-center">

            {/* Left Column - Content & Form */}
            <div className="flex flex-col gap-6">
              <MotionPreset fade slide={{ offset: 50 }} blur transition={{ duration: 0.5 }} delay={0.1}>
                <Badge variant="outline" className="w-fit px-3 py-1 bg-primary-50 text-primary-700 border-primary-200">
                  <Zap className="w-3 h-3 mr-1" />
                  Valuación instantánea
                </Badge>
              </MotionPreset>

              <MotionPreset fade slide={{ offset: 50 }} blur transition={{ duration: 0.5 }} delay={0.2}>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 leading-tight">
                  ¿Cuánto vale tu auto?
                  <span className="block text-primary-600">Descúbrelo en segundos</span>
                </h1>
              </MotionPreset>

              <MotionPreset fade slide={{ offset: 50 }} blur transition={{ duration: 0.5 }} delay={0.3}>
                <p className="text-lg text-gray-600 max-w-xl">
                  Recibe una <strong>oferta de compra instantánea</strong> basada en datos reales del mercado mexicano.
                  Sin costo, sin compromiso, sin salir de casa.
                </p>
              </MotionPreset>

              {/* Trust Indicators */}
              <MotionPreset fade slide={{ offset: 50 }} blur transition={{ duration: 0.5 }} delay={0.4}>
                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                  <div className="flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    <span>4.9/5 estrellas</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4 text-primary-500" />
                    <span>+2,500 autos vendidos</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-4 h-4 text-green-500" />
                    <span>Mejores precios</span>
                  </div>
                </div>
              </MotionPreset>

              {/* Inline Form */}
              <MotionPreset fade slide={{ offset: 50 }} blur transition={{ duration: 0.5 }} delay={0.5}>
                <div className="mt-4">
                  <AutometricaValuationForm embedded />
                </div>
              </MotionPreset>

              {/* Micro-copy for SEO */}
              <MotionPreset fade blur transition={{ duration: 0.5 }} delay={0.6}>
                <p className="text-xs text-gray-400 mt-2">
                  Cotización gratuita • Datos de Guía Autométrica • Pago en 24 horas
                </p>
              </MotionPreset>
            </div>

            {/* Right Column - Image */}
            <MotionPreset
              fade
              slide={{ direction: 'right', offset: 100 }}
              blur
              transition={{ duration: 0.7 }}
              delay={0.4}
              className="relative hidden lg:block"
            >
              <div className="relative">
                {/* Background shape */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary-100 to-primary-200 rounded-[40px] transform rotate-3" />

                {/* Main Image */}
                <div className="relative z-10 rounded-[36px] overflow-hidden shadow-2xl">
                  <Image
                    src="/images/landing-asset-main.png"
                    alt="Vende tu auto con TREFA - Valuación instantánea"
                    width={600}
                    height={500}
                    className="w-full h-auto object-cover"
                    priority
                  />
                </div>

                {/* Floating badge */}
                <div className="absolute -bottom-4 -left-4 z-20 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center">
                      <DollarSign className="w-6 h-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Promedio de oferta</p>
                      <p className="text-lg font-bold text-gray-900">$185,000</p>
                    </div>
                  </div>
                </div>

                {/* Second floating badge */}
                <div className="absolute -top-4 -right-4 z-20 bg-white rounded-2xl shadow-xl p-4 border border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Tiempo de pago</p>
                      <p className="text-lg font-bold text-gray-900">24 horas</p>
                    </div>
                  </div>
                </div>
              </div>
            </MotionPreset>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <MotionPreset fade blur transition={{ duration: 0.5 }}>
            <div className="text-center mb-12">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                ¿Por qué vender tu auto con TREFA?
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
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
                <h3 className="font-bold text-lg text-gray-900 mb-2">Mejor precio del mercado</h3>
                <p className="text-sm text-gray-600">
                  Precios competitivos basados en datos reales de la Guía Autométrica.
                </p>
              </div>
            </MotionPreset>

            <MotionPreset fade slide={{ offset: 30 }} blur transition={{ duration: 0.5 }} delay={0.2}>
              <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-blue-100 flex items-center justify-center mb-4">
                  <Clock className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Pago en 24 horas</h3>
                <p className="text-sm text-gray-600">
                  Recibe tu dinero al día siguiente. Sin esperas, sin complicaciones.
                </p>
              </div>
            </MotionPreset>

            <MotionPreset fade slide={{ offset: 30 }} blur transition={{ duration: 0.5 }} delay={0.3}>
              <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-purple-100 flex items-center justify-center mb-4">
                  <Shield className="w-7 h-7 text-purple-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">100% seguro</h3>
                <p className="text-sm text-gray-600">
                  Nos encargamos de todo el papeleo. Transacción segura y transparente.
                </p>
              </div>
            </MotionPreset>

            <MotionPreset fade slide={{ offset: 30 }} blur transition={{ duration: 0.5 }} delay={0.4}>
              <div className="bg-gray-50 rounded-2xl p-6 hover:shadow-lg transition-shadow">
                <div className="w-14 h-14 rounded-xl bg-orange-100 flex items-center justify-center mb-4">
                  <CheckCircle2 className="w-7 h-7 text-orange-600" />
                </div>
                <h3 className="font-bold text-lg text-gray-900 mb-2">Sin comisiones ocultas</h3>
                <p className="text-sm text-gray-600">
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
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">
                Vende tu auto en 3 simples pasos
              </h2>
              <p className="text-gray-600 max-w-2xl mx-auto">
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
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Cotiza tu auto</h3>
                  <p className="text-sm text-gray-600">
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
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Agenda inspección</h3>
                  <p className="text-sm text-gray-600">
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
                  <h3 className="font-bold text-lg text-gray-900 mb-2">Recibe tu pago</h3>
                  <p className="text-sm text-gray-600">
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
              <h2 className="text-2xl font-bold text-gray-900 mb-6">
                Valuación de auto gratis: Descubre cuánto vale tu vehículo
              </h2>

              <p className="text-gray-600 mb-4">
                ¿Te preguntas <strong>cuánto vale mi auto</strong>? Con TREFA puedes obtener una <strong>valuación de auto instantánea y gratuita</strong> basada en datos reales del mercado mexicano. Nuestra herramienta utiliza la <strong>Guía Autométrica</strong>, la referencia más confiable para conocer el valor de tu vehículo.
              </p>

              <p className="text-gray-600 mb-4">
                Ya sea que quieras <strong>vender tu auto usado</strong>, conocer su valor de mercado, o simplemente curiosear, nuestra <strong>cotización de auto en línea</strong> te da un estimado preciso en segundos. Sin costo, sin compromiso, sin necesidad de agendar citas.
              </p>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                ¿Cómo funciona la valuación de autos?
              </h3>

              <p className="text-gray-600 mb-4">
                Nuestro sistema de <strong>tasación de autos</strong> considera múltiples factores: marca, modelo, año, versión y kilometraje. Cruzamos esta información con los precios actuales del mercado para darte una <strong>oferta de compra real</strong> que puedes aceptar hoy mismo.
              </p>

              <div className="bg-primary-50 rounded-2xl p-6 my-8 border border-primary-100">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center flex-shrink-0">
                    <Car className="w-6 h-6 text-primary-600" />
                  </div>
                  <div>
                    <h4 className="font-bold text-gray-900 mb-2">
                      ¿Listo para cotizar tu auto?
                    </h4>
                    <p className="text-sm text-gray-600 mb-0">
                      Usa nuestro formulario arriba y recibe una oferta de compra instantánea.
                      Es gratis, rápido y sin compromiso.
                    </p>
                  </div>
                </div>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mt-8 mb-4">
                Preguntas frecuentes sobre venta de autos
              </h3>

              <div className="space-y-4">
                <details className="group bg-gray-50 rounded-xl p-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                    ¿Cuánto tiempo tarda el proceso de venta?
                    <span className="ml-2 text-primary-600 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-gray-600 mt-3 text-sm">
                    El proceso completo puede completarse en tan solo 24-48 horas. Desde la cotización hasta el pago, nos encargamos de todo para que sea lo más rápido posible.
                  </p>
                </details>

                <details className="group bg-gray-50 rounded-xl p-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                    ¿Qué documentos necesito para vender mi auto?
                    <span className="ml-2 text-primary-600 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-gray-600 mt-3 text-sm">
                    Necesitas: factura original o carta factura, identificación oficial vigente, comprobante de domicilio, y tarjeta de circulación. Nosotros te ayudamos con el resto del papeleo.
                  </p>
                </details>

                <details className="group bg-gray-50 rounded-xl p-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                    ¿El precio cotizado es negociable?
                    <span className="ml-2 text-primary-600 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-gray-600 mt-3 text-sm">
                    La cotización inicial es un estimado basado en los datos que proporcionas. El precio final se confirma después de la inspección física del vehículo.
                  </p>
                </details>

                <details className="group bg-gray-50 rounded-xl p-4">
                  <summary className="font-semibold text-gray-900 cursor-pointer list-none flex justify-between items-center">
                    ¿Compran autos con adeudos o problemas legales?
                    <span className="ml-2 text-primary-600 group-open:rotate-180 transition-transform">▼</span>
                  </summary>
                  <p className="text-gray-600 mt-3 text-sm">
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
