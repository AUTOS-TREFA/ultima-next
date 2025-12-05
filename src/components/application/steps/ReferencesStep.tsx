import React, { useState, useEffect, useCallback } from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { Button } from '../../ui/button';
import { CardContent } from '../../ui/card';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select';
import type { StepperType } from '../EnhancedApplication';

const FAMILY_RELATIONSHIPS = [
  'Hijo/Hija',
  'Primo/Prima',
  'Madre',
  'Padre',
  'Hermano/Hermana',
  'Tía/Tío',
  'Sobrino/Sobrina',
  'Abuelo/Abuela',
  'Nieto/Nieta'
];

const FRIEND_RELATIONSHIPS = [
  'Amistad',
  'Laboral',
  'Familia Política'
];

interface ReferencesStepProps {
  stepper: StepperType;
  control: any;
  errors: any;
  profile: any;
  getValues: any;
  onNext: () => void;
}

const ReferencesStep: React.FC<ReferencesStepProps> = ({
  stepper,
  control,
  errors,
  profile,
  getValues,
  onNext
}) => {
  const [spouseWarning, setSpouseWarning] = useState<string | null>(null);

  // Function to normalize names for comparison
  const normalizeName = (name: string) => {
    if (!name) return '';
    return name
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  };

  // Check if a reference name matches the spouse name
  const checkSpouseReference = useCallback(() => {
    const spouseName = profile?.spouse_name || '';
    if (!spouseName) return;

    const friendRefName = getValues('friend_reference_name') || '';
    const familyRefName = getValues('family_reference_name') || '';

    const normalizedSpouse = normalizeName(spouseName);
    const normalizedFriend = normalizeName(friendRefName);
    const normalizedFamily = normalizeName(familyRefName);

    if (normalizedSpouse && normalizedFriend && normalizedSpouse === normalizedFriend) {
      setSpouseWarning('Tu cónyuge no puede ser usado como referencia de amistad.');
      return;
    }

    if (normalizedSpouse && normalizedFamily && normalizedSpouse === normalizedFamily) {
      setSpouseWarning('Tu cónyuge no puede ser usado como referencia familiar.');
      return;
    }

    setSpouseWarning(null);
  }, [profile, getValues]);

  useEffect(() => {
    checkSpouseReference();
  }, [checkSpouseReference]);

  return (
    <CardContent className="col-span-5 flex flex-col gap-6 p-6 md:col-span-3">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Referencias Personales</h2>
        <p className="text-sm text-gray-600">Proporciona dos referencias que no sean tu cónyuge.</p>
      </div>

      {/* Spouse Warning */}
      {profile?.spouse_name && (
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm text-blue-800">
            <strong>Importante:</strong> Tu cónyuge ({profile.spouse_name}) no puede ser usado como referencia familiar o de amistad.
          </p>
        </div>
      )}

      {spouseWarning && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-sm text-red-800 font-semibold">
            ⚠️ {spouseWarning}
          </p>
        </div>
      )}

      {/* Friend Reference */}
      <div className="bg-white rounded-xl p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Referencia de Amistad</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <Controller
            name="friend_reference_name"
            control={control}
            render={({ field }) => (
              <div>
                <Label htmlFor="friend_reference_name">Nombre Completo *</Label>
                <Input
                  {...field}
                  id="friend_reference_name"
                  placeholder="Nombre completo"
                  className="mt-1"
                  onBlur={() => {
                    field.onBlur();
                    checkSpouseReference();
                  }}
                />
                {errors.friend_reference_name && <p className="text-red-600 text-sm mt-1">{errors.friend_reference_name.message}</p>}
              </div>
            )}
          />

          <Controller
            name="friend_reference_phone"
            control={control}
            render={({ field }) => (
              <div>
                <Label htmlFor="friend_reference_phone">Teléfono *</Label>
                <Input
                  {...field}
                  id="friend_reference_phone"
                  placeholder="8112345678"
                  maxLength={10}
                  className="mt-1"
                />
                {errors.friend_reference_phone && <p className="text-red-600 text-sm mt-1">{errors.friend_reference_phone.message}</p>}
              </div>
            )}
          />

          <Controller
            name="friend_reference_relationship"
            control={control}
            render={({ field }) => (
              <div>
                <Label htmlFor="friend_reference_relationship">Relación *</Label>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="friend_reference_relationship" className="mt-1">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FRIEND_RELATIONSHIPS.map(rel => (
                      <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.friend_reference_relationship && <p className="text-red-600 text-sm mt-1">{errors.friend_reference_relationship.message}</p>}
              </div>
            )}
          />
        </div>
      </div>

      {/* Family Reference */}
      <div className="bg-white rounded-xl p-6 border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Referencia Familiar</h3>
        <div className="grid md:grid-cols-3 gap-6">
          <Controller
            name="family_reference_name"
            control={control}
            render={({ field }) => (
              <div>
                <Label htmlFor="family_reference_name">Nombre Completo *</Label>
                <Input
                  {...field}
                  id="family_reference_name"
                  placeholder="Nombre completo"
                  className="mt-1"
                  onBlur={() => {
                    field.onBlur();
                    checkSpouseReference();
                  }}
                />
                {errors.family_reference_name && <p className="text-red-600 text-sm mt-1">{errors.family_reference_name.message}</p>}
              </div>
            )}
          />

          <Controller
            name="family_reference_phone"
            control={control}
            render={({ field }) => (
              <div>
                <Label htmlFor="family_reference_phone">Teléfono *</Label>
                <Input
                  {...field}
                  id="family_reference_phone"
                  placeholder="8112345678"
                  maxLength={10}
                  className="mt-1"
                />
                {errors.family_reference_phone && <p className="text-red-600 text-sm mt-1">{errors.family_reference_phone.message}</p>}
              </div>
            )}
          />

          <Controller
            name="parentesco"
            control={control}
            render={({ field }) => (
              <div>
                <Label htmlFor="parentesco">Parentesco *</Label>
                <Select onValueChange={field.onChange} value={field.value}>
                  <SelectTrigger id="parentesco" className="mt-1">
                    <SelectValue placeholder="Seleccionar..." />
                  </SelectTrigger>
                  <SelectContent>
                    {FAMILY_RELATIONSHIPS.map(rel => (
                      <SelectItem key={rel} value={rel}>{rel}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.parentesco && <p className="text-red-600 text-sm mt-1">{errors.parentesco.message}</p>}
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

export default ReferencesStep;
