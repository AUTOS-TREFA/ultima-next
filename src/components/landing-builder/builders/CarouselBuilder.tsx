
'use client';

import React, { useState } from 'react';
import type { CarouselProps } from '../../../types/landing-builder';
import { useBuilderContext } from '../../../context/LandingBuilderContext';
import { CarouselInputPanel } from '../CarouselInputPanel';
import { CarouselPreviewer } from '../CarouselPreviewer';

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const CarouselBuilder: React.FC = () => {
    const { savedCarousels, removeCarousel } = useBuilderContext();
    const [props, setProps] = useState<CarouselProps>({
        headline: 'Explora Nuestra Gama Familiar',
        paragraph: 'Desde SUVs espaciosas hasta hatchbacks eficientes, cada vehículo está diseñado pensando en la seguridad y comodidad de tu familia.',
        images: [
            { id: 1, src: 'https://images.unsplash.com/photo-1619767886558-efdc259cde1a?q=80&w=2070&auto=format&fit=crop' },
            { id: 2, src: 'https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop' },
            { id: 3, src: 'https://images.unsplash.com/photo-1552519507-95ec734c9f3f?q=80&w=1964&auto=format&fit=crop' },
            { id: 4, src: 'https://images.unsplash.com/photo-1609521263047-f8f205293f24?q=80&w=2070&auto=format&fit=crop' },
            { id: 5, src: 'https://images.unsplash.com/photo-1606664515524-ed2f786a0bd6?q=80&w=2070&auto=format&fit=crop' },
        ],
        color: '#ffffff',
    });

    return (
        <main className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-4 sm:p-8">
            <aside className="lg:col-span-1 xl:col-span-1 lg:sticky lg:top-[157px] sm:top-[145px] h-fit">
                <div className="space-y-6">
                    <CarouselInputPanel
                        {...props}
                        onPropsChange={setProps}
                    />
                    {savedCarousels.length > 0 && (
                        <div className="bg-white rounded-lg p-6 space-y-4 border border-slate-200 shadow-sm">
                            <h2 className="text-xl font-semibold text-slate-900">Carruseles Guardados</h2>
                            <ul className="space-y-2">
                                {savedCarousels.map(carousel => (
                                    <li key={carousel.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{carousel.headline}</p>
                                            <p className="text-xs text-slate-500 capitalize">{carousel.layout.replace('-', ' ')}</p>
                                        </div>
                                        <button onClick={() => removeCarousel(carousel.id)} className="p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-500 rounded-md">
                                            <TrashIcon />
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            </aside>
            <section className="lg:col-span-2 xl:col-span-3">
                <CarouselPreviewer {...props} />
            </section>
        </main>
    );
};
