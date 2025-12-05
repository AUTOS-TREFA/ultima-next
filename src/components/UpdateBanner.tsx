import { useEffect, useState } from 'react';
import { Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface UpdateBannerProps {
  onUpdate: () => void;
  onDismiss: () => void;
}

export function UpdateBanner({ onUpdate, onDismiss }: UpdateBannerProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Animación de entrada suave
    const timer = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  const handleUpdate = () => {
    setIsVisible(false);
    setTimeout(onUpdate, 300); // Esperar a que termine la animación
  };

  const handleDismiss = () => {
    setIsVisible(false);
    setTimeout(onDismiss, 300); // Esperar a que termine la animación
  };

  return (
    <div
      className={`fixed bottom-4 left-4 right-4 md:left-auto md:right-4 z-[9999] transition-all duration-300 ease-out ${
        isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'
      }`}
      style={{ maxWidth: '420px' }}
    >
      <Card className="overflow-hidden border-0 shadow-2xl">
        <div className="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-700 p-5">
          <div className="flex items-start gap-4">
            <div className="bg-white/25 p-2.5 rounded-xl backdrop-blur-sm">
              <Sparkles className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-white font-bold text-lg mb-2">
                ¡Hay mejoras nuevas!
              </h3>
              <p className="text-white/95 text-sm leading-relaxed mb-4">
                Para que todo funcione correctamente, solo haz clic en actualizar. Esto tomará solo unos segundos.
              </p>
              <Button
                onClick={handleUpdate}
                className="w-full bg-white text-orange-600 hover:bg-orange-50 font-bold shadow-lg text-base py-5"
              >
                Actualizar ahora
              </Button>
              <button
                onClick={handleDismiss}
                className="w-full text-white/80 hover:text-white text-xs mt-3 transition-colors"
              >
                Continuar sin actualizar (no recomendado)
              </button>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
