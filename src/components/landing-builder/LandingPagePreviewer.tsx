'use client';

import React, { useState } from 'react';
import type { SavedHeroProps, SavedBlockProps, SavedFeaturesProps, SavedCarouselProps, SavedComparisonProps } from '../../types/landing-builder';
import { CodeBlock } from './CodeBlock';
import { HeroCentered } from './block-templates/hero/HeroCentered';
import { HeroSplit } from './block-templates/hero/HeroSplit';
import { HeroMinimalist } from './block-templates/hero/HeroMinimalist';
import { BlockSideBySide } from './block-templates/BlockSideBySide';
import { BlockImageTopCentered } from './block-templates/BlockImageTopCentered';
import { BlockImageTopStandard } from './block-templates/BlockImageTopStandard';
import { BlockSideBySideImageLeft } from './block-templates/BlockSideBySideImageLeft';
import { FeaturesCards } from './block-templates/features/FeaturesCards';
import { FeaturesAlternating } from './block-templates/features/FeaturesAlternating';
import { FeaturesIconGrid } from './block-templates/features/FeaturesIconGrid';
import { HorizontalCarousel } from './block-templates/carousels/HorizontalCarousel';
import { CenteredCarousel } from './block-templates/carousels/CenteredCarousel';
import { GalleryCarousel } from './block-templates/carousels/GalleryCarousel';
import { ComparisonTable } from './block-templates/comparison/ComparisonTable';
import { ComparisonSideBySide } from './block-templates/comparison/ComparisonSideBySide';
import { ComparisonPricingBoxes } from './block-templates/comparison/ComparisonPricingBoxes';
import { getFullPageJsx } from '../../services/jsxGenerator';
import { DeviceSwitcher } from './DeviceSwitcher';

type Device = 'desktop' | 'tablet' | 'mobile';

interface LandingPagePreviewerProps {
    sections: (SavedHeroProps | SavedBlockProps | SavedFeaturesProps | SavedCarouselProps | SavedComparisonProps)[];
}

const renderSection = (section: SavedHeroProps | SavedBlockProps | SavedFeaturesProps | SavedCarouselProps | SavedComparisonProps) => {
    switch (section.layout) {
        // Hero layouts
        case 'split':
            return <HeroSplit {...section as SavedHeroProps} />;
        case 'minimalist':
            return <HeroMinimalist {...section as SavedHeroProps} />;
        // Section layouts
        case 'side':
            return <BlockSideBySide {...section as SavedBlockProps} />;
        case 'side-left':
            return <BlockSideBySideImageLeft {...section as SavedBlockProps} />;
        case 'standard':
            return <BlockImageTopStandard {...section as SavedBlockProps} />;
        case 'centered':
             if ('ctaText' in section) {
                return <HeroCentered {...section as SavedHeroProps} />;
             }
             return <BlockImageTopCentered {...section as SavedBlockProps} />;
        // Features layouts
        case 'cards':
            return <FeaturesCards {...section as SavedFeaturesProps} />;
        case 'alternating':
            return <FeaturesAlternating {...section as SavedFeaturesProps} />;
        case 'grid':
            return <FeaturesIconGrid {...section as SavedFeaturesProps} />;
        // Carousel layouts
        case 'horizontal':
            return <HorizontalCarousel {...section as SavedCarouselProps} />;
        case 'centered-slider':
            return <CenteredCarousel {...section as SavedCarouselProps} />;
        case 'gallery':
            return <GalleryCarousel {...section as SavedCarouselProps} />;
        // Comparison layouts
        case 'table':
            return <ComparisonTable {...section as SavedComparisonProps} />;
        case 'side-by-side':
            return <ComparisonSideBySide {...section as SavedComparisonProps} />;
        case 'pricing-boxes':
            return <ComparisonPricingBoxes {...section as SavedComparisonProps} />;
        default:
            return <div className="p-4 text-red-500">Error: Layout desconocido.</div>;
    }
};

export const LandingPagePreviewer: React.FC<LandingPagePreviewerProps> = ({ sections }) => {
    const [device, setDevice] = useState<Device>('desktop');
    const jsxString = sections.length > 0 ? getFullPageJsx(sections) : "Selecciona componentes para ver el código de la página completa.";
    
    const widthClasses: Record<Device, string> = {
        desktop: 'w-full',
        tablet: 'w-[768px]',
        mobile: 'w-[375px]',
    };

    return (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Vista Previa de la Landing Page</h3>
                    <p className="text-sm text-slate-500">Aquí tienes una vista previa en vivo de los componentes seleccionados.</p>
                </div>
                <DeviceSwitcher activeDevice={device} onDeviceChange={setDevice} />
            </div>
            
            <div className="bg-slate-200 p-4 sm:p-6 flex justify-center items-start">
                <div className={`${widthClasses[device]} mx-auto transition-all duration-300 ease-in-out`}>
                    <div className="shadow-lg bg-white">
                        {sections.length > 0 ? (
                            sections.map(section => (
                                <div key={section.id}>
                                    {renderSection(section)}
                                </div>
                            ))
                        ) : (
                            <div className="text-center py-20 px-4">
                                <p className="text-slate-500">Selecciona componentes desde el panel izquierdo para previsualizar tu página.</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            <div className="p-4 sm:p-6 bg-slate-50 border-t border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900">Código JSX de la Página Completa</h3>
                <p className="text-sm text-slate-500">Copia este único componente que contiene todo lo que has construido.</p>
            </div>
            <CodeBlock jsxString={jsxString} />
        </div>
    );
};
