import React from 'react';
import type { FeaturesProps } from '../../types/landing-builder';
import { FeaturesCards } from './block-templates/features/FeaturesCards';
import { FeaturesAlternating } from './block-templates/features/FeaturesAlternating';
import { FeaturesIconGrid } from './block-templates/features/FeaturesIconGrid';
import { getFeaturesCardsJsx, getFeaturesAlternatingJsx, getFeaturesIconGridJsx } from '../../services/jsxGenerator';
import { useBuilderContext } from '../../context/LandingBuilderContext';
import { PreviewPane } from './PreviewPane';

export const FeaturesPreviewer: React.FC<FeaturesProps> = (props) => {
    const { addFeature: addSavedFeature } = useBuilderContext();

    // Add placeholder images if they are missing, for preview purposes
    const propsWithImages = {
        ...props,
        features: props.features.map(f => ({
            ...f,
            image: f.image || 'https://images.unsplash.com/photo-1605559424843-9e4c228bf1c2?q=80&w=1964&auto=format&fit=crop'
        }))
    };
    
    const handleSave = (layout: 'cards' | 'alternating' | 'grid') => {
        addSavedFeature({ ...props, layout });
    };

    return (
        <div className="space-y-12">
            <PreviewPane
                title="Diseño 1: Rejilla de Tarjetas"
                description="Un diseño limpio y moderno para mostrar múltiples características de forma concisa."
                onSave={() => handleSave('cards')}
                jsxString={getFeaturesCardsJsx(props)}
            >
                <FeaturesCards {...propsWithImages} />
            </PreviewPane>

            <PreviewPane
                title="Diseño 2: Lista Alternada"
                description="Ideal para explicar características con más detalle, alternando imagen y texto."
                onSave={() => handleSave('alternating')}
                jsxString={getFeaturesAlternatingJsx(props)}
            >
                <FeaturesAlternating {...propsWithImages} />
            </PreviewPane>

            <PreviewPane
                title="Diseño 3: Rejilla con Iconos"
                description="Una presentación compacta y visual para características clave."
                onSave={() => handleSave('grid')}
                jsxString={getFeaturesIconGridJsx(props)}
            >
                <FeaturesIconGrid {...propsWithImages} />
            </PreviewPane>
        </div>
    );
};
