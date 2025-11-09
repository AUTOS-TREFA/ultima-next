import React, { useState, useEffect, useRef } from 'react';
import type { FeaturesProps } from '../../../types';

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
    <section ref={sectionRef} className="py-12 sm:py-16 lg:py-20 overflow-hidden" style={{ backgroundColor: color }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-24">
        {features.map((feature, index) => {
            const isVisible = visibleItems.includes(feature.id);
            return (
                <div key={feature.id} data-id={feature.id} className="feature-item lg:grid lg:grid-cols-2 lg:gap-12 lg:items-center">
                    <div className={`transition-all duration-700 ease-out ${index % 2 === 0 ? 'lg:order-2' : ''} ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
                        <h3 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
                            {feature.title}
                        </h3>
                        <p className="mt-3 text-lg text-slate-600">
                            {feature.description}
                        </p>
                    </div>
                    <div className={`mt-10 lg:mt-0 ${index % 2 === 0 ? 'lg:order-1' : ''} transition-all duration-700 ease-out delay-200 ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-90'}`}>
                        {feature.image && (
                            <img
                                className="rounded-lg shadow-xl w-full h-auto object-cover"
                                src={feature.image}
                                alt={feature.title}
                            />
                        )}
                    </div>
                </div>
            )
        })}
      </div>
    </section>
  );
};
