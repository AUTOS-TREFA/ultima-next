'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback, lazy, Suspense } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import type { VehicleFilters } from '../types/types';
import { useVehicles } from '../context/VehicleContext';
import { useFilters } from '../context/FilterContext';
import VehicleService from '../services/VehicleService';
import type { FacebookPixelService } from '../services/FacebookPixelService';
import VehicleCard from '../components/VehicleCard';
import VehicleCardSkeleton from '../components/VehicleCardSkeleton';
import VehicleGridCard from '../components/VehicleGridCard';
import InjectionCard from '../components/InjectionCard';
import Pagination from '../components/Pagination';
import FilterSidebar from '../components/FilterSidebar';
import StickySidebar from '../components/StickySidebar';
import FavoritesQuickAccess from '../components/FavoritesQuickAccess';

const RecentlyViewed = lazy(() => import('../components/RecentlyViewed'));

import { ListIcon, LayoutGridIcon, SearchIcon, ChevronDownIcon, MapPinIcon } from '../components/icons';
import useDebounce from '../hooks/useDebounce';
import { useRealtimeVisitors } from '../hooks/useRealtimeVisitors';
import { proxyImage } from '../utils/proxyImage';
import { getVehicleImage } from '../utils/getVehicleImage';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../utils/constants';
import ExplorarTutorialOverlay from '../components/ExplorarTutorialOverlay';
import { useDrag } from '@use-gesture/react';
import { animated, useSpring } from 'react-spring';

// shadcn/ui components
import { Card, CardContent } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { SlidersHorizontal } from 'lucide-react';

const VehicleListPage: React.FC = () => {
  const { activeUsers } = useRealtimeVisitors();
  const params = useParams<{ marca?: string; carroceria?: string }>();
  const searchParams = useSearchParams();
  const marca = params?.marca;
  const carroceria = params?.carroceria;
  const router = useRouter();
  const { vehicles, totalCount, isLoading: vehiclesLoading, error: vehiclesError } = useVehicles();
  const { filters, handleFiltersChange, onRemoveFilter, handleClearFilters, currentPage, handlePageChange } = useFilters();
  const isInitialMount = useRef(true);
  const [facebookPixelService, setFacebookPixelService] = useState<any>(null);

  // Dynamically import FacebookPixelService only on client side
  useEffect(() => {
    import('../services/FacebookPixelService').then(module => {
      setFacebookPixelService(module.facebookPixelService);
    });
  }, []);

  // Initialize showTutorial based on localStorage to prevent flash
  const [showTutorial, setShowTutorial] = useState(() => {
    if (typeof window !== 'undefined') {
      const tutorialShown = localStorage.getItem('explorarTutorialShown');
      return !tutorialShown;
    }
    return false;
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

  const dynamicTitle = useMemo(() => {
    if (totalCount === 0) return 'No se encontraron autos | TREFA';

    const parts = [`${totalCount}`];
    const marcaFilter = filters.marca?.[0];
    const carroceriaFilter = filters.carroceria?.[0];
    const ubicacion = filters.ubicacion?.[0];

    if (marcaFilter) {
      parts.push(marcaFilter);
    } else {
      parts.push('autos');
    }

    if (carroceriaFilter) {
      parts.push(carroceriaFilter);
    }

    if (ubicacion) {
      parts.push(`en ${ubicacion}`);
    }

    parts.push('disponibles');

    return `${parts.join(' ')} | TREFA`;
  }, [totalCount, filters.marca, filters.carroceria, filters.ubicacion]);

  // Generate dynamic results display with highlighted count
  const resultsDisplay = useMemo(() => {
    if (totalCount === 0) {
      return <span>No se encontraron autos</span>;
    }

    const marcaFilter = filters.marca?.[0];
    const carroceriaFilter = filters.carroceria?.[0];
    const ubicacion = filters.ubicacion?.[0];
    const transmision = filters.transmision?.[0];

    // Build the text parts
    const parts: (string | JSX.Element)[] = [];

    // Add count in orange
    parts.push(<span key="count" className="text-orange-500 font-bold">{totalCount}</span>);

    // Build descriptive text
    if (marcaFilter) {
      parts.push(' ', marcaFilter);
    } else {
      parts.push(' autos');
    }

    if (carroceriaFilter) {
      parts.push(' ', carroceriaFilter);
    }

    if (transmision) {
      parts.push(' con transmision ', transmision);
    }

    if (ubicacion) {
      parts.push(' en ', ubicacion);
    }

    parts.push(' disponibles');

    return <>{parts}</>;
  }, [totalCount, filters.marca, filters.carroceria, filters.ubicacion, filters.transmision]);

  // SEO metadata is handled in the page.tsx file in Next.js

  // Default to grid view for all devices
  const [view, setView] = useState<'list' | 'grid'>('grid');
  const [isFilterSheetOpen, setIsFilterSheetOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [showGridTooltip, setShowGridTooltip] = useState(false);

  // Show grid view tooltip after page loads
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowGridTooltip(true);
      const hideTimer = setTimeout(() => {
        setShowGridTooltip(false);
      }, 3000); // Hide after 3 seconds
      return () => clearTimeout(hideTimer);
    }, 1000); // Show after 1 second
    return () => clearTimeout(timer);
  }, []);

  // Separate animations for sheet and overlay for better UX
  const [{ y, opacity }, api] = useSpring(() => ({
    y: typeof window !== 'undefined' ? window.innerHeight : 800,
    opacity: 0,
    config: { tension: 300, friction: 30 }
  }));

  const [{ overlayOpacity }, overlayApi] = useSpring(() => ({
    overlayOpacity: 0,
    config: { duration: 200 }
  }));

  const openSheet = useCallback(() => {
    setIsFilterSheetOpen(true);
    setIsClosing(false);
    // Fade in overlay immediately
    overlayApi.start({ overlayOpacity: 1, immediate: false });
    // Use a small timeout to ensure the component is mounted before animating
    setTimeout(() => {
      api.start({ y: 0, opacity: 1, immediate: false });
    }, 10);
  }, [api, overlayApi]);

  const closeSheet = useCallback(() => {
    setIsClosing(true);
    // Fade out overlay immediately for instant feedback
    overlayApi.start({ overlayOpacity: 0, immediate: false });
    // Animate sheet down
    api.start({ y: typeof window !== 'undefined' ? window.innerHeight : 800, opacity: 0, immediate: false });
    setTimeout(() => {
      setIsFilterSheetOpen(false);
      setIsClosing(false);
    }, 300); // Delay state update to allow animation to complete
  }, [api, overlayApi]);

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
      if (my > (typeof window !== 'undefined' ? window.innerHeight : 800) * 0.4) {
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

  // Effect to sync URL params to filter state on initial load
  useEffect(() => {
    const initialFilters: Partial<VehicleFilters> = {};
    if (marca) initialFilters.marca = [marca];
    if (carroceria) initialFilters.carroceria = [carroceria];

    searchParams?.forEach((value, key) => {
        const filterKey = key as keyof VehicleFilters;
        const existing = initialFilters[filterKey] || [];
        // @ts-ignore
        initialFilters[filterKey] = [...existing, value];
    });

    handleFiltersChange(initialFilters);
    isInitialMount.current = false;
  }, [marca, carroceria, searchParams]);

  // Effect to sync filter state to URL params


  const [searchTerm, setSearchTerm] = useState(filters.search || '');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);

  useEffect(() => {
    handleFiltersChange({ search: debouncedSearchTerm || undefined });
  }, [debouncedSearchTerm]);

  // Facebook Pixel: Track Search events when filters change
  useEffect(() => {
    // Skip tracking on initial mount
    if (isInitialMount.current) return;

    // Build search query from active filters
    const searchParts: string[] = [];
    if (filters.search) searchParts.push(filters.search);
    if (filters.marca) searchParts.push(...filters.marca);
    if (filters.carroceria) searchParts.push(...filters.carroceria);
    if (filters.ubicacion) searchParts.push(...filters.ubicacion);
    if (filters.transmision) searchParts.push(...filters.transmision);

    const searchQuery = searchParts.join(' ') || 'browse_inventory';

    // Track the search with filters (only if service is loaded)
    if (facebookPixelService) {
      facebookPixelService.trackSearch(searchQuery, filters)
        .catch(err => console.warn('[FB Pixel] Error tracking Search:', err));
    }
  }, [filters, facebookPixelService]);

  useEffect(() => {
    // Prevent body scroll when sheet is open
    if (isFilterSheetOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      // Small delay to ensure smooth transition
      const timer = setTimeout(() => {
        document.body.style.overflow = 'auto';
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isFilterSheetOpen]);

  // Preload first 6 vehicle images for instant display
  useEffect(() => {
    if (vehicles.length > 0) {
      const imagesToPreload = vehicles.slice(0, 6).map(v => getVehicleImage(v)).filter(Boolean);
      imagesToPreload.forEach((imgUrl) => {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'image';
        link.href = imgUrl;
        // @ts-ignore
        link.fetchPriority = 'high';
        document.head.appendChild(link);
      });
    }
  }, [vehicles]);

  const vehiclesPerPage = 16;
  const totalPages = useMemo(() => Math.ceil(totalCount / vehiclesPerPage), [totalCount]);

  const activeFiltersList = useMemo(() => {
    const list: { key: keyof VehicleFilters, value: string | number | boolean, label: string }[] = [];
    const keyToLabel: Partial<Record<keyof VehicleFilters, string>> = {
        minPrice: 'Precio Minimo',
        maxPrice: 'Precio Maximo',
        enganchemin: 'Enganche Minimo',
        maxEnganche: 'Enganche Maximo',
        search: 'Busqueda',
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
                else if (filterKey === 'autoano') label = `Ano: ${v}`;
                else if (filterKey === 'carroceria') label = String(v);
                else if (filterKey === 'ubicacion') label = String(v);
                else if (filterKey === 'transmision') label = String(v);
                else if (filterKey === 'combustible') label = String(v);
                else if (filterKey === 'garantia') label = String(v);
                else if (filterKey === 'promociones') label = String(v);
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

  const renderSkeletons = useCallback(() => {
    const count = view === 'list' ? 4 : 12;
    return [...Array(count)].map((_, i) => (
      <VehicleCardSkeleton key={i} isGrid={view === 'grid'} />
    ));
  }, [view]);

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
      {/* Mobile Fixed Filter Bar - Below MobileHeader */}
      <div className="lg:hidden fixed top-16 left-0 right-0 z-20 bg-white border-b border-gray-100/80 shadow-sm">
        <div className="flex items-center justify-between px-3 py-2">
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <h1 className="text-sm font-semibold truncate">
              {resultsDisplay}
            </h1>
          </div>
          <Button
            onClick={openSheet}
            size="sm"
            className="flex items-center gap-1.5 bg-[#FF6801] hover:bg-[#E55E01] text-white flex-shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
            <span>Filtros</span>
          </Button>
        </div>
      </div>

      {/* Add top padding on mobile to account for fixed headers (MobileHeader 64px + FilterBar ~44px) */}
      <main className="max-w-screen-2xl mx-auto p-4 sm:p-6 lg:p-8 pt-16 lg:pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-[384px_1fr] gap-8 items-start">
          <aside className="hidden lg:block">
            <StickySidebar topOffset={24}>
              <FilterSidebar
                allVehicles={vehicles}
                onFiltersChange={handleFiltersChange}
                onClearFilters={handleClearFilters}
                filterOptions={filterOptions}
                currentFilters={filters}
                onRemoveFilter={onRemoveFilter}
                activeFiltersList={activeFiltersList}
              />
            </StickySidebar>
          </aside>
          <div>
            <Card className="hidden lg:block mb-6 overflow-visible">
              <CardContent className="pt-4 pb-4 overflow-visible">
                {/* Search and Sort Row - Results count on left, controls on right */}
                <div className="flex items-center justify-between gap-3 mb-3">
                  {/* Results count on the left */}
                  <h1 className="text-sm font-semibold whitespace-nowrap">
                    {resultsDisplay}
                  </h1>

                  {/* Controls on the right */}
                  <div className="flex items-center gap-3">
                    <div className="relative w-[300px]">
                      <label htmlFor="search-vehicle" className="sr-only">Buscar vehiculo</label>
                      <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                      <Input
                        id="search-vehicle"
                        type="search"
                        placeholder="Buscar por marca, modelo o ano..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 h-9"
                      />
                    </div>
                    <Select value={filters.orderby || 'default'} onValueChange={(value) => handleFiltersChange({ orderby: value })}>
                      <SelectTrigger className="w-[180px] h-9">
                        <SelectValue placeholder="Ordenar por" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="default">Mas Recientes</SelectItem>
                        <SelectItem value="relevance">Mas Populares</SelectItem>
                        <SelectItem value="price-asc">Precio: Menor a Mayor</SelectItem>
                        <SelectItem value="price-desc">Precio: Mayor a Menor</SelectItem>
                        <SelectItem value="year-desc">Ano: Mas Recientes</SelectItem>
                        <SelectItem value="mileage-asc">Kilometraje: Menor a Mayor</SelectItem>
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2 relative">
                      <Button
                        variant={view === 'list' ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => setView('list')}
                        aria-label="Vista de lista"
                        className={`h-9 w-9 transition-all ${view === 'list' ? 'bg-[#FF6801] hover:bg-[#E55E01] text-white border-[#FF6801]' : ''}`}
                      >
                        <ListIcon className="w-4 h-4" />
                      </Button>
                      <div className="relative">
                        <Button
                          variant={view === 'grid' ? 'default' : 'outline'}
                          size="icon"
                          onClick={() => {
                            setView('grid');
                            setShowGridTooltip(false);
                          }}
                          aria-label="Vista de cuadricula"
                          className={`h-9 w-9 transition-all ${view === 'grid' ? 'bg-[#FF6801] hover:bg-[#E55E01] text-white border-[#FF6801]' : ''}`}
                        >
                          <LayoutGridIcon className="w-4 h-4" />
                        </Button>
                        {showGridTooltip && (
                          <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-3 py-1.5 rounded-md whitespace-nowrap z-[9999] animate-fade-in shadow-lg">
                            Ver en cuadricula
                            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gray-900 rotate-45"></div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="border-t my-3" />

                {/* Filters Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-muted-foreground">Filtros:</span>
                    <Button
                      variant={filters.hideSeparado ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFiltersChange({ hideSeparado: !filters.hideSeparado })}
                      className={`h-8 ${filters.hideSeparado ? 'bg-[#FF6801] hover:bg-[#E55E01] text-white border-[#FF6801]' : ''}`}
                    >
                      <span>Ocultar Separados</span>
                      {filters.hideSeparado && <span className="ml-2">✓</span>}
                    </Button>
                    <Button
                      variant={(filters.orderby === 'relevance') ? "default" : "outline"}
                      size="sm"
                      onClick={() => handleFiltersChange({ orderby: filters.orderby === 'relevance' ? undefined : 'relevance' })}
                      className={`h-8 ${filters.orderby === 'relevance' ? 'bg-[#FF6801] hover:bg-[#E55E01] text-white border-[#FF6801]' : ''}`}
                    >
                      <span>Populares</span>
                      {filters.orderby === 'relevance' && <span className="ml-2">✓</span>}
                    </Button>
                  </div>
                  {/* Live browsing counter with avatars */}
                  {activeUsers > 0 && (
                    <div className="flex items-center gap-2">
                      {/* Stacked mini person avatars with initials */}
                      <div className="flex -space-x-1.5">
                        <div className="w-6 h-6 rounded-full bg-blue-500 border-2 border-white flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white">MG</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-green-500 border-2 border-white flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white">AR</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-purple-500 border-2 border-white flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white">LC</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-pink-500 border-2 border-white flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white">JS</span>
                        </div>
                        <div className="w-6 h-6 rounded-full bg-orange-500 border-2 border-white flex items-center justify-center">
                          <span className="text-[9px] font-bold text-white">+{Math.max(0, activeUsers - 4)}</span>
                        </div>
                      </div>

                      {/* Counter text with animated dot */}
                      <div className="flex items-center gap-1 text-sm">
                        <span className="text-orange-600 font-bold transition-all duration-300">
                          {activeUsers}
                        </span>
                        <span className="text-gray-600">{activeUsers === 1 ? 'persona explorando' : 'personas explorando'}</span>
                        <span className="relative flex h-2 w-2 ml-1">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Mobile visitor counter - compact version below fixed filter bar */}
            {activeUsers > 0 && (
              <div className="lg:hidden flex items-center gap-1.5 text-xs text-gray-600 bg-gradient-to-r from-orange-50 to-transparent px-3 py-2 rounded-md mb-4">
                <div className="flex -space-x-1">
                  <div className="w-4 h-4 rounded-full bg-blue-500 border border-white flex items-center justify-center">
                    <span className="text-[7px] font-bold text-white">MG</span>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-green-500 border border-white flex items-center justify-center">
                    <span className="text-[7px] font-bold text-white">AR</span>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-purple-500 border border-white flex items-center justify-center">
                    <span className="text-[7px] font-bold text-white">LC</span>
                  </div>
                  <div className="w-4 h-4 rounded-full bg-orange-500 border border-white flex items-center justify-center">
                    <span className="text-[7px] font-bold text-white">+{Math.max(0, activeUsers - 3)}</span>
                  </div>
                </div>
                <span className="text-orange-600 font-bold transition-all duration-300">{activeUsers}</span>
                <span>{activeUsers === 1 ? 'persona viendo' : 'personas viendo'} autos ahora</span>
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-green-500"></span>
                </span>
              </div>
            )}

            {/* Mobile Favorites Slider */}
            <div className="lg:hidden mb-6">
              <FavoritesQuickAccess variant="mobile" />
            </div>

            {vehiclesError ? (
              <p className="text-red-500 text-center py-10">Error al cargar los autos. Por favor, intentelo de nuevo mas tarde.</p>
            ) : vehicles.length === 0 && !isLoading ? (
              <div className="text-center py-16 px-6 bg-white rounded-2xl">
                <img src={proxyImage("http://5.183.8.48/wp-content/uploads/2024/09/trefa-no-encontrado.png")} alt="No se encontraron resultados" className="w-48 mx-auto mb-6" onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_PLACEHOLDER_IMAGE; }} />
                <h3 className="text-xl font-semibold text-gray-800">No se encontraron autos</h3>
                <p className="text-gray-500 mt-2">Intente ajustar los filtros o ampliar su busqueda.</p>
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
                    {vehicles.slice(0, 3).map(vehicle => <VehicleGridCard key={`grid-${vehicle.id}`} vehicle={vehicle} />)}
                    {/* Mobile injection at position 4 (index 3) */}
                    <div key="injection-mobile" className="block lg:hidden">
                      <InjectionCard />
                    </div>
                    {vehicles.slice(3, 5).map(vehicle => <VehicleGridCard key={`grid-${vehicle.id}`} vehicle={vehicle} />)}
                    {/* Desktop injection at position 6 (index 5) - second row, last column */}
                    <div key="injection-desktop" className="hidden lg:block">
                      <InjectionCard />
                    </div>
                    {vehicles.slice(5).map(vehicle => <VehicleGridCard key={`grid-${vehicle.id}`} vehicle={vehicle} />)}
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
        <Suspense fallback={<div className="h-64"></div>}>
          <RecentlyViewed layout="carousel" />
        </Suspense>
      </main>

      {(isFilterSheetOpen || isClosing) && (
        <animated.div
          className="fixed inset-0 bg-black/50 z-[90] lg:hidden"
          style={{ opacity: overlayOpacity }}
          onClick={closeSheet}
        ></animated.div>
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
