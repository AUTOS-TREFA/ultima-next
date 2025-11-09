'use client';

import React from 'react';
import { FilterProvider } from '../context/FilterContext';
import { VehicleProvider } from '../context/VehicleContext';

interface InventoryLayoutProps {
  children: React.ReactNode;
}

const InventoryLayout: React.FC<InventoryLayoutProps> = ({ children }) => {
  return (
    <FilterProvider>
      <VehicleProvider>
        {children}
      </VehicleProvider>
    </FilterProvider>
  );
};

export default InventoryLayout;
