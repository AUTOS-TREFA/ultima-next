import React from 'react';
import type { CarouselProps } from '../../types/landing-builder';
import { useBuilderContext } from '../../context/LandingBuilderContext';
import { HorizontalCarousel } from './block-templates/carousels/HorizontalCarousel';
import { CenteredCarousel } from './block-templates/carousels/CenteredCarousel';
import { GalleryCarousel } from './block-templates/carousels/GalleryCarousel';
import { getHorizontalCarouselJsx, getCenteredCarouselJsx, getGalleryCarouselJsx } from '../../services/jsxGenerator';
import { PreviewPane } from './PreviewPane';

export const CarouselPreviewer: React.FC<CarouselProps> = (props) => {
    const { addCarousel } = useBuilderContext();
    
    const handleSave = (layout: 'horizontal' | 'centered-slider' | 'gallery') => {
        addCarousel({ ...props, layout });
    };

    return (
        <div className="space-y-12">
            <PreviewPane
                title="Diseño 1: Slider Horizontal"
                description="Un carrusel clásico para mostrar una serie de imágenes."
                onSave={() => handleSave('horizontal')}
                jsxString={getHorizontalCarouselJsx(props)}
            >
                <HorizontalCarousel {...props} />
            </PreviewPane>

            <PreviewPane
                title="Diseño 2: Slider Centrado"
                description="Un diseño moderno que muestra vistas previas de las diapositivas adyacentes."
                onSave={() => handleSave('centered-slider')}
                jsxString={getCenteredCarouselJsx(props)}
            >
                <CenteredCarousel {...props} />
            </PreviewPane>

            <PreviewPane
                title="Diseño 3: Galería con Miniaturas"
                description="Ideal para portafolios de productos o galerías de proyectos."
                onSave={() => handleSave('gallery')}
                jsxString={getGalleryCarouselJsx(props)}
            >
                <GalleryCarousel {...props} />
            </PreviewPane>
        </div>
    );
};
