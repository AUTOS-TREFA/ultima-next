'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Heart, FileText, Phone, Image } from 'lucide-react';

const steps = [
  {
    icon: '👋',
    title: '¡Bienvenido a TREFA!',
    content: 'Estamos felices de tenerte aquí. Permítenos mostrarte rápidamente cómo funciona todo.'
  },
  {
    icon: <Heart className="w-12 h-12 text-red-500" />,
    title: 'Guarda tus Favoritos',
    content: 'Explora nuestro inventario y guarda los autos que más te gusten. ¡Nunca los perderás de vista!'
  },
  {
    icon: '📸',
    title: 'Navega las Fotos',
    content: 'Desliza hacia la izquierda o derecha sobre las fotos de los autos para ver todas las imágenes. También puedes tocar los puntos en la parte inferior para cambiar de foto.',
    animation: true
  },
  {
    icon: <FileText className="w-12 h-12 text-blue-500" />,
    title: 'Aplica sin Compromiso',
    content: 'Puedes iniciar una solicitud de financiamiento en cualquier momento. Esto no es un compromiso de compra, solo el primer paso para encontrar tu auto ideal.'
  },
  {
    icon: <Phone className="w-12 h-12 text-green-500" />,
    title: 'Estamos para Ayudarte',
    content: 'Ya seas un cliente nuevo o recurrente, nuestro equipo de asesores está a solo una llamada de distancia para ayudarte en cada paso del proceso.'
  }
];

interface OnboardingModalProps {
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ onClose }) => {
  const [step, setStep] = useState(0);

  const handleNext = () => {
    if (step < steps.length - 1) {
      setStep(step + 1);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-white rounded-lg shadow-xl w-full max-w-md m-4"
      >
        <div className="p-6 text-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex justify-center items-center h-24">
                {typeof steps[step].icon === 'string' ? (
                  <span className="text-5xl">{steps[step].icon}</span>
                ) : (
                  steps[step].icon
                )}
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mt-4">{steps[step].title}</h2>
              <p className="text-gray-600 mt-2">{steps[step].content}</p>

              {steps[step].animation && (
                <div className="mt-6 relative bg-gray-100 rounded-lg overflow-hidden h-32 flex items-center justify-center">
                  <motion.div
                    className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2"
                    animate={{
                      x: [0, -40, 40, 0],
                    }}
                    transition={{
                      duration: 3,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  >
                    <div className="text-4xl">👆</div>
                  </motion.div>
                  <div className="absolute bottom-2 flex gap-2">
                    <div className="w-2 h-2 rounded-full bg-primary-500"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                    <div className="w-2 h-2 rounded-full bg-gray-300"></div>
                  </div>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
        <div className="p-6 bg-gray-50 rounded-b-lg flex justify-between items-center">
          <div className="flex space-x-2">
            {steps.map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 rounded-full ${i === step ? 'bg-blue-500' : 'bg-gray-300'}`}
              />
            ))}
          </div>
          <button
            onClick={handleNext}
            className="bg-blue-500 text-white font-semibold px-6 py-2 rounded-lg hover:bg-blue-600 transition-colors flex items-center"
          >
            {step === steps.length - 1 ? 'Comenzar a Explorar' : 'Siguiente'}
            <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default OnboardingModal;
