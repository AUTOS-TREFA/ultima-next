import React from 'react';
import { ArrowLeftIcon, CheckCircle, User, Building2, AlertCircle, Loader2, Car } from 'lucide-react';
import { Button } from '../../ui/button';
import { CardContent } from '../../ui/card';
import type { StepperType } from '../EnhancedApplication';

interface ReviewSubmitStepProps {
  stepper: StepperType;
  control: any;
  getValues: any;
  setValue: any;
  profile: any;
  vehicleInfo: any;
  bank: string | null;
  onSubmit: (e?: React.BaseSyntheticEvent) => Promise<void>;
  isSubmitting: boolean;
  submissionError: string | null;
}

const ReviewSubmitStep: React.FC<ReviewSubmitStepProps> = ({
  stepper,
  getValues,
  profile,
  vehicleInfo,
  bank,
  onSubmit,
  isSubmitting,
  submissionError
}) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
  };

  const applicationData = getValues();
  const address = applicationData.current_address || profile?.address || '';
  const colony = applicationData.current_colony || profile?.colony || '';
  const city = applicationData.current_city || profile?.city || '';
  const state = applicationData.current_state || profile?.state || '';
  const zipCode = applicationData.current_zip_code || profile?.zip_code || '';

  const fullAddress = [address, colony, city, state, zipCode ? `C.P. ${zipCode}` : '']
    .filter(part => part && part.trim())
    .join(', ');

  // Get financing details from form
  const loanTerm = applicationData.loan_term_months || 60;
  const downPayment = applicationData.down_payment_amount || 0;
  const vehiclePrice = vehicleInfo?.precio || 0;
  const amountToFinance = vehiclePrice - downPayment;

  return (
    <CardContent className="col-span-5 flex flex-col gap-6 p-6 md:col-span-3">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Revisa y Envía tu Solicitud</h2>
        <p className="text-sm text-gray-600">Verifica que toda la información sea correcta antes de enviar.</p>
      </div>

      {/* Vehicle and Financing Info */}
      {vehicleInfo?._vehicleTitle && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6 border-2 border-blue-200">
          <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Car className="w-5 h-5 text-blue-600" />
            Vehículo y Financiamiento
          </h3>
          <div className="grid md:grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-gray-600">Auto Seleccionado</p>
              <p className="font-semibold text-gray-900">{vehicleInfo._vehicleTitle}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Precio</p>
              <p className="font-semibold text-primary-700">{formatCurrency(vehiclePrice)}</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Plazo del Crédito</p>
              <p className="font-semibold text-gray-900">{loanTerm} meses</p>
            </div>
            <div>
              <p className="text-xs text-gray-600">Enganche</p>
              <p className="font-semibold text-gray-900">{formatCurrency(downPayment)}</p>
            </div>
          </div>
          <div className="pt-4 border-t border-blue-200">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">Monto a Financiar:</span>
              <span className="text-lg font-bold text-primary-600">{formatCurrency(amountToFinance)}</span>
            </div>
          </div>
          <div className="mt-3">
            <p className="text-xs text-blue-700">
              <strong>Nota:</strong> Si deseas cambiar el plazo o el enganche, puedes regresar al Paso 1.
            </p>
          </div>
        </div>
      )}

      {/* Bank Info */}
      {bank && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            <div>
              <p className="text-xs text-gray-600">Banco Recomendado</p>
              <p className="font-semibold text-gray-900">{bank}</p>
            </div>
          </div>
        </div>
      )}

      {/* Summary Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Personal Data */}
        <div className="bg-gray-50 p-5 rounded-lg border">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
            <User className="w-4 h-4 mr-2 text-primary-600" />
            Datos Personales
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-gray-500">Nombre</p>
              <p className="font-semibold text-gray-800">{profile?.first_name} {profile?.last_name} {profile?.mother_last_name}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">RFC</p>
              <p className="font-semibold text-gray-800 font-mono">{profile?.rfc || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Teléfono</p>
              <p className="font-semibold text-gray-800">{profile?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Dirección</p>
              <p className="font-semibold text-gray-800 text-xs">{fullAddress || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* Employment Data */}
        <div className="bg-gray-50 p-5 rounded-lg border">
          <h3 className="font-semibold text-gray-700 mb-3 flex items-center">
            <Building2 className="w-4 h-4 mr-2 text-primary-600" />
            Datos Laborales
          </h3>
          <div className="space-y-2 text-sm">
            <div>
              <p className="text-xs text-gray-500">Empresa</p>
              <p className="font-semibold text-gray-800">{applicationData.company_name || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Puesto</p>
              <p className="font-semibold text-gray-800">{applicationData.job_title || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Ingreso Bruto Mensual</p>
              <p className="font-semibold text-gray-800">${applicationData.net_monthly_income || 'N/A'}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Antigüedad</p>
              <p className="font-semibold text-gray-800">{applicationData.job_seniority || 'N/A'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Details */}
      <div className="bg-gray-50 p-5 rounded-lg border">
        <h3 className="font-semibold text-gray-700 mb-3">Detalles Adicionales</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500">Tipo de Vivienda</p>
            <p className="font-semibold text-gray-800">{applicationData.housing_type || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Tiempo en Domicilio</p>
            <p className="font-semibold text-gray-800">{applicationData.time_at_address || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Dependientes</p>
            <p className="font-semibold text-gray-800">{applicationData.dependents || 'N/A'}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Nivel de Estudios</p>
            <p className="font-semibold text-gray-800">{applicationData.grado_de_estudios || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* References */}
      <div className="bg-gray-50 p-5 rounded-lg border">
        <h3 className="font-semibold text-gray-700 mb-3">Referencias</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-xs text-gray-500 mb-1">Referencia de Amistad</p>
            <p className="font-semibold text-gray-800">{applicationData.friend_reference_name || 'N/A'}</p>
            <p className="text-xs text-gray-600">{applicationData.friend_reference_phone || ''}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Referencia Familiar</p>
            <p className="font-semibold text-gray-800">{applicationData.family_reference_name || 'N/A'}</p>
            <p className="text-xs text-gray-600">{applicationData.family_reference_phone || ''}</p>
          </div>
        </div>
      </div>

      {/* Submission Error */}
      {submissionError && (
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-semibold text-red-900">Error al Enviar</p>
              <p className="text-sm text-red-800 mt-1">{submissionError}</p>
              {submissionError.includes("vehículo") && (
                <Button
                  type="button"
                  onClick={() => stepper.goTo('vehicle-financing')}
                  variant="outline"
                  size="sm"
                  className="mt-3"
                >
                  Ir a Selección de Vehículo
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Important Notice */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <p className="text-sm text-blue-900">
          <strong>Antes de enviar:</strong> Revisa cuidadosamente toda la información. Puedes hacer clic en cualquier paso numerado del lado izquierdo para editar la información.
        </p>
      </div>

      <div className="flex justify-between gap-4 mt-6">
        <Button variant="secondary" size="lg" onClick={stepper.prev}>
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Anterior
        </Button>
        <Button
          size="lg"
          onClick={onSubmit}
          disabled={isSubmitting}
          className="bg-green-600 hover:bg-green-700 text-white"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Enviando...
            </>
          ) : (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Enviar Solicitud
            </>
          )}
        </Button>
      </div>
    </CardContent>
  );
};

export default ReviewSubmitStep;
