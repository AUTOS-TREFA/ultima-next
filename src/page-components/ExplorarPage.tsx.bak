'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useVehicles } from '../context/VehicleContext';
import type { WordPressVehicle } from '../types/types';
import { Heart, X, ArrowLeft, RotateCcw, Grid3x3, Info, ChevronLeft, ChevronRight } from 'lucide-react';
import { useFavorites } from '../hooks/useFavorites';
import { toast } from 'sonner';
import { useSprings, animated } from '@react-spring/web';
import { useDrag } from '@use-gesture/react';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../utils/constants';

const ExplorarPage: React.FC = () => {
    const navigate = useNavigate();
    const { vehicles: allVehicles, isLoading, error } = useVehicles();
    const { isFavorite, toggleFavorite } = useFavorites();
    const [currentCategoryIndex, setCurrentCategoryIndex] = useState(0);
    const [showCategorySelector, setShowCategorySelector] = useState(false);
    const [gone, setGone] = useState<Set<number>>(new Set());
    const [currentImageIndex, setCurrentImageIndex] = useState<Record<number, number>>({});
    const [showTutorial, setShowTutorial] = useState(false);

    // Check if tutorial has been shown
    useEffect(() => {
        const tutorialShown = localStorage.getItem('explorarTutorialShown');
        if (!tutorialShown) {
            setShowTutorial(true);
        }
    }, []);

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
    }, [allVehicles, isFavorite, currentCategory]);

    // Reset when category changes
    useEffect(() => {
        setGone(new Set());
        setCurrentImageIndex({});
    }, [currentCategoryIndex]);

    const [springs, api] = useSprings(filteredVehicles.length, (i) => ({
        x: 0,
        y: 0,
        scale: 1,
        rotateZ: 0,
        config: { friction: 50, tension: 800 },
    }));

    const handleSwipe = (index: number, direction: 'left' | 'right') => {
        const car = filteredVehicles[index];

        setGone(prev => new Set([...prev, index]));

        // Animate card off screen
        api.start(i => {
            if (i !== index) return;
            return {
                x: direction === 'right' ? window.innerWidth : -window.innerWidth,
                rotateZ: direction === 'right' ? 15 : -15,
                config: { friction: 50, tension: 200 },
            };
        });

        if (direction === 'right') {
            toggleFavorite(car.id);
            toast.success(`${car.titulo} guardado en favoritos!`, {
                icon: <Heart className="w-4 h-4 text-red-500" />,
            });
        } else {
            toast('Pasaste el auto', {
                icon: <X className="w-4 h-4 text-gray-500" />,
            });
        }
    };

    const bind = useDrag(({ args: [index], active, movement: [mx, my], direction: [xDir], velocity: [vx], tap }) => {
        if (gone.has(index)) return;

        // Find the top card
        const topCardIndex = filteredVehicles.findIndex((_, i) => !gone.has(i));
        if (index !== topCardIndex) return;

        // Handle tap to cycle images
        if (tap) {
            setCurrentImageIndex(prev => ({
                ...prev,
                [index]: ((prev[index] || 0) + 1),
            }));
            return;
        }

        const trigger = vx > 0.5 || Math.abs(mx) > 100;
        const dir = xDir < 0 ? 'left' : 'right';

        if (!active && trigger) {
            handleSwipe(index, dir);
        } else {
            // Follow finger while dragging
            api.start(i => {
                if (i !== index) return;
                const x = active ? mx : 0;
                const rotateZ = active ? mx / 20 : 0;
                const scale = active ? 1.02 : 1;

                return { x, rotateZ, scale, y: 0 };
            });
        }
    }, {
        filterTaps: true,
        axis: 'x',
    });

    const handleButtonSwipe = (direction: 'left' | 'right') => {
        const index = filteredVehicles.findIndex((_, i) => !gone.has(i));
        if (index === -1) return;
        handleSwipe(index, direction);
    };

    const handleRestart = () => {
        setGone(new Set());
        setCurrentImageIndex({});
        setCurrentCategoryIndex(0);
        setShowCategorySelector(false);
    };

    const handleCategorySelect = (index: number) => {
        setCurrentCategoryIndex(index);
        setShowCategorySelector(false);
    };

    const getCarImages = (car: WordPressVehicle) => {
        return [
            ...(Array.isArray(car.feature_image) ? car.feature_image : [car.feature_image]),
            ...(car.galeria_exterior || []),
            ...(car.galeria_interior || [])
        ].filter(Boolean) as string[];
    };

    const nextImage = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setCurrentImageIndex(prev => ({
            ...prev,
            [index]: ((prev[index] || 0) + 1),
        }));
    };

    const prevImage = (index: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const images = getCarImages(filteredVehicles[index]);
        setCurrentImageIndex(prev => ({
            ...prev,
            [index]: ((prev[index] || 0) - 1 + images.length),
        }));
    };

    if (isLoading) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 gap-4">
                <div className="w-16 h-16 border-4 border-white/20 border-t-white rounded-full animate-spin" />
                <p className="text-white/60 text-sm">Cargando vehículos...</p>
            </div>
        );
    }

    if (error || !allVehicles || allVehicles.length === 0) {
        return (
            <div className="fixed inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 gap-4 px-6">
                <div className="bg-white/5 border border-white/10 rounded-2xl p-8 max-w-md text-center">
                    <h2 className="text-2xl font-bold text-white mb-3">
                        {error ? 'Error al cargar vehículos' : 'No hay vehículos disponibles'}
                    </h2>
                    <p className="text-white/60 text-sm mb-6">
                        {error?.message || 'En este momento no tenemos vehículos en inventario.'}
                    </p>
                    <button
                        onClick={() => navigate('/')}
                        className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
                    >
                        Volver al inicio
                    </button>
                </div>
            </div>
        );
    }

    const allGone = gone.size === filteredVehicles.length;

    return (
        <div className="fixed inset-0 flex flex-col bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 overflow-hidden">
            {/* Tutorial Overlay */}
            {showTutorial && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[100] flex items-center justify-center p-6">
                    <div className="bg-gradient-to-br from-gray-800 to-gray-900 rounded-3xl max-w-md w-full p-8 border border-white/10">
                        <h2 className="text-3xl font-bold text-white mb-4">¡Bienvenido a Explorar!</h2>
                        <div className="space-y-4 text-white/80 mb-6">
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-primary-600 flex items-center justify-center flex-shrink-0">
                                    <ChevronRight className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white mb-1">Desliza a la derecha</h3>
                                    <p className="text-sm">Para guardar el auto en favoritos</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-gray-600 flex items-center justify-center flex-shrink-0">
                                    <ChevronLeft className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white mb-1">Desliza a la izquierda</h3>
                                    <p className="text-sm">Para pasar al siguiente auto</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3">
                                <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                                    <Info className="w-6 h-6" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white mb-1">Toca la imagen</h3>
                                    <p className="text-sm">Para ver más fotos del vehículo</p>
                                </div>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                setShowTutorial(false);
                                localStorage.setItem('explorarTutorialShown', 'true');
                            }}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-4 rounded-xl transition-colors"
                        >
                            ¡Entendido!
                        </button>
                    </div>
                </div>
            )}

            {/* Header */}
            <div className="relative flex items-center justify-between px-4 py-3 bg-black/20 backdrop-blur-sm border-b border-white/5 z-20 flex-shrink-0">
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors px-2 py-1"
                >
                    <ArrowLeft className="w-5 h-5" />
                    <span className="text-sm font-medium">Salir</span>
                </button>

                <div className="text-center">
                    <p className="text-xs font-semibold text-white/50 uppercase tracking-wide">Categoría</p>
                    <h1 className="text-base font-bold text-white">{currentCategory}</h1>
                </div>

                <button
                    onClick={() => setShowCategorySelector(true)}
                    className="flex items-center gap-2 text-white/80 hover:text-white transition-colors px-2 py-1"
                >
                    <Grid3x3 className="w-5 h-5" />
                </button>
            </div>

            {/* Main Card Area */}
            <div className="flex-1 flex items-center justify-center overflow-hidden relative">
                {allGone ? (
                    <div className="text-center text-white space-y-6 max-w-sm mx-auto px-6">
                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-3xl p-8">
                            <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-primary-500 to-purple-600 flex items-center justify-center">
                                <Heart className="w-10 h-10 text-white" />
                            </div>
                            <h3 className="text-2xl font-bold mb-2">¡Terminaste!</h3>
                            <p className="text-white/60 text-sm">
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
                                onClick={() => navigate('/escritorio/favoritos')}
                                className="w-full flex items-center justify-center gap-3 bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white font-semibold py-4 px-6 rounded-xl transition-all border border-white/10"
                            >
                                <Heart className="w-5 h-5" />
                                Ver Favoritos ({Object.keys(useFavorites().favorites).length})
                            </button>
                        </div>
                    </div>
                ) : (
                    <div className="relative w-full max-w-[90vw] h-[70vh] max-h-[600px]">
                        {springs.map((style, i) => {
                            if (gone.has(i)) return null;

                            const car = filteredVehicles[i];
                            const images = getCarImages(car);
                            const imageIndex = (currentImageIndex[i] || 0) % images.length;
                            const currentImage = images[imageIndex] || DEFAULT_PLACEHOLDER_IMAGE;

                            // Only render top 3 cards for performance
                            const topCardIndex = filteredVehicles.findIndex((_, idx) => !gone.has(idx));
                            if (i > topCardIndex + 2) return null;

                            const isTopCard = i === topCardIndex;
                            const stackOffset = i - topCardIndex;

                            return (
                                <animated.div
                                    key={car.id}
                                    style={{
                                        ...style,
                                        position: 'absolute',
                                        width: '100%',
                                        height: '100%',
                                        touchAction: 'none',
                                        willChange: 'transform',
                                        zIndex: filteredVehicles.length - i,
                                        transform: style.x.to(x => {
                                            const baseTransform = `translateX(${x}px) translateY(${stackOffset * -8}px) scale(${1 - stackOffset * 0.05}) rotateZ(${style.rotateZ.get()}deg)`;
                                            return baseTransform;
                                        }),
                                    }}
                                    {...(isTopCard ? bind(i) : {})}
                                >
                                    <div className="relative w-full h-full rounded-3xl shadow-2xl overflow-hidden bg-gray-900 border-4 border-white/20">
                                        {/* Image Progress Indicators */}
                                        {images.length > 1 && (
                                            <div className="absolute top-4 left-4 right-4 z-20 flex gap-1.5">
                                                {images.map((_, idx) => (
                                                    <div
                                                        key={idx}
                                                        className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                                                            idx === imageIndex ? 'bg-white shadow-lg' : 'bg-white/30'
                                                        }`}
                                                    />
                                                ))}
                                            </div>
                                        )}

                                        {/* Image */}
                                        <img
                                            src={currentImage}
                                            alt={car.titulo}
                                            className="w-full h-full object-cover select-none"
                                            draggable="false"
                                        />

                                        {/* Gradient Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent pointer-events-none" />

                                        {/* Image Navigation Arrows */}
                                        {images.length > 1 && isTopCard && (
                                            <>
                                                <button
                                                    onClick={(e) => prevImage(i, e)}
                                                    className="absolute left-2 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-2 rounded-full transition-all"
                                                >
                                                    <ChevronLeft className="w-6 h-6" />
                                                </button>
                                                <button
                                                    onClick={(e) => nextImage(i, e)}
                                                    className="absolute right-2 top-1/2 -translate-y-1/2 z-30 bg-black/50 hover:bg-black/70 backdrop-blur-sm text-white p-2 rounded-full transition-all"
                                                >
                                                    <ChevronRight className="w-6 h-6" />
                                                </button>
                                            </>
                                        )}

                                        {/* Car Info */}
                                        <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10 pointer-events-none">
                                            <h2 className="text-2xl font-bold mb-2 drop-shadow-lg">
                                                {car.titulo}
                                            </h2>
                                            <div className="flex items-center gap-3 text-sm font-medium mb-2">
                                                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                                                    {car.autoano}
                                                </span>
                                                <span className="bg-white/20 backdrop-blur-sm px-3 py-1 rounded-lg">
                                                    {car.kilometraje?.toLocaleString() || 0} km
                                                </span>
                                            </div>
                                            {car.precio && (
                                                <div className="text-3xl font-bold text-green-400 drop-shadow-lg">
                                                    ${car.precio.toLocaleString()}
                                                </div>
                                            )}
                                        </div>

                                        {/* View Details Button */}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                navigate(`/autos/${car.slug}`);
                                            }}
                                            className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-bold px-4 py-2 rounded-full hover:bg-white transition-all shadow-lg z-20 pointer-events-auto"
                                        >
                                            Ver Detalles
                                        </button>
                                    </div>
                                </animated.div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* Action Buttons */}
            {!allGone && (
                <div className="flex items-center justify-center gap-6 p-6 bg-black/20 backdrop-blur-sm border-t border-white/5 z-20 flex-shrink-0">
                    <button
                        onClick={() => handleButtonSwipe('left')}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-16 h-16 rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md flex items-center justify-center text-white transition-all group-active:scale-90">
                            <X className="w-8 h-8" />
                        </div>
                        <span className="text-xs font-medium text-white/60">Pasar</span>
                    </button>

                    <button
                        onClick={() => handleButtonSwipe('right')}
                        className="flex flex-col items-center gap-2 group"
                    >
                        <div className="w-20 h-20 rounded-full bg-gradient-to-br from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 shadow-lg shadow-red-500/30 flex items-center justify-center text-white transition-all group-active:scale-90">
                            <Heart className="w-10 h-10" />
                        </div>
                        <span className="text-xs font-medium text-white/60">Me gusta</span>
                    </button>
                </div>
            )}

            {/* Category Selector Modal */}
            {showCategorySelector && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-6">
                    <div className="bg-gray-900 rounded-3xl max-w-md w-full max-h-[80vh] overflow-hidden border border-white/10">
                        <div className="p-6 border-b border-white/10">
                            <h2 className="text-2xl font-bold text-white">Elegir Categoría</h2>
                            <p className="text-white/60 text-sm mt-1">Selecciona el tipo de vehículo</p>
                        </div>

                        <div className="overflow-y-auto max-h-[calc(80vh-180px)] p-6 space-y-2">
                            {categories.map((category, index) => (
                                <button
                                    key={category}
                                    onClick={() => handleCategorySelect(index)}
                                    className={`w-full text-left px-6 py-4 rounded-xl font-semibold transition-all ${
                                        index === currentCategoryIndex
                                            ? 'bg-primary-600 text-white shadow-lg scale-105'
                                            : 'bg-white/5 hover:bg-white/10 text-white/80 hover:text-white'
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

export default ExplorarPage;
