
import React, { useState } from 'react';
import { useBuilderContext } from '../../../context/LandingBuilderContext';
import { LandingPageInputPanel } from '../LandingPageInputPanel';
import { LandingPagePreviewer } from '../LandingPagePreviewer';
import type { SavedHeroProps, SavedBlockProps, SavedFeaturesProps, SavedCarouselProps, SavedComparisonProps, PublishedPage } from '../../types/landing-builder';

export const LandingPageBuilder: React.FC = () => {
    const { savedHeros, savedSections, savedFeatures, savedCarousels, savedComparisons, addPublishedPage } = useBuilderContext();
    const [selectedIds, setSelectedIds] = useState<string[]>([]);
    const [isPublishing, setIsPublishing] = useState<boolean>(false);
    
    const allSections = [...savedHeros, ...savedSections, ...savedFeatures, ...savedCarousels, ...savedComparisons];
    
    const handleSelectionChange = (id: string, isSelected: boolean) => {
        if (isSelected) {
            setSelectedIds(prev => [...prev, id]);
        } else {
            setSelectedIds(prev => prev.filter(selectedId => selectedId !== id));
        }
    };

    const selectedSections = allSections
        .filter(s => selectedIds.includes(s.id))
        // Basic sort to encourage Hero first, but user selection order is preserved by checkbox order.
        .sort((a, b) => {
            if ('ctaText' in a && !('ctaText' in b)) return -1;
            if (!('ctaText' in a) && 'ctaText' in b) return 1;
            return 0;
        });


    const handlePublish = async (slug: string, title: string) => {
        if (!slug || !title || selectedSections.length === 0) return;
        const componentIds = selectedSections.map(s => s.id);
        const success = await addPublishedPage(slug, title, componentIds);
        if (success) {
            setSelectedIds([]);
        }
        setIsPublishing(false);
    };

    return (
        <main className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-8 p-4 sm:p-8">
            <aside className="lg:col-span-1 xl:col-span-1 lg:sticky lg:top-[157px] sm:top-[145px] h-fit">
                <LandingPageInputPanel
                    savedHeros={savedHeros}
                    savedSections={savedSections}
                    savedFeatures={savedFeatures}
                    savedCarousels={savedCarousels}
                    savedComparisons={savedComparisons}
                    selectedIds={selectedIds}
                    onSelectionChange={handleSelectionChange}
                    onPublish={handlePublish}
                    isPublishing={isPublishing}
                    setIsPublishing={setIsPublishing}
                    hasSelectedSections={selectedSections.length > 0}
                />
            </aside>
            <section className="lg:col-span-2 xl:col-span-3">
                <LandingPagePreviewer sections={selectedSections} />
            </section>
        </main>
    );
};
