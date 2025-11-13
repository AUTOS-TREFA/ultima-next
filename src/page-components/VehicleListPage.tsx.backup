import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import type { VehicleFilters } from '../types/types';
import { useVehicles } from '../context/VehicleContext';
import { useFilters } from '../context/FilterContext';
import VehicleService from '../services/VehicleService';
import VehicleCard from '../components/VehicleCard';
import VehicleCardSkeleton from '../components/VehicleCardSkeleton';
import VehicleGridCard from '../components/VehicleGridCard';
import InjectionCard from '../components/InjectionCard';
import RecentlyViewed from '../components/RecentlyViewed';
import Pagination from '../components/Pagination';
import FilterSidebar from '../components/FilterSidebar';
import { ListIcon, LayoutGridIcon, SearchIcon, ChevronDownIcon, MapPinIcon } from '../components/icons';
import useSEO from '../hooks/useSEO';
import useDebounce from '../hooks/useDebounce';
import { proxyImage } from '../utils/proxyImage';
import ExplorarTutorialOverlay from '../components/ExplorarTutorialOverlay';
import { useDrag } from '@use-gesture/react';
import { animated, useSpring } from 'react-spring';

const VehicleListPage: React.FC = () => {
  const { marca, carroceria } = useParams<{ marca?: string; carroceria?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { vehicles, totalCount, isLoading: vehiclesLoading, error: vehiclesError } = useVehicles();
  const { filters, handleFiltersChange, onRemoveFilter, handleClearFilters, currentPage, handlePageChange } = useFilters();
  const isInitialMount = useRef(true);

  // Initialize showTutorial based on localStorage to prevent flash
  const [showTutorial, setShowTutorial] = useState(() => {
    const tutorialShown = localStorage.getItem('explorarTutorialShown');
    return !tutorialShown;
  });

  const handleCloseTutorial = () => {
    setShowTutorial(false);
    localStorage.setItem('explorarTutorialShown', 'true');
  };

  console.log('Vehicles:', vehicles);
  console.log('Vehicles Error:', vehiclesError);

  // Fetch filter options with React Query caching (30 min cache)
  const { data: filterOptions = {}, isLoading: filterOptionsLoading } = useQuery({
    queryKey: ['filterOptions'],
    queryFn: () => VehicleService.getFilterOptions(),
    staleTime: 30 * 60 * 1000, // 30 minutes - filter options rarely change
    gcTime: 60 * 60 * 1000, // 1 hour garbage collection
    retry: 2,
  });

const generateDynamicTitle = (count: number, filters: VehicleFilters) => {
    if (count === 0) return 'No se encontraron autos | TREFA';

    const parts = [`${count}`];
    const marca = filters.marca?.[0];
    const carroceria = filters.carroceria?.[0];
    const ubicacion = filters.ubicacion?.[0];

    if (marca) {
        parts.push(marca);
    } else {
        parts.push('autos');
    }

    if (carroceria) {
        parts.push(carroceria);
    }

    if (ubicacion) {
        parts.push(`en ${ubicacion}`);
    }

    parts.push('disponibles');

    return `${parts.join(' ')} | TREFA`;
  };

  // Generate dynamic results display with highlighted count
  const generateResultsDisplay = (count: number, filters: VehicleFilters) => {
    if (count === 0) {
      return <span>No se encontraron autos</span>;
    }

    const marca = filters.marca?.[0];
    const carroceria = filters.carroceria?.[0];
    const ubicacion = filters.ubicacion?.[0];
    const transmision = filters.transmision?.[0];

    // Build the text parts
    const parts: (string | JSX.Element)[] = [];

    // Add count in orange
    parts.push(<span key="count" className="text-orange-500 font-bold">{count}</span>);

    // Build descriptive text
    if (marca) {
      parts.push(' ', marca);
    } else {
      parts.push(' autos');
    }

    if (carroceria) {
      parts.push(' ', carroceria);
    }

    if (transmision) {
      parts.push(' con transmisión ', transmision);
    }

    if (ubicacion) {
      parts.push(' en ', ubicacion);
    }

    parts.push(' disponibles');

    return <>{parts}</>;
  };

  useSEO({
    title: generateDynamicTitle(totalCount, filters),
    description: 'Explora nuestro inventario de autos seminuevos certificados. Encuentra el auto perfecto para ti con opciones de financiamiento.',
    keywords: 'inventario, autos seminuevos, trefa, financiamiento, comprar auto'
  });

  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Animation for the filter sheet
  const [{ y, opacity }, api] = useSpring(() => ({ y: window.innerHeight, opacity: 0, config: { tension: 300, friction: 30 } }));

  const openSheet = useCallback(() => {
    setIsFilterSheetOpen(true);
    setIsClosing(false);
    // Use a small timeout to ensure the component is mounted before animating
    setTimeout(() => {
      api.start({ y: 0, opacity: 1, immediate: false });
    }, 10);
  }, [api]);

  const closeSheet = useCallback(() => {
    setIsClosing(true);
    api.start({ y: window.innerHeight, opacity: 0, immediate: false });
    setTimeout(() => {
      setIsFilterSheetOpen(false);
      setIsClosing(false);
    }, 300); // Delay state update to allow animation to complete
  }, [api]);

  useEffect(() => {
    const handleToggle = () => {
      if (isFilterSheetOpen) {
        closeSheet();
      } else {
        openSheet();
      }
    };
    window.addEventListener('toggleFilterSheet', handleToggle);
    return () => window.removeEventListener('toggleFilterSheet', handleToggle);
  }, [openSheet, closeSheet, isFilterSheetOpen]);

  const bindSheetDrag = useDrag(
    ({ last, movement: [, my], velocity: [, vy], direction: [, dy], cancel }) => {
      // If the user flicks down fast, close the sheet
      if (vy > 0.5 && dy > 0) {
        closeSheet();
        return;
      }
      // If the user drags more than halfway down, close the sheet
      if (my > window.innerHeight * 0.4) {
        closeSheet();
        return;
      }
      // If the drag ends, spring back to the open position
      if (last) {
        openSheet();
      } else {
        // Follow the finger while dragging
        api.start({ y: my, immediate: true });
      }
    },
    { from: () => [0, y.get()], bounds: { top: 0 }, rubberband: true }
  );
  
  // Effect to sync URL params to filter state on initial load ONLY
  useEffect(() => {
    if (!isInitialMount.current) return;

    const initialFilters: Partial<VehicleFilters> = {};

    // Handle path params (marca, carroceria from route)
    if (marca) initialFilters.marca = [marca];
    if (carroceria) initialFilters.carroceria = [carroceria];

    // Handle query params
    searchParams.forEach((value, key) => {
        const filterKey = key as keyof VehicleFilters;

        // Skip if already set by path params
        if (initialFilters[filterKey]) return;

        // Parse array values (marca, carroceria, etc.)
        if (['marca', 'carroceria', 'autoano', 'ubicacion', 'transmision', 'combustible', 'garantia', 'promotion'].includes(filterKey)) {
            const existing = initialFilters[filterKey] as string[] || [];
            // @ts-ignore
            initialFilters[filterKey] = [...existing, value];
        }
        // Parse numeric values
        else if (['minPrice', 'maxPrice', 'enganchemin', 'maxEnganche'].includes(filterKey)) {
            // @ts-ignore
            initialFilters[filterKey] = parseFloat(value);
        }
        // Parse boolean values
        else if (['hideSeparado', 'recienLlegados'].includes(filterKey)) {
            // @ts-ignore
            initialFilters[filterKey] = value === 'true';
        }
        // String values (search, orderby)
        else {
            // @ts-ignore
            initialFilters[filterKey] = value;
        }
    });

    // Only apply if we have filters from URL
    if (Object.keys(initialFilters).length > 0) {
      handleFiltersChange(initialFilters);
    }

    isInitialMount.current = false;
  }, []); // Run only once on mount

  // Effect to sync filter state to URL params (bidirectional sync)
  useEffect(() => {
    // Skip on initial mount - let the above effect handle that
    if (isInitialMount.current) return;

    const params = new URLSearchParams();

    // Build URL params from current filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value) && value.length > 0) {
        // For arrays, add multiple params with same key
        value.forEach(v => params.append(key, String(v)));
      } else if (typeof value === 'boolean') {
        if (value === true) params.set(key, 'true');
      } else if (typeof value === 'number') {
        params.set(key, String(value));
      } else if (typeof value === 'string' && value !== '') {
        params.set(key, value);
      }
    });

    // Update URL without adding to history
    const newSearch = params.toString();
    const currentSearch = searchParams.toString();

    if (newSearch !== currentSearch) {
      navigate(`?${newSearch}`, { replace: true });
    }
  }, [filters, navigate])
  

  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    handleFiltersChange({ search: debouncedSearchTerm || undefined });
  }, [debouncedSearchTerm]);

  useEffect(() => {
    document.body.style.overflow = isFilterSheetOpen ? 'hidden' : 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isFilterSheetOpen]);

  const vehiclesPerPage = 20;
  const totalPages = Math.ceil(totalCount / vehiclesPerPage);

  const activeFiltersList = useMemo(() => {
    const list: { key: keyof VehicleFilters, value: string | number | boolean, label: string }[] = [];
    const keyToLabel: Partial<Record<keyof VehicleFilters, string>> = {
        minPrice: 'Precio Mínimo',
        maxPrice: 'Precio Máximo',
        enganchemin: 'Enganche Mínimo',
        maxEnganche: 'Enganche Máximo',
        recienLlegados: 'Recién llegados',
        search: 'Búsqueda',
        orderby: 'Ordenar por',
    };

    for (const key in filters) {
        const filterKey = key as keyof VehicleFilters;
        const value = filters[filterKey];

        if (value === undefined || value === null) continue;

        if (filterKey === 'hideSeparado') {
            if (value === true) {
                list.push({ key: filterKey, value, label: 'Solo disponibles' });
            }
            continue; 
        }

        if (Array.isArray(value)) {
            if (value.length === 0) continue;
            value.forEach(v => {
                let label = String(v);
                if (filterKey === 'marca') label = String(v);
                else if (filterKey === 'autoano') label = `Año: ${v}`;
                else if (filterKey === 'carroceria') label = String(v);
                else if (filterKey === 'ubicacion') label = String(v);
                else if (filterKey === 'transmision') label = String(v);
                else if (filterKey === 'combustible') label = String(v);
                else if (filterKey === 'garantia') label = String(v);
                else if (filterKey === 'promotion') label = String(v);
                list.push({ key: filterKey, value: v, label });
            });
        } else if (typeof value === 'string' && value) {
            const label = keyToLabel[filterKey] ? `${keyToLabel[filterKey]}: ${value}` : String(value);
            list.push({ key: filterKey, value, label });
        } else if (typeof value === 'number' && (filterKey === 'minPrice' || filterKey === 'maxPrice' || filterKey === 'enganchemin' || filterKey === 'maxEnganche')) {
             const label = keyToLabel[filterKey] ? `${keyToLabel[filterKey]}: ${value}` : String(value);
            list.push({ key: filterKey, value, label });
        }
    }
    return list;
  }, [filters]);

  const renderSkeletons = () => {
    const count = view === 'list' ? 4 : 12;
    return [...Array(count)].map((_, i) =>
      view === 'list' ? (
        <div key={i} className="bg-white p-5 rounded-2xl shadow-sm animate-pulse">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="h-48 bg-gray-200 rounded-lg md:col-span-1"></div>
            <div className="md:col-span-2 space-y-4 pt-4">
              <div className="h-6 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          </div>
        </div>
      ) : (
        <div key={i} className="bg-white rounded-2xl shadow-sm animate-pulse overflow-hidden">
          <div className="aspect-[4/3] bg-gray-200"></div>
          <div className="p-4 space-y-3">
            <div className="h-5 bg-gray-200 rounded w-5/6"></div>
            <div className="h-4 bg-gray-200 rounded w-1/3"></div>
          </div>
        </div>
      )
    );
  };

  const isLoading = vehiclesLoading;

  if (isLoading && vehicles.length === 0) {
    return (
      <main className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[384px_1fr] gap-8 items-start relative z-10">
          <div className="hidden lg:block">
            <div className="bg-white p-6 rounded-2xl shadow-sm animate-pulse">
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-6"></div>
              <div className="space-y-4">
                <div className="h-6 bg-gray-200 rounded w-full"></div>
                <div className="h-6 bg-gray-200 rounded w-5/6"></div>
                <div className="h-6 bg-gray-200 rounded w-full"></div>
              </div>
            </div>
          </div>
          <div>
            <div className="h-12 bg-gray-200 rounded-xl mb-6 animate-pulse"></div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {renderSkeletons()}
            </div>
          </div>
        </div>
      </main>
    );
  }
  
  return (
    <>
      <main className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 lg:grid-cols-[384px_1fr] gap-8 items-start">
          <div className="hidden lg:block">
            <FilterSidebar
              allVehicles={vehicles}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              filterOptions={filterOptions}
              currentFilters={filters}
              onRemoveFilter={onRemoveFilter}
              activeFiltersList={activeFiltersList}
            />
          </div>
          <div>
            <div className="hidden lg:block bg-white p-4 rounded-xl shadow-md border border-gray-200 mb-6">
              <div className="relative mb-3">
                <label htmlFor="search-vehicle" className="sr-only">Buscar vehículo</label>
                <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 z-10">
                  <SearchIcon className="h-4 w-4 text-gray-400" aria-hidden="true" />
                </div>
                <div className="relative p-[2px] rounded-lg bg-gradient-to-r from-primary-400 via-orange-400 to-primary-400 animate-pulse">
                  <input
                    id="search-vehicle"
                    type="search"
                    placeholder="Buscar por marca, modelo o año..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="block w-full rounded-[6px] bg-white py-2 pl-10 pr-3 text-base text-gray-900 focus:outline-none relative z-10"
                  />
                </div>
              </div>

              <div className="border-t border-gray-200 mb-3"></div>

              <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                <div className="flex-1">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Filtros Rápidos
                  </label>
                  <div className="flex flex-col sm:flex-row gap-1.5">
                    <button
                      onClick={() => handleFiltersChange({ hideSeparado: !filters.hideSeparado })}
                      className={`flex items-center justify-between px-2.5 py-1.5 text-sm font-semibold rounded-md border-2 transition-all ${
                        filters.hideSeparado
                          ? 'bg-orange-100 border-orange-600 text-orange-700'
                          : 'bg-gray-50 border-gray-300 text-gray-500 hover:border-gray-400 hover:text-gray-700'
                      }`}
                    >
                      <span>Ocultar Separados</span>
                      <span className={`w-4 h-4 rounded flex items-center justify-center ${filters.hideSeparado ? 'bg-orange-200' : 'bg-gray-100'}`}>
                        {filters.hideSeparado && <span className="text-orange-700 text-sm">✓</span>}
                      </span>
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 flex-wrap lg:flex-nowrap">
                  <div className="relative flex-shrink-0">
                    <label htmlFor="sort-by" className="sr-only">Ordenar por</label>
                    <select
                      id="sort-by"
                      value={filters.orderby || 'default'}
                      onChange={(e) => handleFiltersChange({ orderby: e.target.value })}
                      className="appearance-none bg-gray-50 text-gray-700 font-semibold text-sm pl-2.5 pr-7 py-1.5 rounded-md border-2 border-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition"
                    >
                      <option value="default">Más Recientes</option>
                      <option value="relevance">Más Populares</option>
                      <option value="price-asc">Precio: Menor a Mayor</option>
                      <option value="price-desc">Precio: Mayor a Menor</option>
                      <option value="year-desc">Año: Más Recientes</option>
                      <option value="mileage-asc">Kilometraje: Menor a Mayor</option>
                    </select>
                    <ChevronDownIcon className="w-3.5 h-3.5 text-gray-500 absolute top-1/2 right-2 -translate-y-1/2 pointer-events-none" />
                  </div>
                  <button onClick={() => setView('list')} aria-label="Vista de lista" className={`p-1.5 rounded-md border-2 transition-all ${view === 'list' ? 'bg-primary-600 border-primary-600 text-white shadow-md' : 'bg-gray-50 border-gray-300 text-gray-500 hover:border-gray-400'}`}>
                    <ListIcon className="w-4 h-4" />
                  </button>
                  <button onClick={() => setView('grid')} aria-label="Vista de cuadrícula" className={`p-1.5 rounded-md border-2 transition-all ${view === 'grid' ? 'bg-primary-600 border-primary-600 text-white shadow-md' : 'bg-gray-50 border-gray-300 text-gray-500 hover:border-gray-400'}`}>
                    <LayoutGridIcon className="w-4 h-4" />
                  </button>
                </div>
              </div>

              <div className="border-t border-gray-200 mt-3 mb-3"></div>

              <div>
                <h1 className="text-base font-semibold text-gray-800">
                  {generateResultsDisplay(totalCount, filters)}
                </h1>
              </div>
            </div>

            <div className="lg:hidden bg-white p-4 rounded-xl shadow-md border border-gray-200 mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-sm font-semibold text-gray-800">
                    {generateResultsDisplay(totalCount, filters)}
                </h1>
                <p className="text-xs text-gray-500 mt-0.5">Toca para filtrar</p>
              </div>
              <button
                onClick={openSheet}
                className="flex items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg font-semibold text-sm shadow-md hover:bg-primary-700 transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                </svg>
                Filtros
              </button>
            </div>

            {vehiclesError ? (
              <p className="text-red-500 text-center py-10">Error al cargar los autos. Por favor, inténtelo de nuevo más tarde.</p>
            ) : vehicles.length === 0 && !isLoading ? (
              <div className="text-center py-16 px-6 bg-white rounded-2xl">
                <img src={proxyImage("http://5.183.8.48/wp-content/uploads/2024/09/trefa-no-encontrado.png")} alt="No se encontraron resultados" className="w-48 mx-auto mb-6" />
                <h3 className="text-xl font-semibold text-gray-800">No se encontraron autos</h3>
                <p className="text-gray-500 mt-2">Intente ajustar los filtros o ampliar su búsqueda.</p>
              </div>
            ) : isLoading ? (
              <>
                {view === 'list' ? (
                  <div className="space-y-6">
                    {[...Array(6)].map((_, i) => <VehicleCardSkeleton key={i} />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[...Array(9)].map((_, i) => <VehicleCardSkeleton key={i} isGrid />)}
                  </div>
                )}
              </>
            ) : (
              <>
                {view === 'list' ? (
                  <div className="space-y-6">
                    {vehicles.map(vehicle => <VehicleCard key={vehicle.id} vehicle={vehicle} />)}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {vehicles.slice(0, 3).map(vehicle => <VehicleGridCard key={vehicle.id} vehicle={vehicle} />)}
                    {/* Mobile injection at position 4 (index 3) */}
                    <div className="block lg:hidden">
                      <InjectionCard />
                    </div>
                    {vehicles.slice(3, 5).map(vehicle => <VehicleGridCard key={vehicle.id} vehicle={vehicle} />)}
                    {/* Desktop injection at position 6 (index 5) - second row, last column */}
                    <div className="hidden lg:block">
                      <InjectionCard />
                    </div>
                    {vehicles.slice(5).map(vehicle => <VehicleGridCard key={vehicle.id} vehicle={vehicle} />)}
                  </div>
                )}

                  {totalPages > 1 && (
                  <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={handlePageChange}
                  />
                )}
              </>
            )}
          </div>
        </div>
        <RecentlyViewed layout="carousel" />
      </main>

      {(isFilterSheetOpen || isClosing) && (
        <div className="fixed inset-0 bg-black/50 z-[90] lg:hidden" onClick={closeSheet}></div>
      )}
      {(isFilterSheetOpen || isClosing) && (
        <animated.div
          className="fixed bottom-0 left-0 right-0 max-h-[85vh] bg-white backdrop-blur-sm rounded-t-2xl flex flex-col z-[95] lg:hidden overflow-hidden"
          style={{ y, opacity }}
        >
          <div {...bindSheetDrag()} className="w-full p-4 flex justify-center cursor-grab touch-none">
            <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
          </div>
          {Object.keys(filterOptions).length > 0 ? (
            <FilterSidebar
              allVehicles={vehicles}
              isMobileSheet={true}
              onCloseSheet={closeSheet}
              resultsCount={totalCount}
              onFiltersChange={handleFiltersChange}
              onClearFilters={handleClearFilters}
              filterOptions={filterOptions}
              currentFilters={filters}
              onRemoveFilter={onRemoveFilter}
              activeFiltersList={activeFiltersList}
            />
          ) : (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          )}
        </animated.div>
      )}
      {showTutorial && !isFilterSheetOpen && <ExplorarTutorialOverlay onClose={handleCloseTutorial} />}
    </>
  );
};

export default VehicleListPage;
