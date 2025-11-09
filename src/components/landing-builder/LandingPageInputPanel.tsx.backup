
import React, { useState } from 'react';
import type { SavedHeroProps, SavedBlockProps, SavedFeaturesProps, SavedCarouselProps, SavedComparisonProps } from '../../types/landing-builder';
import { useBuilderContext } from '../../context/LandingBuilderContext';

interface LandingPageInputPanelProps {
    savedHeros: SavedHeroProps[];
    savedSections: SavedBlockProps[];
    savedFeatures: SavedFeaturesProps[];
    savedCarousels: SavedCarouselProps[];
    savedComparisons: SavedComparisonProps[];
    selectedIds: string[];
    onSelectionChange: (id: string, isSelected: boolean) => void;
    onPublish: (slug: string, title: string) => void;
    isPublishing: boolean;
    setIsPublishing: (isPublishing: boolean) => void;
    hasSelectedSections: boolean;
}

interface SectionListProps<T extends {id: string, headline: string, layout: string}> {
    title: string;
    items: T[];
    selectedIds: string[];
    onSelectionChange: (id: string, isSelected: boolean) => void;
}

const SectionList = <T extends {id: string, headline: string, layout: string}>({ title, items, selectedIds, onSelectionChange }: SectionListProps<T>) => {
    if (items.length === 0) return null;
    
    return (
        <div>
            <h3 className="text-lg font-semibold text-slate-800 mb-3">{title}</h3>
            <ul className="space-y-2">
                {items.map(item => (
                    <li key={item.id}>
                        <label className="flex items-center bg-slate-50 p-3 rounded-md border border-slate-200 hover:bg-slate-100 cursor-pointer transition-colors">
                            <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-[#FF6801] focus:ring-[#FF6801]"
                                checked={selectedIds.includes(item.id)}
                                onChange={(e) => onSelectionChange(item.id, e.target.checked)}
                            />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-slate-900">{item.headline}</p>
                                <p className="text-xs text-slate-500 capitalize">{item.layout.replace('-', ' ')}</p>
                            </div>
                        </label>
                    </li>
                ))}
            </ul>
        </div>
    );
};


export const LandingPageInputPanel: React.FC<LandingPageInputPanelProps> = (props) => {
    const { savedHeros, savedSections, savedFeatures, savedCarousels, savedComparisons, selectedIds, onSelectionChange, onPublish, isPublishing, setIsPublishing, hasSelectedSections } = props;
    const { publishedPages } = useBuilderContext();
    const [slug, setSlug] = useState('');
    const [title, setTitle] = useState('');

    const hasSavedItems = savedHeros.length > 0 || savedSections.length > 0 || savedFeatures.length > 0 || savedCarousels.length > 0 || savedComparisons.length > 0;

    const handlePublishClick = () => {
        const sanitizedSlug = slug.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
        if (sanitizedSlug && title.trim()) {
            onPublish(sanitizedSlug, title.trim());
            setSlug('');
            setTitle('');
        } else {
            alert('Por favor, introduce un título y nombre de URL válidos.');
        }
    };

    return (
        <div className="space-y-6">
            <div className="bg-white rounded-lg p-6 space-y-6 border border-slate-200 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Monta tu Landing Page</h2>
                
                {!hasSavedItems && (
                     <div className="text-center py-8 px-4 bg-slate-50 rounded-lg border border-dashed">
                        <p className="text-slate-500">Aún no has guardado ningún componente.</p>
                        <p className="text-sm text-slate-400 mt-1">Ve a las otras pestañas para crear y guardar algunos.</p>
                    </div>
                )}
                
                {hasSavedItems && (
                  <>
                    <p className="text-sm text-slate-600">
                        Selecciona los componentes guardados que quieres incluir en tu página final.
                    </p>
                    <div className="space-y-6">
                        <SectionList title="Heros" items={savedHeros} selectedIds={selectedIds} onSelectionChange={onSelectionChange} />
                        <SectionList title="Secciones" items={savedSections} selectedIds={selectedIds} onSelectionChange={onSelectionChange} />
                        <SectionList title="Features" items={savedFeatures} selectedIds={selectedIds} onSelectionChange={onSelectionChange} />
                        <SectionList title="Carrusels" items={savedCarousels} selectedIds={selectedIds} onSelectionChange={onSelectionChange} />
                        <SectionList title="Comparaciones" items={savedComparisons} selectedIds={selectedIds} onSelectionChange={onSelectionChange} />
                    </div>

                    <hr className="border-slate-200" />
                    
                    {isPublishing ? (
                        <div className="space-y-3">
                            <div>
                                <label htmlFor="title" className="block text-sm font-medium text-slate-700 mb-1">Título de la Página</label>
                                <input
                                    type="text"
                                    id="title"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    placeholder="ej: Campaña de Verano 2025"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-md shadow-sm py-2 px-3"
                                />
                            </div>
                            <div>
                                <label htmlFor="slug" className="block text-sm font-medium text-slate-700 mb-1">Nombre de la URL (slug)</label>
                                <input
                                    type="text"
                                    id="slug"
                                    value={slug}
                                    onChange={(e) => setSlug(e.target.value)}
                                    placeholder="ej: campana-de-verano"
                                    className="w-full bg-slate-50 border border-slate-300 rounded-md shadow-sm py-2 px-3"
                                />
                            </div>
                            <div className="flex space-x-2">
                                <button onClick={handlePublishClick} className="w-full px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-slate-800 hover:bg-slate-900">
                                    Confirmar
                                </button>
                                <button onClick={() => setIsPublishing(false)} className="w-full px-4 py-2 text-sm font-medium rounded-md text-slate-700 bg-slate-200 hover:bg-slate-300">
                                    Cancelar
                                </button>
                            </div>
                        </div>
                    ) : (
                        <button onClick={() => setIsPublishing(true)} disabled={!hasSelectedSections} className="w-full px-4 py-2 text-sm font-medium rounded-md shadow-sm text-white bg-[#FF6801] hover:bg-[#E65C00] disabled:bg-orange-300 disabled:cursor-not-allowed">
                            Publicar Landing Page
                        </button>
                    )}
                  </>
                )}
            </div>

            {publishedPages.length > 0 && (
                <div className="bg-white rounded-lg p-6 space-y-4 border border-slate-200 shadow-sm">
                    <h2 className="text-xl font-semibold text-slate-900">Páginas Publicadas</h2>
                    <ul className="space-y-2">
                        {publishedPages.map(page => (
                            <li key={page.slug} className="flex items-center justify-between bg-slate-50 p-2 rounded-md">
                                <a href={`/${page.slug}`} target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-[#FF6801] hover:underline">
                                    /{page.slug}
                                </a>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
};
