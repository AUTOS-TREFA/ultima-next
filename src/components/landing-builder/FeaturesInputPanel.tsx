'use client';

import React from 'react';
import type { FeaturesProps } from '../../types/landing-builder';

interface FeaturesInputPanelProps extends FeaturesProps {
    onContentChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
    onFeatureChange: (id: number, field: 'title' | 'description', value: string) => void;
    onAddFeature: () => void;
    onRemoveFeature: (id: number) => void;
    onGenerateFeatureText: (id: number) => void;
    isGenerating: boolean | number;
    error: string | null;
    onColorChange: (color: string) => void;
}

const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm6 0a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0V6h-1a1 1 0 010-2h1V3a1 1 0 011-1zM5 12a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0v-1H3a1 1 0 010-2h1v-1a1 1 0 011-1zm6 0a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0v-1h-1a1 1 0 010-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
)
const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);


export const FeaturesInputPanel: React.FC<FeaturesInputPanelProps> = (props) => {
    const { headline, paragraph, features, color, onContentChange, onFeatureChange, onAddFeature, onRemoveFeature, onGenerateFeatureText, isGenerating, error, onColorChange } = props;

    return (
        <div className="bg-white rounded-lg p-6 space-y-6 border border-slate-200 shadow-sm">
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-900">Contenido Principal</h2>
                <div>
                    <label htmlFor="headline" className="block text-sm font-medium text-slate-600 mb-2">Título de la Sección</label>
                    <input type="text" name="headline" id="headline" value={headline} onChange={onContentChange}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md shadow-sm py-2 px-3" />
                </div>
                <div>
                    <label htmlFor="paragraph" className="block text-sm font-medium text-slate-600 mb-2">Párrafo Introductorio</label>
                    <textarea name="paragraph" id="paragraph" rows={3} value={paragraph} onChange={onContentChange}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md shadow-sm py-2 px-3" />
                </div>
                 <div>
                    <label htmlFor="color" className="block text-sm font-medium text-slate-600 mb-2">Color de Fondo</label>
                    <input type="color" name="color" id="color" value={color} onChange={(e) => onColorChange(e.target.value)}
                        className="w-full h-10 p-1 bg-slate-50 border border-slate-300 rounded-md cursor-pointer" />
                </div>
            </div>

            <hr className="border-slate-200" />

            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold text-slate-900">Características</h2>
                    <button onClick={onAddFeature} className="px-3 py-1.5 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-[#FF6801] hover:bg-[#E65C00]">
                        Añadir
                    </button>
                </div>

                <div className="space-y-4">
                    {features.map(feature => (
                        <div key={feature.id} className="p-4 bg-slate-50/70 rounded-lg border border-slate-200 space-y-3">
                            <div className="flex justify-between items-start">
                                <input type="text" value={feature.title} onChange={(e) => onFeatureChange(feature.id, 'title', e.target.value)}
                                    className="w-full bg-white font-semibold border-slate-300 rounded-md shadow-sm py-1 px-2 mr-2" />
                                <button onClick={() => onRemoveFeature(feature.id)} className="p-2 text-slate-500 hover:bg-red-100 hover:text-red-600 rounded-md">
                                    <TrashIcon />
                                </button>
                            </div>
                            <textarea value={feature.description} onChange={(e) => onFeatureChange(feature.id, 'description', e.target.value)} rows={3}
                                className="w-full bg-white border-slate-300 rounded-md shadow-sm py-2 px-3 text-sm" />
                            <button onClick={() => onGenerateFeatureText(feature.id)} disabled={!!isGenerating} className="w-full flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md text-white bg-slate-600 hover:bg-slate-700 disabled:bg-slate-400">
                                {isGenerating === feature.id ? <LoadingSpinner/> : <SparklesIcon />}
                                {isGenerating === feature.id ? 'Generando...' : 'Generar Descripción con IA'}
                            </button>
                        </div>
                    ))}
                </div>
                {error && <p className="text-sm text-red-600 mt-2">{error}</p>}
            </div>
        </div>
    );
};