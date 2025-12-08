'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRightIcon as ArrowRight, CheckCircleIcon as CheckCircle } from '../components/icons';
import LazyImage from '../components/LazyImage';

const AboutPage: React.FC = () => {
  // SEO metadata is handled in the page.tsx file in Next.js

  const values = [
    {
      title: 'Transparencia',
      description: 'Información clara y honesta en cada transacción'
    },
    {
      title: 'Calidad Certificada',
      description: 'Todos nuestros autos pasan inspección de 150 puntos'
    },
    {
      title: 'Servicio Personalizado',
      description: 'Asesoría dedicada en cada paso del proceso'
    },
    {
      title: 'Financiamiento Ágil',
      description: 'Respuesta en menos de 24 horas'
    }
  ];

  const milestones = [
    {
      year: '2020',
      title: 'Fundación de TREFA',
      description: 'Iniciamos con la misión de transformar la compra-venta de autos seminuevos en Monterrey'
    },
    {
      year: '2021',
      title: 'Certificación de Calidad',
      description: 'Implementamos nuestro riguroso proceso de inspección de 150 puntos'
    },
    {
      year: '2022',
      title: 'Plataforma Digital',
      description: 'Lanzamos nuestra plataforma 100% digital de financiamiento'
    },
    {
      year: '2023',
      title: '1000+ Clientes Felices',
      description: 'Alcanzamos más de mil familias satisfechas con su nuevo auto'
    }
  ];

  return (
    <div className="w-full">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-orange-500 to-amber-700 text-white py-20 sm:py-28 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-1/4 -left-24 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/2 -right-24 w-96 h-96 bg-white rounded-full mix-blend-overlay filter blur-3xl animate-blob animation-delay-2000"></div>
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black tracking-tight leading-none mb-6">
              Conócenos
            </h1>
            <p className="text-xl sm:text-2xl text-white/90 leading-relaxed">
              Somos la agencia de autos seminuevos que está transformando la forma de comprar y vender autos en Monterrey
            </p>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <LazyImage
                src="/images/hero-showroom.webp"
                alt="TREFA Showroom"
                className="w-full h-full"
                objectFit="cover"
              />
            </div>
            <div>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
                Nuestra Misión
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                En TREFA, nuestra misión es hacer que la compra y venta de autos seminuevos sea una experiencia simple, transparente y confiable para todos nuestros clientes en Monterrey y el área metropolitana.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Nos comprometemos a ofrecer autos de la más alta calidad, respaldados por inspecciones rigurosas y un proceso de financiamiento ágil que pone a nuestros clientes primero.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed">
                Creemos que cada persona merece tener acceso a un auto confiable que se ajuste a su presupuesto, y trabajamos todos los días para hacer esa visión una realidad.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              Nuestros Valores
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Los principios que guían cada decisión y acción en TREFA
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-700 mb-6 mx-auto">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3 text-center">
                  {value.title}
                </h3>
                <p className="text-gray-600 text-center leading-relaxed">
                  {value.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Timeline Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-4">
              Nuestra Historia
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              El camino que nos ha llevado a ser líderes en el mercado de seminuevos
            </p>
          </div>

          <div className="space-y-12">
            {milestones.map((milestone, index) => (
              <div
                key={index}
                className="relative pl-8 sm:pl-32 group"
              >
                {/* Timeline line */}
                {index !== milestones.length - 1 && (
                  <div className="absolute left-3 sm:left-8 top-8 h-full w-0.5 bg-orange-200"></div>
                )}

                {/* Year badge */}
                <div className="absolute left-0 sm:left-0 top-0 w-20 h-20 rounded-full bg-gradient-to-br from-orange-500 to-amber-700 flex items-center justify-center shadow-lg">
                  <span className="text-white font-black text-sm">{milestone.year}</span>
                </div>

                {/* Content */}
                <div className="bg-gray-50 rounded-2xl p-6 sm:p-8 shadow-md hover:shadow-lg transition-all duration-300">
                  <h3 className="text-2xl font-bold text-gray-900 mb-3">
                    {milestone.title}
                  </h3>
                  <p className="text-gray-600 leading-relaxed">
                    {milestone.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Team Image Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl sm:text-5xl font-black text-gray-900 mb-6">
                Un Equipo Comprometido
              </h2>
              <p className="text-lg text-gray-700 leading-relaxed mb-6">
                Nuestro equipo de asesores expertos está aquí para guiarte en cada paso del proceso, desde la selección del auto perfecto hasta el cierre de tu financiamiento.
              </p>
              <p className="text-lg text-gray-700 leading-relaxed mb-8">
                Con años de experiencia en la industria automotriz, conocemos las necesidades de nuestros clientes y trabajamos incansablemente para superar sus expectativas.
              </p>
              <Link
                href="/vacantes"
                className="inline-flex items-center text-lg font-semibold text-orange-600 hover:text-orange-700 transition-colors group"
              >
                Únete a nuestro equipo
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-2xl">
              <LazyImage
                src="/images/fer-help.png"
                alt="Equipo TREFA"
                className="w-full h-full"
                objectFit="contain"
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-orange-500 to-amber-700 text-white">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl sm:text-5xl font-black mb-6">
            ¿Listo para tu próximo auto?
          </h2>
          <p className="text-xl mb-10 text-white/90">
            Descubre por qué más de mil familias han confiado en TREFA para encontrar su auto ideal
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/autos"
              className="inline-block text-lg font-semibold transition-all duration-300 px-8 py-4 rounded-lg bg-white text-orange-600 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
            >
              Ver Inventario
            </Link>
            <Link
              href="/vender-mi-auto"
              className="inline-block text-lg font-semibold transition-all duration-300 px-8 py-4 rounded-lg border-2 border-white text-white hover:bg-white hover:text-orange-600"
            >
              Vender mi Auto
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutPage;
