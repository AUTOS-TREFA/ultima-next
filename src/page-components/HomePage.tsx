'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useVehicles } from '../context/VehicleContext';
import type { Vehicle } from '../types/types';
import useIntersectionObserver from '../hooks/useIntersectionObserver';
import {
    CarIcon as Car,
    FileTextIcon as FileText,
    CheckIcon as Check,
    ArrowRightIcon as ArrowRight
} from '../components/icons';
import { ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';
import WallOfLove from '../components/WallOfLove';
import { formatPrice } from '../utils/formatters';
import { getVehicleImage } from '../utils/getVehicleImage';
import WhyChooseTrefaSection from '../components/WhyChooseTrefaSection';
import VehicleGridCard from '../components/VehicleGridCard';
import LazyImage from '../components/LazyImage';
import { proxyImage } from '../utils/proxyImage';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../utils/constants';
import Sparkles from '../components/Sparkles';
// import { useConfig } from '../context/ConfigContext';



/* ---------- Hero Vehicle Card ---------- */
const HeroVehicleCard: React.FC<{ vehicle: Vehicle }> = React.memo(({ vehicle }) => {
  const imageSrc = getVehicleImage(vehicle);

  return (
    <div className="relative h-full group">
      <div className="h-full rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="relative aspect-[4/3] bg-gray-100">
          <LazyImage
            src={imageSrc}
            alt={vehicle.titulo}
            className="w-full h-full"
            objectFit="cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
            <h3
              className="text-white font-bold text-sm truncate drop-shadow-md"
              title={vehicle.titulo}
            >
              {vehicle.titulo}
            </h3>
            <p className="text-primary-400 font-semibold text-base drop-shadow-md">
              {formatPrice(vehicle.precio)}
            </p>
          </div>
        </div>
      </div>
      <Link href={`/autos/${vehicle.slug}`} className="absolute inset-0 z-10">
        <span className="sr-only">Ver detalles de {vehicle.titulo}</span>
      </Link>
    </div>
  );
});

/* ---------- Shimmer Span ---------- */
const ShimmerSpan: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = '',
}) => (
  <span
    className={`inline-block bg-gradient-to-r bg-[length:200%_100%] bg-clip-text text-transparent group-data-[visible=true]:animate-shimmer ${className}`}
  >
    {children}
  </span>
);

/* ---------- Scroller Row ---------- */
const ScrollerRow: React.FC<{ vehicles: Vehicle[]; reverse?: boolean; speed?: number }> = ({
  vehicles,
  reverse = false,
  speed = 40,
}) => {
  // The duplication logic was flawed and is removed. 
  // The parent component is responsible for providing enough vehicles.
  const extendedVehicles = [...vehicles];

  const ScrollerContent = () => (
    <>
      {extendedVehicles.map((v, i) => (
        <div key={`${v.id}-${i}`} className="flex-shrink-0 w-44 sm:w-60 h-auto">
          <HeroVehicleCard vehicle={v} />
        </div>
      ))}
    </>
  );

  return (
    <div
      className={`flex gap-4 ${reverse ? 'animate-scroll-right' : 'animate-scroll-left'}`}
      style={{ animationDuration: `${speed}s` }}
    >
      <div className="flex flex-shrink-0 gap-4 min-w-full">
        <ScrollerContent />
      </div>
      <div className="flex flex-shrink-0 gap-4 min-w-full">
        <ScrollerContent />
      </div>
    </div>
  );
};

/* ---------- New Hero Section ---------- */
const NewHeroSection: React.FC = () => {
  const { vehicles: allVehicles, isLoading } = useVehicles();
  const [displayVehicles, setDisplayVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    if (allVehicles && allVehicles.length > 0) {
      const available = allVehicles.filter(v => 
        !v.separado && 
        !v.vendido &&
        getVehicleImage(v) !== DEFAULT_PLACEHOLDER_IMAGE
      );
      const shuffled = [...available].sort(() => 0.5 - Math.random());
      setDisplayVehicles(shuffled);
    }
  }, [allVehicles]);

  const rows = useMemo(() => {
    if (displayVehicles.length === 0) {
      return { row1: [], row2: [] };
    }
    // Ensure there are enough vehicles to populate both rows by duplicating if necessary.
    let vehiclesForHero = [...displayVehicles];
    while (vehiclesForHero.length < 14) {
      vehiclesForHero.push(...displayVehicles);
    }
    vehiclesForHero = vehiclesForHero.slice(0, 14);
    
    const midPoint = Math.ceil(vehiclesForHero.length / 2);
    return {
      row1: vehiclesForHero.slice(0, midPoint),
      row2: vehiclesForHero.slice(midPoint),
    };
  }, [displayVehicles]);

  return (
    <section className="relative w-full overflow-hidden lg:pt-12 pb-8">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 -left-24 w-72 h-72 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/2 -right-24 w-72 h-72 bg-orange-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-trefa-blue/10 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10 mt-12 lg:mb-12">
        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-tight sm:leading-tight animate-fade-in-down">
          Encuentra tu próximo auto
        </h1>
      </div>

      {displayVehicles.length >= 1 ? (
        <div className="h-[320px] md:h-[420px] relative flex justify-start items-start mask-gradient">
          <div className="absolute top-0 left-0 w-full flex flex-col justify-center gap-2 h-full">
            <ScrollerRow vehicles={rows.row1} speed={25} />
            <ScrollerRow vehicles={rows.row2} reverse speed={35} />
          </div>
        </div>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center mt-6">
          <p className="text-gray-400">
            {isLoading
              ? 'Cargando inventario...'
              : 'Actualizando lo más nuevo de nuestro inventario...'}
          </p>
        </div>
      )}

      <div className="mt-12 sm:mt-14 text-center">
        <Link
          href="/autos"
          data-gtm-id="cta-principal-inicio"
          className="inline-block text-xl font-semibold transition-all duration-300 px-10 py-5 rounded-lg text-white shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 bg-gradient-to-r from-orange-400 to-orange-600 hover:from-orange-500 hover:to-orange-700"
        >
          Ver el inventario completo
        </Link>
      </div>
    </section>
  );
};

/* ---------- Section ---------- */
const Section: React.FC<{ children: React.ReactNode; className?: string; id?: string }> = ({
  children,
  className = '',
  id,
}) => (
  <section id={id} className={`relative py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 w-full overflow-hidden ${className}`}>
    <div className="max-w-7xl mx-auto">{children}</div>
  </section>
);

/* ---------- Animated Header ---------- */
const AnimatedHeader: React.FC<{ title: React.ReactNode; subtitle: string }> = ({
  title,
  subtitle,
}) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  return (
    <div
      ref={ref}
      data-visible={isVisible}
      className={`text-center transition-all duration-700 ease-out group ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
      }`}
    >
      <h2 className="text-5xl lg:text-6xl font-bold tracking-tight text-gray-900 leading-snug lg:leading-tight">
        {title}
      </h2>
      <p className="mt-4 text-lg max-w-3xl mx-auto leading-relaxed">{subtitle}</p>
    </div>
  );
};

/* ---------- Step Card ---------- */
const StepCard: React.FC<{ icon: React.ElementType; title: string; description: string }> =
  React.memo(({ icon: Icon, title, description }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.2 });
    return (
      <div
        ref={ref}
        className={`transition-all duration-500 ease-out ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
        }`}
      >
        <div className="flex items-center justify-center w-20 h-20 rounded-full border-4 mb-6 mx-auto bg-white/10 border-white/30">
          <Icon className="w-10 h-10 text-white" />
        </div>
        <h3 className="text-xl font-extrabold text-white">{title}</h3>
        <p className="mt-2 text-white/80">{description}</p>
      </div>
    );
  });

/* ---------- How It Works Section ---------- */
const HowItWorksSection: React.FC = () => {
  const steps = useMemo(
    () => [
      {
        icon: Car,
        title: '1. Elige un auto',
        description: 'Explora nuestro inventario certificado y encuentra el auto perfecto para ti.',
      },
      {
        icon: FileText,
        title: '2. Haz click en Financiar',
        description:
          'Completa tu solicitud de financiamiento 100% en línea de forma rápida y segura.',
      },
      {
        icon: Check,
        title: '3. Envía tu solicitud',
        description:
          'En menos de 24 horas recibirás una respuesta del banco con mayores probabilidades de aprobar tu crédito.',
      },
    ],
    []
  );

  return (
    <Section className="bg-gradient-to-br from-orange-500 to-amber-700 hover:to-orange-700 text-white">
      <AnimatedHeader
        title={<span className="text-white">Así de fácil es estrenar</span>}
        subtitle="Nuestro proceso está diseñado para ser rápido, sencillo y completamente transparente. Además, cuentas con asesoría personalizada en cada paso del proceso vía WhatsApp."
      />
      <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
        {steps.map((step, index) => (
          <StepCard key={index} {...step} />
        ))}
      </div>
    </Section>
  );
};

/* ---------- Featured Inventory Section ---------- */
const FeaturedInventorySection: React.FC = () => {
  const { vehicles: allVehicles, isLoading } = useVehicles();
  const [displayVehicles, setDisplayVehicles] = useState<Vehicle[]>([]);

  useEffect(() => {
    if (allVehicles && allVehicles.length > 0) {
      const available = allVehicles.filter(v => 
        !v.separado && 
        !v.vendido && 
        getVehicleImage(v) !== DEFAULT_PLACEHOLDER_IMAGE
      );
      const shuffled = [...available].sort(() => 0.5 - Math.random()).slice(0, 4);
      setDisplayVehicles(shuffled);
    }
  }, [allVehicles]);

  return (
    <Section className="bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <AnimatedHeader
          title={
            <ShimmerSpan className="from-gray-900 via-gray-600 to-gray-900">
              Inventario Destacado
            </ShimmerSpan>
          }
          subtitle="Una selección de nuestros autos más populares, inspeccionados rigurosamente y con el tanque lleno, listos para tu nueva aventura o regresar contigo a casa."
        />
      </div>
      <div className="mt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {isLoading ? (
          <div className="col-span-full text-center text-gray-500">Cargando vehículos...</div>
        ) : displayVehicles.length > 0 ? (
          displayVehicles.map(vehicle => <VehicleGridCard key={vehicle.id} vehicle={vehicle} />)
        ) : (
          <div className="col-span-full text-center text-gray-500">No hay vehículos disponibles</div>
        )}
      </div>
      <div className="mt-12 text-center">
        <Link
          href="/autos"
          className="text-base font-semibold text-primary-600 hover:text-primary-700 transition-colors"
        >
          Conocer nuestro famoso inventario &rarr;
        </Link>
      </div>
    </Section>
  );
};

const AnimatedHeading: React.FC<{ children: React.ReactNode, as?: 'h2' | 'h3', className?: string }> = ({ children, as: Component = 'h2', className }) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
    return (
        <Component
            ref={ref}
            className={`transition-all duration-700 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'} ${className}`}
        >
            {children}
        </Component>
    );
};

/* ---------- YouTube VSL Section ---------- */
const YouTubeVSLSection: React.FC = () => {
  return (
    <div className="bg-white pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-3xl overflow-hidden relative" style={{ paddingBottom: '56.25%', height: 0 }}>
          <iframe
            className="absolute top-0 left-0 w-full h-full"
            src="https://www.youtube.com/embed/p-nMlle-xfw?rel=0"
            title="TREFA VSL"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
        </div>
      </div>
    </div>
  );
};

/* ---------- Landing Page Hero Section ---------- */
const LandingPageHero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-white">
      {/* Desktop background vehicles */}
      <div className="hidden lg:block absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute right-0 xl:right-16 bottom-0">
          <img
            src="https://r2.trefa.mx/Frame%2040%20(1).png"
            alt="TREFA Vehicle"
            className="w-[425px] xl:w-[510px] h-auto object-contain opacity-40"
          />
        </div>
        <div className="absolute left-0 xl:left-16 bottom-0">
          <img
            src="https://r2.trefa.mx/r9GDYibmXVaw8Zv93n4Bfi9TIs.png.webp"
            alt="TREFA Vehicle"
            className="w-[425px] xl:w-[510px] h-auto object-contain scale-x-[-1] opacity-40"
          />
        </div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-t to-transparent blur-3xl rounded-t-full from-primary/20 translate-y-1/2 w-[80%] h-96" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10 py-8 lg:py-20 lg:min-h-[88dvh] lg:flex lg:items-center">
        <div className="flex flex-col items-center text-center space-y-4 lg:space-y-6 w-full">
          <span className="px-3 py-1 lg:px-4 bg-gradient-to-r from-primary/10 to-secondary/5 border border-primary/30 hover:from-primary/20 hover:to-secondary/10 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md rounded-full inline-flex items-center gap-2 text-xs lg:text-sm">
            <ShieldCheck className="w-3 h-3 text-primary" />
            <span className="font-medium">Autos Seminuevos Certificados</span>
          </span>

          <motion.h1 className="font-heading text-2xl md:text-4xl lg:text-6xl font-bold tracking-tight max-w-4xl leading-tight">
            Tu próximo auto seminuevo te está esperando
          </motion.h1>

          <p className="text-sm md:text-base lg:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Encuentra el auto perfecto en nuestra selección de vehículos seminuevos 2019 en
            adelante. SUVs, Sedanes, Hatchbacks y Pick Ups con garantía y financiamiento
            disponible.
          </p>

          {/* Mobile image - shown only on mobile */}
          <div className="lg:hidden w-full max-w-xs mx-auto my-6">
            <img
              src="https://r2.trefa.mx/r9GDYibmXVaw8Zv93n4Bfi9TIs.png.webp"
              alt="TREFA Vehicle Showcase"
              className="w-full h-auto object-contain"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4 pt-2 lg:pt-4 w-full sm:w-auto">
            <Link href="/autos" className="inline-flex items-center justify-center gap-2 bg-background text-foreground border-2 border-input hover:bg-accent hover:text-accent-foreground px-6 py-2.5 lg:px-8 lg:py-3 rounded-lg font-semibold transition-all text-sm lg:text-base">
              Ver Inventario
              <Car className="w-4 h-4" />
            </Link>
            <Link href="/kit-trefa" className="inline-flex items-center justify-center gap-2 bg-primary text-white hover:bg-primary/90 px-6 py-2.5 lg:px-8 lg:py-3 rounded-lg font-semibold shadow-lg transition-all text-sm lg:text-base">
              Conoce el Kit de Seguridad
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="flex flex-col items-center space-y-3 lg:space-y-4 mt-6 lg:mt-10">
            <p className="text-xs lg:text-sm text-muted-foreground">
              Más de 5,000 autos vendidos y clientes satisfechos
            </p>
            <div className="flex items-center space-x-4 lg:space-x-6 opacity-60 flex-wrap justify-center gap-y-3 gap-x-3 lg:gap-y-4 lg:gap-x-4">
              <div className="flex items-center space-x-2">
                <img src="/images/Honda.png" alt="Honda" className="h-5 lg:h-7 w-auto opacity-70" />
                <span className="text-sm lg:text-base font-semibold hidden sm:inline">Honda</span>
              </div>
              <div className="flex items-center space-x-2">
                <img src="/images/Toyota.png" alt="Toyota" className="h-5 lg:h-7 w-auto opacity-70" />
                <span className="text-sm lg:text-base font-semibold hidden sm:inline">Toyota</span>
              </div>
              <div className="flex items-center space-x-2">
                <img src="/images/Nissan.png" alt="Nissan" className="h-5 lg:h-7 w-auto opacity-70" />
                <span className="text-sm lg:text-base font-semibold hidden sm:inline">Nissan</span>
              </div>
              <div className="flex items-center space-x-2">
                <img src="/images/Mazda.png" alt="Mazda" className="h-5 lg:h-7 w-auto opacity-70" />
                <span className="text-sm lg:text-base font-semibold hidden sm:inline">Mazda</span>
              </div>
              <div className="flex items-center space-x-2">
                <img src="/images/Jeep.png" alt="Jeep" className="h-5 lg:h-7 w-auto opacity-70" />
                <span className="text-sm lg:text-base font-semibold hidden sm:inline">Jeep</span>
              </div>
              <div className="flex items-center space-x-2">
                <img src="/images/Kia.png" alt="Kia" className="h-5 lg:h-7 w-auto opacity-70" />
                <span className="text-sm lg:text-base font-semibold hidden sm:inline">Kia</span>
              </div>
            </div>
            <p className="text-xs lg:text-sm text-muted-foreground">
              y 15 de las mejores marcas más...
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

/* ---------- Testimonio Separator ---------- */
const TestimonioSeparator: React.FC = () => {
  return (
    <div className="bg-white w-full">
      <LazyImage
        src="/images/testimonio.png"
        alt="Testimonio de cliente TREFA"
        className="w-full h-auto"
        objectFit="contain"
      />
    </div>
  );
};

/* ---------- CTA Cards Section ---------- */
const CTACardsSection: React.FC = () => {
  const { vehicles: allVehicles } = useVehicles();
  const router = useRouter();

  const marcas = useMemo(() => {
    if (!allVehicles) return [];
    const allMarcas = allVehicles.map(v => v.automarca).filter(Boolean);
    const uniqueMarcas = [...new Set(allMarcas)];
    return uniqueMarcas.slice(0, 12).map(marcaName => ({
        id: marcaName,
        name: marcaName,
        slug: marcaName.toLowerCase().replace(/\s+/g, '-'),
        logoUrl: '/images/trefalogo.png'
    }));
  }, [allVehicles]);

  const handleFilterClick = (filterKey: string, filterValue: string) => {
    if (filterKey === 'automarca') {
        router.push(`/marcas/${filterValue.toLowerCase()}`);
    } else if (filterKey === 'classification') {
        router.push(`/carroceria/${filterValue.toLowerCase()}`);
    } else {
        const params = new URLSearchParams();
        if (filterValue) {
             params.set(filterKey, filterValue);
        }
        router.push(`/autos?${params.toString()}`);
    }
  };

  return (
    <Section className="bg-white">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Card */}
        <div className="bg-trefa-bgradient-down text-white rounded-3xl relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
          <div className="p-4 md:p-12 flex flex-col md:flex-row md:items-center justify-between">
            <div className="relative z-10 text-center md:text-left md:w-1/2 lg:w-3/5">
              <AnimatedHeading as="h2" className="text-4xl md:text-5xl font-bold">Conoce nuestro inventario</AnimatedHeading>
              <p className="mt-4 text-lg text-gray-300">
                Autos seminuevos seleccionados cuidadosamente para ti.
              </p>
              <Link href="/autos" className="mt-8 inline-flex items-center font-semibold group text-lg">
                Ver inventario
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="relative md:w-1/2 lg:w-3/5 mt-7 md:mt-0 h-32 md:h-64">
              <img
                src={proxyImage(
                  'https://cufm.mx/wp-content/uploads/2025/01/autos-trefa-.png'
                )}
                alt="Inventario de autos TREFA"
                className="absolute bottom-0 right-0 w-full h-auto max-h-full object-contain object-right-bottom transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>

        {/* Middle Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Sell Car Card */}
          <div className="bg-trefa-bgradient-right text-white rounded-3xl p-6 md:p-10 relative overflow-hidden min-h-[20rem] flex flex-col justify-between group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="relative z-10">
              <AnimatedHeading as="h3" className="text-4xl font-bold">¿Quieres vender tu auto?</AnimatedHeading>
              <p className="mt-2 text-gray-300">
                Recibe una oferta por tu auto en un proceso rápido y transparente.
              </p>
              <Link
                href="/vender-mi-auto"
                className="mt-6 inline-flex items-center font-semibold group text-lg"
              >
                Recibir una oferta
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <img
              src="https://pemgwyymodlwabaexxrb.supabase.co/storage/v1/object/public/fotos_airtable/app/klipartz.com.png"
              alt="Vende tu auto"
              className="absolute bottom-0 right-0 w-1/2 max-w-[200px] object-contain pointer-events-none opacity-90 group-hover:opacity-80 transition-all duration-300 group-hover:scale-110"
            />
          </div>

          {/* Contact Advisor Card */}
          <div className="bg-trefa-bgradient-left text-white rounded-3xl p-6 md:p-10 relative overflow-hidden min-h-[20rem] flex flex-col justify-between group transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
            <div className="relative z-10">
              <AnimatedHeading as="h3" className="text-4xl font-bold">Hablar con un asesor</AnimatedHeading>
              <p className="mt-2 text-gray-300">
                Obtén una asesoría personalizada de un experto de nuestro equipo.
              </p>
              <a
                href="https://wa.me/5218187049079"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center font-semibold group text-lg"
              >  Iniciar Chat

               <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </a>
            </div>
            <img
              src="/images/fer-help.png"
              alt="TREFA Fernando"
              className="absolute bottom-0 right-0 w-1/2 max-w-[200px] object-contain pointer-events-none opacity-100 group-hover:opacity-90 transition-all duration-300 group-hover:scale-110"
            />
          </div>
        </div>

        {/* Bottom Card */}
        <div className="bg-trefa-bgradient-up text-white border-xl rounded-3xl relative overflow-hidden group transition-all duration-300 hover:shadow-xl hover:-translate-y-0.5">
          <div className="p-6 md:p-14 flex flex-col md:flex-row md:items-center justify-between">
            <div className="relative z-10 text-center md:text-left md:w-1/2 lg:w-3/5">
              <AnimatedHeading as="h2" className="text-4xl md:text-5xl font-bold">Tramita tu crédito en línea</AnimatedHeading>
              <p className="mt-4 text-lg text-gray-100">
                Nuevo portal de financiamiento con respuesta en 24 horas o menos.
              </p>
              <Link
                href="/escritorio/aplicacion"
                className="mt-8 text-trefa-primary inline-flex items-center font-semibold group text-lg"
              >
                Ver autos elegibles
                <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
            <div className="relative md:w-1/2 lg:w-2/5 mt-8 md:mt-0 h-50 md:h-64">
              <img
                src="https://pemgwyymodlwabaexxrb.supabase.co/storage/v1/object/public/fotos_airtable/app/financiamiento.png"
                alt="Financiamiento en línea"
                className="absolute bottom-0 right-0 w-full h-auto max-h-[90%] md:max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
              />
            </div>
          </div>
        </div>
      </div>
    </Section>
  );
};

/* ---------- Home Page ---------- */
const HomePage: React.FC = () => {
  // SEO metadata is handled in the page.tsx file in Next.js

  return (
    <main className="relative z-10">
      <LandingPageHero />
      <NewHeroSection />
      <CTACardsSection />
      <YouTubeVSLSection />
      <WhyChooseTrefaSection />
      <TestimonioSeparator />
      <FeaturedInventorySection />
      <HowItWorksSection />
      <WallOfLove />
    </main>
  );
};

export default HomePage;