'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Marquee } from '@/components/ui/marquee';
import { MotionPreset } from '@/components/ui/motion-preset';
import { Rating } from '@/components/ui/rating';
import { Shield, LockKeyhole, Zap } from 'lucide-react';
import Link from 'next/link';
import type { Vehicle } from '@/types/types';
import { getVehicleImage } from '@/utils/getVehicleImage';

// Compact vehicle card for the marquee - hover overlay
const VehicleMarqueeCard = ({ vehicle }: { vehicle: Vehicle }) => {
  const imageUrl = getVehicleImage(vehicle);
  const formattedPrice = new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency: 'MXN',
    maximumFractionDigits: 0,
  }).format(vehicle.precio);

  return (
    <Link
      href={`/autos/${vehicle.slug}`}
      className="group block bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-500 ease-out overflow-hidden w-[260px] border border-gray-100 hover:-translate-y-1"
    >
      <div className="relative h-44 overflow-hidden">
        <img
          src={imageUrl}
          alt={vehicle.titulo || vehicle.title}
          className="w-full h-full object-cover transition-transform duration-500 ease-out group-hover:scale-105"
          loading="lazy"
        />
        {/* Badges - always visible */}
        {vehicle.garantia && (
          <div className="absolute top-2 left-2 bg-green-500 text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
            <Shield className="w-3 h-3" />
            Garantía
          </div>
        )}
        {vehicle.promociones && vehicle.promociones.length > 0 && (
          <div className="absolute top-2 right-2 bg-orange-500 text-white text-xs font-semibold px-2 py-1 rounded-full">
            Promoción
          </div>
        )}
        {/* Hover overlay with info */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
          <h3 className="font-semibold text-sm text-white line-clamp-1">
            {vehicle.titulo || vehicle.title}
          </h3>
          <div className="flex items-center gap-2 mt-1 text-xs text-white/80">
            <span>{vehicle.autoano || vehicle.year}</span>
            <span>•</span>
            <span>{vehicle.kilometraje?.toLocaleString()} km</span>
          </div>
          <p className="text-lg font-bold text-[#FF6801] mt-1">{formattedPrice}</p>
        </div>
      </div>
    </Link>
  );
};

interface HeroWithVehiclesProps {
  vehicles: Vehicle[];
}

const HeroWithVehicles = ({ vehicles }: HeroWithVehiclesProps) => {
  // Split vehicles into two groups for the marquees
  const halfLength = Math.ceil(vehicles.length / 2);
  const leftVehicles = vehicles.slice(0, halfLength);
  const rightVehicles = vehicles.slice(halfLength);

  return (
    <section className="from-primary/10 via-orange-50/50 to-background flex min-h-screen flex-1 flex-col bg-gradient-to-bl to-60% overflow-hidden">
      <div className="mx-auto grid w-full max-w-7xl flex-1 gap-8 px-4 sm:px-6 lg:grid-cols-[1fr_auto] lg:px-8">
        {/* Left Content - extended width */}
        <div className="flex max-w-3xl flex-col justify-center gap-8 pt-16 pb-12 lg:pt-20 lg:pr-8">
          <div className="flex flex-col items-start gap-6">
            <MotionPreset
              fade
              slide
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="bg-white/80 backdrop-blur-sm flex items-center gap-2.5 rounded-full border border-orange-200 px-3 py-2 shadow-sm"
            >
              <Badge className="bg-primary hover:bg-primary text-white">
                <Zap className="w-3 h-3 mr-1" />
                100% Digital
              </Badge>
              <span className="text-gray-600 text-sm">Financiamiento Automotriz en Línea</span>
            </MotionPreset>

            <MotionPreset
              component="h1"
              fade
              slide
              delay={0.3}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-3xl leading-tight font-bold text-balance sm:text-4xl lg:text-5xl text-gray-900"
            >
              Estrena tu auto seminuevo en{' '}
              <span className="bg-gradient-to-r from-primary to-orange-500 bg-clip-text text-transparent">
                tiempo récord
              </span>
            </MotionPreset>

            <MotionPreset
              component="p"
              fade
              slide
              delay={0.6}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="text-gray-600 text-lg"
            >
              La agencia de autos seminuevos mejor calificada del país. Aplica a tu financiamiento
              desde tu celular y obtén respuesta en menos de 24 horas.
            </MotionPreset>

            <MotionPreset
              fade
              slide
              delay={0.9}
              transition={{ duration: 0.5, ease: 'easeOut' }}
              className="flex flex-wrap items-center gap-4"
            >
              <Button size="lg" asChild className="bg-[#FF6801] hover:bg-[#E55E01] shadow-lg h-14 px-8">
                <Link href="/autos">
                  <Zap className="w-5 h-5 mr-2" />
                  Ver Inventario
                </Link>
              </Button>
              <Button
                size="lg"
                variant="outline"
                asChild
                className="border-[#FF6801] border-2 hover:bg-[#FF6801]/5 text-[#FF6801] h-14 px-8"
              >
                <Link href="/financiamientos">Contactar a un Asesor</Link>
              </Button>
            </MotionPreset>
          </div>

          <hr className="border-dashed border-gray-300" />

          <MotionPreset
            fade
            slide
            delay={1.2}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-col sm:flex-row sm:items-center gap-6"
          >
            {/* Stats */}
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                  5K+
                </div>
                <div className="text-sm">
                  <p className="font-semibold text-gray-900">Autos Vendidos</p>
                  <p className="text-gray-500">Clientes felices</p>
                </div>
              </div>

              <div className="h-10 w-px bg-gray-200" />

              <div className="space-y-1">
                <div className="flex items-center gap-1">
                  <Rating readOnly variant="yellow" size={20} value={5} precision={0.5} />
                  <span className="font-semibold text-sm ml-1">4.9</span>
                </div>
                <p className="text-xs text-gray-500">La mejor calificada del país</p>
              </div>
            </div>
          </MotionPreset>

          {/* Trust badges */}
          <MotionPreset
            fade
            slide
            delay={1.5}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="flex flex-wrap items-center gap-3"
          >
            <div className="flex items-center gap-2 bg-green-50 text-green-700 px-3 py-1.5 rounded-full text-xs font-medium">
              <Shield className="w-4 h-4" />
              Garantía Incluida
            </div>
            <div className="flex items-center gap-2 bg-blue-50 text-blue-700 px-3 py-1.5 rounded-full text-xs font-medium">
              <LockKeyhole className="w-4 h-4" />
              Kit de Seguridad
            </div>
            <div className="flex items-center gap-2 bg-orange-50 text-orange-700 px-3 py-1.5 rounded-full text-xs font-medium">
              <Zap className="w-4 h-4" />
              Respuesta en 24h
            </div>
          </MotionPreset>
        </div>

        {/* Right Content - Vehicle Marquees with fades */}
        <MotionPreset
          fade
          blur
          transition={{ duration: 0.7, ease: 'easeOut' }}
          className="relative max-lg:hidden py-4 ml-4"
        >
          {/* Top fade overlay */}
          <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-orange-50/90 via-orange-50/50 to-transparent z-10 pointer-events-none" />
          {/* Bottom fade overlay */}
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-orange-50/90 via-orange-50/50 to-transparent z-10 pointer-events-none" />

          <div className="grid grid-cols-2 gap-8">
            {leftVehicles.length > 0 && (
              <Marquee
                vertical
                pauseOnHover
                duration={40}
                gap={24}
                className="h-screen min-h-[700px] overflow-hidden"
              >
                {leftVehicles.map((vehicle) => (
                  <VehicleMarqueeCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </Marquee>
            )}

            {rightVehicles.length > 0 && (
              <Marquee
                vertical
                pauseOnHover
                duration={45}
                gap={24}
                reverse
                className="h-screen min-h-[700px] overflow-hidden"
              >
                {rightVehicles.map((vehicle) => (
                  <VehicleMarqueeCard key={vehicle.id} vehicle={vehicle} />
                ))}
              </Marquee>
            )}
          </div>
        </MotionPreset>

        {/* Mobile: Show a few vehicles in a grid */}
        <div className="lg:hidden pb-12">
          <div className="grid grid-cols-2 gap-4">
            {vehicles.slice(0, 4).map((vehicle) => (
              <VehicleMarqueeCard key={vehicle.id} vehicle={vehicle} />
            ))}
          </div>
          <div className="mt-6 text-center">
            <Button asChild variant="outline" className="w-full">
              <Link href="/autos">Ver todos los autos →</Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroWithVehicles;
