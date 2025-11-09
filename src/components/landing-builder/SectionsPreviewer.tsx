import React from 'react';
import type { BlockProps } from '../../types/landing-builder';
import { BlockSideBySide } from './block-templates/BlockSideBySide';
import { BlockImageTopCentered } from './block-templates/BlockImageTopCentered';
import { BlockImageTopStandard } from './block-templates/BlockImageTopStandard';
import { BlockSideBySideImageLeft } from './block-templates/BlockSideBySideImageLeft';
import { getVideoJsx, getSideBySideJsx, getImageTopCenteredJsx, getImageTopStandardJsx, getSideBySideImageLeftJsx } from '../../services/jsxGenerator';
import { useBuilderContext } from '../../context/LandingBuilderContext';
import { PreviewPane } from './PreviewPane';

export const SectionsPreviewer: React.FC<BlockProps> = (props) => {
  const { addSection } = useBuilderContext();
  const fullProps = { ...props, image: props.image || "ruta/a/tu/imagen.jpg" };

  const handleSave = (layout: 'side' | 'centered' | 'standard' | 'side-left') => {
    addSection({ ...fullProps, layout });
  }

  return (
    <div className="space-y-12">
      {props.video && (
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
          <div className="p-4 sm:p-6 bg-slate-50 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">Resultado del Video Generado</h3>
            <p className="text-sm text-slate-500">Este es el video generado a partir de tu imagen e indicación.</p>
          </div>
          <div className="p-4 sm:p-6 bg-black">
             <video src={props.video} controls autoPlay loop muted className="w-full max-w-2xl mx-auto rounded-lg" />
          </div>
        </div>
      )}

      <PreviewPane
        title="Diseño 1: Lado a Lado (Imagen Derecha)"
        description="Ideal para descripciones de características o propuestas de valor."
        onSave={() => handleSave('side')}
        jsxString={getSideBySideJsx(fullProps)}
      >
        <BlockSideBySide {...props} />
      </PreviewPane>
      
      <PreviewPane
        title="Diseño 2: Lado a Lado (Imagen Izquierda)"
        description="Una variación clásica para mantener el flujo visual."
        onSave={() => handleSave('side-left')}
        jsxString={getSideBySideImageLeftJsx(fullProps)}
      >
        <BlockSideBySideImageLeft {...props} />
      </PreviewPane>

      <PreviewPane
        title="Diseño 3: Imagen Arriba, Texto Centrado"
        description="Genial para declaraciones potentes o exhibiciones de productos."
        onSave={() => handleSave('centered')}
        jsxString={getImageTopCenteredJsx(fullProps)}
      >
        <BlockImageTopCentered {...props} />
      </PreviewPane>

      <PreviewPane
        title="Diseño 4: Imagen Arriba, Texto Estándar"
        description="Un diseño clásico para artículos o explicaciones detalladas."
        onSave={() => handleSave('standard')}
        jsxString={getImageTopStandardJsx(fullProps)}
      >
        <BlockImageTopStandard {...props}/>
      </PreviewPane>
    </div>
  );
};
