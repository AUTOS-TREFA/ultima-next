import React from 'react';
import { EyeIcon } from '../icons';
import { formatPromotion } from '../../utils/formatters';

interface VehicleCardHeaderProps {
  title: string;
  year?: number;
  view_count?: number;
  ordencompra?: string;
  promociones?: string[];
}

const VehicleCardHeader: React.FC<VehicleCardHeaderProps> = ({ title, year, view_count = 0, ordencompra, promociones }) => {
  // Check if title already contains the year to avoid duplication like "Nissan Versa 2021 2021"
  const titleAlreadyContainsYear = year && title.includes(String(year));

  return (
  <div>
    <div className="flex items-center gap-2 mb-1 flex-wrap">
      {ordencompra && (
        <p className="text-[11px] md:text-[12px] font-light text-gray-500 tracking-wider">{ordencompra}</p>
      )}
      {promociones && promociones.length > 0 && promociones.slice(0, 2).map((promo, idx) => {
        const formattedPromo = formatPromotion(promo);
        if (!formattedPromo) return null;

        return (
          <span key={idx} className="text-[11px] md:text-[12px] font-medium text-orange-600 border border-orange-600 px-1.5 md:px-2 py-0.5 rounded-md">
            {formattedPromo}
          </span>
        );
      })}
    </div>
    <h2 className="text-xl md:text-2xl font-bold md:font-extrabold text-gray-800 group-hover:text-primary-600 transition-colors leading-tight">
      {title}{!titleAlreadyContainsYear && year && <span className="text-gray-600"> {year}</span>}
    </h2>
    {view_count > 100 && (
      <div className="flex items-center gap-1.5 text-xs md:text-sm text-gray-500 flex-shrink-0 pt-1" title={`${view_count.toLocaleString('es-MX')} vistas`}>
        <EyeIcon className="w-4 h-4 md:w-5 md:h-5" />
        <span>{view_count.toLocaleString('es-MX')}</span>
      </div>
    )}
  </div>
  );
};

export default VehicleCardHeader;
