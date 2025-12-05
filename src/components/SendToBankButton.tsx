'use client';

import React, { useState, useEffect } from 'react';
import { BankService } from '@/services/BankService';
import { BANKS, type BankName } from '@/types/bank';
import { toast } from 'sonner';

interface SendToBankButtonProps {
  leadId: string;
  applicationId?: string;
  recommendedBank?: BankName;
  bankProfile?: {
    score?: number;
    risk_level?: string;
    profiling_data?: any;
  };
  onSent?: () => void;
}

const SendToBankButton: React.FC<SendToBankButtonProps> = ({
  leadId,
  applicationId,
  recommendedBank,
  bankProfile,
  onSent
}) => {
  const [showModal, setShowModal] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankName | null>(recommendedBank || null);
  const [availableBankReps, setAvailableBankReps] = useState<any[]>([]);
  const [selectedBankRep, setSelectedBankRep] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [loadingReps, setLoadingReps] = useState(false);

  useEffect(() => {
    if (showModal && selectedBank) {
      loadBankReps();
    }
  }, [showModal, selectedBank]);

  const loadBankReps = async () => {
    if (!selectedBank) return;

    setLoadingReps(true);
    try {
      const allReps = await BankService.getAllBankReps();
      const bankReps = allReps.filter(
        (rep) => rep.bank_affiliation === selectedBank && rep.is_approved && rep.is_active
      );
      setAvailableBankReps(bankReps);

      // Auto-select if only one rep
      if (bankReps.length === 1) {
        setSelectedBankRep(bankReps[0].id);
      }
    } catch (err: unknown) {
      console.error('Error loading bank reps:', err);
      toast.error('Error al cargar representantes bancarios');
    } finally {
      setLoadingReps(false);
    }
  };

  const handleSendToBank = async () => {
    if (!selectedBank || !selectedBankRep || !leadId) {
      toast.error('Por favor selecciona un banco y representante');
      return;
    }

    setLoading(true);
    try {
      await BankService.assignLeadToBank(
        leadId,
        applicationId || null,
        selectedBankRep,
        selectedBank
      );

      toast.success(`Solicitud enviada a ${BANKS[selectedBank].name}`);
      setShowModal(false);
      onSent?.();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al enviar solicitud';
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getRecommendedBankInfo = () => {
    if (!recommendedBank) return null;
    return BANKS[recommendedBank];
  };

  const recommendedBankInfo = getRecommendedBankInfo();

  return (
    <>
      <button
        onClick={() => setShowModal(true)}
        className="w-full px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-md flex items-center justify-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
        </svg>
        Enviar solicitud a {recommendedBankInfo ? recommendedBankInfo.name : 'banco'}
      </button>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold text-gray-900">Enviar solicitud a banco</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Bank Profile Score */}
              {bankProfile && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h3 className="font-semibold text-gray-900 mb-3">Perfil Bancario del Cliente</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {bankProfile.score !== undefined && (
                      <div>
                        <p className="text-sm text-gray-600">Score</p>
                        <p className="text-2xl font-bold text-gray-900">{bankProfile.score}/100</p>
                      </div>
                    )}
                    {bankProfile.risk_level && (
                      <div>
                        <p className="text-sm text-gray-600">Nivel de Riesgo</p>
                        <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                          bankProfile.risk_level === 'low' ? 'bg-green-100 text-green-800' :
                          bankProfile.risk_level === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {bankProfile.risk_level === 'low' ? 'Bajo' :
                           bankProfile.risk_level === 'medium' ? 'Medio' : 'Alto'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Recommended Bank */}
              {recommendedBankInfo && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <h3 className="font-semibold text-green-900">Banco Recomendado</h3>
                  </div>
                  <p className="text-lg font-bold text-green-900">{recommendedBankInfo.name}</p>
                  <p className="text-sm text-green-700 mt-1">
                    Basado en el perfil bancario del cliente
                  </p>
                </div>
              )}

              {/* Bank Selection */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-3">
                  Seleccionar banco
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {Object.values(BANKS).map((bank) => (
                    <button
                      key={bank.id}
                      onClick={() => {
                        setSelectedBank(bank.id);
                        setSelectedBankRep('');
                      }}
                      className={`p-4 border-2 rounded-lg transition-all ${
                        selectedBank === bank.id
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-gray-200 hover:border-gray-300 bg-white'
                      } ${bank.id === recommendedBank ? 'ring-2 ring-green-300' : ''}`}
                    >
                      <div className="flex flex-col items-center gap-2">
                        <div className="w-12 h-12 rounded-lg bg-gray-100 flex items-center justify-center">
                          <span className="text-xl font-bold text-gray-600">
                            {bank.name.charAt(0)}
                          </span>
                        </div>
                        <span className="text-xs font-semibold text-gray-700 text-center">
                          {bank.name}
                        </span>
                        {bank.id === recommendedBank && (
                          <span className="text-xs text-green-600 font-medium">
                            Recomendado
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Bank Representative Selection */}
              {selectedBank && (
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Asignar a representante de {BANKS[selectedBank].name}
                  </label>
                  {loadingReps ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-sm text-gray-600 mt-2">Cargando representantes...</p>
                    </div>
                  ) : availableBankReps.length === 0 ? (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800">
                        No hay representantes disponibles para {BANKS[selectedBank].name}
                      </p>
                    </div>
                  ) : (
                    <select
                      value={selectedBankRep}
                      onChange={(e) => setSelectedBankRep(e.target.value)}
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="">Seleccionar representante...</option>
                      {availableBankReps.map((rep) => (
                        <option key={rep.id} value={rep.id}>
                          {rep.first_name} {rep.last_name} ({rep.email})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t border-gray-200 px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                disabled={loading}
              >
                Cancelar
              </button>
              <button
                onClick={handleSendToBank}
                disabled={loading || !selectedBank || !selectedBankRep}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Enviando...
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                    </svg>
                    Enviar solicitud
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SendToBankButton;
