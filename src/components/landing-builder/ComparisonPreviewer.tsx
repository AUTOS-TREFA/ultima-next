import React from 'react';
import type { ComparisonProps } from '../../types/landing-builder';
import { useBuilderContext } from '../../context/LandingBuilderContext';
import { ComparisonTable } from './block-templates/comparison/ComparisonTable';
import { ComparisonSideBySide } from './block-templates/comparison/ComparisonSideBySide';
import { ComparisonPricingBoxes } from './block-templates/comparison/ComparisonPricingBoxes';
import { getComparisonTableJsx, getComparisonSideBySideJsx, getComparisonPricingBoxesJsx } from '../../services/jsxGenerator';
import { PreviewPane } from './PreviewPane';

export const ComparisonPreviewer: React.FC<ComparisonProps> = (props) => {
    const { addComparison } = useBuilderContext();
    
    const handleSave = (layout: 'table' | 'side-by-side' | 'pricing-boxes') => {
        addComparison({ ...props, layout });
    };

    return (
        <div className="space-y-12">
            <PreviewPane
                title="Diseño 1: Tabla Comparativa"
                description="Un formato clásico y claro para datos detallados."
                onSave={() => handleSave('table')}
                jsxString={getComparisonTableJsx(props)}
            >
                <ComparisonTable {...props} />
            </PreviewPane>

            <PreviewPane
                title="Diseño 2: Listas Lado a Lado"
                description="Ideal para resaltar características de forma vertical y concisa."
                onSave={() => handleSave('side-by-side')}
                jsxString={getComparisonSideBySideJsx(props)}
            >
                <ComparisonSideBySide {...props} />
            </PreviewPane>

            <PreviewPane
                title="Diseño 3: Cajas de Precios"
                description="Un diseño moderno y visual para comparar planes o productos."
                onSave={() => handleSave('pricing-boxes')}
                jsxString={getComparisonPricingBoxesJsx(props)}
            >
                <ComparisonPricingBoxes {...props} />
            </PreviewPane>
        </div>
    );
};
