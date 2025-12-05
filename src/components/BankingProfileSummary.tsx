import React, { useEffect } from 'react';
import { CreditCard } from 'lucide-react';

interface BankingProfileSummaryProps {
    bankProfile: any | null;
}

const BankingProfileSummary: React.FC<BankingProfileSummaryProps> = ({ bankProfile }) => {
    // Debug logging
    useEffect(() => {
        console.log('[BankingProfileSummary] Received bankProfile:', bankProfile);
    }, [bankProfile]);

    // Use bank profile data from the bank_profiles table
    const bankingData = bankProfile || {};

    // Check for both Spanish and English field names for compatibility
    const hasBankingInfo = bankingData.banco_recomendado ||
                          bankingData.banco_segunda_opcion ||
                          bankingData.respuestas ||
                          bankingData.is_complete;

    if (!hasBankingInfo) {
        console.log('[BankingProfileSummary] No banking info available');
        return (
            <div className="bg-gray-50 p-6 rounded-xl shadow-sm border border-dashed border-gray-300">
                <h2 className="text-lg font-semibold text-gray-600 mb-2 flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Perfilación Bancaria
                </h2>
                <p className="text-sm text-gray-500">Este cliente aún no ha completado su perfil bancario.</p>
            </div>
        );
    }

    // Extract data from respuestas field
    const respuestas = bankingData.respuestas || {};

    return (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-6 rounded-xl shadow-sm">
            <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-green-600" />
                Perfilación Bancaria
            </h2>
            <div className="space-y-3">
                {bankingData.banco_recomendado && (
                    <div className="bg-white/80 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Banco Recomendado</p>
                        <p className="text-sm font-bold text-green-700">{bankingData.banco_recomendado}</p>
                    </div>
                )}
                {bankingData.banco_segunda_opcion && (
                    <div className="bg-white/80 p-3 rounded-lg">
                        <p className="text-xs text-gray-500 uppercase tracking-wider">Banco Segunda Opción</p>
                        <p className="text-sm font-semibold text-gray-800">{bankingData.banco_segunda_opcion}</p>
                    </div>
                )}
                {respuestas.trabajo_tiempo && (
                    <div className="bg-white/80 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Antigüedad en el Empleo</p>
                        <p className="text-sm font-semibold text-gray-800">{respuestas.trabajo_tiempo}</p>
                    </div>
                )}
                {(respuestas.cuenta_bancaria || respuestas.banco_nomina) && (
                    <div className="bg-white/80 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Cuenta Bancaria Principal</p>
                        <p className="text-sm font-semibold text-gray-800">{respuestas.cuenta_bancaria || respuestas.banco_nomina}</p>
                    </div>
                )}
                {respuestas.ingreso_mensual && (
                    <div className="bg-white/80 p-3 rounded-lg">
                        <p className="text-xs text-gray-500">Ingresos Mensuales Comprobables</p>
                        <p className="text-sm font-semibold text-gray-800">{respuestas.ingreso_mensual}</p>
                    </div>
                )}
                {(respuestas.historial_crediticio || respuestas.creditos_vigentes) && (
                    <div className="bg-white/80 p-3 rounded-lg grid grid-cols-2 gap-4">
                        {respuestas.historial_crediticio && (
                            <div>
                                <p className="text-xs text-gray-500">Historial Crediticio</p>
                                <p className="text-sm font-semibold text-gray-800">{respuestas.historial_crediticio}</p>
                            </div>
                        )}
                        {respuestas.creditos_vigentes && (
                            <div>
                                <p className="text-xs text-gray-500">Créditos Vigentes</p>
                                <p className="text-sm font-semibold text-gray-800">{respuestas.creditos_vigentes}</p>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default BankingProfileSummary;
