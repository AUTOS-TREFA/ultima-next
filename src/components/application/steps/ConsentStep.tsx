import React from 'react';
import { ArrowLeftIcon, ArrowRightIcon, CheckCircle } from 'lucide-react';
import { Controller } from 'react-hook-form';
import { Button } from '../../ui/button';
import { CardContent } from '../../ui/card';
import { Label } from '../../ui/label';
import { Checkbox } from '../../ui/checkbox';
import SignatureCanvas from '../SignatureCanvas';
import type { StepperType } from '../EnhancedApplication';

const declarations = [
  "Confirmo que la información que he proporcionado es correcta y completa.",
  "Autorizo a TREFA a compartir mi solicitud con las instituciones financieras necesarias para encontrar la mejor opción de crédito para mí.",
  "Entiendo que se consultará mi historial crediticio para evaluar mi solicitud.",
  "Acepto que TREFA me contacte por los medios proporcionados para dar seguimiento a mi solicitud.",
  "He leído y acepto el Aviso de Privacidad de TREFA.",
  "Comprendo que el envío de esta solicitud no garantiza la aprobación del crédito, la cual depende del análisis de la institución financiera.",
  "Confirmo que soy mayor de edad y tengo capacidad legal para realizar esta solicitud."
];

interface ConsentStepProps {
  stepper: StepperType;
  control: any;
  errors: any;
  setValue: any;
  onNext: () => void;
}

const ConsentStep: React.FC<ConsentStepProps> = ({
  stepper,
  control,
  errors,
  setValue,
  onNext
}) => {
  return (
    <CardContent className="col-span-6 flex flex-col gap-4 p-4 sm:p-5 md:col-span-4">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Declaraciones Finales</h2>
        <p className="text-sm text-gray-600">
          Al continuar, expreso y certifico haber leído, aceptado o estar de acuerdo con cada una de las siguientes cláusulas:
        </p>
      </div>

      {/* Declarations List */}
      <div className="bg-white rounded-xl p-6 border">
        <ul className="space-y-3 text-gray-700 text-sm">
          {declarations.map((declaration, index) => (
            <li key={index} className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-primary-600 flex-shrink-0 mt-0.5" />
              <span>{declaration}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* Terms and Conditions Checkbox */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-6">
        <Controller
          name="terms_and_conditions"
          control={control}
          render={({ field }) => (
            <div className="flex items-start gap-3">
              <Checkbox
                id="terms_and_conditions"
                checked={field.value || false}
                onCheckedChange={field.onChange}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="terms_and_conditions" className="text-base font-semibold text-gray-900 cursor-pointer">
                  He leído y estoy de acuerdo con los términos y condiciones *
                </Label>
                {errors.terms_and_conditions && (
                  <p className="text-red-600 text-sm mt-2 font-semibold">
                    {errors.terms_and_conditions.message}
                  </p>
                )}
              </div>
            </div>
          )}
        />
      </div>

      {/* Digital Signature */}
      <div className="bg-white rounded-xl p-6 border-2 border-primary-200">
        <Controller
          name="digital_signature"
          control={control}
          rules={{ required: 'La firma digital es obligatoria para enviar tu solicitud' }}
          render={({ field }) => (
            <SignatureCanvas
              value={field.value}
              onChange={field.onChange}
              error={errors.digital_signature?.message}
            />
          )}
        />
      </div>

      {/* Survey Consent (Optional) */}
      <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6">
        <Controller
          name="consent_survey"
          control={control}
          render={({ field }) => (
            <div className="flex items-start gap-3">
              <Checkbox
                id="consent_survey"
                checked={field.value || false}
                onCheckedChange={field.onChange}
                className="mt-0.5"
              />
              <div className="flex-1">
                <Label htmlFor="consent_survey" className="text-base font-medium text-gray-900 cursor-pointer">
                  Sí, me gustaría recibir un cupón promocional a cambio de responder una breve encuesta por correo electrónico después de enviar mi solicitud.
                </Label>
                <p className="text-xs text-gray-600 mt-1">
                  Opcional - Recibirás una encuesta de satisfacción y un cupón de descuento válido para tu próxima compra.
                </p>
              </div>
            </div>
          )}
        />
      </div>

      {/* Important Notice */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <p className="text-sm text-yellow-800">
          <strong>Nota Importante:</strong> Al hacer clic en "Siguiente", confirmas que toda la información proporcionada es verídica, aceptas los términos mencionados anteriormente y que tu firma digital tiene validez legal.
        </p>
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

export default ConsentStep;
