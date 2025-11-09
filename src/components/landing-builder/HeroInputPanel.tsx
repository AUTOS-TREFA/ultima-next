
'use client';

import React from 'react';
import type { HeroProps, Roundness } from '../../types/landing-builder';

interface HeroInputPanelProps {
    content: HeroProps;
    onContentChange: React.Dispatch<React.SetStateAction<HeroProps>>;
    onImageUpload: (file: File) => void;
    textPrompt: string;
    onTextPromptChange: React.Dispatch<React.SetStateAction<string>>;
    onGenerateText: () => void;
    isGeneratingText: boolean;
    textError: string | null;
    imagePrompt: string;
    onImagePromptChange: React.Dispatch<React.SetStateAction<string>>;
    onGenerateImage: () => void;
    isGeneratingImage: boolean;
    imageError: string | null;
}

const PhotoIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
);
const SparklesIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm6 0a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0V6h-1a1 1 0 010-2h1V3a1 1 0 011-1zM5 12a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0v-1H3a1 1 0 010-2h1v-1a1 1 0 011-1zm6 0a1 1 0 011 1v1h1a1 1 0 010 2h-1v1a1 1 0 01-2 0v-1h-1a1 1 0 010-2h1v-1a1 1 0 011-1z" clipRule="evenodd" />
    </svg>
)
const LoadingSpinner = () => (
    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

export const HeroInputPanel: React.FC<HeroInputPanelProps> = (props) => {
    const {
        content, onContentChange, onImageUpload,
        textPrompt, onTextPromptChange, onGenerateText, isGeneratingText, textError,
        imagePrompt, onImagePromptChange, onGenerateImage, isGeneratingImage, imageError,
    } = props;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        onContentChange(prev => ({ ...prev, [name]: value }));
    }
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            onImageUpload(e.target.files[0]);
        }
    };

    const isGenerating = isGeneratingText || isGeneratingImage;
    const roundnessOptions: { value: Roundness, label: string }[] = [
        { value: 'none', label: 'Sin Redondez' }, { value: 'sm', label: 'Pequeño (sm)' },
        { value: 'md', label: 'Medio (md)' }, { value: 'lg', label: 'Grande (lg)' },
        { value: 'xl', label: 'Extra Grande (xl)' }, { value: '2xl', label: '2xl' },
        { value: '3xl', label: '3xl' }, { value: 'full', label: 'Completo (full)' },
    ];

    return (
        <div className="bg-white rounded-lg p-6 space-y-6 border border-slate-200 shadow-sm">
            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-900">Generar con IA</h2>
                <div className="space-y-4 p-4 bg-slate-50/70 rounded-lg border border-slate-200">
                    <h3 className="font-semibold text-slate-800">1. Generar Texto del Hero</h3>
                    <div>
                        <label htmlFor="textPrompt" className="block text-sm font-medium text-slate-600 mb-2">Tema o idea</label>
                        <textarea name="textPrompt" id="textPrompt" rows={2} value={textPrompt} onChange={(e) => onTextPromptChange(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6801]" />
                    </div>
                    <button onClick={onGenerateText} disabled={isGenerating} className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#FF6801] hover:bg-[#E65C00] disabled:bg-orange-300">
                        {isGeneratingText ? <LoadingSpinner /> : <SparklesIcon />}
                        {isGeneratingText ? 'Generando...' : 'Generar Textos'}
                    </button>
                    {textError && <p className="text-sm text-red-600 mt-2">{textError}</p>}
                </div>

                <div className="space-y-4 p-4 bg-slate-50/70 rounded-lg border border-slate-200">
                    <h3 className="font-semibold text-slate-800">2. Generar Imagen de Fondo</h3>
                    <div>
                        <label htmlFor="imagePrompt" className="block text-sm font-medium text-slate-600 mb-2">Descripción de la imagen</label>
                        <textarea name="imagePrompt" id="imagePrompt" rows={2} value={imagePrompt} onChange={(e) => onImagePromptChange(e.target.value)}
                            className="w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#FF6801]" />
                    </div>
                    <button onClick={onGenerateImage} disabled={isGenerating} className="w-full flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#FF6801] hover:bg-[#E65C00] disabled:bg-orange-300">
                        {isGeneratingImage ? <LoadingSpinner /> : <SparklesIcon />}
                        {isGeneratingImage ? 'Generando...' : 'Generar Imagen'}
                    </button>
                    {imageError && <p className="text-sm text-red-600 mt-2">{imageError}</p>}
                </div>
            </div>

            <hr className="border-slate-200" />

            <div className="space-y-6">
                <h2 className="text-xl font-semibold text-slate-900">Personalizar Contenido</h2>
                <div>
                    <label htmlFor="headline" className="block text-sm font-medium text-slate-600 mb-2">Título Principal</label>
                    <input type="text" name="headline" id="headline" value={content.headline} onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md shadow-sm py-2 px-3" />
                </div>
                <div>
                    <label htmlFor="paragraph" className="block text-sm font-medium text-slate-600 mb-2">Párrafo</label>
                    <textarea name="paragraph" id="paragraph" rows={4} value={content.paragraph} onChange={handleChange}
                        className="w-full bg-slate-50 border border-slate-300 rounded-md shadow-sm py-2 px-3" />
                </div>
                
                 {/* CTA Customization */}
                <div className="space-y-4 p-4 bg-slate-50/70 rounded-lg border border-slate-200">
                    <h3 className="font-semibold text-slate-800">Llamada a la Acción (CTA)</h3>
                    <div>
                        <label htmlFor="ctaText" className="block text-sm font-medium text-slate-600 mb-2">Texto del CTA</label>
                        <input type="text" name="ctaText" id="ctaText" value={content.ctaText} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3" />
                    </div>
                    <div>
                        <label htmlFor="ctaLink" className="block text-sm font-medium text-slate-600 mb-2">Enlace del CTA (URL)</label>
                        <input type="text" name="ctaLink" id="ctaLink" value={content.ctaLink} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="ctaType" className="block text-sm font-medium text-slate-600 mb-2">Tipo</label>
                            <select name="ctaType" id="ctaType" value={content.ctaType} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3">
                                <option value="button">Botón</option>
                                <option value="link">Enlace de Texto</option>
                            </select>
                        </div>
                        {content.ctaType === 'button' && (
                            <div>
                                <label htmlFor="ctaStyle" className="block text-sm font-medium text-slate-600 mb-2">Estilo</label>
                                <select name="ctaStyle" id="ctaStyle" value={content.ctaStyle} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3">
                                    <option value="filled">Relleno</option>
                                    <option value="lined">Borde</option>
                                </select>
                            </div>
                        )}
                    </div>
                    {content.ctaType === 'button' && (
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label htmlFor="ctaColor" className="block text-sm font-medium text-slate-600 mb-2">Color</label>
                                <input type="color" name="ctaColor" id="ctaColor" value={content.ctaColor} onChange={handleChange} className="w-full h-10 p-1 bg-white border border-slate-300 rounded-md" />
                            </div>
                            <div>
                                <label htmlFor="ctaRoundness" className="block text-sm font-medium text-slate-600 mb-2">Redondez</label>
                                <select name="ctaRoundness" id="ctaRoundness" value={content.ctaRoundness} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3">
                                    {roundnessOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                </select>
                            </div>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                      <label htmlFor="color" className="block text-sm font-medium text-slate-600 mb-2">Color de Fondo</label>
                      <input type="color" name="color" id="color" value={content.color} onChange={handleChange}
                          className="w-full h-10 p-1 bg-slate-50 border border-slate-300 rounded-md cursor-pointer" />
                  </div>
                   <div>
                        <label htmlFor="imageRoundness" className="block text-sm font-medium text-slate-600 mb-2">Redondez de Imagen</label>
                        <select name="imageRoundness" id="imageRoundness" value={content.imageRoundness} onChange={handleChange} className="w-full bg-white border border-slate-300 rounded-md shadow-sm py-2 px-3">
                            {roundnessOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                        </select>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Imagen de Fondo</label>
                    <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-slate-300 border-dashed rounded-md">
                        <div className="space-y-1 text-center">
                            {content.image ? <img src={content.image} alt="Vista previa" className="mx-auto h-24 w-auto rounded-md object-contain" /> : <PhotoIcon />}
                            <div className="flex text-sm text-slate-500">
                                <label htmlFor="file-upload-hero" className="relative cursor-pointer bg-white rounded-md font-medium text-[#FF6801] hover:text-[#E65C00] px-1">
                                    <span>Sube un archivo</span>
                                    <input id="file-upload-hero" name="file-upload" type="file" className="sr-only" onChange={handleFileChange} accept="image/*"/>
                                </label>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
