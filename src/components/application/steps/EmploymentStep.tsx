import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon } from 'lucide-react';
import { Controller, useController } from 'react-hook-form';
import { Button } from '../../ui/button';
import { CardContent } from '../../ui/card';
import { Label } from '../../ui/label';
import { Input } from '../../ui/input';
import type { StepperType } from '../EnhancedApplication';

interface EmploymentStepProps {
  stepper: StepperType;
  control: any;
  errors: any;
  setValue: any;
  onNext: () => void;
}

const EmploymentStep: React.FC<EmploymentStepProps> = ({
  stepper,
  control,
  errors,
  setValue,
  onNext
}) => {
  const { field: incomeField } = useController({ name: 'net_monthly_income', control });

  const formatNumberWithCommas = (value: string): string => {
    const numericValue = value.replace(/[^0-9]/g, '');
    if (numericValue === '') return '';
    const number = parseInt(numericValue, 10);
    return number.toLocaleString('es-MX');
  };

  const handleIncomeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedValue = formatNumberWithCommas(e.target.value);
    incomeField.onChange(formattedValue);
  };

  const incomeDisplayValue = incomeField.value || '';

  return (
    <CardContent className="col-span-6 flex flex-col gap-4 p-4 sm:p-5 md:col-span-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Información Laboral</h2>
        <p className="text-sm text-gray-600">Proporciona los detalles de tu empleo actual.</p>
      </div>

      <div className="bg-white rounded-xl p-6 border space-y-6">
        {/* Fiscal Classification */}
        <Controller
          name="fiscal_classification"
          control={control}
          render={({ field }) => (
            <div>
              <Label>Clasificación Fiscal</Label>
              <div className="flex flex-col gap-2 mt-2">
                {['Empleado del sector privado', 'Física con actividad empresarial', 'Empleado del sector público', 'Pensionado'].map(opt => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => field.onChange(opt)}
                    className={`px-4 py-3 text-sm font-semibold rounded-lg border-2 transition-colors text-left ${
                      field.value === opt ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'
                    }`}
                  >
                    {opt}
                  </button>
                ))}
              </div>
              {errors.fiscal_classification && <p className="text-red-600 text-sm mt-1">{errors.fiscal_classification.message}</p>}
            </div>
          )}
        />

        {/* Company Details Grid */}
        <div className="grid md:grid-cols-2 gap-6">
          <Controller
            name="company_name"
            control={control}
            render={({ field }) => (
              <div>
                <Label htmlFor="company_name">Nombre de la Empresa *</Label>
                <Input {...field} id="company_name" placeholder="Ej: TREFA Autos" className="mt-1" />
                {errors.company_name && <p className="text-red-600 text-sm mt-1">{errors.company_name.message}</p>}
              </div>
            )}
          />

          <Controller
            name="company_phone"
            control={control}
            render={({ field }) => (
              <div>
                <Label htmlFor="company_phone">Teléfono de la Empresa *</Label>
                <Input
                  {...field}
                  id="company_phone"
                  placeholder="8112345678"
                  maxLength={10}
                  className="mt-1"
                />
                {errors.company_phone && <p className="text-red-600 text-sm mt-1">{errors.company_phone.message}</p>}
              </div>
            )}
          />

          <Controller
            name="supervisor_name"
            control={control}
            render={({ field }) => (
              <div>
                <Label htmlFor="supervisor_name">Nombre del Jefe Inmediato *</Label>
                <Input {...field} id="supervisor_name" placeholder="Nombre completo" className="mt-1" />
                {errors.supervisor_name && <p className="text-red-600 text-sm mt-1">{errors.supervisor_name.message}</p>}
              </div>
            )}
          />

          <Controller
            name="company_website"
            control={control}
            render={({ field }) => (
              <div>
                <Label htmlFor="company_website">Sitio Web (Opcional)</Label>
                <Input {...field} id="company_website" placeholder="www.empresa.com" className="mt-1" />
                {errors.company_website && <p className="text-red-600 text-sm mt-1">{errors.company_website.message}</p>}
              </div>
            )}
          />
        </div>

        {/* Company Address */}
        <Controller
          name="company_address"
          control={control}
          render={({ field }) => (
            <div>
              <Label htmlFor="company_address">Dirección de la Empresa *</Label>
              <Input {...field} id="company_address" placeholder="Calle, número, colonia, ciudad, estado" className="mt-1" />
              {errors.company_address && <p className="text-red-600 text-sm mt-1">{errors.company_address.message}</p>}
            </div>
          )}
        />

        {/* Industry and Job Details */}
        <div className="grid md:grid-cols-2 gap-6">
          <Controller
            name="company_industry"
            control={control}
            render={({ field }) => (
              <div>
                <Label htmlFor="company_industry">Sector o Industria *</Label>
                <Input {...field} id="company_industry" placeholder="Ej: Automotriz, Tecnología, etc." className="mt-1" />
                {errors.company_industry && <p className="text-red-600 text-sm mt-1">{errors.company_industry.message}</p>}
              </div>
            )}
          />

          <Controller
            name="job_title"
            control={control}
            render={({ field }) => (
              <div>
                <Label htmlFor="job_title">Nombre de tu Puesto *</Label>
                <Input {...field} id="job_title" placeholder="Ej: Gerente, Analista, etc." className="mt-1" />
                {errors.job_title && <p className="text-red-600 text-sm mt-1">{errors.job_title.message}</p>}
              </div>
            )}
          />
        </div>

        {/* Job Seniority */}
        <Controller
          name="job_seniority"
          control={control}
          render={({ field }) => (
            <div>
              <Label>Antigüedad en el Puesto *</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {['Menos de 1 año', '1', '2', '3', '4', '5', '6', '7-10', 'Más de 10'].map(opt => (
                  <button
                    type="button"
                    key={opt}
                    onClick={() => field.onChange(opt)}
                    className={`px-4 py-2 text-sm font-semibold rounded-full border-2 transition-colors ${
                      field.value === opt ? 'bg-primary-600 border-primary-600 text-white' : 'bg-white border-gray-300 text-gray-700 hover:border-primary-400'
                    }`}
                  >
                    {opt === '1' || opt === '2' || opt === '3' || opt === '4' || opt === '5' || opt === '6' ? `${opt} año${opt === '1' ? '' : 's'}` : opt}
                  </button>
                ))}
              </div>
              {errors.job_seniority && <p className="text-red-600 text-sm mt-1">{errors.job_seniority.message}</p>}
            </div>
          )}
        />

        {/* Monthly Income */}
        <div>
          <Label htmlFor="net_monthly_income">Ingreso Mensual Bruto *</Label>
          <div className="relative mt-1">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-gray-500 font-semibold">$</span>
            <input
              value={incomeDisplayValue}
              onChange={handleIncomeChange}
              placeholder="25,000"
              className="block w-full px-4 py-2 bg-white border-2 border-gray-300 rounded-lg shadow-sm focus:ring-primary-500 focus:border-primary-500 pl-7 font-semibold"
              inputMode="numeric"
            />
          </div>
          <p className="text-xs text-gray-500 mt-2">Ingresa tu salario bruto mensual (antes de impuestos)</p>
          {errors.net_monthly_income && <p className="text-red-600 text-sm mt-1">{errors.net_monthly_income.message}</p>}
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

export default EmploymentStep;
