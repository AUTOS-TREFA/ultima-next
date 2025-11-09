
'use client';

import React, { useState, useEffect, useRef } from 'react';
import type { BlockProps, Roundness } from '../../../types/landing-builder';

const getRoundnessClass = (roundness: Roundness) => {
    const mapping: { [key: string]: string } = {
        'none': 'rounded-none', 'sm': 'rounded-sm', 'md': 'rounded-md', 'lg': 'rounded-lg',
        'xl': 'rounded-xl', '2xl': 'rounded-2xl', '3xl': 'rounded-3xl', 'full': 'rounded-full'
    };
    return mapping[roundness] || 'rounded-xl';
};

const CTA: React.FC<BlockProps> = ({ ctaText, ctaLink, ctaType, ctaStyle, ctaColor, ctaRoundness }) => {
  if (!ctaText) return null;

  if (ctaType === 'link') {
    return (
      <a href={ctaLink || '#'} style={{ color: ctaColor }} className="mt-8 inline-block font-semibold hover:underline">
        {ctaText} &rarr;
      </a>
    );
  }
  
  const baseClasses = `inline-block px-6 py-3 text-base font-medium transition-colors duration-200`;
  const roundnessClass = getRoundnessClass(ctaRoundness);
  const styleClasses = ctaStyle === 'filled'
    ? `text-white shadow-md hover:opacity-90`
    : `border-2 shadow-sm`;

  const inlineStyles = ctaStyle === 'filled' 
    ? { backgroundColor: ctaColor } 
    : { borderColor: ctaColor, color: ctaColor };

  const hoverStyles = ctaStyle === 'lined' ? {
      onMouseOver: (e: any) => { e.currentTarget.style.backgroundColor = ctaColor; e.currentTarget.style.color = '#FFF'; },
      onMouseOut: (e: any) => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = ctaColor; }
  } : {};

  return (
    <div className="mt-8">
        <a href={ctaLink || '#'} className={`${baseClasses} ${roundnessClass} ${styleClasses}`} style={inlineStyles} {...hoverStyles}>
            {ctaText}
        </a>
    </div>
  );
};


export const BlockImageTopCentered: React.FC<BlockProps> = (props) => {
  const { headline, paragraph, image, color, imageRoundness } = props;
  const [isAnimated, setIsAnimated] = useState(false);
  const sectionRef = useRef<HTMLElement>(null);
  const imageRoundnessClass = getRoundnessClass(imageRoundness);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsAnimated(true);
          observer.unobserve(section);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(section);

    return () => {
      if (section) {
        observer.unobserve(section);
      }
    };
  }, []);
  
  return (
    <section ref={sectionRef} className="py-4 @sm:py-6 @md:py-10 px-4 @sm:px-6 @lg:px-8 overflow-hidden" style={{ backgroundColor: color }}>
      <div className="max-w-4xl mx-auto text-center">
        <div className={`mb-6 @sm:mb-8 aspect-w-16 aspect-h-9 ${imageRoundnessClass} overflow-hidden transform transition-all duration-1000 ease-in-out ${isAnimated ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
          {image && <img className="object-cover w-full h-full max-h-[500px]" src={image} alt="Showcase" />}
        </div>
        <h2 className={`text-lg @sm:text-xl @md:text-3xl @lg:text-4xl font-extrabold text-slate-900 tracking-tight mb-3 @sm:mb-4 transition-all duration-700 ease-out delay-200 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          {headline}
        </h2>
        <p className={`max-w-2xl mx-auto text-base @sm:text-lg text-slate-600 transition-all duration-700 ease-out delay-300 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
          {paragraph}
        </p>
         <div className={`transition-all duration-700 ease-out delay-400 ${isAnimated ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-5'}`}>
            <CTA {...props} />
        </div>
      </div>
    </section>
  );
};
