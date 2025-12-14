'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRightIcon, WhatsAppIcon } from './icons';
import { searchVehiclesWithAI } from '../Valuation/services/valuationService';
import { config } from '@/config';
import type { Vehicle } from '../types/types';
import { Search, Loader2, Car, DollarSign, Clock, Shield, CheckCircle2 } from 'lucide-react';

interface VenderMegaMenuProps {
  isOpen: boolean;
  onClose: () => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
}

const VenderMegaMenu: React.FC<VenderMegaMenuProps> = ({ isOpen, onClose, triggerRef }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [vehicleOptions, setVehicleOptions] = useState<Vehicle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (searchQuery.length > 2) {
      setIsSearching(true);
      const handler = setTimeout(() => {
        searchVehiclesWithAI(
          searchQuery,
          config.airtable.valuation.apiKey,
          config.airtable.valuation.baseId,
          config.airtable.valuation.tableId,
          config.airtable.valuation.view
        )
          .then(res => { setVehicleOptions(res); setIsDropdownOpen(res.length > 0); })
          .catch(err => console.error("Error searching vehicles:", err))
          .finally(() => setIsSearching(false));
      }, 300);
      return () => clearTimeout(handler);
    } else {
      setVehicleOptions([]);
      setIsDropdownOpen(false);
    }
  }, [searchQuery]);

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

  const handleSelectVehicle = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setSearchQuery(vehicle.label);
    setIsDropdownOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onClose();
    if (selectedVehicle?.ordencompra) {
      router.push(`/vender-mi-auto?vehicle=${encodeURIComponent(selectedVehicle.ordencompra)}`);
    } else if (searchQuery.trim()) {
      router.push(`/vender-mi-auto?search=${encodeURIComponent(searchQuery.trim())}`);
    } else {
      router.push('/vender-mi-auto');
    }
  };

  const handleWhatsAppClick = () => {
    onClose();
    window.open('https://wa.me/5218187049079?text=Hola,%20me%20gustaría%20vender%20mi%20auto.%20¿Pueden%20ayudarme%20con%20una%20cotización?', '_blank');
  };

  if (!isOpen || !triggerRef.current) return null;

  return (
    <div
      ref={menuRef}
      className="absolute top-full left-0 right-0 w-full animate-slideDown z-40"
      style={{ transformOrigin: 'top' }}
    >
      <div className="mt-2 bg-white rounded-b-2xl shadow-2xl border border-gray-100/50">
        <div className="max-w-5xl mx-auto p-8">
          <div className="grid grid-cols-12 gap-8">
            {/* Left Column - Benefits (now first) */}
            <div className="col-span-5">
              {/* Header */}
              <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-900">Vende tu Auto</h2>
                <p className="text-sm text-gray-500 mt-1">Recibe una oferta competitiva en menos de 24 horas</p>
              </div>

              <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-4">¿Por qué vender con TREFA?</h3>

              <div className="space-y-3">
                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-9 h-9 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
                    <DollarSign className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Mejor Precio del Mercado</p>
                    <p className="text-xs text-gray-500">Precios competitivos basados en datos reales</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-9 h-9 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Clock className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Pago en 24 Horas</p>
                    <p className="text-xs text-gray-500">Recibes tu pago al día siguiente</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-9 h-9 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                    <Shield className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Proceso 100% Seguro</p>
                    <p className="text-xs text-gray-500">Nos encargamos de todo el papeleo</p>
                  </div>
                </div>

                <div className="flex items-start gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                  <div className="w-9 h-9 rounded-lg bg-orange-100 flex items-center justify-center flex-shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-900 text-sm">Sin Comisiones Ocultas</p>
                    <p className="text-xs text-gray-500">El precio ofrecido es lo que recibes</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Form (now second) */}
            <div className="col-span-7 flex flex-col justify-end">
              {/* Quick Quote Form - no bounding box */}
              <div>
                <div className="flex items-center gap-3 mb-5">
                  <div className="w-11 h-11 rounded-xl bg-primary-100 flex items-center justify-center">
                    <Car className="w-5 h-5 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">Cotización Rápida</h3>
                    <p className="text-sm text-gray-500">Escribe marca, modelo y año de tu auto</p>
                  </div>
                </div>

                <form onSubmit={handleSubmit} ref={formRef}>
                  <div className="relative">
                    <input
                      type="text"
                      value={selectedVehicle ? selectedVehicle.label : searchQuery}
                      onChange={(e) => { setSearchQuery(e.target.value); setSelectedVehicle(null); }}
                      placeholder="Ej: Nissan Versa 2020"
                      className="w-full bg-gray-50 border-2 border-gray-200 rounded-xl py-4 px-5 text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all pl-12 text-base"
                      onFocus={() => setIsDropdownOpen(searchQuery.length > 2 && vehicleOptions.length > 0)}
                    />
                    <div className="absolute top-1/2 left-4 -translate-y-1/2 text-gray-400">
                      {isSearching ? <Loader2 className="w-5 h-5 animate-spin text-primary-500" /> : <Search className="w-5 h-5" />}
                    </div>
                  </div>

                  {isDropdownOpen && vehicleOptions.length > 0 && (
                    <ul className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                      {vehicleOptions.map(v => (
                        <li
                          key={v.id}
                          onClick={() => handleSelectVehicle(v)}
                          className="px-4 py-3 text-base text-gray-800 hover:bg-primary-50 cursor-pointer flex items-center gap-3"
                        >
                          <Car className="w-4 h-4 text-gray-400" />
                          {v.label}
                        </li>
                      ))}
                    </ul>
                  )}

                  <button
                    type="submit"
                    className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl font-bold text-base py-4 px-6 bg-primary-600 text-white hover:bg-primary-700 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-md"
                  >
                    <span>Obtener Cotización Gratis</span>
                    <ArrowRightIcon className="w-5 h-5" />
                  </button>
                </form>

                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-500">
                    Sin compromiso • Respuesta en menos de 24h
                  </p>
                  {/* WhatsApp Link */}
                  <button
                    onClick={handleWhatsAppClick}
                    className="flex items-center gap-2 text-sm text-green-600 hover:text-green-700 transition-colors font-medium"
                  >
                    <WhatsAppIcon className="w-4 h-4" />
                    <span>Cotizar por WhatsApp</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VenderMegaMenu;
