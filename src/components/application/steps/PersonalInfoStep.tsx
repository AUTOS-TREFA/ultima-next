import React, { useState, useEffect } from 'react';
import { ArrowLeftIcon, ArrowRightIcon, User } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { Button } from '../../ui/button';
import { CardContent } from '../../ui/card';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import type { StepperType } from '../EnhancedApplication';

const MEXICAN_STATES = [
  'Aguascalientes', 'Baja California', 'Baja California Sur', 'Campeche',
  'Chiapas', 'Chihuahua', 'Coahuila', 'Colima', 'Durango', 'Guanajuato',
  'Guerrero', 'Hidalgo', 'Jalisco', 'México', 'Michoacán', 'Morelos',
  'Nayarit', 'Nuevo León', 'Oaxaca', 'Puebla', 'Querétaro', 'Quintana Roo',
  'San Luis Potosí', 'Sinaloa', 'Sonora', 'Tabasco', 'Tamaulipas',
  'Tlaxcala', 'Veracruz', 'Yucatán', 'Zacatecas'
];

const normalizeNameToTitleCase = (name: string): string => {
  if (!name) return '';
  const lowercaseWords = ['de', 'del', 'la', 'los', 'las', 'y', 'e', 'van', 'von', 'da', 'di'];
  return name
    .trim()
    .toLowerCase()
    .split(' ')
    .map((word, index) => {
      if (index === 0) return word.charAt(0).toUpperCase() + word.slice(1);
      if (lowercaseWords.includes(word)) return word;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
};

interface PersonalInfoStepProps {
  stepper: StepperType;
  control: any;
  errors: any;
  isMarried: boolean;
  profile: any;
  setValue: any;
  trigger: any;
  onNext: () => void;
}

const PersonalInfoStep: React.FC<PersonalInfoStepProps> = ({
  stepper,
  control,
  errors,
  isMarried,
  profile,
  setValue,
  trigger,
  onNext
}) => {
  const [useDifferentAddress, setUseDifferentAddress] = useState(
    () => !(profile?.address && profile.address.length >= 5)
  );

  useEffect(() => {
    const profileAddressIsValid = profile?.address && profile.address.length >= 5;
    if (profileAddressIsValid && !useDifferentAddress) {
      setValue('current_address', profile.address || '', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      setValue('current_colony', profile.colony || '', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      setValue('current_city', profile.city || '', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      setValue('current_state', profile.state || '', { shouldValidate: true, shouldDirty: true, shouldTouch: true });
      setValue('current_zip_code', profile.zip_code || '', { shouldValidate: true, shouldDirty: true, shouldTouch: true });

      setTimeout(() => {
        trigger(['current_address', 'current_colony', 'current_city', 'current_state', 'current_zip_code']);
      }, 0);
    }
  }, [profile, setValue, useDifferentAddress, trigger]);

  return (
    <CardContent className="col-span-5 flex flex-col gap-4 sm:gap-6 p-3 sm:p-4 md:p-6 md:col-span-3">
      <div>
        <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-1 sm:mb-2">Información Personal</h2>
        <p className="text-xs sm:text-sm text-gray-600">Confirma que tu información personal esté correcta y actualizada.</p>
      </div>

      {/* Profile Information Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-primary-50 rounded-lg sm:rounded-xl p-4 sm:p-6">
        <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 sm:mb-4 flex items-center">
          <User className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          Datos Personales Registrados
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs sm:text-sm">
          <div>
            <p className="text-xs text-gray-500">Nombre Completo</p>
            <p className="font-semibold text-gray-900">
              {normalizeNameToTitleCase(profile?.first_name || '')} {normalizeNameToTitleCase(profile?.last_name || '')} {normalizeNameToTitleCase(profile?.mother_last_name || '')}
            </p>
          </div>
          <div>
            <p className="text-xs text-gray-500">RFC</p>
            <p className="font-semibold text-gray-900 font-mono">{profile?.rfc || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Fecha de Nacimiento</p>
            <p className="font-semibold text-gray-900">{profile?.birth_date || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Teléfono</p>
            <p className="font-semibold text-gray-900">{profile?.phone || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Estado Civil</p>
            <p className="font-semibold text-gray-900">{profile?.civil_status || 'N/A'}</p>
          </div>
          {profile?.spouse_name && (
            <div>
              <p className="text-xs text-gray-500">Nombre del Cónyuge</p>
              <p className="font-semibold text-gray-900">{normalizeNameToTitleCase(profile.spouse_name)}</p>
            </div>
          )}
        </div>
        <div className="mt-4 pt-4 border-t border-blue-200">
          <p className="text-xs text-blue-700">
            Si necesitas actualizar esta información, puedes hacerlo desde tu <a href="/escritorio/profile" className="underline font-semibold">perfil</a>.
          </p>
        </div>
      </div>

      {/* Address Section */}
      <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border">
        <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wide mb-3 sm:mb-4">Domicilio Actual</h3>
        <div className="space-y-3 sm:space-y-4">
          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="use_different_address_checkbox"
                type="checkbox"
                checked={useDifferentAddress}
                onChange={(e) => setUseDifferentAddress(e.target.checked)}
                className="focus:ring-primary-500 h-4 w-4 text-primary-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="use_different_address_checkbox" className="font-medium text-gray-700">
                Usar una dirección diferente a la de mi perfil
              </label>
              <p className="text-xs text-gray-500 mt-1">Esta debe ser la dirección de tu domicilio actual.</p>
            </div>
          </div>

          {useDifferentAddress ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 pt-3 sm:pt-4 border-t">
              <Controller
                name="current_address"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="current_address">Calle y Número</Label>
                    <Input {...field} id="current_address" />
                    {errors.current_address && <p className="text-red-600 text-sm mt-1">{errors.current_address.message}</p>}
                  </div>
                )}
              />
              <Controller
                name="current_colony"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="current_colony">Colonia</Label>
                    <Input {...field} id="current_colony" />
                    {errors.current_colony && <p className="text-red-600 text-sm mt-1">{errors.current_colony.message}</p>}
                  </div>
                )}
              />
              <Controller
                name="current_city"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="current_city">Ciudad</Label>
                    <Input {...field} id="current_city" />
                    {errors.current_city && <p className="text-red-600 text-sm mt-1">{errors.current_city.message}</p>}
                  </div>
                )}
              />
              <Controller
                name="current_state"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="current_state">Estado</Label>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger id="current_state">
                        <SelectValue placeholder="Seleccionar..." />
                      </SelectTrigger>
                      <SelectContent>
                        {MEXICAN_STATES.map(state => (
                          <SelectItem key={state} value={state}>{state}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {errors.current_state && <p className="text-red-600 text-sm mt-1">{errors.current_state.message}</p>}
                  </div>
                )}
              />
              <Controller
                name="current_zip_code"
                control={control}
                render={({ field }) => (
                  <div>
                    <Label htmlFor="current_zip_code">Código Postal</Label>
                    <Input {...field} id="current_zip_code" />
                    {errors.current_zip_code && <p className="text-red-600 text-sm mt-1">{errors.current_zip_code.message}</p>}
                  </div>
                )}
              />
            </div>
          ) : (
            <div className="pt-4 border-t bg-gray-50 p-4 rounded-lg">
              <p className="text-xs text-gray-500 mb-2">Dirección registrada en tu perfil:</p>
              <p className="text-sm font-semibold text-gray-900">
                {profile?.address}, {profile?.colony}, {profile?.city}, {profile?.state} C.P. {profile?.zip_code}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Housing & Personal Info */}
      <div className="bg-white rounded-lg sm:rounded-xl p-4 sm:p-6 border space-y-4 sm:space-y-6">
        <h3 className="text-xs sm:text-sm font-bold text-gray-700 uppercase tracking-wide">Información del Hogar</h3>

        <Controller
          name="time_at_address"
          control={control}
          render={({ field }) => (
            <div>
              <Label>Tiempo Viviendo en el Domicilio Actual</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Menos de 1 año', '1-2 años', '3-5 años', '6-10 años', 'Más de 10 años'].map(opt => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => field.onChange(opt)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-full border-2 transition-colors ${
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
              <Label>Tipo de Vivienda</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Propia', 'Rentada', 'Familiar'].map(opt => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => field.onChange(opt)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-full border-2 transition-colors ${
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

        <Controller
          name="dependents"
          control={control}
          render={({ field }) => (
            <div>
              <Label>Número de Dependientes Económicos</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['0', '1', '2', '3', '4+'].map(opt => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => field.onChange(opt)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-full border-2 transition-colors ${
                      field.value === opt ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {errors.dependents && <p className="text-red-600 text-sm mt-1">{errors.dependents.message}</p>}
            </div>
          )}
        />

        <Controller
          name="grado_de_estudios"
          control={control}
          render={({ field }) => (
            <div>
              <Label>Nivel de Estudios</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Primaria', 'Secundaria', 'Preparatoria', 'Licenciatura', 'Posgrado'].map(opt => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => field.onChange(opt)}
                    className={`px-3 py-1.5 text-sm font-semibold rounded-full border-2 transition-colors ${
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

      <div className="flex flex-col sm:flex-row justify-between gap-3 sm:gap-4 mt-4 sm:mt-6">
        <Button variant="secondary" size="lg" onClick={stepper.prev} disabled={stepper.isFirst} className="w-full sm:w-auto">
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button size="lg" onClick={onNext} className="w-full sm:w-auto">
          Siguiente
          <ArrowRightIcon className="w-4 h-4 ml-2" />
        </Button>
      </div>
    </CardContent>
  );
};

export default PersonalInfoStep;
