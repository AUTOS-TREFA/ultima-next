import React, { useState } from 'react';
import { BuilderProvider, useBuilderContext } from '../context/LandingBuilderContext';
import { HeroBuilder } from '../components/landing-builder/builders/HeroBuilder';
import { SectionsBuilder } from '../components/landing-builder/builders/SectionsBuilder';
import { FeaturesBuilder } from '../components/landing-builder/builders/FeaturesBuilder';
import { CarouselBuilder } from '../components/landing-builder/builders/CarouselBuilder';
import { ComparisonBuilder } from '../components/landing-builder/builders/ComparisonBuilder';
import { LandingPageBuilder } from '../components/landing-builder/builders/LandingPageBuilder';
import { Navbar } from '../components/landing-builder/Navbar';

export type BuilderType = 'hero' | 'secciones' | 'features' | 'carrusels' | 'comparacion' | 'landing';

const ConstructorContent: React.FC = () => {
  const { loading } = useBuilderContext();
  const [activeBuilder, setActiveBuilder] = useState<BuilderType>('hero');

  const renderBuilder = () => {
    switch (activeBuilder) {
      case 'hero':
        return <HeroBuilder />;
      case 'secciones':
        return <SectionsBuilder />;
      case 'features':
        return <FeaturesBuilder />;
      case 'carrusels':
        return <CarouselBuilder />;
      case 'comparacion':
        return <ComparisonBuilder />;
      case 'landing':
        return <LandingPageBuilder />;
      default:
        return <HeroBuilder />;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-slate-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="py-5 px-4 sm:px-8 border-b border-slate-200 bg-white/80 backdrop-blur-sm sticky top-0 z-20">
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Constructor de Landing Pages - TREFA</h1>
        <p className="text-slate-500">
          Elige un tipo de componente, guárdalo y luego combínalos en la pestaña "Landing Page" para publicarlos.
        </p>
      </header>

      <Navbar active={activeBuilder} setActive={setActiveBuilder} />

      {renderBuilder()}
    </div>
  );
};

const ConstructorPage: React.FC = () => {
  return (
    <BuilderProvider>
      <ConstructorContent />
    </BuilderProvider>
  );
};

export default ConstructorPage;
