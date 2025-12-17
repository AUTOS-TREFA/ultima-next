'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useVehicles } from '../context/VehicleContext';
import VehicleGridCard from '../components/VehicleGridCard';
import { Loader2, AlertTriangle, Car, TrendingUp, Zap, Check } from 'lucide-react';
import { getCategoryImage } from '../utils/categoryImages';

interface MarketingCategoryPageProps {
    marca?: string;
    carroceria?: string;
}

const MarketingCategoryPage: React.FC<MarketingCategoryPageProps> = ({ marca, carroceria }) => {
    const { vehicles: allVehicles, isLoading } = useVehicles();
    const [error] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high'>('recent');

    const filteredVehicles = useMemo(() => {
        if (!allVehicles) return [];
        if (!marca && !carroceria) {
            return allVehicles;
        }
        let filtered = allVehicles.filter(vehicle => {
            if (marca) {
                return vehicle.marca?.toLowerCase() === marca.toLowerCase();
            }
            if (carroceria) {
                return vehicle.clasificacionid?.some(c => c.toLowerCase() === carroceria.toLowerCase());
            }
            return false;
        });

        // Apply sorting
        filtered.sort((a, b) => {
            if (sortBy === 'price-low') {
                return (a.precio || 0) - (b.precio || 0);
            }
            if (sortBy === 'price-high') {
                return (b.precio || 0) - (a.precio || 0);
            }
            return 0;
        });

        return filtered;
    }, [allVehicles, marca, carroceria, sortBy]);

    const filterType = marca ? 'marca' : carroceria ? 'clasificacion' : '';
    const filterValue = marca || carroceria || '';

    const [seoContent] = useState(() => {
        const type = filterType?.toLowerCase();
        const value = filterValue?.toLowerCase();
        const banner = getCategoryImage(type, value);

        if (type === 'marca' && value) {
            const capitalizedBrand = value.charAt(0).toUpperCase() + value.slice(1);
            const titles = [
                `Tu ${capitalizedBrand} Ideal está Aquí en Venta`,
                `Los Mejores Seminuevos ${capitalizedBrand} en Monterrey`,
                `Compra tu ${capitalizedBrand} Usado al Mejor Precio`,
                `Venta de Autos ${capitalizedBrand} Usados y Seminuevos`,
                `${capitalizedBrand} en Monterrey: Encuentra Precios y Ofertas`
            ];
            const title = titles[Math.floor(Math.random() * titles.length)];
            const description = `Explora nuestro inventario de autos ${capitalizedBrand} seminuevos en venta en Monterrey. Encuentra el mejor precio para tu próximo ${capitalizedBrand} usado. ¡Financiamiento disponible!`;
            const keywords = `${capitalizedBrand} seminuevo, ${capitalizedBrand} usado, ${capitalizedBrand} monterrey, venta de ${capitalizedBrand}, precio ${capitalizedBrand}, comprar ${capitalizedBrand}`;

            return { title, description, keywords, banner };
        }

        const staticTitles: { [key: string]: { [key: string]: string } } = {
            clasificacion: {
                suv: 'SUVs Seminuevas en Venta',
                sedan: 'Sedanes Seminuevos en Venta',
                'pick-up': 'Pickups Seminuevas en Venta',
                hatchback: 'Hatchbacks Seminuevos en Venta',
            }
        };

        const title = (type && value && staticTitles[type]?.[value]) || 'Nuestras Mejores Ofertas';
        const description = `Encuentra los mejores ${title.toLowerCase()} en TREFA. Inventario certificado, financiamiento a tu medida y compra 100% digital.`;
        const keywords = `${title.toLowerCase()}, seminuevos, venta de autos, trefa, ${filterValue || ''}`;

        return { title, banner, description, keywords };
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                <p className="mt-4 text-gray-600">Cargando ofertas...</p>
            </div>
        );
    }

    if (error) {
         return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <AlertTriangle className="w-12 h-12 text-red-500" />
                <h2 className="mt-4 text-lg font-semibold text-gray-800">Ocurrió un error</h2>
                <p className="mt-2 text-gray-600">{error}</p>
            </div>
        );
    }

    return (
        <main className="bg-white">
            {/* Hero Section */}
            <div className="relative h-60 sm:h-72 lg:h-80 overflow-hidden">
                <img
                    src={seoContent.banner}
                    alt={seoContent.title}
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent"></div>
                <div className="relative h-full flex flex-col justify-end p-4 sm:p-6 lg:p-8 text-white">
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold drop-shadow-lg leading-tight">
                        {seoContent.title}
                    </h1>
                    <p className="mt-2 text-sm sm:text-base drop-shadow-md max-w-2xl line-clamp-2">
                        {seoContent.description}
                    </p>
                </div>
            </div>

            {/* Benefits Bar */}
            <div className="bg-primary-50 border-b border-primary-100">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-5">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                        <div className="flex items-center gap-3">
                            <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium text-gray-700">Inventario Certificado</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Zap className="w-5 h-5 text-amber-600 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium text-gray-700">Financiamiento Disponible</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <TrendingUp className="w-5 h-5 text-blue-600 flex-shrink-0" />
                            <span className="text-xs sm:text-sm font-medium text-gray-700">Mejores Precios</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Results Section */}
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">
                {filteredVehicles.length > 0 ? (
                    <>
                        {/* Header with Results Count and Sort */}
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                                    {filteredVehicles.length} {filteredVehicles.length === 1 ? 'auto' : 'autos'} disponibles
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-600 mt-1">en esta categoría</p>
                            </div>

                            {/* Sort Dropdown */}
                            <div className="flex items-center gap-2">
                                <label htmlFor="sort" className="text-xs sm:text-sm font-medium text-gray-700">Ordenar:</label>
                                <select
                                    id="sort"
                                    value={sortBy}
                                    onChange={(e) => setSortBy(e.target.value as any)}
                                    className="px-3 py-2 text-xs sm:text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                                >
                                    <option value="recent">Más Reciente</option>
                                    <option value="price-low">Precio: Menor a Mayor</option>
                                    <option value="price-high">Precio: Mayor a Menor</option>
                                </select>
                            </div>
                        </div>

                        {/* Vehicle Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
                            {filteredVehicles.map(vehicle => (
                                <VehicleGridCard key={vehicle.id} vehicle={vehicle} />
                            ))}
                        </div>

                        {/* CTA Section */}
                        <div className="mt-10 sm:mt-12 bg-gradient-to-r from-primary-600 to-primary-700 rounded-2xl p-6 sm:p-8 text-white text-center">
                            <h3 className="text-lg sm:text-xl font-bold mb-2">¿Buscas algo diferente?</h3>
                            <p className="text-sm sm:text-base opacity-90 mb-4">
                                Explora todo nuestro inventario y encuentra tu auto ideal
                            </p>
                            <Link
                                href={`/autos${filterType ? `?${filterType}=${filterValue}` : ''}`}
                                className="inline-block bg-white text-primary-600 font-semibold px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg hover:bg-gray-100 transition-colors text-sm sm:text-base"
                            >
                                Ver todos los resultados
                            </Link>
                        </div>
                    </>
                ) : (
                    <div className="text-center py-12 sm:py-16 px-4 bg-gray-50 rounded-2xl">
                        <Car className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg sm:text-xl font-semibold text-gray-800">No se encontraron autos</h3>
                        <p className="text-sm text-gray-600 mt-2 mb-6">
                            Actualmente no tenemos autos que coincidan con esta categoría. ¡Vuelve pronto!
                        </p>
                        <Link
                            href="/autos"
                            className="inline-block bg-primary-600 text-white font-medium px-6 py-2.5 rounded-lg hover:bg-primary-700 transition-colors text-sm"
                        >
                            Explorar todo el inventario
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
};

export default MarketingCategoryPage;
