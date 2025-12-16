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

    return uniqueMarcas.slice(0, 10).map(marcaName => ({
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
        title: `${v.marca} ${v.modelo}`.trim(), // Remove year for cleaner tag cloud
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
              className="text-sm font-semibold text-[#003161] hover:text-[#002850] flex items-center gap-1 transition-colors"
            >
              Ver todos los autos disponibles
              <ArrowRightIcon className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-4 gap-6">
            {/* Column 1 - Buy Options */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">¿Cómo quieres comprar?</h3>
              <div className="space-y-2">
                {/* Explorar Inventario */}
                <button
                  onClick={() => handleLinkClick('/autos')}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary-100 flex items-center justify-center group-hover:bg-primary-200 transition-colors flex-shrink-0">
                    <CarIcon className="w-5 h-5 text-primary-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-gray-900 group-hover:text-primary-700">Explorar Inventario</p>
                    <p className="text-xs text-gray-500">+100 autos disponibles</p>
                  </div>
                </button>

                {/* Comprar en Sucursal */}
                <button
                  onClick={() => setShowCalendar(!showCalendar)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-blue-50 border border-gray-100 hover:border-blue-200 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors flex-shrink-0">
                    <Store className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-gray-900 group-hover:text-blue-700">Comprar en Sucursal</p>
                    <p className="text-xs text-gray-500">Agenda tu visita</p>
                  </div>
                </button>

                {showCalendar && (
                  <div className="ml-12 p-3 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs text-blue-800 mb-2">Selecciona sucursal:</p>
                    <div className="grid grid-cols-2 gap-1.5">
                      {['Monterrey', 'Guadalupe', 'Saltillo', 'Reynosa'].map(city => (
                        <button
                          key={city}
                          onClick={() => handleLinkClick(`/visitas?sucursal=${city.toLowerCase()}`)}
                          className="px-2 py-1.5 text-xs font-medium bg-white rounded-lg border border-blue-200 hover:bg-blue-100 transition-colors text-blue-700"
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
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-green-50 border border-gray-100 hover:border-green-200 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors flex-shrink-0">
                    <Monitor className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-gray-900 group-hover:text-green-700">Comprar en Línea</p>
                    <p className="text-xs text-gray-500">Financiamiento digital</p>
                  </div>
                </button>

                {/* Asesoría Gratuita */}
                <button
                  onClick={handleWhatsAppClick}
                  className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-50 hover:bg-emerald-50 border border-gray-100 hover:border-emerald-200 transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center group-hover:bg-emerald-200 transition-colors flex-shrink-0">
                    <MessageCircle className="w-5 h-5 text-emerald-600" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-sm text-gray-900 group-hover:text-emerald-700">Asesoría Gratuita</p>
                    <p className="text-xs text-gray-500">Habla con un experto</p>
                  </div>
                </button>
              </div>
            </div>

            {/* Column 2 - Carrocería */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Tipo de Carrocería</h3>
              <div className="space-y-2">
                {classifications.map(c => {
                  const count = c.keys.reduce((sum, key) => sum + (vehicleCountByClassification[key] || 0), 0);
                  return (
                    <button
                      key={c.name}
                      onClick={() => handleFilterClick('classification', c.slug)}
                      className="w-full flex items-center gap-3 p-2.5 rounded-xl bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 transition-all group"
                    >
                      <img src={c.imageUrl} alt={c.name} className="w-16 h-12 object-contain group-hover:scale-105 transition-transform" />
                      <div className="text-left">
                        <p className="font-bold text-sm text-gray-900 group-hover:text-primary-700">{c.name}</p>
                        <p className="text-xs text-gray-500">{count} disponibles</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Column 3 - Marcas (2x4 grid) - Compact */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Marcas Populares</h3>
              <div className="grid grid-cols-2 gap-1.5">
                {marcas.map(marca => (
                  <button
                    key={marca.id}
                    onClick={() => handleFilterClick('automarca', marca.slug)}
                    className="flex items-center justify-center p-2 rounded-lg bg-gray-50 hover:bg-primary-50 border border-gray-100 hover:border-primary-200 transition-all group h-12"
                    title={marca.name}
                  >
                    {marca.logoUrl && marca.logoUrl !== '/images/trefalogo.png' ? (
                      <img
                        src={marca.logoUrl}
                        alt={marca.name}
                        className="w-8 h-8 object-contain group-hover:scale-110 transition-transform"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.nextElementSibling?.classList.remove('hidden');
                        }}
                      />
                    ) : null}
                    <span className={`text-[10px] font-semibold text-gray-600 group-hover:text-primary-700 text-center ${marca.logoUrl && marca.logoUrl !== '/images/trefalogo.png' ? 'hidden' : ''}`}>
                      {marca.name}
                    </span>
                  </button>
                ))}
              </div>
              <button
                onClick={() => handleLinkClick('/autos')}
                className="w-full mt-2 p-1.5 text-xs font-semibold text-primary-600 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition-colors flex items-center justify-center gap-1"
              >
                Ver todas las marcas
                <ArrowRightIcon className="w-3 h-3" />
              </button>
            </div>

            {/* Column 4 - Popular Vehicles Tag Cloud */}
            <div>
              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">Autos Populares</h3>
              {popularVehicles.length > 0 && (
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
              )}
              <div className="mt-6 p-4 bg-gradient-to-br from-primary-50 to-orange-50 rounded-xl" style={{ border: '1px solid rgba(255, 104, 1, 0.15)' }}>
                <p className="text-sm font-semibold text-gray-900 mb-1">¿No encuentras lo que buscas?</p>
                <p className="text-xs text-gray-600 mb-3">Cuéntanos qué auto quieres y te ayudamos a encontrarlo.</p>
                <button
                  onClick={handleWhatsAppClick}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-[#25D366] hover:bg-[#20BD5A] text-white text-xs font-semibold rounded-lg transition-colors"
                >
                  <WhatsAppIcon className="w-4 h-4" />
                  Solicitar Auto
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComprarMegaMenu;
