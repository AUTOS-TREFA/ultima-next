import React, { useState, useEffect } from 'react';
import { ArrowRightIcon, Car, Search, X, CheckCircle, Loader2, DollarSign } from 'lucide-react';
import { Button } from '../../ui/button';
import { CardContent } from '../../ui/card';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { useVehicles } from '../../../context/VehicleContext';
import { WordPressVehicle } from '../../../types/types';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../../../utils/constants';
import { getVehicleImage } from '../../../utils/getVehicleImage';
import type { StepperType } from '../EnhancedApplication';

interface VehicleFinancingStepProps {
  stepper: StepperType;
  vehicleInfo: any;
  control: any;
  setValue: any;
  onVehicleSelect: (vehicle: WordPressVehicle) => void;
  onNext: () => void;
}

const VehicleFinancingStep: React.FC<VehicleFinancingStepProps> = ({
  stepper,
  vehicleInfo,
  control,
  setValue,
  onVehicleSelect,
  onNext
}) => {
  const { vehicles, isLoading: loading } = useVehicles();
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState<WordPressVehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<WordPressVehicle | null>(null);
  const [showCalculator, setShowCalculator] = useState(false);

  // Financing state
  const [loanTerm, setLoanTerm] = useState(60);
  const [downPaymentRaw, setDownPaymentRaw] = useState('');

  // Initialize selected vehicle from vehicleInfo
  useEffect(() => {
    if (vehicleInfo?._ordenCompra && vehicles.length > 0) {
      const vehicle = vehicles.find(v => v.ordencompra === vehicleInfo._ordenCompra);
      if (vehicle) {
        setSelectedVehicle(vehicle);
        setShowCalculator(true);
      }
    }
  }, [vehicleInfo, vehicles]);

  // Get vehicle pricing
  const vehiclePrice = selectedVehicle?.precio || 0;
  const minDownPayment = selectedVehicle?.enganchemin || Math.round(vehiclePrice * 0.25);
  const recommendedDownPayment = selectedVehicle?.enganche_recomendado || Math.round(vehiclePrice * 0.40);
  const maxTerm = selectedVehicle?.plazomax || 60;

  const formatNumber = (value: number | string): string => {
    const numStr = String(value).replace(/[^0-9]/g, '');
    if (!numStr) return '';
    return parseInt(numStr, 10).toLocaleString('es-MX');
  };

  const parseFormattedNumber = (formatted: string): number => {
    const numStr = formatted.replace(/[^0-9]/g, '');
    return numStr ? parseInt(numStr, 10) : 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
  };

  // Initialize down payment and term when calculator first shows
  useEffect(() => {
    if (showCalculator) {
      // Initialize down payment only if not set
      if (minDownPayment > 0 && !downPaymentRaw) {
        setDownPaymentRaw(formatNumber(minDownPayment));
        setValue('down_payment_amount', minDownPayment);
      }
      // Initialize term only if still at default 60 (never been changed by user)
      const initialTerm = Math.min(maxTerm, 60);
      if (loanTerm === 60 && initialTerm < 60) {
        setLoanTerm(initialTerm);
      }
    }
  }, [minDownPayment, downPaymentRaw, setValue, maxTerm, showCalculator]);

  // Update form values
  useEffect(() => {
    if (showCalculator) {
      const downPaymentValue = parseFormattedNumber(downPaymentRaw);
      setValue('loan_term_months', loanTerm);
      setValue('down_payment_amount', downPaymentValue);
    }
  }, [loanTerm, downPaymentRaw, setValue, showCalculator]);

  const allTermOptions = [12, 24, 36, 48, 60];
  const termOptions = allTermOptions.filter(term => term <= maxTerm);

  // Filter vehicles based on search
  useEffect(() => {
    if (!vehicles || vehicles.length === 0) {
      setFilteredVehicles([]);
      return;
    }

    if (!searchTerm.trim()) {
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
    setShowCalculator(true);
  };

  const handleContinue = () => {
    if (selectedVehicle) {
      onNext();
    }
  };

  return (
    <CardContent className="col-span-6 flex flex-col gap-4 p-4 sm:p-5 md:col-span-4 bg-gray-50/50">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Car className="w-5 h-5 sm:w-6 sm:h-6 text-primary-600" />
          {showCalculator ? 'Auto y Financiamiento' : 'Selecciona tu Auto'}
        </h2>
        <p className="text-sm text-gray-600">
          {showCalculator ? 'Ajusta las opciones de financiamiento para tu auto.' : 'Elige el auto para el cual deseas solicitar financiamiento.'}
        </p>
      </div>

      {/* Selected Vehicle Display with Calculator */}
      {selectedVehicle && showCalculator && (
        <div className="space-y-6">
          {/* Vehicle Info */}
          <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 flex-1 min-w-0">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <img
                  src={getVehicleImage(selectedVehicle)}
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
                  setShowCalculator(false);
                }}
                className="flex-shrink-0"
              >
                <X className="w-4 h-4" />
                Cambiar
              </Button>
            </div>
          </div>

          {/* Financing Calculator */}
          <div className="bg-gradient-to-r from-primary-50 to-orange-50 rounded-xl p-6 border-2 border-primary-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-primary-600" />
              Opciones de Financiamiento
            </h3>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Loan Term */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Plazo del Crédito (meses) *
                </Label>
                <div className="grid grid-cols-3 gap-2">
                  {termOptions.map(term => (
                    <button
                      key={term}
                      type="button"
                      onClick={() => setLoanTerm(term)}
                      className={`px-3 py-2 text-sm font-semibold rounded-lg border-2 transition-all ${
                        loanTerm === term
                          ? 'bg-primary-600 border-primary-600 text-white shadow-md'
                          : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'
                      }`}
                    >
                      {term}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Plazo máximo para este auto: {maxTerm} meses
                </p>
              </div>

              {/* Down Payment */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-2 block">
                  Enganche *
                </Label>
                <div className="relative mb-2">
                  <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500">$</span>
                  <input
                    type="text"
                    value={downPaymentRaw}
                    onChange={(e) => {
                      const formatted = formatNumber(e.target.value);
                      setDownPaymentRaw(formatted);
                    }}
                    placeholder="0"
                    className="block w-full px-4 py-2 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 pl-7"
                  />
                </div>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setDownPaymentRaw(formatNumber(minDownPayment))}
                    className="flex-1 px-3 py-1.5 bg-white border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-50 transition-colors"
                  >
                    Mínimo: {formatCurrency(minDownPayment)}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDownPaymentRaw(formatNumber(recommendedDownPayment))}
                    className="flex-1 px-3 py-1.5 bg-primary-50 border border-primary-200 text-primary-700 rounded-lg text-xs font-semibold hover:bg-primary-100 transition-colors"
                  >
                    Recomendado (40%)
                  </button>
                </div>
              </div>
            </div>

            {/* Summary */}
            <div className="bg-white rounded-lg p-4 border border-primary-200">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-xs text-gray-600">Precio del Auto</p>
                  <p className="text-sm font-semibold text-gray-800">{formatCurrency(vehiclePrice)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Enganche</p>
                  <p className="text-sm font-semibold text-gray-800">{formatCurrency(parseFormattedNumber(downPaymentRaw))}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Monto a Financiar</p>
                  <p className="text-sm font-semibold text-primary-600">{formatCurrency(vehiclePrice - parseFormattedNumber(downPaymentRaw))}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Search Bar */}
      {!showCalculator && (
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
      {loading && !showCalculator && (
        <div className="flex justify-center items-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          <span className="ml-3 text-gray-600">Cargando autos...</span>
        </div>
      )}

      {/* Vehicles Grid - Clean, borderless design with prominent images */}
      {!loading && !showCalculator && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4 max-h-[calc(100vh-280px)] overflow-y-auto pr-1">
          {filteredVehicles.length > 0 ? (
            filteredVehicles.map((vehicle) => (
              <button
                key={vehicle.ordencompra}
                type="button"
                onClick={() => handleVehicleClick(vehicle)}
                className="group relative text-left transition-all hover:scale-[1.02] focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 rounded-lg"
              >
                {/* Image container - no padding, prominent */}
                <div className="aspect-[4/3] w-full overflow-hidden rounded-lg bg-gray-100 shadow-sm group-hover:shadow-md transition-shadow">
                  <img
                    src={getVehicleImage(vehicle)}
                    alt={vehicle.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = DEFAULT_PLACEHOLDER_IMAGE;
                    }}
                  />
                  {/* Price overlay on image */}
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-2 pt-6">
                    <p className="text-white font-bold text-sm sm:text-base drop-shadow-sm">
                      {formatCurrency(vehicle.precio)}
                    </p>
                  </div>
                </div>
                {/* Minimal info below image */}
                <div className="mt-2 px-0.5">
                  <h3 className="font-semibold text-xs sm:text-sm text-gray-900 line-clamp-1 group-hover:text-primary-600 transition-colors">
                    {vehicle.title}
                  </h3>
                  <div className="flex items-center gap-2 text-[10px] sm:text-xs text-gray-500 mt-0.5">
                    <span>{vehicle.autoano}</span>
                    <span className="text-gray-300">•</span>
                    <span>{vehicle.kilometraje?.toLocaleString('es-MX')} km</span>
                  </div>
                </div>
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
      <div className="flex justify-between gap-4 mt-4 pt-4 border-t border-gray-200">
        <Button
          variant="secondary"
          onClick={() => window.location.href = '/escritorio'}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleContinue}
          disabled={!selectedVehicle || !showCalculator}
          className="text-white"
        >
          Continuar
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </Button>
      </div>

      {/* Helper Text - Compact */}
      {!showCalculator && (
        <p className="text-xs text-gray-500 text-center">
          💡 Busca por marca, modelo o año. Haz clic en un auto para continuar.
        </p>
      )}
    </CardContent>
  );
};

export default VehicleFinancingStep;
