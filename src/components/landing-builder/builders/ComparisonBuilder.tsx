
'use client';

import React, { useState } from 'react';
import type { ComparisonProps, ComparisonFeature, ComparisonItem } from '../../types/landing-builder';
import { useBuilderContext } from '../../../context/LandingBuilderContext';
import { ComparisonInputPanel } from '../ComparisonInputPanel';
import { ComparisonPreviewer } from '../ComparisonPreviewer';

const initialFeatures: ComparisonFeature[] = [
    { id: 1, name: 'Motor' },
    { id: 2, name: 'Precio' },
    { id: 3, name: 'Consumo (L/100km)' },
    { id: 4, name: 'Maletero (L)' },
];

const initialItems: ComparisonItem[] = [
    { id: 1, name: 'Modelo SUV', values: { 1: '2.0L Turbo', 2: '$35,000', 3: '7.5', 4: '550' } },
    { id: 2, name: 'Modelo Sedán', values: { 1: '1.8L Híbrido', 2: '$32,000', 3: '4.8', 4: '480' } },
    { id: 3, name: 'Modelo Hatchback', values: { 1: '1.5L Turbo', 2: '$28,000', 3: '6.2', 4: '410' } },
];

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


export const ComparisonBuilder: React.FC = () => {
    const { savedComparisons, removeComparison } = useBuilderContext();
    const [props, setProps] = useState<ComparisonProps>({
        headline: 'Compara Nuestros Modelos',
        paragraph: 'Encuentra el coche perfecto para tus necesidades. Compara las características clave de nuestros modelos más populares y toma la mejor decisión.',
        features: initialFeatures,
        items: initialItems,
        color: '#f1f5f9',
    });

    return (
        <main className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-4 sm:p-8">
            <aside className="lg:col-span-1 xl:col-span-1 lg:sticky lg:top-[157px] sm:top-[145px] h-fit">
                <div className="space-y-6">
                    <ComparisonInputPanel
                        {...props}
                        onPropsChange={setProps}
                    />
                     {savedComparisons.length > 0 && (
                        <div className="bg-white rounded-lg p-6 space-y-4 border border-slate-200 shadow-sm">
                            <h2 className="text-xl font-semibold text-slate-900">Comparaciones Guardadas</h2>
                            <ul className="space-y-2">
                                {savedComparisons.map(comp => (
                                    <li key={comp.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{comp.headline}</p>
                                            <p className="text-xs text-slate-500 capitalize">{comp.layout.replace('-', ' ')}</p>
                                        </div>
                                        <button onClick={() => removeComparison(comp.id)} className="p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-500 rounded-md">
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
                <ComparisonPreviewer {...props} />
            </section>
        </main>
    );
};
