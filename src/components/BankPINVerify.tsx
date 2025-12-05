'use client';

import React, { useState } from 'react';
import { Shield, X } from 'lucide-react';
import { BankService } from '@/services/BankService';

interface BankPINVerifyProps {
  onVerified: () => void;
  onCancel: () => void;
  action: string; // Description of what action requires PIN
}

const BankPINVerify: React.FC<BankPINVerifyProps> = ({ onVerified, onCancel, action }) => {
  const [pin, setPin] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVerify = async () => {
    if (!pin || pin.length < 4) {
      setError('Ingresa tu PIN');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const isValid = await BankService.verifyPIN(pin);

      if (isValid) {
        onVerified();
      } else {
        setError('PIN incorrecto');
        setPin('');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al verificar PIN';
      setError(errorMessage);
      setPin('');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-sm w-full p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <Shield className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Verificar PIN</h3>
              <p className="text-xs text-gray-600">{action}</p>
            </div>
          </div>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Ingresa tu PIN
          </label>
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
            onKeyPress={handleKeyPress}
            autoFocus
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-widest font-mono focus:ring-2 focus:ring-green-500 focus:border-transparent"
            placeholder="••••"
          />
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
            {error}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg font-medium hover:bg-gray-50"
          >
            Cancelar
          </button>
          <button
            onClick={handleVerify}
            disabled={loading || !pin}
            className="flex-1 bg-green-600 text-white py-2 rounded-lg font-semibold hover:bg-green-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? 'Verificando...' : 'Verificar'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BankPINVerify;
