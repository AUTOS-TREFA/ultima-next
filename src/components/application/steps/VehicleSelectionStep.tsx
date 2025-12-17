import React, { useState, useEffect } from 'react';
import { ArrowRightIcon, Car, Search, X, CheckCircle, Loader2 } from 'lucide-react';
import { Button } from '../../ui/button';
import { CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { useVehicles } from '../../../context/VehicleContext';
import { WordPressVehicle } from '../../../types/types';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../../../utils/constants';
import type { StepperType } from '../EnhancedApplication';

interface VehicleSelectionStepProps {
  stepper: StepperType;
  vehicleInfo: any;
  onVehicleSelect: (vehicle: WordPressVehicle) => void;
  onNext: () => void;
}

const VehicleSelectionStep: React.FC<VehicleSelectionStepProps> = ({
  stepper,
  vehicleInfo,
  onVehicleSelect,
  onNext
}) => {
  const { vehicles, isLoading: loading } = useVehicles();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState<WordPressVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<WordPressVehicle | null>(null);

  // Initialize selected vehicle from vehicleInfo
  useEffect(() => {
    if (vehicleInfo?._ordenCompra && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.ordencompra === vehicleInfo._ordenCompra);
      if (vehicle) {
        setSelectedVehicle(vehicle);
      }
    }
  }, [vehicleInfo, vehicles]);

  // Filter vehicles based on search
  useEffect(() => {
    if (!vehicles || vehicles.length === 0) {
      setFilteredVehicles([]);
      return;
    }

    if (!searchTerm.trim()) {
      // Show first 12 vehicles when no search
      setFilteredVehicles(vehicles.slice(0, 12));
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = vehicles.filter(vehicle => {
      const title = vehicle.title?.toLowerCase() || '';
      const marca = vehicle.marca?.toLowerCase() || '';
      const modelo = vehicle.modelo?.toLowerCase() || '';
      const year = vehicle.autoano?.toString() || '';

      return title.includes(term) ||
             marca.includes(term) ||
             modelo.includes(term) ||
             year.includes(term);
    }).slice(0, 12);

    setFilteredVehicles(filtered);
  }, [searchTerm, vehicles]);

  const handleVehicleClick = (vehicle: WordPressVehicle) => {
    setSelectedVehicle(vehicle);
    onVehicleSelect(vehicle);
  };

  const handleContinue = () => {
    if (selectedVehicle) {
      onNext();
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 0
    }).format(amount);
  };

  return (
    <CardContent className="col-span-5 flex flex-col gap-6 p-6 md:col-span-3">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center gap-2">
          <Car className="w-6 h-6 text-primary-600" />
          Selecciona tu Auto
        </h2>
        <p className="text-sm text-gray-600">
          Elige el auto para el cual deseas solicitar financiamiento.
        </p>
      </div>

      {/* Selected Vehicle Display */}
      {selectedVehicle && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
              <img
                src={selectedVehicle.thumbnail_webp || selectedVehicle.thumbnail || selectedVehicle.feature_image_webp || selectedVehicle.feature_image?.[0] || DEFAULT_PLACEHOLDER_IMAGE}
                alt={selectedVehicle.title}
                className="w-20 h-14 object-cover rounded flex-shrink-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = DEFAULT_PLACEHOLDER_IMAGE;
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-xs text-green-700 font-medium">Auto Seleccionado</p>
                <p className="font-bold text-gray-900 truncate">{selectedVehicle.title}</p>
                <p className="text-sm font-semibold text-primary-600">
                  {formatCurrency(selectedVehicle.precio)}
                </p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => {
                setSelectedVehicle(null);
              }}
              className="flex-shrink-0"
            >
              <X className="w-4 h-4" />
              Cambiar
            </Button>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {!selectedVehicle && (
        <div className="relative">
          <Label htmlFor="vehicle-search" className="sr-only">Buscar auto</Label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
            <Input
              id="vehicle-search"
              type="text"
              placeholder="Busca por marca, modelo o año..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-10 h-12 text-base"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="ml-3 text-gray-600">Cargando autos...</span>
        </div>
      )}

      {/* Vehicles Grid */}
      {!loading && !selectedVehicle && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-h-[600px] overflow-y-auto pr-2">
          {filteredVehicles.length > 0 ? (
            filteredVehicles.map((vehicle) => (
              <button
                key={vehicle.ordencompra}
                type="button"
                onClick={() => handleVehicleClick(vehicle)}
                className="group relative bg-white border-2 border-gray-200 rounded-lg p-3 hover:border-primary-500 hover:shadow-lg transition-all text-left"
              >
                <div className="aspect-video w-full mb-3 overflow-hidden rounded-md bg-gray-100">
                  <img
                    src={vehicle.thumbnail_webp || vehicle.thumbnail || vehicle.feature_image_webp || vehicle.feature_image?.[0] || DEFAULT_PLACEHOLDER_IMAGE}
                    alt={vehicle.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_PLACEHOLDER_IMAGE;
                    }}
                  />
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-sm text-gray-900 line-clamp-2 group-hover:text-primary-600">
                    {vehicle.title}
                  </h3>
                  <p className="text-lg font-bold text-primary-600">
                    {formatCurrency(vehicle.precio)}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{vehicle.autoano}</span>
                    <span>{vehicle.kilometraje?.toLocaleString('es-MX')} km</span>
                  </div>
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 bg-primary-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg pointer-events-none" />
              </button>
            ))
          ) : (
            <div className="col-span-full text-center py-12">
              <Car className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {searchTerm ? 'No se encontraron autos' : 'No hay autos disponibles'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between gap-4 mt-6 pt-6 border-t">
        <Button
          variant="secondary"
          size="lg"
          onClick={() => window.location.href = '/escritorio'}
        >
          Cancelar
        </Button>
        <Button
          size="lg"
          onClick={handleContinue}
          disabled={!selectedVehicle}
        >
          Continuar con este Auto
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Helper Text */}
      {!selectedVehicle && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-sm text-blue-800">
          <p><strong>Consejo:</strong> Puedes buscar por marca, modelo o año. Selecciona el auto que más te guste para continuar con tu solicitud.</p>
        </div>
      )}
    </CardContent>
  );
};

export default VehicleSelectionStep;
