
import React, { useState } from 'react';
import type { HeroProps } from '../types';
import { GoogleGenAI, Type } from "@google/genai";
import { HeroInputPanel } from '../components/HeroInputPanel';
import { HeroPreviewer } from '../components/HeroPreviewer';
import { useBuilderContext } from '../context/BuilderContext';

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const HeroBuilder: React.FC = () => {
    const { savedHeros, removeHero } = useBuilderContext();
    const [content, setContent] = useState<HeroProps>({
        headline: 'Aventura, Espacio y Comodidad',
        paragraph: 'Descubre la SUV perfecta para tu familia. Con la última tecnología en seguridad y un interior espacioso, cada viaje es una nueva oportunidad para crear recuerdos.',
        ctaText: 'Explorar SUVs',
        image: 'https://images.unsplash.com/photo-1554223090-7e482851df45?q=80&w=2070&auto=format&fit=crop',
        color: '#ffffff',
        ctaLink: '#',
        ctaType: 'button',
        ctaStyle: 'filled',
        ctaColor: '#FF6801',
        ctaRoundness: 'md',
        imageRoundness: 'none',
    });

    const [textPrompt, setTextPrompt] = useState<string>('Un hero para una marca de coches SUV familiares, enfocado en la aventura y la seguridad.');
    const [isGeneratingText, setIsGeneratingText] = useState<boolean>(false);
    const [textError, setTextError] = useState<string | null>(null);

    const [imagePrompt, setImagePrompt] = useState<string>('Una SUV familiar de color azul oscuro conduciendo por una carretera de montaña al atardecer, con una familia feliz dentro.');
    const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
    const [imageError, setImageError] = useState<string | null>(null);

    const handleGenerateText = async () => {
        setIsGeneratingText(true);
        setTextError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Basado en el siguiente tema: "${textPrompt}", genera un titular (headline), un párrafo corto (paragraph) y un texto para un botón de llamada a la acción (ctaText) para la sección Héroe de una landing page.`,
                config: {
                    responseMimeType: "application/json",
                    responseSchema: {
                        type: Type.OBJECT,
                        properties: {
                            headline: { type: Type.STRING },
                            paragraph: { type: Type.STRING },
                            ctaText: { type: Type.STRING },
                        },
                        required: ['headline', 'paragraph', 'ctaText'],
                    }
                }
            });
            const resultJson = JSON.parse(response.text?.trim() || '{}');
            setContent(prev => ({ ...prev, ...resultJson }));
        } catch (e) {
            console.error(e);
            setTextError("No se pudo generar el texto.");
        } finally {
            setIsGeneratingText(false);
        }
    };

    const handleGenerateImage = async () => {
        setIsGeneratingImage(true);
        setImageError(null);
        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
            const response = await ai.models.generateImages({
                model: 'imagen-4.0-generate-001',
                prompt: imagePrompt,
                config: { numberOfImages: 1, aspectRatio: '16:9' },
            });
            const imageBytes = response.generatedImages?.[0]?.image?.imageBytes;
            if (imageBytes) {
                const imageUrl = `data:image/png;base64,${imageBytes}`;
                setContent(prev => ({ ...prev, image: imageUrl }));
            }
        } catch (e) {
            console.error(e);
            setImageError("No se pudo generar la imagen.");
        } finally {
            setIsGeneratingImage(false);
        }
    };
    
    const handleImageUpload = (file: File) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            setContent(prev => ({ ...prev, image: reader.result as string }));
        };
        reader.readAsDataURL(file);
    };

    return (
        <main className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-4 sm:p-8">
            <aside className="lg:col-span-1 xl:col-span-1 lg:sticky lg:top-[157px] sm:top-[145px] h-fit">
                <div className="space-y-6">
                    <HeroInputPanel
                        content={content}
                        onContentChange={setContent}
                        onImageUpload={handleImageUpload}
                        textPrompt={textPrompt}
                        onTextPromptChange={setTextPrompt}
                        onGenerateText={handleGenerateText}
                        isGeneratingText={isGeneratingText}
                        textError={textError}
                        imagePrompt={imagePrompt}
                        onImagePromptChange={setImagePrompt}
                        onGenerateImage={handleGenerateImage}
                        isGeneratingImage={isGeneratingImage}
                        imageError={imageError}
                    />
                    {savedHeros.length > 0 && (
                        <div className="bg-white rounded-lg p-6 space-y-4 border border-slate-200 shadow-sm">
                            <h2 className="text-xl font-semibold text-slate-900">Heros Guardados</h2>
                            <ul className="space-y-2">
                                {savedHeros.map(hero => (
                                    <li key={hero.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                                        <div>
                                            <p className="text-sm font-medium text-slate-800">{hero.headline}</p>
                                            <p className="text-xs text-slate-500 capitalize">{hero.layout}</p>
                                        </div>
                                        <button onClick={() => removeHero(hero.id)} className="p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-500 rounded-md">
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
                <HeroPreviewer {...content} />
            </section>
        </main>
    );
};
