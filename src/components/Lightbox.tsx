'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { ChevronLeftIcon, ChevronRightIcon, XIcon } from './icons';
import { getVideoEmbedUrl } from '../utils/formatters';

type MediaItem = {
    type: 'image' | 'video';
    url: string;
};

interface LightboxProps {
    media: MediaItem[];
    currentIndex: number;
    onClose: () => void;
    onPrev: () => void;
    onNext: () => void;
}

const Lightbox: React.FC<LightboxProps> = ({ media, currentIndex, onClose, onPrev, onNext }) => {
    const [showZoom, setShowZoom] = useState(false);
    const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
    const [touchStart, setTouchStart] = useState<number | null>(null);
    const ZOOM_LEVEL = 3;

    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose();
            if (e.key === 'ArrowLeft') onPrev();
            if (e.key === 'ArrowRight') onNext();
        };

        window.addEventListener('keydown', handleKeyDown);
        document.body.style.overflow = 'hidden';
        document.body.classList.add('lightbox-active');

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'unset';
            document.body.classList.remove('lightbox-active');
        };
    }, [onClose, onPrev, onNext]);

    // Touch swipe handling
    const handleTouchStart = (e: React.TouchEvent) => {
        setTouchStart(e.touches[0].clientX);
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        if (touchStart === null) return;
        const touchEnd = e.changedTouches[0].clientX;
        const diff = touchStart - touchEnd;
        const threshold = 50;

        if (diff > threshold) {
            onNext();
        } else if (diff < -threshold) {
            onPrev();
        }
        setTouchStart(null);
    };

    const handleMouseEnter = () => setShowZoom(true);
    const handleMouseLeave = () => setShowZoom(false);
    const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
        const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
        const x = ((e.clientX - left) / width) * 100;
        const y = ((e.clientY - top) / height) * 100;
        setMousePosition({
            x: Math.max(0, Math.min(100, x)),
            y: Math.max(0, Math.min(100, y))
        });
    };

    const goToImage = useCallback((index: number) => {
        const diff = index - currentIndex;
        if (diff > 0) {
            for (let i = 0; i < diff; i++) onNext();
        } else {
            for (let i = 0; i < Math.abs(diff); i++) onPrev();
        }
    }, [currentIndex, onNext, onPrev]);

    const currentItem = media[currentIndex];
    if (!currentItem) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] bg-black"
            style={{ touchAction: 'none' }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="lightbox-title"
        >
            <h2 id="lightbox-title" className="sr-only">Visor de imágenes y videos</h2>

            {/* Top bar with counter and close button - Always visible */}
            <div
                className="fixed top-0 left-0 right-0 z-[10002] flex items-center justify-between px-3 py-3 sm:px-6 sm:py-4"
                style={{ paddingTop: 'max(12px, env(safe-area-inset-top))' }}
            >
                {/* Counter */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-black/60 text-white text-sm rounded-full backdrop-blur-sm">
                    <span className="font-bold">{currentIndex + 1}</span>
                    <span className="text-white/60">/</span>
                    <span>{media.length}</span>
                </div>

                {/* Close button - Large touch target for mobile */}
                <button
                    onClick={onClose}
                    className="flex items-center justify-center min-w-[44px] min-h-[44px] px-3 sm:px-4 py-2 bg-white text-gray-900 font-semibold rounded-full shadow-lg active:bg-gray-200 transition-colors"
                    aria-label="Cerrar galería"
                    type="button"
                >
                    <XIcon className="w-5 h-5" />
                    <span className="hidden sm:inline sm:ml-2">Cerrar</span>
                </button>
            </div>

            {/* Navigation arrows */}
            {media.length > 1 && (
                <>
                    <button
                        onClick={(e) => { e.stopPropagation(); onPrev(); }}
                        className="fixed left-2 sm:left-4 top-1/2 -translate-y-1/2 z-[10000] p-2 sm:p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all active:scale-95"
                        aria-label="Imagen anterior"
                    >
                        <ChevronLeftIcon className="w-6 h-6" />
                    </button>
                    <button
                        onClick={(e) => { e.stopPropagation(); onNext(); }}
                        className="fixed right-2 sm:right-4 top-1/2 -translate-y-1/2 z-[10000] p-2 sm:p-3 bg-black/50 hover:bg-black/70 text-white rounded-full transition-all active:scale-95"
                        aria-label="Siguiente imagen"
                    >
                        <ChevronRightIcon className="w-6 h-6" />
                    </button>
                </>
            )}

            {/* Main content area - Touch swipeable */}
            <div
                className="absolute inset-0 flex items-center justify-center"
                style={{
                    paddingTop: 'max(60px, calc(env(safe-area-inset-top) + 48px))',
                    paddingBottom: media.length > 1 ? 'max(100px, calc(env(safe-area-inset-bottom) + 80px))' : 'max(20px, env(safe-area-inset-bottom))',
                    paddingLeft: '48px',
                    paddingRight: '48px'
                }}
                onClick={onClose}
                onTouchStart={handleTouchStart}
                onTouchEnd={handleTouchEnd}
            >
                {currentItem.type === 'image' ? (
                    <div
                        className="relative w-full h-full flex items-center justify-center"
                        onMouseEnter={handleMouseEnter}
                        onMouseLeave={handleMouseLeave}
                        onMouseMove={handleMouseMove}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={currentItem.url}
                            alt={`Imagen ${currentIndex + 1} de ${media.length}`}
                            className="max-w-full max-h-full object-contain rounded-md select-none"
                            draggable={false}
                            style={{ maxHeight: 'calc(100vh - 180px)' }}
                        />
                        {/* Zoom lens - Desktop only */}
                        {showZoom && (
                            <div
                                className="absolute pointer-events-none w-48 h-48 sm:w-64 sm:h-64 rounded-full border-4 border-white/80 bg-no-repeat shadow-2xl hidden sm:block"
                                style={{
                                    left: `${mousePosition.x}%`,
                                    top: `${mousePosition.y}%`,
                                    transform: 'translate(-50%, -50%)',
                                    backgroundImage: `url(${currentItem.url})`,
                                    backgroundSize: `${100 * ZOOM_LEVEL}%`,
                                    backgroundPosition: `${mousePosition.x}% ${mousePosition.y}%`,
                                }}
                            />
                        )}
                    </div>
                ) : (
                    <div
                        className="aspect-video w-full max-w-screen-lg"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <iframe
                            src={getVideoEmbedUrl(currentItem.url) || ''}
                            title="Video del auto"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                            className="w-full h-full rounded-lg"
                        ></iframe>
                    </div>
                )}
            </div>

            {/* Bottom thumbnails */}
            {media.length > 1 && (
                <div
                    className="fixed bottom-0 left-0 right-0 z-[10001] bg-gradient-to-t from-black/90 to-transparent py-3"
                    style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}
                >
                    <div className="flex justify-center px-3">
                        <div className="flex gap-1.5 p-1.5 bg-black/60 rounded-lg backdrop-blur-sm overflow-x-auto max-w-full">
                            {media.map((item, idx) => (
                                <button
                                    key={idx}
                                    onClick={(e) => { e.stopPropagation(); goToImage(idx); }}
                                    className={`shrink-0 w-14 h-10 sm:w-16 sm:h-12 rounded overflow-hidden border-2 transition-all ${
                                        currentIndex === idx
                                            ? 'border-white scale-105'
                                            : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                                >
                                    {item.type === 'image' ? (
                                        <img src={item.url} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full bg-gray-700 flex items-center justify-center">
                                            <span className="text-white text-xs">Video</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Mobile swipe hint */}
                    <div className="sm:hidden flex justify-center mt-2 text-white/50 text-xs">
                        <span className="flex items-center gap-1">
                            <ChevronLeftIcon className="w-3 h-3" />
                            Desliza para navegar
                            <ChevronRightIcon className="w-3 h-3" />
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Lightbox;
