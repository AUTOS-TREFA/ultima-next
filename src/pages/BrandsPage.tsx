'use client';

import React from 'react';
import Link from 'next/link';
import { useVehicles } from '../context/VehicleContext';
import { BRAND_LOGOS } from '../utils/constants';
import { Loader2 } from 'lucide-react';

const BrandsPage: React.FC = () => {
  // SEO metadata is handled in the page.tsx file in Next.js

  const { vehicles, isLoading } = useVehicles();

  const brandCounts = React.useMemo(() => {
    if (!vehicles) return [];

    const counts: Record<string, number> = {};

    vehicles.forEach(vehicle => {
      // 🧩 Identify possible brand field variations
      const brandRaw =
        vehicle.marca ||
        vehicle.Marca ||
        vehicle.brand ||
        vehicle.Brand ||
        vehicle.MARCA;

      if (brandRaw && typeof brandRaw === 'string') {
        // 🧼 Normalize brand name: trim + uppercase
        const normalized = brandRaw.trim().toUpperCase();
        counts[normalized] = (counts[normalized] || 0) + 1;
      }
    });

    // Debug: ensure total matches inventory count
    const total = Object.values(counts).reduce((a, b) => a + b, 0);
    console.log('🔎 Brand counts:', counts, 'Total in brands:', total, 'Total vehicles:', vehicles.length);

    // Sort by count descending
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  }, [vehicles]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-12 h-12 animate-spin text-primary-600" />
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-extrabold text-gray-900 mb-8 text-center">
          Nuestras Marcas
        </h1>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {brandCounts.map(([brand, count]) => {
            // 🧩 Convert normalized brand back to readable format
            const displayName =
              brand.charAt(0) + brand.slice(1).toLowerCase();

            const logoSrc =
              BRAND_LOGOS[displayName] ||
              BRAND_LOGOS[brand] ||
              '/images/trefalogo.png';

            return (
              <Link
                key={brand}
                href={`/marcas/${displayName.toLowerCase()}`}
                className="bg-white p-4 rounded-xl shadow-sm border border-gray-200 flex flex-col items-center justify-center text-center transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
              >
                <img
                  src={logoSrc}
                  alt={`${displayName} logo`}
                  className="h-16 w-auto object-contain mb-4"
                />
                <span className="font-bold text-gray-800">{displayName}</span>
                <span className="text-sm text-gray-500">
                  ({count} {count === 1 ? 'auto' : 'autos'})
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BrandsPage;