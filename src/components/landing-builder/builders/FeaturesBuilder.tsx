'use client';

import React, { useState } from 'react';
import type { FeaturesProps, FeatureItem } from '../../../types/landing-builder';
import { GoogleGenAI } from "@google/genai";
import { FeaturesInputPanel } from '../FeaturesInputPanel';
import { FeaturesPreviewer } from '../FeaturesPreviewer';
import { useBuilderContext } from '../../../context/LandingBuilderContext';

const initialFeatures: FeatureItem[] = [
    { id: 1, title: 'Desarrollo Web y Móvil', description: 'Creamos aplicaciones web y móviles de alto rendimiento, centradas en la experiencia del usuario y los resultados de negocio.' },
    { id: 2, title: 'Marketing Digital', description: 'Impulsamos tu visibilidad online con estrategias de SEO, SEM y redes sociales diseñadas para atraer y convertir a tu público objetivo.' },
    { id: 3, title: 'Diseño UX/UI', description: 'Diseñamos interfaces intuitivas y atractivas que mejoran la satisfacción del usuario y aumentan la retención.' },
    { id: 4, title: 'Consultoría Estratégica', description: 'Te guiamos en el complejo camino de la transformación digital para asegurar que cada inversión tecnológica genere valor.' },
];

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


export const FeaturesBuilder: React.FC = () => {
    const { savedFeatures, removeFeature: removeSavedFeature } = useBuilderContext();
    const [props, setProps] = useState<FeaturesProps>({
        headline: 'Nuestros Servicios',
        paragraph: 'Un conjunto completo de soluciones digitales diseñadas para llevar tu presencia online y tus resultados de negocio al siguiente nivel.',
        features: initialFeatures,
        color: '#ffffff',
    });

    const [isGenerating, setIsGenerating] = useState<boolean | number>(false); // boolean for main, number for item id
    const [error, setError] = useState<string | null>(null);

    const handleContentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setProps(prev => ({ ...prev, [name]: value }));
    }
    
    const handleFeatureChange = (id: number, field: 'title' | 'description', value: string) => {
        setProps(prev => ({
            ...prev,
            features: prev.features.map(f => f.id === id ? { ...f, [field]: value } : f)
        }));
    };
    
    const addFeature = () => {
        const newId = (props.features.length > 0 ? Math.max(...props.features.map(f => f.id)) : 0) + 1;
        setProps(prev => ({
            ...prev,
            features: [...prev.features, { id: newId, title: `Nuevo Servicio ${newId}`, description: 'Describe este nuevo y fantástico servicio aquí.' }]
        }));
    };
    
    const removeFeature = (id: number) => {
        setProps(prev => ({ ...prev, features: prev.features.filter(f => f.id !== id) }));
    };

    const generateFeatureText = async (id: number) => {
        const feature = props.features.find(f => f.id === id);
        if (!feature || !feature.title) return;
        
        setIsGenerating(id);
        setError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Basado en el título del servicio: "${feature.title}", escribe una descripción corta y atractiva (1-2 frases).`,
            });
            handleFeatureChange(id, 'description', response.text?.trim() || '');
        } catch (e) {
            console.error(e);
            setError("No se pudo generar la descripción.");
        } finally {
            setIsGenerating(false);
        }
    };


    return (
        <main className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-4 sm:p-8">
            <aside className="lg:col-span-1 xl:col-span-1 lg:sticky lg:top-[157px] sm:top-[145px] h-fit">
                <div className="space-y-6">
                    <FeaturesInputPanel
                        {...props}
                        onContentChange={handleContentChange}
                        onFeatureChange={handleFeatureChange}
                        onAddFeature={addFeature}
                        onRemoveFeature={removeFeature}
                        onGenerateFeatureText={generateFeatureText}
                        isGenerating={isGenerating}
                        error={error}
                        onColorChange={(color) => setProps(p => ({...p, color}))}
                    />
                    {savedFeatures.length > 0 && (
                        <div className="bg-white rounded-lg p-6 space-y-4 border border-slate-200 shadow-sm">
                            <h2 className="text-xl font-semibold text-slate-900">Features Guardados</h2>
                            <ul className="space-y-2">
                                {savedFeatures.map(feature => (
                                    <li key={feature.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{feature.headline}</p>
                                            <p className="text-xs text-slate-500 capitalize">{feature.layout}</p>
                                        </div>
                                        <button onClick={() => removeSavedFeature(feature.id)} className="p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-500 rounded-md">
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
                <FeaturesPreviewer {...props} />
            </section>
        </main>
    );
};