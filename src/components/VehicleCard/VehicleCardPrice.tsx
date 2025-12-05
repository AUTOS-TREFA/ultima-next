
import React from 'react';
import { formatPrice } from '../../utils/formatters';

interface VehicleCardPriceProps {
  precio: number;
  mensualidadRecomendada: number;
}

const VehicleCardPrice: React.FC<VehicleCardPriceProps> = ({ precio, mensualidadRecomendada }) => (
  <div className="mb-4 sm:mb-0">
    <p className="text-xl md:text-2xl font-bold text-gray-900">{formatPrice(precio)}</p>
    {mensualidadRecomendada > 0 && (
      <p className="text-sm md:text-base text-gray-500 mt-1">
        desde <span className="text-orange-600 font-bold">{formatPrice(mensualidadRecomendada)}</span> al mes
      </p>
    )}
  </div>
);

export default VehicleCardPrice;
