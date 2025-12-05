import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon, Home, Users, GraduationCap } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { Button } from '../../ui/button';
import { CardContent } from '../../ui/card';
import { Label } from '../../ui/label';
import type { StepperType } from '../EnhancedApplication';

interface AdditionalDetailsStepProps {
  stepper: StepperType;
  control: any;
  errors: any;
  onNext: () => void;
}

const AdditionalDetailsStep: React.FC<AdditionalDetailsStepProps> = ({
  stepper,
  control,
  errors,
  onNext
}) => {
  return (
    <CardContent className="col-span-5 flex flex-col gap-6 p-6 md:col-span-3">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Historial Complementario</h2>
        <p className="text-sm text-gray-600">Información complementaria para evaluar tu solicitud.</p>
      </div>

      <div className="space-y-6">
        {/* Time at Address */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center">
            <Home className="w-4 h-4 mr-2 text-primary-600" />
            Información de Vivienda
          </h3>

          <Controller
            name="time_at_address"
            control={control}
            render={({ field }) => (
              <div className="mb-6">
                <Label className="text-sm font-medium mb-2 block">Tiempo Viviendo en el Domicilio Actual *</Label>
                <div className="flex flex-wrap gap-2">
                  {['Menos de 1 año', '1-2 años', '3-5 años', '6-10 años', 'Más de 10 años'].map(opt => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => field.onChange(opt)}
                      className={`px-4 py-2 text-sm font-semibold rounded-full border-2 transition-colors ${
                        field.value === opt ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {errors.time_at_address && <p className="text-red-600 text-sm mt-1">{errors.time_at_address.message}</p>}
              </div>
            )}
          />

          <Controller
            name="housing_type"
            control={control}
            render={({ field }) => (
              <div>
                <Label className="text-sm font-medium mb-2 block">Tipo de Vivienda *</Label>
                <div className="flex flex-wrap gap-2">
                  {['Propia', 'Rentada', 'Familiar'].map(opt => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => field.onChange(opt)}
                      className={`px-4 py-2 text-sm font-semibold rounded-full border-2 transition-colors ${
                        field.value === opt ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {errors.housing_type && <p className="text-red-600 text-sm mt-1">{errors.housing_type.message}</p>}
              </div>
            )}
          />
        </div>

        {/* Dependents */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center">
            <Users className="w-4 h-4 mr-2 text-primary-600" />
            Información Familiar
          </h3>

          <Controller
            name="dependents"
            control={control}
            render={({ field }) => (
              <div>
                <Label className="text-sm font-medium mb-2 block">Número de Dependientes Económicos *</Label>
                <div className="flex flex-wrap gap-2">
                  {['0', '1', '2', '3', '4+'].map(opt => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => field.onChange(opt)}
                      className={`px-4 py-2 text-sm font-semibold rounded-full border-2 transition-colors ${
                        field.value === opt ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-500 mt-2">Personas que dependen económicamente de ti</p>
                {errors.dependents && <p className="text-red-600 text-sm mt-1">{errors.dependents.message}</p>}
              </div>
            )}
          />
        </div>

        {/* Education Level */}
        <div>
          <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wide mb-4 flex items-center">
            <GraduationCap className="w-4 h-4 mr-2 text-primary-600" />
            Nivel de Estudios
          </h3>

          <Controller
            name="grado_de_estudios"
            control={control}
            render={({ field }) => (
              <div>
                <Label className="text-sm font-medium mb-2 block">Grado de Estudios Completado *</Label>
                <div className="flex flex-wrap gap-2">
                  {['Primaria', 'Secundaria', 'Preparatoria', 'Licenciatura', 'Posgrado'].map(opt => (
                    <button
                      type="button"
                      key={opt}
                      onClick={() => field.onChange(opt)}
                      className={`px-4 py-2 text-sm font-semibold rounded-full border-2 transition-colors ${
                        field.value === opt ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'
                      }`}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
                {errors.grado_de_estudios && <p className="text-red-600 text-sm mt-1">{errors.grado_de_estudios.message}</p>}
              </div>
            )}
          />
        </div>
      </div>

      <div className="flex justify-between gap-4 mt-6">
        <Button variant="secondary" size="lg" onClick={stepper.prev}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button size="lg" onClick={onNext} className="text-white">
          Siguiente
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </CardContent>
  );
};

export default AdditionalDetailsStep;
