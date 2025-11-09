'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Hand, X, Heart, ChevronUp, MousePointer, ArrowLeft, ArrowRight } from 'lucide-react';

const ExplorarTutorialOverlay: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const TUTORIAL_SHOWN_KEY = 'explorarTinderTutorialShown';
    const tutorialShown = localStorage.getItem(TUTORIAL_SHOWN_KEY);
    if (!tutorialShown) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    const TUTORIAL_SHOWN_KEY = 'explorarTinderTutorialShown';
    localStorage.setItem(TUTORIAL_SHOWN_KEY, 'true');
    setIsVisible(false);
  };

  const gestures = [
    { icon: Hand, text: 'Desliza a los lados para ver el siguiente auto', animation: { x: [0, 40, -40, 0] } },
    { icon: Heart, text: 'Desliza hacia abajo para guardar en favoritos', animation: { y: [0, 40, 0] } },
    { icon: ChevronUp, text: 'Desliza hacia arriba para cambiar de categoría', animation: { y: [0, -40, 0] } },
    { icon: MousePointer, text: 'Toca la imagen para ver la siguiente foto', animation: { scale: [1, 1.1, 1] } },
  ];

  const nextStep = () => {
    if (currentStep < gestures.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const currentGesture = gestures[currentStep];

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 30 : -30,
      opacity: 0,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 30 : -30,
      opacity: 0,
    }),
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 200, damping: 20 }}
            className="relative bg-gray-800 border border-gray-700 rounded-2xl shadow-xl p-8 max-w-md w-full text-center text-white overflow-hidden"
          >
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors z-20"
              aria-label="Cerrar tutorial"
            >
              <X className="w-6 h-6" />
            </button>

            <h2 className="text-2xl font-bold mb-4">Cómo Explorar</h2>

            <div className="relative h-40 flex items-center justify-center">
              <AnimatePresence initial={false} custom={currentStep}>
                <motion.div
                  key={currentStep}
                  custom={currentStep}
                  variants={variants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{
                    x: { type: "spring", stiffness: 300, damping: 30 },
                    opacity: { duration: 0.2 }
                  }}
                  className="absolute w-full"
                >
                  <div className="flex flex-col items-center text-center gap-4">
                    <motion.div
                      className="bg-gray-700 p-4 rounded-full"
                      animate={currentGesture.animation}
                      transition={{
                        duration: 1.5,
                        ease: 'easeInOut',
                        repeat: Infinity,
                        repeatDelay: 1
                      }}
                    >
                      <currentGesture.icon className="w-8 h-8 text-primary-400" />
                    </motion.div>
                    <p className="font-semibold text-lg">{currentGesture.text}</p>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="flex justify-center gap-2 my-4">
              {gestures.map((_, index) => (
                <div
                  key={index}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${currentStep === index ? 'bg-white' : 'bg-gray-600'}`}
                />
              ))}
            </div>

            <div className="flex justify-between items-center mt-8">
              <button 
                onClick={prevStep} 
                disabled={currentStep === 0} 
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg text-gray-300 hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Anterior
              </button>
              
              {currentStep < gestures.length - 1 ? (
                <button 
                  onClick={nextStep} 
                  className="flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-lg bg-primary-600 text-white hover:bg-primary-700 transition-colors"
                >
                  Siguiente
                  <ArrowRight className="w-4 h-4" />
                </button>
              ) : (
                <button 
                  onClick={handleClose} 
                  className="px-6 py-2 text-sm font-bold rounded-lg bg-green-600 text-white hover:bg-green-700 transition-colors"
                >
                  ¡Entendido!
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ExplorarTutorialOverlay;
