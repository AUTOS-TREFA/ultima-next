'use client';

import React, { useState } from 'react';
import { FileText, CheckCircle, MessageSquare, X, ArrowRight, ArrowLeft } from 'lucide-react';
import { BankService } from '@/services/BankService';

interface BankOnboardingProps {
  onComplete: () => void;
}

const BankOnboarding: React.FC<BankOnboardingProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  const steps = [
    {
      title: 'Bienvenido al Portal Bancario',
      icon: CheckCircle,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Este portal te permite gestionar todas las solicitudes de financiamiento asignadas a tu banco de manera eficiente y segura.
          </p>
          <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
            <p className="text-sm text-blue-800">
              <strong>Importante:</strong> Toda la información que veas aquí es confidencial y debe ser tratada con la máxima seguridad.
            </p>
          </div>
        </div>
      )
    },
    {
      title: 'Encontrar Solicitudes Pendientes',
      icon: FileText,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Desde el menú lateral, puedes acceder a:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-yellow-600 text-xs font-bold">1</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Solicitudes Pendientes</p>
                <p className="text-sm text-gray-600">Solicitudes nuevas que requieren tu revisión</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-green-600 text-xs font-bold">2</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Solicitudes Aprobadas</p>
                <p className="text-sm text-gray-600">Solicitudes que ya has aprobado</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-purple-600 text-xs font-bold">3</span>
              </div>
              <div>
                <p className="font-semibold text-gray-900">Solicitudes Activas</p>
                <p className="text-sm text-gray-600">Solicitudes con retroalimentación pendiente</p>
              </div>
            </li>
          </ul>
        </div>
      )
    },
    {
      title: 'Actualizar Estado y Dar Retroalimentación',
      icon: MessageSquare,
      content: (
        <div className="space-y-4">
          <p className="text-gray-700">
            Al hacer clic en "Ver detalles" de una solicitud, podrás:
          </p>
          <ul className="space-y-3">
            <li className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Aprobar o Rechazar</p>
                <p className="text-sm text-gray-600">Cambiar el estado de la solicitud según tu evaluación</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <MessageSquare className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Proporcionar Retroalimentación</p>
                <p className="text-sm text-gray-600">Dejar comentarios sobre documentos faltantes o información adicional requerida</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <FileText className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-gray-900">Descargar Documentos</p>
                <p className="text-sm text-gray-600">Descargar todos los documentos en un archivo ZIP</p>
              </div>
            </li>
          </ul>
          <div className="bg-green-50 border-l-4 border-green-400 p-4 mt-4">
            <p className="text-sm text-green-800">
              <strong>Nota:</strong> Se te pedirá tu PIN para realizar estas acciones de seguridad.
            </p>
          </div>
        </div>
      )
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = async () => {
    try {
      await BankService.completeOnboarding();
      onComplete();
    } catch (error) {
      console.error('Error completing onboarding:', error);
      onComplete(); // Continue anyway
    }
  };

  const CurrentIcon = steps[currentStep].icon;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-8 relative">
        <button
          onClick={handleFinish}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-4 mb-6">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
            <CurrentIcon className="w-8 h-8 text-blue-600" />
          </div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">{steps[currentStep].title}</h2>
            <p className="text-sm text-gray-600">Paso {currentStep + 1} de {steps.length}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8">
          <div className="flex gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                className={`h-2 flex-1 rounded-full transition-colors ${
                  index <= currentStep ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="mb-8 min-h-[300px]">
          {steps[currentStep].content}
        </div>

        {/* Navigation */}
        <div className="flex justify-between items-center">
          <button
            onClick={handlePrev}
            disabled={currentStep === 0}
            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-gray-900 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <ArrowLeft className="w-4 h-4" />
            Anterior
          </button>

          {currentStep < steps.length - 1 ? (
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
            >
              Siguiente
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              onClick={handleFinish}
              className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold"
            >
              <CheckCircle className="w-4 h-4" />
              ¡Entendido!
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default BankOnboarding;
