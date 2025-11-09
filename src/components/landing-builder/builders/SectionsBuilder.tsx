
'use client';

import React, { useState, useEffect } from 'react';
import { SectionsInputPanel } from '../SectionsInputPanel';
import { SectionsPreviewer } from '../SectionsPreviewer';
import type { BlockProps } from '../../../types/landing-builder';
import { GoogleGenAI, Type } from "@google/genai";
import { useBuilderContext } from '../../../context/LandingBuilderContext';

// Helper to extract base64 data from a data URL
const getBase64 = (dataUrl: string) => dataUrl.split(',')[1];

const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

export const SectionsBuilder: React.FC = () => {
  const { savedSections, removeSection } = useBuilderContext();
  const [content, setContent] = useState<BlockProps>({
    headline: 'Diseñado para tu Familia, Hecho para el Futuro',
    paragraph: 'Descubre un sedán que combina elegancia, seguridad y tecnología avanzada. Espacio para todos, eficiencia para tu día a día y un diseño que no pasa desapercibido.',
    image: `https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=2070&auto=format&fit=crop`,
    color: '#ffffff',
    video: null,
    ctaText: 'Ver Modelos',
    ctaLink: '#',
    ctaType: 'button',
    ctaStyle: 'filled',
    ctaColor: '#FF6801',
    ctaRoundness: 'md',
    imageRoundness: 'xl',
  });
  
  // State for Text Generation
  const [textPrompt, setTextPrompt] = useState<string>('Una sección para un concesionario de coches familiares, destacando seguridad y espacio.');
  const [isGeneratingText, setIsGeneratingText] = useState<boolean>(false);
  const [textError, setTextError] = useState<string | null>(null);
  
  // State for Image Generation
  const [imagePrompt, setImagePrompt] = useState<string>('Un sedán familiar moderno de color blanco, conduciendo por una calle suburbana arbolada en un día soleado.');
  const [imageAspectRatio, setImageAspectRatio] = useState('16:9');
  const [isGeneratingImage, setIsGeneratingImage] = useState<boolean>(false);
  const [imageError, setImageError] = useState<string | null>(null);

  // State for Video Generation
  const [videoPrompt, setVideoPrompt] = useState<string>('Haciendo zoom lentamente, la gente empieza a celebrar un éxito.');
  const [videoAspectRatio, setVideoAspectRatio] = useState('16:9');
  const [isGeneratingVideo, setIsGeneratingVideo] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isApiKeySelected, setIsApiKeySelected] = useState(false);


  useEffect(() => {
    // Check for Veo API key on initial load
    (window as any).aistudio?.hasSelectedApiKey()?.then(setIsApiKeySelected);
  }, []);

  const handleImageUpload = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      setContent(prev => ({ ...prev, image: reader.result as string, video: null }));
    };
    reader.readAsDataURL(file);
  };
  
  const handleGenerateText = async () => {
    if (!textPrompt) {
        setTextError('Por favor, introduce un tema para generar el contenido.');
        return;
    }
    setIsGeneratingText(true);
    setTextError(null);
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Basado en el siguiente tema: "${textPrompt}", genera un titular (headline), un párrafo corto (paragraph) y un texto para un botón de llamada a la acción (ctaText) para una sección de una landing page.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        headline: { type: Type.STRING, description: "Un titular corto y atractivo." },
                        paragraph: { type: Type.STRING, description: "Un párrafo descriptivo de 2-3 frases." },
                        ctaText: { type: Type.STRING, description: "Texto para un botón de llamada a la acción, ej: 'Saber Más'." },
                    },
                    required: ['headline', 'paragraph', 'ctaText'],
                }
            }
        });

        const resultText = response.text?.trim() || '{}';
        const resultJson = JSON.parse(resultText);

        setContent(prev => ({ ...prev, ...resultJson }));

    } catch (e) {
        console.error(e);
        setTextError("No se pudo generar el contenido. Por favor, inténtalo de nuevo.");
    } finally {
        setIsGeneratingText(false);
    }
  };

  const handleGenerateImage = async () => {
    if (!imagePrompt) {
        setImageError('Por favor, introduce un tema para generar la imagen.');
        return;
    }
    setIsGeneratingImage(true);
    setImageError(null);
    setContent(prev => ({...prev, video: null}));
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        const response = await ai.models.generateImages({
            model: 'imagen-4.0-generate-001',
            prompt: imagePrompt,
            config: {
                numberOfImages: 1,
                aspectRatio: imageAspectRatio as any,
            },
        });

        const base64Image = response.generatedImages?.[0]?.image?.imageBytes;
        if (base64Image) {
            const imageUrl = `data:image/png;base64,${base64Image}`;
            setContent(prev => ({ ...prev, image: imageUrl }));
        }

    } catch (e) {
        console.error(e);
        setImageError("No se pudo generar la imagen. Por favor, inténtalo de nuevo.");
    } finally {
        setIsGeneratingImage(false);
    }
  };
  
  const handleSelectApiKey = async () => {
      await (window as any).aistudio?.openSelectKey();
      // Assume success after dialog opens to avoid race condition
      setIsApiKeySelected(true);
  }

  const handleGenerateVideo = async () => {
    if (!content.image) {
        setVideoError('Por favor, sube o genera una imagen primero para usarla como base para el video.');
        return;
    }
    setIsGeneratingVideo(true);
    setVideoError(null);
    
    try {
        const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
        let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: videoPrompt,
            image: {
                imageBytes: getBase64(content.image),
                mimeType: 'image/png',
            },
            config: {
                numberOfVideos: 1,
                aspectRatio: videoAspectRatio as any,
                resolution: '720p',
            }
        });

        while (!operation.done) {
            await new Promise(resolve => setTimeout(resolve, 5000));
            operation = await ai.operations.getVideosOperation({ operation: operation });
        }

        if (operation.response?.generatedVideos?.[0]?.video?.uri) {
            const downloadLink = operation.response.generatedVideos[0].video.uri;
            const videoResponse = await fetch(`${downloadLink}&key=${process.env.API_KEY}`);
            const videoBlob = await videoResponse.blob();
            const videoUrl = URL.createObjectURL(videoBlob);
            setContent(prev => ({...prev, video: videoUrl}));
        } else {
             throw new Error('La operación de video finalizó pero no se encontró la URI del video.');
        }

    } catch(e: any) {
        console.error(e);
        if (e.message?.includes('Requested entity was not found')) {
            setVideoError("La API Key no es válida. Por favor, selecciona una nueva.");
            setIsApiKeySelected(false);
        } else {
            setVideoError("No se pudo generar el video. Por favor, inténtalo de nuevo.");
        }
    } finally {
        setIsGeneratingVideo(false);
    }
  };

  return (
      <main className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-4 sm:p-8">
        <aside className="lg:col-span-1 xl:col-span-1 lg:sticky lg:top-[157px] sm:top-[145px] h-fit">
          <div className="space-y-6">
            <SectionsInputPanel
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
              imageAspectRatio={imageAspectRatio}
              onImageAspectRatioChange={setImageAspectRatio}
              onGenerateImage={handleGenerateImage}
              isGeneratingImage={isGeneratingImage}
              imageError={imageError}

              videoPrompt={videoPrompt}
              onVideoPromptChange={setVideoPrompt}
              videoAspectRatio={videoAspectRatio}
              onVideoAspectRatioChange={setVideoAspectRatio}
              onGenerateVideo={handleGenerateVideo}
              isGeneratingVideo={isGeneratingVideo}
              videoError={videoError}
              isApiKeySelected={isApiKeySelected}
              onSelectApiKey={handleSelectApiKey}
            />
            {savedSections.length > 0 && (
                <div className="bg-white rounded-lg p-6 space-y-4 border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900">Secciones Guardadas</h2>
                    <ul className="space-y-2">
                        {savedSections.map(section => (
                            <li key={section.id} className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                                <div>
                                    <p className="text-sm font-medium text-slate-800">{section.headline}</p>
                                    <p className="text-xs text-slate-500 capitalize">{section.layout.replace('-', ' ')}</p>
                                </div>
                                <button onClick={() => removeSection(section.id)} className="p-1.5 text-slate-400 hover:bg-red-100 hover:text-red-500 rounded-md">
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
          <SectionsPreviewer {...content} />
        </section>
      </main>
  );
};
