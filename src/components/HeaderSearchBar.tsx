'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Search as SearchIcon, Loader2 } from 'lucide-react';
import type { WordPressVehicle } from '../types/types';
import { useVehicles } from '../context/VehicleContext';
import { formatPrice } from '../utils/formatters';
import { getVehicleImage } from '../utils/getVehicleImage';

const HeaderSearchBar: React.FC = () => {
  const { vehicles: allVehicles } = useVehicles();
  const [query, setQuery] = useState('');
  const [showTooltip, setShowTooltip] = useState(false);
  const [results, setResults] = useState<WordPressVehicle[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isDropdownVisible, setIsDropdownVisible] = useState(false);
  const router = useRouter();
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const tooltipShown = sessionStorage.getItem('headerSearchTooltipShown');
    if (!tooltipShown) {
      const timer = setTimeout(() => {
        setShowTooltip(true);
        sessionStorage.setItem('headerSearchTooltipShown', 'true');
      }, 2500); // Wait 2.5s before showing
      
      const hideTimer = setTimeout(() => {
        setShowTooltip(false);
      }, 7500); // Tooltip is visible for 5s

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, []);

  useEffect(() => {
    if (query.length < 3) {
      setResults([]);
      setIsDropdownVisible(false);
      return;
    }
    setIsSearching(true);
    const handler = setTimeout(() => {
      try {
        const lowercasedQuery = query.toLowerCase();
        const filtered = allVehicles.filter(v =>
          v.title.toLowerCase().includes(lowercasedQuery) ||
          (v.marca && v.marca.toLowerCase().includes(lowercasedQuery)) ||
          (v.modelo && v.modelo.toLowerCase().includes(lowercasedQuery)) ||
          (v.autoano && v.autoano.toString().includes(lowercasedQuery))
        );
        setResults(filtered.slice(0, 5)); // Show top 5 results
        setIsDropdownVisible(true);
      } catch (error) {
        console.error("Live search failed:", error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(handler);
  }, [query, allVehicles]);
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setIsDropdownVisible(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsDropdownVisible(false);
    if (query.trim()) {
      router.push(`/autos?search=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleResultClick = (slug: string) => {
    setIsDropdownVisible(false);
    setQuery('');
    router.push(`/autos/${slug}`);
  };

  return (
    <div className="relative w-full max-w-2xl mx-auto" ref={searchRef}>
      <form onSubmit={handleSubmit} className="relative">
        <div className="header-search-container">
          <div className="relative flex items-center w-full bg-white rounded-full border border-gray-200">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4">
              {isSearching ? <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400 animate-spin" /> : <SearchIcon className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" aria-hidden="true" />}
            </div>
            <input
              type="search"
              name="search"
              id="header-search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Busca por marca, modelo o año..."
              className="block w-full rounded-full border-0 bg-transparent py-2 sm:py-2.5 pl-10 sm:pl-11 pr-3 sm:pr-4 text-sm leading-tight text-gray-900 placeholder:text-gray-500 focus:ring-0"
              autoComplete="off"
            />
          </div>
        </div>
      </form>
      {isDropdownVisible && results.length > 0 && (
        <ul className="absolute top-full mt-2 w-full bg-white rounded-lg shadow-xl z-50 overflow-hidden border border-gray-200">
          {results.map(vehicle => (
            <li key={vehicle.id}>
              <button onClick={() => handleResultClick(vehicle.slug)} className="w-full text-left flex items-center gap-3 sm:gap-4 p-3 sm:p-4 hover:bg-gray-100 active:bg-gray-200 transition-colors">
                <img src={getVehicleImage(vehicle)} alt={vehicle.title} className="w-20 h-16 sm:w-24 sm:h-18 object-cover rounded-md flex-shrink-0 shadow-sm" />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-base sm:text-sm text-gray-900 line-clamp-2">{vehicle.title}</p>
                  <p className="text-base sm:text-sm text-primary-600 font-bold mt-0.5">{formatPrice(vehicle.precio)}</p>
                </div>
              </button>
            </li>
          ))}
           <li className="p-3 sm:p-2 bg-gray-50 border-t border-gray-200">
                <button onClick={() => handleSubmit(new Event('submit') as any)} className="w-full text-center text-base sm:text-sm font-semibold text-primary-600 hover:text-primary-700 active:text-primary-800 py-1">
                    Ver todos los resultados para "{query}"
                </button>
            </li>
        </ul>
      )}
      {showTooltip && (
        <div className="header-search-tooltip">
          ¿Qué auto estás buscando?
        </div>
      )}
    </div>
  );
};

export default HeaderSearchBar;