'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useVehicles } from '../context/VehicleContext';
import type { WordPressVehicle } from '../types/types';
import { Loader2, Heart, X, ArrowLeft, RotateCcw, Grid3x3 } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import CarSwiper, { SwiperControls } from '../components/CarSwiper';
import { toast } from 'sonner';
import TinderTutorialOverlay from '../components/TinderTutorialOverlay';

type Direction = "left" | "right" | "up" | "down";

const ResponsiveInventoryPage: React.FC = () => {
    const router = useRouter();
    const { vehicles: allVehicles, isLoading, error } = useVehicles();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
    const [deckKey, setDeckKey] = useState(Date.now());
    const [showCategorySelector, setShowCategorySelector] = useState(false);
    const swiperRef = useRef<SwiperControls>(null);

    const categories = useMemo(() => {
        if (!allVehicles || allVehicles.length === 0) return ['Todos'];
        const extracted = [...new Set(allVehicles.flatMap(v => v.clasificacionid || []).filter(Boolean))];
        const priority = ['SUV', 'Sedán', 'Pick Up', 'Hatchback'];
        extracted.sort((a, b) => {
            const aPrio = priority.indexOf(a);
            const bPrio = priority.indexOf(b);
            if (aPrio > -1 && bPrio > -1) return aPrio - bPrio;
            if (aPrio > -1) return -1;
            if (bPrio > -1) return 1;
            return a.localeCompare(b);
        });
        return ['Todos', ...extracted];
    }, [allVehicles]);

    const currentCategory = categories[currentCategoryIndex];

    const filteredVehicles = useMemo(() => {
        if (!allVehicles) return [];
        const available = allVehicles.filter(v => v?.id && !isFavorite(v.id));
        const filtered = currentCategory === 'Todos'
            ? available
            : available.filter(v => v.clasificacionid?.includes(currentCategory));
        return filtered.sort(() => Math.random() - 0.5);
    }, [allVehicles, isFavorite, currentCategoryIndex, categories]);

    const handleSwipe = (carIndex: number, car: WordPressVehicle, direction: Direction) => {
        if (direction === 'down') {
            toggleFavorite(car.id);
            toast.success(`${car.title} guardado en favoritos!`, {
                icon: <Heart className="w-4 h-4 text-red-500" />,
            });
        } else if (direction === 'up') {
            // Skip/pass on the car
            toast('Pasaste el auto', {
                icon: <X className="w-4 h-4 text-gray-500" />,
            });
        }
    };

    const handleTap = (carIndex: number, car: WordPressVehicle) => {
        // Image cycling handled inside CarSwiper
    };

    const handleRestart = () => {
        setCurrentCategoryIndex(0);
        setDeckKey(Date.now());
        setShowCategorySelector(false);
    };

    const handleCategorySelect = (index: number) => {
        setCurrentCategoryIndex(index);
        setDeckKey(Date.now());
        setShowCategorySelector(false);
    };

    useEffect(() => {
        setDeckKey(Date.now());
    }, [currentCategoryIndex]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 gap-4 overflow-hidden">
                <Loader2 className="w-12 h-12 animate-spin text-white" />
                <p className="text-gray-400 text-sm">Cargando vehículos...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 gap-4 px-4 overflow-hidden">
                <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-6 max-w-md">
                    <h2 className="text-xl font-bold text-red-500 mb-2">Error al cargar vehículos</h2>
                    <p className="text-gray-300 text-sm mb-4">
                        {error.message || 'No se pudieron cargar los vehículos. Por favor, intenta de nuevo.'}
                    </p>
                    <button
                        onClick={() => window.location.reload()}
                        className="w-full bg-red-500 hover:bg-red-600 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        Reintentar
                    </button>
                </div>
            </div>
        );
    }

    if (!allVehicles || allVehicles.length === 0) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-gray-900 gap-4 px-4 overflow-hidden">
                <div className="bg-white/5 border border-white/10 rounded-lg p-6 max-w-md text-center">
                    <h2 className="text-xl font-bold text-white mb-2">No hay vehículos disponibles</h2>
                    <p className="text-gray-400 text-sm mb-4">
                        En este momento no tenemos vehículos en inventario. Por favor, vuelve más tarde.
                    </p>
                    <button
                        onClick={() => router.push('/')}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white overflow-hidden">
            <TinderTutorialOverlay />

            {/* Header */}
            <div className="relative flex items-center justify-between px-6 py-4 bg-black/20 backdrop-blur-sm border-b border-white/5 z-20">
                <button
                    onClick={() => router.push('/escritorio')}
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Salir</span>
                </button>

                <div className="text-center flex-1">
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Categoría</p>
                    <h1 className="text-lg font-bold text-white">{currentCategory}</h1>
                </div>

                <button
                    onClick={() => setShowCategorySelector(true)}
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors"
                >
                    <Grid3x3 className="w-5 h-5" />
                </button>
            </div>

            {/* Main Swiper Area */}
            <div className="flex-1 flex items-center justify-center overflow-hidden">
                <CarSwiper
                    key={deckKey}
                    ref={swiperRef}
                    cars={filteredVehicles}
                    onSwipe={handleSwipe}
                    onTap={handleTap}
                >
                    {/* End of deck screen */}
                    <div className="text-center text-white space-y-6 max-w-sm mx-auto">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-8">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                                <Heart className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">¡Terminaste!</h3>
                            <p className="text-gray-400 text-sm">
                                {currentCategory === 'Todos'
                                    ? 'Has visto todos los autos disponibles'
                                    : `Has visto todos los autos en ${currentCategory}`
                                }
                            </p>
                        </div>

                        <div className="space-y-3">
                            <button
                                onClick={handleRestart}
                                className="w-full flex items-center justify-center gap-3 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-xl transition-all shadow-lg"
                            >
                                <RotateCcw className="w-5 h-5" />
                                Reiniciar
                            </button>

                            <button
                                onClick={() => setShowCategorySelector(true)}
                                className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-4 px-6 rounded-xl transition-all border border-white/10"
                            >
                                <Grid3x3 className="w-5 h-5" />
                                Elegir Categoría
                            </button>

                            <button
                                onClick={() => router.push('/escritorio/favoritos')}
                                className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-4 px-6 rounded-xl transition-all border border-white/10"
                            >
                                <Heart className="w-5 h-5" />
                                Ver Favoritos
                            </button>
                        </div>
                    </div>
                </CarSwiper>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-center gap-6 p-6 bg-black/20 backdrop-blur-sm border-t border-white/5 z-20">
                <ActionButton
                    onClick={() => swiperRef.current?.swipe('up')}
                    color="bg-white/10 hover:bg-white/20"
                    icon={X}
                    label="Pasar"
                />
                <ActionButton
                    onClick={() => swiperRef.current?.swipe('down')}
                    color="bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg shadow-red-500/30"
                    icon={Heart}
                    label="Me gusta"
                    primary
                />
            </div>

            {/* Category Selector Modal */}
            {showCategorySelector && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className="bg-gray-900 rounded-2xl max-w-md w-full max-h-[80vh] overflow-hidden border border-white/10">
                        <div className="p-6 border-b border-white/10">
                            <h2 className="text-2xl font-bold text-white">Elegir Categoría</h2>
                            <p className="text-gray-400 text-sm mt-1">Selecciona el tipo de vehículo que quieres explorar</p>
                        </div>

                        <div className="overflow-y-auto max-h-[calc(80vh-180px)] p-6 space-y-2">
                            {categories.map((category, index) => (
                                <button
                                    key={category}
                                    onClick={() => handleCategorySelect(index)}
                                    className={`w-full text-left px-6 py-4 rounded-xl font-semibold transition-all ${
                                        index === currentCategoryIndex
                                            ? 'bg-primary-600 text-white shadow-lg'
                                            : 'bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white'
                                    }`}
                                >
                                    {category}
                                </button>
                            ))}
                        </div>

                        <div className="p-6 border-t border-white/10">
                            <button
                                onClick={() => setShowCategorySelector(false)}
                                className="w-full bg-white/10 hover:bg-white/20 text-white font-semibold py-3 px-6 rounded-xl transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

interface ActionButtonProps {
    onClick: () => void;
    icon: React.ElementType;
    color: string;
    label: string;
    primary?: boolean;
}

const ActionButton: React.FC<ActionButtonProps> = ({ onClick, icon: Icon, color, label, primary }) => (
    <button
        onClick={onClick}
        className={`flex flex-col items-center gap-2 transition-transform active:scale-90 ${primary ? '' : ''}`}
    >
        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all ${color}`}>
            <Icon className="w-8 h-8" />
        </div>
        <span className="text-xs font-medium text-gray-400">{label}</span>
    </button>
);

export default ResponsiveInventoryPage;
