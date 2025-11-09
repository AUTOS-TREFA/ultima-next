import React, { useState, useEffect, useRef } from 'react';
import type { FeaturesProps } from '../../../../types/landing-builder';

export const FeaturesAlternating: React.FC<FeaturesProps> = ({ features, color }) => {
    const sectionRef = useRef<HTMLElement>(null);
    const [visibleItems, setVisibleItems] = useState<number[]>([]);
  
    useEffect(() => {
        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const id = parseInt(entry.target.getAttribute('data-id') || '0', 10);
                        setVisibleItems(prev => [...prev, id]);
                    }
                });
            },
            { threshold: 0.2 }
        );

        const items = sectionRef.current?.querySelectorAll('.feature-item');
        items?.forEach(item => observer.observe(item));

        return () => items?.forEach(item => observer.unobserve(item));
    }, [features]);

  return (
    <section ref={sectionRef} className="py-4 @sm:py-8 @md:py-12 @lg:py-16 overflow-hidden" style={{ backgroundColor: color }}>
      <div className="max-w-7xl mx-auto px-4 @sm:px-6 @lg:px-8 space-y-12 @sm:space-y-16 @md:space-y-20 @lg:space-y-24">
        {features.map((feature, index) => {
            const isVisible = visibleItems.includes(feature.id);
            return (
                <div key={feature.id} data-id={feature.id} className="feature-item grid grid-cols-1 @lg:grid-cols-2 gap-8 @sm:gap-10 @lg:gap-12 items-center">
                    <div className={`transition-all duration-700 ease-out ${index % 2 === 0 ? 'lg:order-2' : ''} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <h3 className="text-xl @sm:text-2xl @md:text-3xl font-extrabold text-slate-900 tracking-tight">
                            {feature.title}
                        </h3>
                        <p className="mt-2 @sm:mt-3 text-base @sm:text-lg text-slate-600">
                            {feature.description}
                        </p>
                    </div>
                    <div className={`mt-6 @sm:mt-8 @lg:mt-0 ${index % 2 === 0 ? 'lg:order-1' : ''} transition-all duration-700 ease-out delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                        <img
                            className="rounded-lg shadow-xl w-full h-auto object-cover"
                            src={feature.image}
                            alt={feature.title}
                        />
                    </div>
                </div>
            )
        })}
      </div>
    </section>
  );
};
