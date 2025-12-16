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
import TrefaTestimonials from '../components/shadcn-studio/blocks/testimonials-component-03/trefa-testimonials';
import { formatPrice } from '../utils/formatters';
import { getVehicleImage } from '../utils/getVehicleImage';
import WhyChooseTrefaSection from '../components/WhyChooseTrefaSection';
import VehicleGridCard from '../components/VehicleGridCard';
import LazyImage from '../components/LazyImage';
import { proxyImage } from '../utils/proxyImage';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../utils/constants';
import BranchesSection from '../components/BranchesSection';
import { Button } from '../components/ui/button';
import { cn } from '../lib/utils';
import { AppleCardsCarousel } from '../components/AppleCardsCarousel';
import HeroTrefa from '../components/ui/hero-trefa';
import AnimatedVehicleGrid from '../components/AnimatedVehicleGrid';
import Portfolio from '../components/shadcn-studio/blocks/portfolio-04/portfolio-04';
import HeroWithVehicles from '../components/HeroWithVehicles';
import ValuePropositionStatement from '../components/ValuePropositionStatement';
import HomePageContentService, {
  HeroContent,
  InventoryHeroContent,
  CarroceriaCarouselContent,
  CTACardsContent,
  YouTubeVSLContent,
  TestimonialContent,
  BranchesContent
} from '../services/HomePageContentService';

/* ---------- Hero Vehicle Card ---------- */
const HeroVehicleCard: React.FC<{ vehicle: Vehicle }> = React.memo(({ vehicle }) => {
  const imageSrc = getVehicleImage(vehicle);

  return (
    <div className="relative h-full group">
      <div className="h-full rounded-2xl shadow-md overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="relative aspect-[4/3] bg-gray-100">
          <LazyImage
            src={imageSrc}
            alt={vehicle.title}
            className="w-full h-full"
            objectFit="cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex flex-col justify-end p-3">
            <h3
              className="text-white font-bold text-sm truncate drop-shadow-md"
              title={vehicle.title}
            >
              {vehicle.title}
            </h3>
            <p className="text-primary-400 font-semibold text-base drop-shadow-md">
              {formatPrice(vehicle.precio)}
            </p>
          </div>
        </div>
      </div>
      <Link href={`/autos/${vehicle.slug}`} className="absolute inset-0 z-10">
        <span className="sr-only">Ver detalles de {vehicle.title}</span>
      </Link>
    </div>
  );
});

HeroVehicleCard.displayName = 'HeroVehicleCard';

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

/* ---------- Landing Page Hero Section ---------- */
const LandingPageHero: React.FC<{ content: HeroContent | null }> = ({ content }) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  // Default fallback content
  const defaultContent: HeroContent = {
    badgeText: "Autos Seminuevos Certificados",
    title: "Tu próximo auto seminuevo te está esperando",
    description: "Encuentra el auto perfecto en nuestra selección de autos seminuevos 2019 en adelante. SUVs, Sedanes, Hatchbacks y Pick Ups con garantía y financiamiento disponible.",
    desktopImageLeft: "https://r2.trefa.mx/r9GDYibmXVaw8Zv93n4Bfi9TIs.png.webp",
    desktopImageRight: "https://r2.trefa.mx/Frame%2040%20(1).png",
    mobileImage: "https://r2.trefa.mx/r9GDYibmXVaw8Zv93n4Bfi9TIs.png.webp",
    primaryButtonText: "Ver Inventario",
    primaryButtonLink: "/autos",
    secondaryButtonText: "Conoce el Kit de Seguridad",
    secondaryButtonLink: "/kit-trefa",
    statsText: "Más de 5,000 autos vendidos y clientes satisfechos",
    brandsText: "y 15 de las mejores marcas más..."
  };

  const heroContent = content || defaultContent;

  return (
    <section className="relative overflow-hidden bg-white min-h-[100dvh] flex items-center">
      {/* Animated Vehicle Grid Background - Full Screen */}
      {typeof window !== 'undefined' && (
        <AnimatedVehicleGrid
          maxVehicles={window.innerWidth < 768 ? 12 : 30}
          gradientDirection="diagonal"
        />
      )}

      {/* Desktop background vehicles - KEPT as secondary layer for depth */}
      <div className="hidden lg:block absolute inset-0 overflow-hidden pointer-events-none opacity-30">
        <motion.div
          className="absolute right-0 xl:right-16 bottom-0"
          initial={{ opacity: 0, x: 100 }}
          animate={{ opacity: 0.4, x: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <img
            src={heroContent.desktopImageRight}
            alt="TREFA Vehicle"
            className="w-[425px] xl:w-[510px] h-auto object-contain"
          />
        </motion.div>
        <motion.div
          className="absolute left-0 xl:left-16 bottom-0"
          initial={{ opacity: 0, x: -100 }}
          animate={{ opacity: 0.4, x: 0 }}
          transition={{ duration: 1, delay: 0.3 }}
        >
          <img
            src={heroContent.desktopImageLeft}
            alt="TREFA Vehicle"
            className="w-[425px] xl:w-[510px] h-auto object-contain scale-x-[-1]"
          />
        </motion.div>
        <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 bg-gradient-to-t to-transparent blur-3xl rounded-t-full from-primary/20 translate-y-1/2 w-[80%] h-96" />
      </div>

      <div className="container mx-auto px-4 lg:px-6 relative z-10">
        <div ref={ref} className="flex flex-col items-center text-center space-y-4 lg:space-y-6 w-full">
          <motion.span
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="px-3 py-1 lg:px-4 bg-gradient-to-r from-primary/10 to-secondary/5 border border-primary/30 hover:from-primary/20 hover:to-secondary/10 hover:border-primary/40 transition-all duration-300 shadow-sm hover:shadow-md rounded-full inline-flex items-center gap-2 text-xs lg:text-sm"
          >
            <ShieldCheck className="w-3 h-3 text-primary" />
            <span className="font-medium">{heroContent.badgeText}</span>
          </motion.span>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="font-heading text-3xl md:text-5xl lg:text-7xl font-black tracking-tight max-w-5xl leading-tight"
          >
            {heroContent.title}
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base md:text-lg lg:text-2xl text-slate-600 max-w-3xl leading-relaxed"
          >
            {heroContent.description}
          </motion.p>

          {/* Mobile image - shown only on mobile */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:hidden w-full max-w-xs mx-auto my-6"
          >
            <img
              src={heroContent.mobileImage}
              alt="TREFA Vehicle Showcase"
              className="w-full h-auto object-contain"
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 lg:gap-4 pt-2 lg:pt-4 w-full sm:w-auto"
          >
            <Button size="lg" variant="outline" asChild className="text-base lg:text-lg h-12 lg:h-14 px-6 lg:px-8">
              <Link href={heroContent.primaryButtonLink}>
                {heroContent.primaryButtonText}
                <Car className="w-4 h-4 ml-2" />
              </Link>
            </Button>
            <Button size="lg" asChild className="text-base lg:text-lg h-12 lg:h-14 px-6 lg:px-8">
              <Link href={heroContent.secondaryButtonLink}>
                {heroContent.secondaryButtonText}
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="flex flex-col items-center space-y-3 lg:space-y-4 mt-6 lg:mt-10"
          >
            <p className="text-xs lg:text-sm text-slate-600">
              {heroContent.statsText}
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
            <p className="text-xs lg:text-sm text-slate-600">
              {heroContent.brandsText}
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

/* ---------- New Hero Section ---------- */
const NewHeroSection: React.FC<{ content: InventoryHeroContent | null }> = ({ content }) => {
  const { vehicles: allVehicles, isLoading } = useVehicles();
  const [displayVehicles, setDisplayVehicles] = useState<Vehicle[]>([]);
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  // Default fallback content
  const defaultContent: InventoryHeroContent = {
    title: "Encuentra tu próximo auto",
    subtitle: "Explora nuestro inventario completo de seminuevos certificados",
    buttonText: "Ver el inventario completo",
    buttonLink: "/autos"
  };

  const inventoryContent = content || defaultContent;

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
    <section className="relative w-full overflow-hidden min-h-[100dvh] flex flex-col justify-center py-16 lg:py-24">
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute top-1/4 -left-24 w-72 h-72 bg-blue-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob"></div>
        <div className="absolute top-1/2 -right-24 w-72 h-72 bg-orange-500/10 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-72 h-72 bg-trefa-blue/10 rounded-full mix-blend-multiply filter blur-2xl opacity-20 animate-blob animation-delay-4000"></div>
      </div>

      <div ref={ref} className={cn(
        "max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center mb-10 lg:mb-16 transition-all duration-700",
        isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      )}>
        <h2 className="text-2xl font-bold md:text-3xl lg:text-4xl tracking-tight text-slate-800 leading-tight">
          {inventoryContent.title}
        </h2>
        <p className="mt-4 text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto">
          {inventoryContent.subtitle}
        </p>
      </div>

      {displayVehicles.length >= 1 ? (
        <div className="h-[320px] md:h-[420px] relative flex justify-start items-start mask-gradient mb-12">
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
        <Button size="lg" asChild className="text-xl font-semibold h-14 px-10">
          <Link href={inventoryContent.buttonLink} data-gtm-id="cta-principal-inicio">
            {inventoryContent.buttonText}
          </Link>
        </Button>
      </div>
    </section>
  );
};

/* ---------- Section ---------- */
const Section: React.FC<{ children: React.ReactNode; className?: string; id?: string; fullHeight?: boolean }> = ({
  children,
  className = '',
  id,
  fullHeight = false,
}) => (
  <section id={id} className={cn(
    "relative py-20 sm:py-24 lg:py-32 px-4 sm:px-6 lg:px-8 w-full overflow-hidden",
    fullHeight && "min-h-[100dvh] flex flex-col justify-center",
    className
  )}>
    <div className="max-w-7xl mx-auto w-full">{children}</div>
  </section>
);

/* ---------- Animated Header ---------- */
const AnimatedHeader: React.FC<{ title: React.ReactNode; subtitle: string; className?: string }> = ({
  title,
  subtitle,
  className,
}) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });
  return (
    <div
      ref={ref}
      data-visible={isVisible}
      className={cn(
        "text-center transition-all duration-700 ease-out group",
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
        className
      )}
    >
      <h2 className="text-2xl font-bold md:text-3xl lg:text-4xl tracking-tight text-slate-800 leading-tight">
        {title}
      </h2>
      <p className="mt-4 text-lg lg:text-xl text-slate-600 max-w-3xl mx-auto leading-relaxed">{subtitle}</p>
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
        <h3 className="text-2xl lg:text-3xl font-bold text-white">{title}</h3>
        <p className="mt-3 text-lg text-white/90">{description}</p>
      </div>
    );
  });

StepCard.displayName = 'StepCard';

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
    <Section className="bg-gradient-to-br from-orange-500 to-amber-700 text-white" fullHeight>
      <AnimatedHeader
        title={<span className="text-white">Así de fácil es estrenar</span>}
        subtitle="Nuestro proceso está diseñado para ser rápido, sencillo y completamente transparente. Además, cuentas con asesoría personalizada en cada paso del proceso vía WhatsApp."
        className="text-white"
      />
      <div className="mt-16 lg:mt-20 grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12 text-center">
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
    <Section className="bg-gray-50" fullHeight>
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
      <div className="mt-16 lg:mt-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
        {isLoading ? (
          <div className="col-span-full text-center text-gray-500">Cargando autos...</div>
        ) : displayVehicles.length > 0 ? (
          displayVehicles.map(vehicle => <VehicleGridCard key={vehicle.id} vehicle={vehicle} />)
        ) : (
          <div className="col-span-full text-center text-gray-500">No hay autos disponibles</div>
        )}
      </div>
      <div className="mt-12 text-center">
        <Button variant="link" asChild className="text-lg">
          <Link href="/autos">
            Conocer nuestro famoso inventario →
          </Link>
        </Button>
      </div>
    </Section>
  );
};

/* ---------- Animated Heading ---------- */
const AnimatedHeading: React.FC<{ children: React.ReactNode, as?: 'h2' | 'h3', className?: string }> = ({
  children,
  as: Component = 'h2',
  className
}) => {
    const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });

    const defaultClasses = Component === 'h2'
      ? 'text-2xl font-bold md:text-3xl lg:text-4xl'
      : 'text-xl font-bold md:text-2xl lg:text-3xl';

    return (
        <Component
            ref={ref}
            className={cn(
              'transition-all duration-700 ease-out',
              isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8',
              defaultClasses,
              className
            )}
        >
            {children}
        </Component>
    );
};

/* ---------- YouTube VSL Section ---------- */
const YouTubeVSLSection: React.FC<{ content: YouTubeVSLContent | null }> = ({ content }) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  // Default fallback content
  const defaultContent: YouTubeVSLContent = {
    title: "Conoce nuestra historia",
    subtitle: "Descubre cómo TREFA se ha convertido en la agencia líder de autos seminuevos en el noreste de México",
    videoId: "p-nMlle-xfw"
  };

  const videoContent = content || defaultContent;

  return (
    <Section className="bg-white py-12 lg:py-16">
      <div
        ref={ref}
        className={cn(
          "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 transition-all duration-700",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}
      >
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Video - Left side */}
          <div className="order-2 lg:order-1">
            <div className="rounded-2xl overflow-hidden relative shadow-xl" style={{ paddingBottom: '56.25%', height: 0 }}>
              <iframe
                className="absolute top-0 left-0 w-full h-full"
                src={`https://www.youtube.com/embed/${videoContent.videoId}?rel=0`}
                title="TREFA VSL"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            </div>
          </div>
          {/* Text - Right side */}
          <div className="order-1 lg:order-2 text-center lg:text-left">
            <h2 className="text-2xl font-bold md:text-3xl lg:text-4xl tracking-tight text-slate-800 mb-4">
              {videoContent.title}
            </h2>
            <p className="text-lg text-slate-600 mb-6">
              {videoContent.subtitle}
            </p>
            <p className="text-base text-slate-500">
              Descubre por qué miles de familias en el noreste de México confían en TREFA para encontrar su auto ideal con garantías extendidas y financiamiento accesible.
            </p>
          </div>
        </div>
      </div>
    </Section>
  );
};

/* ---------- Testimonio Separator ---------- */
const TestimonioSeparator: React.FC<{ content: TestimonialContent | null }> = ({ content }) => {
  // Default fallback content
  const defaultContent: TestimonialContent = {
    image: "/images/testimonio.png",
    alt: "Testimonio de cliente TREFA"
  };

  const testimonialContent = content || defaultContent;

  return (
    <div className="bg-white w-full">
      <LazyImage
        src={testimonialContent.image}
        alt={testimonialContent.alt}
        className="w-full h-auto"
        objectFit="contain"
      />
    </div>
  );
};

/* ---------- Carroceria Carousel Section ---------- */
const CarroceriaCarouselSection: React.FC<{ content: CarroceriaCarouselContent | null }> = ({ content }) => {
  const [ref, isVisible] = useIntersectionObserver({ threshold: 0.1 });

  // Default fallback content
  const defaultContent: CarroceriaCarouselContent = {
    title: "Explora por Tipo de Carrocería",
    subtitle: "Encuentra el auto perfecto según tu estilo de vida. Desde SUVs familiares hasta Pick Ups robustas.",
    items: [
      {
        title: "SUV",
        category: "Sport Utility Vehicle",
        src: "https://images.unsplash.com/photo-1519641471654-76ce0107ad1b?q=80&w=2071&auto=format&fit=crop",
        description: "Espaciosos, versátiles y perfectos para la familia. Confort y seguridad en cada viaje.",
        link: "/carroceria/suv"
      },
      {
        title: "Sedan",
        category: "Elegancia y Eficiencia",
        src: "https://source.unsplash.com/Q63_3ioH2xg/2128x1600",
        description: "Diseño sofisticado con excelente rendimiento de combustible. Ideal para el día a día.",
        link: "/carroceria/sedan"
      },
      {
        title: "Hatchback",
        category: "Compacto y Práctico",
        src: "https://m.atcdn.co.uk/vms/media/%7Bresize%7D/8b06e0fd21fc486389639a6084e1e3aa.jpg",
        description: "Ágiles en la ciudad con amplio espacio de carga. El equilibrio perfecto.",
        link: "/carroceria/hatchback"
      },
      {
        title: "Pick Up",
        category: "Fuerza y Capacidad",
        src: "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=2070&auto=format&fit=crop",
        description: "Robustas y capaces. Diseñadas para trabajo y aventura sin límites.",
        link: "/carroceria/pick-up"
      }
    ]
  };

  const carouselContent = content || defaultContent;

  return (
    <Section className="bg-gradient-to-b from-white to-gray-50 py-12 lg:py-16">
      <div
        ref={ref}
        className={cn(
          "transition-all duration-700 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}
      >
        <div className="text-center mb-8 lg:mb-10">
          <h2 className="text-xl font-bold md:text-2xl lg:text-3xl tracking-tight text-slate-800 leading-tight mb-3">
            {carouselContent.title}
          </h2>
          <p className="text-base lg:text-lg text-slate-600 max-w-2xl mx-auto">
            {carouselContent.subtitle}
          </p>
        </div>
        <AppleCardsCarousel items={carouselContent.items} />
      </div>
    </Section>
  );
};

/* ---------- CTA Cards Section ---------- */
const CTACardsSection: React.FC<{ content: CTACardsContent | null }> = ({ content }) => {
  // Default fallback content
  const defaultContent: CTACardsContent = {
    cards: [
      {
        type: 'inventory',
        title: "Conoce nuestro inventario",
        description: "Autos seminuevos seleccionados cuidadosamente para ti.",
        buttonText: "Ver inventario",
        buttonLink: "/autos",
        image: "https://cufm.mx/wp-content/uploads/2025/01/autos-trefa-.png"
      },
      {
        type: 'sell',
        title: "¿Quieres vender tu auto?",
        description: "Recibe una oferta por tu auto en un proceso rápido y transparente.",
        buttonText: "Recibir una oferta",
        buttonLink: "/vender-mi-auto",
        image: "https://pemgwyymodlwabaexxrb.supabase.co/storage/v1/object/public/fotos_airtable/app/klipartz.com.png"
      },
      {
        type: 'advisor',
        title: "Hablar con un asesor",
        description: "Obtén una asesoría personalizada de un experto de nuestro equipo.",
        buttonText: "Iniciar Chat",
        buttonLink: "https://wa.me/5218187049079",
        image: "/images/landing-asset-main.png"
      },
      {
        type: 'financing',
        title: "Tramita tu crédito en línea",
        description: "Nuevo portal de financiamiento con respuesta en 24 horas o menos.",
        buttonText: "Ver autos elegibles",
        buttonLink: "/escritorio/aplicacion",
        image: "https://pemgwyymodlwabaexxrb.supabase.co/storage/v1/object/public/fotos_airtable/app/financiamiento.png"
      }
    ]
  };

  const ctaContent = content || defaultContent;

  const getGradientClass = (type: string) => {
    switch (type) {
      case 'inventory': return 'bg-trefa-bgradient-down';
      case 'sell': return 'bg-trefa-bgradient-right';
      case 'advisor': return 'bg-trefa-bgradient-left';
      case 'financing': return 'bg-trefa-bgradient-up';
      default: return 'bg-gradient-to-br from-primary-600 to-primary-800';
    }
  };

  const inventoryCard = ctaContent.cards.find(c => c.type === 'inventory');
  const sellCard = ctaContent.cards.find(c => c.type === 'sell');
  const advisorCard = ctaContent.cards.find(c => c.type === 'advisor');
  const financingCard = ctaContent.cards.find(c => c.type === 'financing');

  return (
    <Section className="bg-white" fullHeight>
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Top Card - Inventory */}
        {inventoryCard && (
          <div className={`${getGradientClass(inventoryCard.type)} text-white rounded-3xl relative overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:-translate-y-2`}>
            <div className="p-6 md:p-12 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="relative z-10 text-center md:text-left flex-1">
                <AnimatedHeading as="h2" className="text-white">
                  {inventoryCard.title}
                </AnimatedHeading>
                <p className="mt-4 text-lg lg:text-xl text-gray-200">
                  {inventoryCard.description}
                </p>
                <Button variant="outline" size="lg" asChild className="mt-8 bg-white text-gray-900 hover:bg-gray-100 border-0">
                  <Link href={inventoryCard.buttonLink}>
                    {inventoryCard.buttonText}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
              <div className="relative flex-1 h-48 md:h-64">
                <img
                  src={proxyImage(inventoryCard.image)}
                  alt={inventoryCard.title}
                  className="absolute bottom-0 right-0 w-full h-auto max-h-full object-contain object-right-bottom transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        )}

        {/* Middle Cards - Sell & Advisor */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {sellCard && (
            <div className={`${getGradientClass(sellCard.type)} text-white rounded-3xl p-6 md:p-10 relative overflow-hidden min-h-[24rem] flex flex-col justify-between group transition-all duration-300 hover:shadow-2xl hover:-translate-y-2`}>
              <div className="relative z-10">
                <AnimatedHeading as="h3" className="text-white">
                  {sellCard.title}
                </AnimatedHeading>
                <p className="mt-3 text-lg text-gray-200">
                  {sellCard.description}
                </p>
                <Button variant="outline" size="lg" asChild className="mt-6 bg-white text-gray-900 hover:bg-gray-100 border-0">
                  <Link href={sellCard.buttonLink}>
                    {sellCard.buttonText}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
              <img
                src={sellCard.image}
                alt={sellCard.title}
                className="absolute bottom-0 right-0 w-1/2 max-w-[200px] object-contain pointer-events-none opacity-90 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110"
              />
            </div>
          )}

          {advisorCard && (
            <div className={`${getGradientClass(advisorCard.type)} text-white rounded-3xl p-6 md:p-10 relative overflow-hidden min-h-[24rem] flex flex-col justify-between group transition-all duration-300 hover:shadow-2xl hover:-translate-y-2`}>
              <div className="relative z-10">
                <AnimatedHeading as="h3" className="text-white">
                  {advisorCard.title}
                </AnimatedHeading>
                <p className="mt-3 text-lg text-gray-200">
                  {advisorCard.description}
                </p>
                <Button variant="outline" size="lg" asChild className="mt-6 bg-white text-gray-900 hover:bg-gray-100 border-0">
                  {advisorCard.buttonLink.startsWith('http') ? (
                    <a
                      href={advisorCard.buttonLink}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {advisorCard.buttonText}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </a>
                  ) : (
                    <Link href={advisorCard.buttonLink}>
                      {advisorCard.buttonText}
                      <ArrowRight className="w-5 h-5 ml-2" />
                    </Link>
                  )}
                </Button>
              </div>
              <img
                src={advisorCard.image}
                alt={advisorCard.title}
                className="absolute bottom-0 right-0 w-1/2 max-w-[200px] object-contain pointer-events-none opacity-100 group-hover:opacity-90 transition-all duration-300 group-hover:scale-110"
              />
            </div>
          )}
        </div>

        {/* Bottom Card - Financing */}
        {financingCard && (
          <div className={`${getGradientClass(financingCard.type)} text-white rounded-3xl relative overflow-hidden group transition-all duration-300 hover:shadow-2xl hover:-translate-y-2`}>
            <div className="p-6 md:p-14 flex flex-col md:flex-row md:items-center justify-between gap-8">
              <div className="relative z-10 text-center md:text-left flex-1">
                <AnimatedHeading as="h2" className="text-white">
                  {financingCard.title}
                </AnimatedHeading>
                <p className="mt-4 text-lg lg:text-xl text-gray-100">
                  {financingCard.description}
                </p>
                <Button variant="outline" size="lg" asChild className="mt-8 bg-white text-primary hover:bg-gray-100 border-0">
                  <Link href={financingCard.buttonLink}>
                    {financingCard.buttonText}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
              <div className="relative flex-1 h-48 md:h-64">
                <img
                  src={financingCard.image}
                  alt={financingCard.title}
                  className="absolute bottom-0 right-0 w-full h-auto max-h-full object-contain transition-transform duration-300 group-hover:scale-105"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </Section>
  );
};

/* ---------- Home Page ---------- */
const HomePage: React.FC = () => {
  const { vehicles: allVehicles, isLoading } = useVehicles();
  const [heroVehicles, setHeroVehicles] = useState<Vehicle[]>([]);
  const [content, setContent] = useState<{
    hero: HeroContent | null;
    inventoryHero: InventoryHeroContent | null;
    carroceriaCarousel: CarroceriaCarouselContent | null;
    ctaCards: CTACardsContent | null;
    youtubeVSL: YouTubeVSLContent | null;
    testimonial: TestimonialContent | null;
    branches: BranchesContent | null;
  }>({
    hero: null,
    inventoryHero: null,
    carroceriaCarousel: null,
    ctaCards: null,
    youtubeVSL: null,
    testimonial: null,
    branches: null,
  });

  // Prepare vehicles for the hero section
  useEffect(() => {
    if (allVehicles && allVehicles.length > 0) {
      const available = allVehicles.filter(v =>
        !v.separado &&
        !v.vendido &&
        getVehicleImage(v) !== DEFAULT_PLACEHOLDER_IMAGE
      );
      // Shuffle and take 16 vehicles for the marquee
      const shuffled = [...available].sort(() => 0.5 - Math.random()).slice(0, 16);
      setHeroVehicles(shuffled);
    }
  }, [allVehicles]);

  useEffect(() => {
    const loadContent = async () => {
      try {
        const sections = await HomePageContentService.getAllSections();
        setContent({
          hero: sections.hero as HeroContent || null,
          inventoryHero: sections.inventory_hero as InventoryHeroContent || null,
          carroceriaCarousel: sections.carroceria_carousel as CarroceriaCarouselContent || null,
          ctaCards: sections.cta_cards as CTACardsContent || null,
          youtubeVSL: sections.youtube_vsl as YouTubeVSLContent || null,
          testimonial: sections.testimonial as TestimonialContent || null,
          branches: sections.branches as BranchesContent || null,
        });
      } catch (error) {
        console.error('Error loading homepage content:', error);
      }
    };

    loadContent();
  }, []);

  // Optimized: Show critical above-the-fold content immediately
  // Database content loads in parallel without blocking initial render
  return (
    <main className="relative z-10 scroll-smooth">
      {/* New Hero with Vehicle Marquee */}
      <HeroWithVehicles vehicles={heroVehicles} />

      {/* Value Proposition Statement */}
      <ValuePropositionStatement />

      {/* Additional sections */}
      <Portfolio maxVehicles={12} title="Autos TREFA" />
      <TrefaTestimonials />
      <WhyChooseTrefaSection />

      {/* Sections that use database content - shown with graceful loading */}
      <CarroceriaCarouselSection content={content.carroceriaCarousel} />
      <YouTubeVSLSection content={content.youtubeVSL} />
      <BranchesSection content={content.branches} />
      <TestimonioSeparator content={content.testimonial} />
    </main>
  );
};

export default HomePage;
