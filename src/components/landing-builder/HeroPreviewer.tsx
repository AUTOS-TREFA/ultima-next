import React from 'react';
import type { HeroProps } from '../../types/landing-builder';
import { HeroCentered } from './block-templates/hero/HeroCentered';
import { HeroSplit } from './block-templates/hero/HeroSplit';
import { HeroMinimalist } from './block-templates/hero/HeroMinimalist';
import { getHeroCenteredJsx, getHeroSplitJsx, getHeroMinimalistJsx } from '../../services/jsxGenerator';
import { useBuilderContext } from '../../context/LandingBuilderContext';
import { PreviewPane } from './PreviewPane';

export const HeroPreviewer: React.FC<HeroProps> = (props) => {
    const { addHero } = useBuilderContext();
    const fullProps = { ...props, image: props.image || "ruta/a/tu/imagen.jpg" };

    const handleSave = (layout: 'centered' | 'split' | 'minimalist') => {
        addHero({ ...fullProps, layout });
    };

    return (
        <div className="space-y-12">
            <PreviewPane
                title="Diseño 1: Centrado Sobre Imagen"
                description="Un enfoque clásico y audaz para captar la atención."
                onSave={() => handleSave('centered')}
                jsxString={getHeroCenteredJsx(fullProps)}
            >
                <HeroCentered {...props} />
            </PreviewPane>

            <PreviewPane
                title="Diseño 2: Pantalla Dividida"
                description="Perfecto para mostrar un visual y un mensaje con igual importancia."
                onSave={() => handleSave('split')}
                jsxString={getHeroSplitJsx(fullProps)}
            >
                <HeroSplit {...props} />
            </PreviewPane>

            <PreviewPane
                title="Diseño 3: Minimalista y Elegante"
                description="Ideal para marcas que valoran la claridad y el diseño limpio."
                onSave={() => handleSave('minimalist')}
                jsxString={getHeroMinimalistJsx(fullProps)}
            >
                <HeroMinimalist {...props} />
            </PreviewPane>
        </div>
    );
};
