'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle, RotateCw, ArrowLeft } from 'lucide-react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error
    console.error('[Vehicle Detail Error]:', error);

    // Auto-retry once after a short delay (handles hydration issues)
    const timer = setTimeout(() => {
      reset();
    }, 500);

    return () => clearTimeout(timer);
  }, [error, reset]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background px-4">
      <div className="max-w-md w-full text-center">
        <div className="mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-orange-100 mb-4">
            <AlertCircle className="w-8 h-8 text-orange-600" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">
            Error al cargar el vehículo
          </h1>
          <p className="text-muted-foreground mb-6">
            Hubo un problema al cargar los detalles. Estamos reintentando automáticamente...
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={reset}
            variant="default"
            className="gap-2"
          >
            <RotateCw className="w-4 h-4" />
            Reintentar ahora
          </Button>
          <Button
            variant="outline"
            asChild
          >
            <Link href="/autos" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Volver al inventario
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
