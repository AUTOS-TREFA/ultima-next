'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useVehicles } from '../context/VehicleContext';
import {
  CarIcon,
  WhatsAppIcon,
  ArrowRightIcon,
  SuvIcon,
  SedanIcon,
  PickupIcon,
  HatchbackIcon,
} from './icons';
import { Calendar, Store, Monitor, MessageCircle } from 'lucide-react';
import { BRAND_LOGOS } from '../utils/constants';

interface ComprarMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const classifications = [
  { name: 'SUV', slug: 'suv', icon: SuvIcon, imageUrl: '/images/suv-filter.png', keys: ['suv'] },
  { name: 'Sedán', slug: 'sedan', icon: SedanIcon, imageUrl: '/images/sedan-filter.png', keys: ['sedan', 'sedán'] },
  { name: 'Pick Up', slug: 'pick-up', icon: PickupIcon, imageUrl: '/images/pickup-filter.png', keys: ['pick up', 'pickup', 'pick-up'] },
  { name: 'Hatchback', slug: 'hatchback', icon: HatchbackIcon, imageUrl: '/images/hatchback-filter.png', keys: ['hatchback'] },
];

const ComprarMegaMenu: React.FC<ComprarMegaMenuProps> = ({ isOpen, onClose, triggerRef }) => {
  const { vehicles: allVehicles } = useVehicles();
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [showCalendar, setShowCalendar] = useState(false);

  const vehicleCountByClassification = useMemo(() => {
    if (!allVehicles) return {};
    const counts: Record<string, number> = {};
    allVehicles.forEach(v => {
      // Try multiple field names for classification/carroceria
      const classification = v.classification || v.carroceria || v.clasificacionid?.[0] || '';
      if (classification) {
        // Normalize to lowercase for matching, also remove accents
        const normalizedKey = classification.toLowerCase().trim()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // Remove accents
        counts[normalizedKey] = (counts[normalizedKey] || 0) + 1;
      }
    });
    return counts;
  }, [allVehicles]);

  const marcas = useMemo(() => {
    if (!allVehicles) return [];
    const allMarcas = allVehicles.map(v => v.marca || v.automarca).filter(Boolean);
    const uniqueMarcas = [...new Set(allMarcas)];

    // Create case-insensitive lookup for brand logos
    const brandLogoLookup = (brandName: string): string => {
      // Direct match first
      if (BRAND_LOGOS[brandName]) return BRAND_LOGOS[brandName];
      // Case-insensitive match
      const lowerBrand = brandName.toLowerCase();
      const matchingKey = Object.keys(BRAND_LOGOS).find(key => key.toLowerCase() === lowerBrand);
      return matchingKey ? BRAND_LOGOS[matchingKey] : '/images/trefalogo.png';
    };

    return uniqueMarcas.slice(0, 8).map(marcaName => ({
      id: marcaName,
      name: marcaName,
      slug: marcaName.toLowerCase().replace(/\s+/g, '-'),
      logoUrl: brandLogoLookup(marcaName)
    }));
  }, [allVehicles]);

  const popularVehicles = useMemo(() => {
    if (!allVehicles) return [];
    // Sort by view_count descending and get top 8, excluding sold vehicles
    return [...allVehicles]
      .filter(v => !v.vendido && !v.separado)
      .sort((a, b) => (b.view_count || 0) - (a.view_count || 0))
      .slice(0, 8)
      .map(v => ({
        id: v.id,
        title: `${v.marca} ${v.modelo} ${v.autoano}`.trim(),
        slug: v.slug
      }));
  }, [allVehicles]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current && !menuRef.current.contains(event.target as Node) &&
        triggerRef.current && !triggerRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, triggerRef]);

  const handleLinkClick = (to: string) => {
    onClose();
    router.push(to);
  };

  const handleFilterClick = (filterKey: string, filterValue: string) => {
    onClose();
    if (filterKey === 'automarca') {
      router.push(`/marcas/${filterValue.toLowerCase()}`);
    } else if (filterKey === 'classification') {
      router.push(`/carroceria/${filterValue.toLowerCase()}`);
    } else {
      router.push(`/autos`);
    }
  };

  const handleWhatsAppClick = () => {
    onClose();
    window.open('https://wa.me/5218187049079?text=Hola,%20me%20gustaría%20recibir%20asesoría%20gratuita%20para%20comprar%20un%20auto.', '_blank');
  };

  if (!isOpen || !triggerRef.current) return null;

  return (
    <div
      ref={menuRef}
      className="absolute top-full left-0 right-0 w-full animate-slideDown z-40"
      style={{ transformOrigin: 'top' }}
    >
      <div className="mt-2 bg-white rounded-b-2xl shadow-2xl border border-gray-100/50">
        <div className="max-w-7xl mx-auto p-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Comprar un Auto</h2>
              <p className="text-sm text-gray-500 mt-1">Encuentra tu próximo auto seminuevo certificado</p>
            </div>
            <Link
              href="/autos"
              onClick={() => onClose()}
              className="text-sm font-semibold text-primary-600 hover:text-primary-700 flex items-center gap-1 transition-colors"
            >
              Ver todos los autos disponibles
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-12 gap-8">
            {/* Left Column - 4 Bold Actions */}
            <div className="col-span-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">¿Cómo quieres comprar?</h3>
              <div className="space-y-2">
                {/* Explorar Inventario */}
                <button
                  onClick={() => handleLinkClick('/autos')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors">
                    <CarIcon className="w-6 h-6 text-primary-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 group-hover:text-primary-700">Explorar Inventario</p>
                    <p className="text-sm text-gray-500">Más de 100 autos disponibles</p>
                  </div>
                </button>

                {/* Comprar en Sucursal */}
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                    <Store className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 group-hover:text-blue-700">Comprar en Sucursal</p>
                    <p className="text-sm text-gray-500">Agenda tu visita presencial</p>
                  </div>
                </button>

                {showCalendar && (
                  <div className="ml-16 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-sm text-blue-800 mb-3">Selecciona una sucursal:</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['Monterrey', 'Guadalupe', 'Saltillo', 'Reynosa'].map(city => (
                        <button
                          key={city}
                          onClick={() => handleLinkClick(`/visitas?sucursal=${city.toLowerCase()}`)}
                          className="px-3 py-2 text-sm font-medium bg-white rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors text-blue-700"
                        >
                          {city}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Comprar en Línea */}
                <button
                  onClick={() => handleLinkClick('/escritorio/aplicacion')}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                    <Monitor className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 group-hover:text-green-700">Comprar en Línea</p>
                    <p className="text-sm text-gray-500">Solicita financiamiento digital</p>
                  </div>
                </button>

                {/* Asesoría Gratuita */}
                <button
                  onClick={handleWhatsAppClick}
                  className="w-full flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 transition-all group"
                >
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors">
                    <MessageCircle className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-gray-900 group-hover:text-emerald-700">Asesoría de Compra Gratuita</p>
                    <p className="text-sm text-gray-500">Habla con un experto por WhatsApp</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Center Column - Carrocería (Stacked vertically) */}
            <div className="col-span-4">
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Tipo de Carrocería</h3>
              <div className="space-y-2">
                {classifications.map(c => {
                  // Sum counts for all matching keys
                  const count = c.keys.reduce((sum, key) => sum + (vehicleCountByClassification[key] || 0), 0);
                  return (
                    <button
                      key={c.name}
                      onClick={() => handleFilterClick('classification', c.slug)}
                      className="w-full flex items-center gap-4 p-3 rounded-xl bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 transition-all group"
                    >
                      <img src={c.imageUrl} alt={c.name} className="w-20 h-14 object-contain group-hover:scale-105 transition-transform" />
                      <div className="text-left">
                        <p className="font-bold text-gray-900 group-hover:text-primary-700">{c.name}</p>
                        <p className="text-sm text-gray-500">{count} autos disponibles</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column - Popular Vehicles & Brands */}
            <div className="col-span-4">
              {/* Popular Vehicles Tag Cloud */}
              {popularVehicles.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Autos Populares</h3>
                  <div className="flex flex-wrap gap-2">
                    {popularVehicles.map(vehicle => (
                      <button
                        key={vehicle.id}
                        onClick={() => handleLinkClick(`/autos/${vehicle.slug}`)}
                        className="px-3 py-1.5 text-xs font-medium bg-gray-100 hover:bg-primary-100 text-gray-700 hover:text-primary-700 rounded-full transition-colors"
                      >
                        {vehicle.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Marcas Populares</h3>
              <div className="grid grid-cols-4 gap-2">
                {marcas.map(marca => (
                  <button
                    key={marca.id}
                    onClick={() => handleFilterClick('automarca', marca.slug)}
                    className="flex flex-col items-center justify-center p-3 rounded-xl bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 transition-all group aspect-square"
                    title={marca.name}
                  >
                    {marca.logoUrl && marca.logoUrl !== '/images/trefalogo.png' ? (
                      <img
                        src={marca.logoUrl}
                        alt={marca.name}
                        className="w-12 h-12 object-contain group-hover:scale-110 transition-transform"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <span className={`text-xs font-semibold text-gray-600 group-hover:text-primary-700 text-center ${marca.logoUrl && marca.logoUrl !== '/images/trefalogo.png' ? 'hidden' : ''}`}>
                      {marca.name}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleLinkClick('/autos')}
                className="w-full mt-4 p-3 text-sm font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Ver todas las marcas
                <ArrowRightIcon className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprarMegaMenu;
