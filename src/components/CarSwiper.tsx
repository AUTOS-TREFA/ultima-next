'use client';

import React, { useState, useMemo, useCallback, forwardRef, useImperativeHandle, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useSprings, animated, to as interpolate } from 'react-spring';
import { useDrag } from '@use-gesture/react';
import { WordPressVehicle } from '../types/types';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../utils/constants';

// --- Type Definitions ---
type Direction = "left" | "right" | "up" | "down";

export interface SwiperControls {
  swipe: (dir: Direction) => void;
}

interface CarSwiperProps {
  cars: WordPressVehicle[];
  onSwipe: (carIndex: number, car: WordPressVehicle, direction: Direction) => void;
  onTap: (carIndex: number, car: WordPressVehicle) => void;
  children?: React.ReactNode;
}

// --- Helper: Initial card positions ---
const to = (i: number) => ({
  x: 0,
  y: i * -4,
  scale: 1,
  rot: -1 + Math.random() * 2,
  delay: i * 100,
});

const from = () => ({ x: 0, rot: 0, scale: 1.5, y: -1000 });

// Transform function for interpolation
const trans = (r: number, s: number) =>
  `rotateZ(${r}deg) scale(${s})`;

// --- Helper Components ---
const CardContent: React.FC<{ car: WordPressVehicle; mediaIndex: number }> = React.memo(({ car, mediaIndex }) => {
    const media = useMemo(() => [
        ...(Array.isArray(car.feature_image) ? car.feature_image : [car.feature_image]),
        ...(car.galeria_exterior || []),
        ...(car.galeria_interior || [])
    ].filter(Boolean) as string[], [car]);

    const currentMedia = media[mediaIndex % media.length] || DEFAULT_PLACEHOLDER_IMAGE;

    return (
        <div className="relative w-full h-full rounded-3xl shadow-2xl overflow-hidden bg-gray-900 border-4 border-white/20">
            {/* Media progress bars */}
            {media.length > 1 && (
                <div className="absolute top-4 left-4 right-4 z-20 flex justify-center gap-1.5">
                    {media.map((_, i) => (
                        <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i === (mediaIndex % media.length) ? 'bg-white shadow-lg' : 'bg-white/30'}`}></div>
                    ))}
                </div>
            )}

            <img
                src={currentMedia}
                alt={car.title}
                className="w-full h-full object-cover"
                draggable="false"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent"></div>

            <div className="absolute bottom-0 left-0 right-0 p-6 text-white z-10">
                <h2 className="text-2xl font-bold mb-1" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                    {car.title}
                </h2>
                <div className="flex items-center gap-3 text-sm font-medium opacity-95" style={{ textShadow: '0 1px 4px rgba(0,0,0,0.6)' }}>
                    <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md">{car.autoano}</span>
                    <span className="bg-white/20 backdrop-blur-sm px-2 py-1 rounded-md">
                        {car.kilometraje?.toLocaleString() || 0} km
                    </span>
                </div>
                {car.precio && (
                    <div className="mt-2 text-2xl font-bold text-green-400" style={{ textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                        ${car.precio.toLocaleString()}
                    </div>
                )}
            </div>

            <Link
                href={`/autos/${car.slug}`}
                onClick={e => e.stopPropagation()}
                className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-gray-900 text-xs font-bold px-4 py-2 rounded-full hover:bg-white transition-all shadow-lg z-20"
            >
                Ver Detalles
            </Link>
        </div>
    );
});

// --- Main Swiper Component ---
const CarSwiper = forwardRef<SwiperControls, CarSwiperProps>(({
    cars, onSwipe, onTap, children
}, ref) => {
    const goneRef = useRef<Set<number>>(new Set());
    const [mediaIndices, setMediaIndices] = useState<Record<number, number>>({});
    const [isSwiping, setIsSwiping] = useState(false);

    // Reset gone set when cars change
    useEffect(() => {
        goneRef.current.clear();
    }, [cars]);

    const [props, api] = useSprings(cars.length, i => ({
        ...to(i),
        from: from(),
    }));

    const handleTap = useCallback((index: number) => {
        // Only allow taps when not swiping
        if (isSwiping) return;

        setMediaIndices(prev => ({
            ...prev,
            [index]: (prev[index] || 0) + 1
        }));
        onTap(index, cars[index]);
    }, [cars, onTap, isSwiping]);

    const bind = useDrag(({
        args: [index],
        active,
        movement: [mx, my],
        direction: [xDir, yDir],
        velocity: [vx, vy],
        last,
    }) => {
        // Prevent multiple cards from being swiped at once
        if (goneRef.current.has(index)) return;

        const trigger = !active && (Math.abs(my) > 100 || vy > 0.5);
        const dir = yDir < 0 ? -1 : 1;

        // Mark as swiping when drag starts
        if (active && !isSwiping) {
            setIsSwiping(true);
        }

        // Only process swipe if this is the top card
        const topCardIndex = cars.findIndex((_, i) => !goneRef.current.has(i));
        if (index !== topCardIndex) return;

        if (!active && trigger) {
            goneRef.current.add(index);
            setIsSwiping(false);

            const direction: Direction = my < 0 ? 'up' : 'down';
            // Delay the callback slightly to prevent multiple triggers
            setTimeout(() => {
                onSwipe(index, cars[index], direction);
            }, 0);
        }

        // Reset swiping state when drag ends
        if (last && !trigger) {
            setIsSwiping(false);
        }

        api.start(i => {
            if (index !== i) return;
            const isGone = goneRef.current.has(index);

            const x = isGone ? 0 : active ? mx * 0.2 : 0;
            const y = isGone ? dir * window.innerHeight * 1.5 : active ? my : 0;
            const rot = active ? mx / 50 : isGone ? dir * 15 : 0;
            const scale = active ? 1.05 : 1;

            return {
                x,
                y,
                rot,
                scale,
                config: {
                    friction: 50,
                    tension: active ? 800 : isGone ? 200 : 500
                },
            };
        });
    }, {
        filterTaps: true,
        threshold: 10,
    });

    useImperativeHandle(ref, () => ({
        swipe: (dir: Direction) => {
            const index = cars.findIndex((_, i) => !goneRef.current.has(i));
            if (index === -1) return;

            goneRef.current.add(index);

            // Delay the callback to prevent multiple triggers
            setTimeout(() => {
                onSwipe(index, cars[index], dir);
            }, 0);

            api.start(i => {
                if (index !== i) return;
                const yDir = dir === 'up' ? -1 : 1;
                return {
                    x: 0,
                    y: yDir * window.innerHeight * 1.5,
                    rot: yDir * 15,
                    scale: 1,
                    config: { friction: 50, tension: 200 }
                };
            });
        }
    }), [cars, onSwipe, api]);

    if (goneRef.current.size === cars.length) {
        return (
            <div className="w-full h-full flex items-center justify-center p-8">
                {children}
            </div>
        );
    }

    return (
        <div className="relative w-full h-full flex items-center justify-center">
            {props.map(({ x, y, rot, scale }, i) => {
                const isGone = goneRef.current.has(i);
                const reversedIndex = cars.length - 1 - i;
                const isTop3 = reversedIndex < 3;

                if (!isTop3 && !isGone) return null;

                return (
                    <animated.div
                        className="absolute will-change-transform touch-none"
                        key={i}
                        style={{
                            transform: interpolate([rot, scale], trans),
                            x,
                            y,
                            opacity: isGone ? 0 : 1,
                            zIndex: cars.length - i,
                            width: 'min(85vw, 380px)',
                            height: 'min(85vw, 380px)',
                            maxWidth: '380px',
                            maxHeight: '380px',
                            left: '50%',
                            top: '50%',
                            marginLeft: 'min(-42.5vw, -190px)',
                            marginTop: 'min(-42.5vw, -190px)',
                        }}
                    >
                        <div
                            {...bind(i)}
                            onClick={() => handleTap(i)}
                            className="w-full h-full cursor-grab active:cursor-grabbing"
                            style={{ touchAction: 'none' }}
                        >
                            <CardContent car={cars[i]} mediaIndex={mediaIndices[i] || 0} />
                        </div>
                    </animated.div>
                );
            })}
        </div>
    );
});

export default CarSwiper;
