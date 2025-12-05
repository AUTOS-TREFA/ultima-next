import React from 'react';
import { CheckCircle, ArrowRight, FileText, Upload, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { Button } from '../../ui/button';
import { CardContent } from '../../ui/card';

interface CompletedStepProps {
  vehicleInfo: any;
  applicationId: string | null;
}

const CompletedStep: React.FC<CompletedStepProps> = ({ vehicleInfo, applicationId }) => {
  return (
    <CardContent className="col-span-5 flex flex-col items-center justify-center gap-6 p-6 md:col-span-3 min-h-[600px]">
      {/* Success Icon */}
      <div className="inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full mb-4">
        <CheckCircle className="w-16 h-16 text-green-600" />
      </div>

      {/* Success Message */}
      <div className="text-center max-w-lg">
        <h1 className="text-3xl font-bold text-gray-900 mb-3">
          ¡Solicitud Enviada Exitosamente!
        </h1>
        <p className="text-base text-gray-600">
          Tu solicitud está en revisión. Te notificaremos por email y WhatsApp sobre el estado de tu solicitud.
        </p>
      </div>

      {/* Vehicle Info */}
      {vehicleInfo?._vehicleTitle && (
        <div className="w-full max-w-lg bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4 border border-blue-200">
          <p className="text-xs text-gray-500 mb-2">Vehículo de Interés</p>
          <div className="flex items-center gap-3">
            <img
              src={vehicleInfo._featureImage}
              alt={vehicleInfo._vehicleTitle}
              className="w-24 h-16 object-cover rounded"
            />
            <div className="flex-1">
              <h3 className="text-sm font-bold text-gray-900">{vehicleInfo._vehicleTitle}</h3>
            </div>
          </div>
        </div>
      )}

      {/* Next Steps */}
      <div className="w-full max-w-lg bg-white border-2 border-primary-200 rounded-lg p-6">
        <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5 text-primary-600" />
          Próximos Pasos
        </h3>
        <ol className="space-y-4 text-sm">
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">1</span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Sube los documentos requeridos</p>
              <p className="text-gray-600 text-xs mt-1">INE, comprobante de domicilio, comprobante de ingresos y estado de cuenta</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">2</span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Espera la revisión del banco</p>
              <p className="text-gray-600 text-xs mt-1">El proceso toma entre 1-3 días hábiles</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary-600 text-white flex items-center justify-center text-xs font-bold">3</span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">Recibe notificación de aprobación</p>
              <p className="text-gray-600 text-xs mt-1">Te contactaremos por email y WhatsApp</p>
            </div>
          </li>
          <li className="flex gap-3">
            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-green-600 text-white flex items-center justify-center text-xs font-bold">4</span>
            <div className="flex-1">
              <p className="font-semibold text-gray-900">¡Separa tu vehículo!</p>
              <p className="text-gray-600 text-xs mt-1">Una vez aprobado, podrás reservar tu auto</p>
            </div>
          </li>
        </ol>
      </div>

      {/* Required Documents */}
      <div className="w-full max-w-lg bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
        <h4 className="font-semibold mb-4 flex items-center gap-2 text-gray-900">
          <FileText className="w-5 h-5 text-yellow-600" />
          Documentos Requeridos
        </h4>
        <div className="grid md:grid-cols-2 gap-3 text-sm">
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Identificación oficial (INE/Pasaporte)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Comprobante de domicilio (máx. 3 meses)</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Comprobante de ingresos</span>
          </div>
          <div className="flex items-start gap-2">
            <CheckCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
            <span className="text-gray-700">Estado de cuenta bancario</span>
          </div>
        </div>
        <div className="mt-4 pt-4 border-t border-yellow-200">
          <p className="text-xs text-yellow-800">
            <strong>Importante:</strong> Todos los documentos deben estar vigentes y ser legibles.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="w-full max-w-lg space-y-3 mt-4">
        <Link
          href={`/escritorio/seguimiento/${applicationId}`}
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Subir Documentos Ahora
          <ArrowRight className="w-4 h-4" />
        </Link>

        <Link
          href="/escritorio/seguimiento"
          className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition-colors"
        >
          Ver Estado de Solicitud
        </Link>
      </div>

      {/* Important Notice */}
      <div className="w-full max-w-lg bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm text-blue-900">
              <strong>Nota:</strong> Mientras más pronto subas tus documentos, más rápido podremos procesar tu solicitud y aprobar tu crédito.
            </p>
          </div>
        </div>
      </div>

      {/* Secondary Actions */}
      <div className="w-full max-w-lg pt-4 border-t border-gray-200 text-center">
        <Link
          href="/explorar"
          className="text-sm text-primary-600 hover:text-primary-700 font-semibold"
        >
          Explorar Más Vehículos →
        </Link>
      </div>

      {/* Thank You Message */}
      <div className="w-full max-w-lg text-center mt-6">
        <p className="text-sm text-gray-500">
          Gracias por confiar en TREFA. Nuestro equipo trabajará para brindarte la mejor opción de financiamiento.
        </p>
      </div>
    </CardContent>
  );
};

export default CompletedStep;
