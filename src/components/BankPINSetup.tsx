'use client';

import React, { useState } from 'react';
import { Lock, AlertCircle } from 'lucide-react';
import { BankService } from '@/services/BankService';
import { toast } from 'sonner';

interface BankPINSetupProps {
  onPINSet: () => void;
}

const BankPINSetup: React.FC<BankPINSetupProps> = ({ onPINSet }) => {
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validatePIN = (value: string): boolean => {
    // PIN must be 4-6 digits
    return /^\d{4,6}$/.test(value);
  };

  const handleSetPIN = async () => {
    setError(null);

    if (!validatePIN(pin)) {
      setError('El PIN debe tener entre 4 y 6 dígitos');
      return;
    }

    if (pin !== confirmPin) {
      setError('Los PINs no coinciden');
      return;
    }

    setLoading(true);

    try {
      await BankService.setPIN(pin);
      toast.success('PIN establecido correctamente');
      onPINSet();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al establecer PIN';
      setError(errorMessage);
      toast.error('Error al establecer PIN');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
            <Lock className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Establecer PIN de Seguridad</h2>
            <p className="text-sm text-gray-600">Requerido para acciones críticas</p>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-400 p-4 mb-6">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-semibold mb-1">¿Por qué necesitas un PIN?</p>
              <p>
                Tu PIN protegerá acciones importantes como actualizar estados de solicitudes y descargar documentos confidenciales.
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Crear PIN (4-6 dígitos)
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirmar PIN
            </label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value.replace(/\D/g, ''))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="••••"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <button
          onClick={handleSetPIN}
          disabled={loading || !pin || !confirmPin}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {loading ? 'Estableciendo...' : 'Establecer PIN'}
        </button>

        <p className="text-xs text-gray-500 text-center mt-4">
          No compartas tu PIN con nadie. Podrás cambiarlo en cualquier momento desde tu perfil.
        </p>
      </div>
    </div>
  );
};

export default BankPINSetup;
