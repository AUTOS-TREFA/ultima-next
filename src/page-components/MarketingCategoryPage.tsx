'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useVehicles } from '../context/VehicleContext';
import VehicleGridCard from '../components/VehicleGridCard';
import {
    Loader2,
    AlertTriangle,
    Car,
    TrendingUp,
    Zap,
    Check,
    Shield,
    DollarSign,
    Calendar,
    Gauge,
    Filter,
    X,
    ChevronDown,
    Star,
    Award,
    Users,
    Phone,
    MessageCircle
} from 'lucide-react';
import { getCategoryImage } from '../utils/categoryImages';

interface MarketingCategoryPageProps {
    marca?: string;
    carroceria?: string;
}

const MarketingCategoryPage: React.FC<MarketingCategoryPageProps> = ({ marca, carroceria }) => {
    const { vehicles: allVehicles, isLoading } = useVehicles();
    const [error] = useState<string | null>(null);
    const [sortBy, setSortBy] = useState<'recent' | 'price-low' | 'price-high'>('recent');

    // Advanced filters
    const [showFilters, setShowFilters] = useState(false);
    const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000000]);
    const [yearRange, setYearRange] = useState<[number, number]>([2010, 2025]);
    const [maxMileage, setMaxMileage] = useState<number>(200000);

    const filteredVehicles = useMemo(() => {
        if (!allVehicles) return [];

        let filtered = allVehicles.filter(vehicle => {
            // Category filter
            if (marca && vehicle.marca?.toLowerCase() !== marca.toLowerCase()) return false;
            if (carroceria && !vehicle.clasificacionid?.some(c => c.toLowerCase() === carroceria.toLowerCase())) return false;

            // Advanced filters
            if (vehicle.precio && (vehicle.precio < priceRange[0] || vehicle.precio > priceRange[1])) return false;
            if (vehicle.anio && (vehicle.anio < yearRange[0] || vehicle.anio > yearRange[1])) return false;
            if (vehicle.km && vehicle.km > maxMileage) return false;

            return true;
        });

        // Apply sorting
        filtered.sort((a, b) => {
            if (sortBy === 'price-low') return (a.precio || 0) - (b.precio || 0);
            if (sortBy === 'price-high') return (b.precio || 0) - (a.precio || 0);
            return 0;
        });

        return filtered;
    }, [allVehicles, marca, carroceria, sortBy, priceRange, yearRange, maxMileage]);

    // Calculate stats
    const stats = useMemo(() => {
        if (!filteredVehicles.length) return null;

        const prices = filteredVehicles.map(v => v.precio || 0).filter(p => p > 0);
        const avgPrice = prices.length ? Math.round(prices.reduce((a, b) => a + b, 0) / prices.length) : 0;
        const minPrice = prices.length ? Math.min(...prices) : 0;
        const maxPrice = prices.length ? Math.max(...prices) : 0;

        return { avgPrice, minPrice, maxPrice, total: filteredVehicles.length };
    }, [filteredVehicles]);

    const filterType = marca ? 'marca' : carroceria ? 'clasificacion' : '';
    const filterValue = marca || carroceria || '';

    const seoContent = useMemo(() => {
        const type = filterType?.toLowerCase();
        const value = filterValue?.toLowerCase();
        const banner = getCategoryImage(type, value);

        if (type === 'marca' && value) {
            const capitalizedBrand = value.charAt(0).toUpperCase() + value.slice(1);
            const title = `${capitalizedBrand} Seminuevos en Venta - Monterrey`;
            const description = `Descubre ${stats?.total || 'nuestra selección de'} autos ${capitalizedBrand} seminuevos certificados en Monterrey. Financiamiento flexible, garantía incluida y los mejores precios del mercado.`;
            const keywords = `${capitalizedBrand} seminuevo, ${capitalizedBrand} usado, ${capitalizedBrand} monterrey, venta de ${capitalizedBrand}, precio ${capitalizedBrand}, comprar ${capitalizedBrand}`;
            return { title, description, keywords, banner };
        }

        const staticContent: { [key: string]: { [key: string]: { title: string; description: string } } } = {
            clasificacion: {
                suv: {
                    title: 'SUVs Seminuevas en Venta - Monterrey',
                    description: 'Amplia selección de SUVs seminuevas certificadas. Encuentra la perfecta para tu familia con financiamiento flexible.'
                },
                sedan: {
                    title: 'Sedanes Seminuevos en Venta - Monterrey',
                    description: 'Sedanes seminuevos premium con garantía. Comodidad, elegancia y tecnología al mejor precio.'
                },
                'pick-up': {
                    title: 'Pickups Seminuevas en Venta - Monterrey',
                    description: 'Pickups seminuevas de trabajo y lujo. Potencia y durabilidad para tu negocio o aventuras.'
                },
                hatchback: {
                    title: 'Hatchbacks Seminuevos en Venta - Monterrey',
                    description: 'Hatchbacks seminuevos prácticos y eficientes. Perfectos para la ciudad con excelente rendimiento.'
                }
            }
        };

        const content = (type && value && staticContent[type]?.[value]) || {
            title: 'Autos Seminuevos Certificados en Monterrey',
            description: 'Encuentra el auto ideal en nuestro inventario certificado. Financiamiento, garantía y compra 100% digital.'
        };

        return {
            title: content.title,
            description: content.description,
            keywords: `seminuevos, venta de autos, monterrey, ${filterValue || ''}`,
            banner
        };
    }, [filterType, filterValue, stats]);

    const currencyFormatter = new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        maximumFractionDigits: 0,
    });

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh]">
                <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
                <p className="mt-4 text-sm text-gray-600">Cargando las mejores ofertas...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <AlertTriangle className="w-12 h-12 text-red-500" />
                <h2 className="mt-4 text-lg font-semibold text-gray-800">Ocurrió un error</h2>
                <p className="mt-2 text-sm text-gray-600">{error}</p>
            </div>
        );
    }

    return (
        <main className="bg-gray-50">
            {/* Hero Section with Overlay Stats */}
            <div className="relative h-[400px] sm:h-[450px] lg:h-[500px] overflow-hidden">
                <img
                    src={seoContent.banner}
                    alt={seoContent.title}
                    className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/30"></div>

                <div className="relative h-full flex flex-col justify-end max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 pb-8 sm:pb-12">
                    <div className="text-white space-y-4">
                        <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight drop-shadow-2xl">
                            {seoContent.title}
                        </h1>
                        <p className="text-base sm:text-lg lg:text-xl max-w-3xl drop-shadow-lg opacity-95">
                            {seoContent.description}
                        </p>

                        {stats && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 max-w-4xl">
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                                    <div className="text-2xl sm:text-3xl font-bold">{stats.total}</div>
                                    <div className="text-xs sm:text-sm opacity-90">Autos Disponibles</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                                    <div className="text-xl sm:text-2xl font-bold">{currencyFormatter.format(stats.avgPrice)}</div>
                                    <div className="text-xs sm:text-sm opacity-90">Precio Promedio</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                                    <div className="text-xl sm:text-2xl font-bold">{currencyFormatter.format(stats.minPrice)}</div>
                                    <div className="text-xs sm:text-sm opacity-90">Desde</div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 sm:p-4 border border-white/20">
                                    <div className="text-xl sm:text-2xl font-bold">{currencyFormatter.format(stats.maxPrice)}</div>
                                    <div className="text-xs sm:text-sm opacity-90">Hasta</div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Trust Badges */}
            <div className="bg-white border-y border-gray-200">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Shield className="w-5 h-5 text-green-600" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-gray-900">Certificados</div>
                                <div className="text-xs text-gray-600">Inspección de 150 puntos</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <DollarSign className="w-5 h-5 text-blue-600" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-gray-900">Financiamiento</div>
                                <div className="text-xs text-gray-600">Desde 3.9% anual</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <Award className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-gray-900">Garantía</div>
                                <div className="text-xs text-gray-600">3 meses incluida</div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-amber-100 rounded-lg">
                                <Users className="w-5 h-5 text-amber-600" />
                            </div>
                            <div>
                                <div className="text-sm font-semibold text-gray-900">+2,000 clientes</div>
                                <div className="text-xs text-gray-600">Satisfechos</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
                {filteredVehicles.length > 0 ? (
                    <div className="space-y-8">
                        {/* Filters and Sort Bar */}
                        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                                <div className="flex items-center gap-4">
                                    <h2 className="text-xl sm:text-2xl font-bold text-gray-900">
                                        {filteredVehicles.length} {filteredVehicles.length === 1 ? 'auto' : 'autos'}
                                    </h2>
                                    <button
                                        onClick={() => setShowFilters(!showFilters)}
                                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        <Filter className="w-4 h-4" />
                                        Filtros
                                        <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                                    </button>
                                </div>

                                <div className="flex items-center gap-2">
                                    <label htmlFor="sort" className="text-sm font-medium text-gray-700 whitespace-nowrap">
                                        Ordenar por:
                                    </label>
                                    <select
                                        id="sort"
                                        value={sortBy}
                                        onChange={(e) => setSortBy(e.target.value as any)}
                                        className="flex-1 sm:flex-none px-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white"
                                    >
                                        <option value="recent">Más Reciente</option>
                                        <option value="price-low">Precio: Menor a Mayor</option>
                                        <option value="price-high">Precio: Mayor a Menor</option>
                                    </select>
                                </div>
                            </div>

                            {/* Advanced Filters Panel */}
                            {showFilters && (
                                <div className="mt-6 pt-6 border-t border-gray-200 grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Rango de Precio
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={priceRange[0]}
                                                onChange={(e) => setPriceRange([+e.target.value, priceRange[1]])}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                                placeholder="Min"
                                            />
                                            <span className="text-gray-500">-</span>
                                            <input
                                                type="number"
                                                value={priceRange[1]}
                                                onChange={(e) => setPriceRange([priceRange[0], +e.target.value])}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                                placeholder="Max"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Año
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="number"
                                                value={yearRange[0]}
                                                onChange={(e) => setYearRange([+e.target.value, yearRange[1]])}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                                placeholder="Min"
                                            />
                                            <span className="text-gray-500">-</span>
                                            <input
                                                type="number"
                                                value={yearRange[1]}
                                                onChange={(e) => setYearRange([yearRange[0], +e.target.value])}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg"
                                                placeholder="Max"
                                            />
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Kilometraje Máximo: {maxMileage.toLocaleString()} km
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="200000"
                                            step="10000"
                                            value={maxMileage}
                                            onChange={(e) => setMaxMileage(+e.target.value)}
                                            className="w-full"
                                        />
                                    </div>

                                    <div className="md:col-span-3 flex justify-end">
                                        <button
                                            onClick={() => {
                                                setPriceRange([0, 1000000]);
                                                setYearRange([2010, 2025]);
                                                setMaxMileage(200000);
                                            }}
                                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
                                        >
                                            <X className="w-4 h-4" />
                                            Limpiar filtros
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Vehicle Grid */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                            {filteredVehicles.map(vehicle => (
                                <VehicleGridCard key={vehicle.id} vehicle={vehicle} />
                            ))}
                        </div>

                        {/* CTA Section */}
                        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 rounded-2xl overflow-hidden">
                            <div className="grid md:grid-cols-2 gap-8 p-8 lg:p-12">
                                <div className="text-white space-y-4">
                                    <h3 className="text-2xl sm:text-3xl font-bold">¿Necesitas ayuda para decidir?</h3>
                                    <p className="text-base opacity-90">
                                        Nuestros asesores expertos están listos para ayudarte a encontrar el auto perfecto y ofrecerte las mejores opciones de financiamiento.
                                    </p>
                                    <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                        <Link
                                            href="/contacto"
                                            className="flex items-center justify-center gap-2 bg-white text-primary-600 font-semibold px-6 py-3 rounded-lg hover:bg-gray-100 transition-colors"
                                        >
                                            <Phone className="w-5 h-5" />
                                            Llamar Ahora
                                        </Link>
                                        <Link
                                            href="/contacto"
                                            className="flex items-center justify-center gap-2 bg-white/10 backdrop-blur-sm text-white font-semibold px-6 py-3 rounded-lg hover:bg-white/20 transition-colors border border-white/30"
                                        >
                                            <MessageCircle className="w-5 h-5" />
                                            Chat en Vivo
                                        </Link>
                                    </div>
                                </div>
                                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-white">
                                            <Check className="w-5 h-5 flex-shrink-0" />
                                            <span className="text-sm">Respuesta inmediata</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-white">
                                            <Check className="w-5 h-5 flex-shrink-0" />
                                            <span className="text-sm">Financiamiento pre-aprobado en 24h</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-white">
                                            <Check className="w-5 h-5 flex-shrink-0" />
                                            <span className="text-sm">Prueba de manejo a domicilio</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-white">
                                            <Check className="w-5 h-5 flex-shrink-0" />
                                            <span className="text-sm">Entrega en 48 horas</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* More Inventory CTA */}
                        <div className="text-center">
                            <Link
                                href={`/autos${filterType ? `?${filterType}=${filterValue}` : ''}`}
                                className="inline-flex items-center gap-2 text-primary-600 hover:text-primary-700 font-semibold text-lg"
                            >
                                Explorar todo el inventario
                                <TrendingUp className="w-5 h-5" />
                            </Link>
                        </div>
                    </div>
                ) : (
                    <div className="bg-white rounded-2xl shadow-sm p-12 text-center">
                        <Car className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">
                            No encontramos autos con estos filtros
                        </h3>
                        <p className="text-gray-600 mb-8 max-w-md mx-auto">
                            Intenta ajustar tus filtros o explora todo nuestro inventario de autos certificados
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button
                                onClick={() => {
                                    setPriceRange([0, 1000000]);
                                    setYearRange([2010, 2025]);
                                    setMaxMileage(200000);
                                }}
                                className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                            >
                                Limpiar filtros
                            </button>
                            <Link
                                href="/autos"
                                className="px-6 py-3 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                Ver todo el inventario
                            </Link>
                        </div>
                    </div>
                )}
            </div>

            {/* Why Buy From Us Section */}
            <div className="bg-white py-16">
                <div className="max-w-screen-2xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center mb-12">
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                            ¿Por qué comprar con TREFA?
                        </h2>
                        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
                            Más de 10 años brindando la mejor experiencia en compra de autos seminuevos
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="text-center">
                            <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Shield className="w-8 h-8 text-primary-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Certificación Completa</h3>
                            <p className="text-gray-600">
                                Cada auto pasa por una inspección de 150 puntos realizada por mecánicos certificados
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <DollarSign className="w-8 h-8 text-green-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Financiamiento Flexible</h3>
                            <p className="text-gray-600">
                                Trabajamos con más de 15 bancos para ofrecerte las mejores tasas y plazos
                            </p>
                        </div>

                        <div className="text-center">
                            <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                                <Star className="w-8 h-8 text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-2">Garantía Incluida</h3>
                            <p className="text-gray-600">
                                3 meses de garantía en motor y transmisión sin costo adicional
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default MarketingCategoryPage;
