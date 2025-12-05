import React, { useRef, useState, useEffect } from 'react';
import { X, RotateCcw, Check } from 'lucide-react';
import { Button } from '../ui/button';
import { Label } from '../ui/label';

interface SignatureCanvasProps {
  value?: string;
  onChange: (signature: string | null) => void;
  error?: string;
}

const SignatureCanvas: React.FC<SignatureCanvasProps> = ({ value, onChange, error }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [isEmpty, setIsEmpty] = useState(true);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    // Detect if touch device
    setIsTouchDevice('ontouchstart' in window || navigator.maxTouchPoints > 0);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const updateCanvasSize = () => {
      const container = canvas.parentElement;
      if (!container) return;

      const rect = container.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = 200; // Fixed height

      // Configure drawing style
      ctx.strokeStyle = '#000';
      ctx.lineWidth = 2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Redraw existing signature if any
      if (value && value !== '') {
        const img = new Image();
        img.onload = () => {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          setIsEmpty(false);
        };
        img.src = value;
      }
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);

    return () => {
      window.removeEventListener('resize', updateCanvasSize);
    };
  }, [value]);

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    setIsDrawing(true);
    setIsEmpty(false);

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false);

      const canvas = canvasRef.current;
      if (!canvas) return;

      // Save signature as base64
      const dataURL = canvas.toDataURL('image/png');
      onChange(dataURL);
    }
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setIsEmpty(true);
    onChange(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between">
        <div>
          <Label className="text-sm font-semibold text-gray-900">
            Firma Digital *
          </Label>
          <p className="text-xs text-gray-600 mt-1">
            {isTouchDevice
              ? "Usa tu dedo para firmar. Hazlo lo más parecido posible a tu firma en tu INE."
              : "Usa tu mouse o trackpad para firmar. Hazlo lo más parecido posible a tu firma en tu INE."}
          </p>
        </div>
        {!isEmpty && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearSignature}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <RotateCcw className="w-4 h-4 mr-1" />
            Limpiar
          </Button>
        )}
      </div>

      <div className={`relative border-2 rounded-lg overflow-hidden ${error ? 'border-red-500' : isEmpty ? 'border-gray-300 border-dashed' : 'border-green-500'}`}>
        <canvas
          ref={canvasRef}
          className="w-full h-[200px] bg-white cursor-crosshair touch-none"
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />

        {isEmpty && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <p className="text-gray-400 text-sm font-medium">
              {isTouchDevice ? "Toca y desliza para firmar" : "Haz clic y arrastra para firmar"}
            </p>
          </div>
        )}

        {!isEmpty && (
          <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
            <Check className="w-4 h-4" />
          </div>
        )}
      </div>

      {error && (
        <p className="text-sm text-red-600 flex items-center gap-1">
          <X className="w-4 h-4" />
          {error}
        </p>
      )}

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
        <p className="text-xs text-blue-900">
          <strong>Importante:</strong> Tu firma digital tiene validez legal. Asegúrate de que sea clara y lo más parecida posible a la firma en tu identificación oficial.
        </p>
      </div>
    </div>
  );
};

export default SignatureCanvas;
