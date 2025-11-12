'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { BankProfilingService } from '../services/BankProfilingService';
import type { BankProfileData } from '../types/types';

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="text-sm font-bold uppercase tracking-wider text-white bg-trefa-blue p-2 rounded-t-md mt-3">{title}</h3>
);

const DataRow: React.FC<{ label: string, value: any }> = ({ label, value }) => (
    <div className="flex justify-between py-1.5 px-3 border-b border-x border-gray-200">
        <p className="text-xs text-gray-600">{label}:</p>
        <p className="text-xs font-semibold text-gray-800 text-right">{value || 'N/A'}</p>
    </div>
);

const PrintableApplication: React.FC<{ application: any }> = ({ application }) => {
    const profile = application.personal_info_snapshot || {};
    const appData = application.application_data || {};
    const carInfo = application.car_info || {};
    const [advisorName, setAdvisorName] = useState<string | null>(null);
    const [hasDocuments, setHasDocuments] = useState<boolean>(false);
    const [isCheckingDocuments, setIsCheckingDocuments] = useState<boolean>(true);
    const [bankProfile, setBankProfile] = useState<BankProfileData | null>(null);

    // Fetch advisor name if we have an asesor_asignado_id
    useEffect(() => {
        const fetchAdvisorName = async () => {
            // Check if we already have the name in the profile
            if (profile.asesor_asignado_name) {
                setAdvisorName(profile.asesor_asignado_name);
                return;
            }

            // If we have an ID but no name, fetch it
            if (profile.asesor_asignado_id) {
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('first_name, last_name')
                        .eq('id', profile.asesor_asignado_id)
                        .single();

                    if (!error && data) {
                        setAdvisorName(`${data.first_name} ${data.last_name}`);
                    }
                } catch (err) {
                    console.error('Error fetching advisor name:', err);
                }
            }
        };

        fetchAdvisorName();
    }, [profile.asesor_asignado_id, profile.asesor_asignado_name]);

    // Check if documents are uploaded
    useEffect(() => {
        const checkDocuments = async () => {
            if (!application.user_id) {
                setIsCheckingDocuments(false);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from('uploaded_documents')
                    .select('id')
                    .eq('user_id', application.user_id)
                    .limit(1);

                if (!error && data && data.length > 0) {
                    setHasDocuments(true);
                } else {
                    setHasDocuments(false);
                }
            } catch (err) {
                console.error('Error checking documents:', err);
                setHasDocuments(false);
            } finally {
                setIsCheckingDocuments(false);
            }
        };

        checkDocuments();
    }, [application.user_id]);

    // Fetch banking profile data
    useEffect(() => {
        const fetchBankProfile = async () => {
            if (!application.user_id) return;

            try {
                const profile = await BankProfilingService.getUserBankProfile(application.user_id);
                setBankProfile(profile);
            } catch (err) {
                console.error('Error fetching bank profile:', err);
            }
        };

        fetchBankProfile();
    }, [application.user_id]);

    // Format currency - handles both numeric values and formatted strings like "25,000"
    const formatCurrency = (amount: any) => {
        if (!amount) return 'N/A';

        // If it's already a formatted string with commas, convert to number first
        const cleanedAmount = typeof amount === 'string'
            ? amount.replace(/[^0-9]/g, '')
            : amount;

        if (!cleanedAmount || isNaN(Number(cleanedAmount))) return 'N/A';

        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(Number(cleanedAmount));
    };

    // Capitalize names properly with Spanish grammar rules
    const capitalizeName = (name: string | undefined) => {
        if (!name) return 'N/A';

        // List of Spanish prepositions and articles that should stay lowercase
        const lowercaseWords = ['de', 'del', 'la', 'los', 'las', 'y', 'e', 'van', 'von', 'da', 'di'];

        return name
            .trim()
            .toLowerCase()
            .split(' ')
            .map((word, index) => {
                // First word should always be capitalized
                if (index === 0) {
                    return word.charAt(0).toUpperCase() + word.slice(1);
                }
                // Check if word should stay lowercase
                if (lowercaseWords.includes(word)) {
                    return word;
                }
                // Capitalize first letter
                return word.charAt(0).toUpperCase() + word.slice(1);
            })
            .join(' ');
    };

    // Normalize civil status to Spanish
    const normalizeCivilStatus = (status: string | undefined) => {
        if (!status) return 'N/A';
        const statusMap: { [key: string]: string } = {
            'married': 'Casado',
            'single': 'Soltero',
            'divorced': 'Divorciado',
            'widowed': 'Viudo',
            'domestic_partnership': 'Unión Libre',
            'free_union': 'Unión Libre',
            'casado': 'Casado',
            'soltero': 'Soltero',
            'divorciado': 'Divorciado',
            'viudo': 'Viudo',
            'union_libre': 'Unión Libre',
        };
        return statusMap[status.toLowerCase()] || status;
    };

    // Get application status in Spanish
    const getStatusLabel = (status: string | undefined) => {
        const statusMap: { [key: string]: string } = {
            'draft': 'Borrador',
            'submitted': 'Enviada',
            'reviewing': 'En Revisión',
            'pending_docs': 'Documentos Pendientes',
            'approved': 'Aprobada',
            'rejected': 'Rechazada',
            'incomplete': 'Incompleta',
        };
        return statusMap[status || 'submitted'] || 'Enviada';
    };

    // Get spouse name (only if married)
    const getSpouseName = () => {
        const civilStatus = normalizeCivilStatus(profile.civil_status || appData.civil_status);
        if (civilStatus === 'Casado') {
            return appData.spouse_full_name || appData.spouse_name || profile.spouse_name || 'N/A';
        }
        return 'N/A';
    };

    // Get address from profile or appData
    const getCurrentAddress = () => {
        return profile.address || appData.current_address || 'N/A';
    };

    return (
        <div className="p-4 sm:p-6 bg-white printable-offer border rounded-xl shadow-sm">
            <header className="flex justify-between items-start pb-3 border-b-2 border-primary-500">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Solicitud de Financiamiento</h1>
                    <p className="text-xs text-gray-500 font-mono">ID: {application.id?.slice(0, 8)}</p>
                    <p className="text-xs text-gray-500">Fecha: {new Date(application.created_at).toLocaleDateString('es-MX')}</p>
                    <p className="text-xs font-semibold text-primary-600 mt-1">Status: {getStatusLabel(application.status)}</p>
                    {advisorName && (
                        <p className="text-xs text-gray-600 mt-1">Asesor Asignado: {advisorName}</p>
                    )}
                </div>
                <img src="/images/trefalogo.png" alt="TREFA Logo" className="h-10" />
            </header>

            {/* Document Completion Status Warning */}
            {!isCheckingDocuments && (
                <div className={`mt-4 p-3 rounded-lg border-2 flex items-center gap-3 ${
                    hasDocuments
                        ? 'bg-green-50 border-green-500'
                        : 'bg-yellow-50 border-yellow-500'
                }`}>
                    <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                        hasDocuments ? 'bg-green-500' : 'bg-yellow-500'
                    }`}>
                        {hasDocuments ? (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        ) : (
                            <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                        )}
                    </div>
                    <div className="flex-1">
                        <p className={`text-sm font-bold ${
                            hasDocuments ? 'text-green-900' : 'text-yellow-900'
                        }`}>
                            {hasDocuments ? '✓ Documentos Completos' : '⚠ Documentos Incompletos'}
                        </p>
                        <p className={`text-xs ${
                            hasDocuments ? 'text-green-700' : 'text-yellow-700'
                        }`}>
                            {hasDocuments
                                ? 'Esta solicitud cuenta con documentos cargados.'
                                : 'Esta solicitud no tiene documentos cargados. Se requiere solicitar documentos al cliente.'}
                        </p>
                    </div>
                </div>
            )}

            <main className="mt-4 space-y-3">
                {/* Vehicle Information */}
                <SectionHeader title="Vehículo de Interés" />
                <div className="rounded-b-md overflow-hidden">
                    <DataRow label="Auto" value={carInfo._vehicleTitle} />
                    <DataRow label="ID del Auto" value={carInfo._ordenCompra} />
                </div>

                {/* Recommended Bank */}
                {appData.recommended_bank && (
                    <>
                        <SectionHeader title="Banco Recomendado" />
                        <div className="rounded-b-md overflow-hidden">
                            <DataRow label="Institución Financiera" value={appData.recommended_bank} />
                        </div>
                    </>
                )}

                {/* Personal Information */}
                <SectionHeader title="Información Personal Completa" />
                <div className="grid grid-cols-1 md:grid-cols-2 rounded-b-md overflow-hidden">
                    <DataRow label="Nombre(s)" value={capitalizeName(profile.first_name)} />
                    <DataRow label="Apellido Paterno" value={capitalizeName(profile.last_name)} />
                    <DataRow label="Apellido Materno" value={capitalizeName(profile.mother_last_name)} />
                    <DataRow label="Email" value={profile.email} />
                    <DataRow label="Teléfono" value={profile.phone} />
                    <DataRow label="RFC" value={profile.rfc} />
                    <DataRow label="Fecha de Nacimiento" value={profile.birth_date} />
                    <DataRow label="Estado Civil" value={normalizeCivilStatus(profile.civil_status)} />
                    <DataRow label="Nombre del Cónyuge" value={getSpouseName()} />
                    <DataRow label="Género" value={profile.gender} />
                    <DataRow label="Nivel de Estudios" value={profile.education_level || appData.education_level || 'N/A'} />
                    <DataRow label="Número de Dependientes" value={profile.dependents || appData.dependents || appData.number_of_dependents || 'N/A'} />
                </div>

                {/* Current Address */}
                <SectionHeader title="Dirección Actual" />
                <div className="grid grid-cols-1 md:grid-cols-2 rounded-b-md overflow-hidden">
                    <DataRow label="Calle y Número" value={getCurrentAddress()} />
                    <DataRow label="Colonia" value={profile.neighborhood || appData.current_neighborhood} />
                    <DataRow label="Ciudad" value={profile.city || appData.current_city} />
                    <DataRow label="Estado" value={profile.state || appData.current_state} />
                    <DataRow label="Código Postal" value={profile.zip_code || appData.current_zip_code} />
                    <DataRow label="Tipo de Vivienda" value={appData.housing_type} />
                    <DataRow label="Tiempo en Domicilio" value={appData.time_at_address} />
                </div>

                {/* Previous Address (if different) */}
                {appData.previous_address && (
                    <>
                        <SectionHeader title="Dirección Anterior" />
                        <div className="grid grid-cols-1 md:grid-cols-2 rounded-b-md overflow-hidden">
                            <DataRow label="Calle y Número" value={appData.previous_address} />
                            <DataRow label="Colonia" value={appData.previous_neighborhood} />
                            <DataRow label="Ciudad" value={appData.previous_city} />
                            <DataRow label="Estado" value={appData.previous_state} />
                            <DataRow label="Código Postal" value={appData.previous_zip_code} />
                        </div>
                    </>
                )}

                {/* Employment Information */}
                <SectionHeader title="Información Laboral" />
                <div className="grid grid-cols-1 md:grid-cols-2 rounded-b-md overflow-hidden">
                    <DataRow label="Clasificación Fiscal" value={appData.fiscal_classification} />
                    <DataRow label="Empresa" value={appData.company_name} />
                    <DataRow label="Giro de la Empresa" value={appData.company_industry} />
                    <DataRow label="Puesto" value={appData.job_title} />
                    <DataRow label="Antigüedad en el Puesto" value={appData.job_seniority} />
                    <DataRow label="Dirección de la Empresa" value={appData.company_address} />
                    <DataRow label="Teléfono (Empresa)" value={appData.company_phone} />
                    <DataRow label="Ingreso Mensual Neto" value={formatCurrency(appData.net_monthly_income)} />
                </div>

                {/* Banking Profile */}
                {(appData.bank_name || appData.account_type || appData.has_savings_account || appData.has_credit_card) && (
                    <>
                        <SectionHeader title="Perfilación Bancaria" />
                        <div className="grid grid-cols-1 md:grid-cols-2 rounded-b-md overflow-hidden">
                            <DataRow label="Banco Principal" value={appData.bank_name} />
                            <DataRow label="Tipo de Cuenta" value={appData.account_type} />
                            <DataRow label="Cuenta de Ahorro" value={appData.has_savings_account ? 'Sí' : 'No'} />
                            <DataRow label="Tarjeta de Crédito" value={appData.has_credit_card ? 'Sí' : 'No'} />
                            <DataRow label="Institución de Crédito" value={appData.credit_card_bank} />
                            <DataRow label="Límite de Crédito" value={formatCurrency(appData.credit_limit)} />
                        </div>
                    </>
                )}

                {/* References */}
                <SectionHeader title="Referencias Personales" />
                <div className="grid grid-cols-1 md:grid-cols-2 rounded-b-md overflow-hidden">
                    <DataRow label="Referencia Familiar - Nombre" value={appData.family_reference_name} />
                    <DataRow label="Referencia Familiar - Teléfono" value={appData.family_reference_phone} />
                    <DataRow label="Referencia Familiar - Parentesco" value={appData.family_reference_relationship} />
                    <DataRow label="Referencia Personal - Nombre" value={appData.friend_reference_name} />
                    <DataRow label="Referencia Personal - Teléfono" value={appData.friend_reference_phone} />
                    <DataRow label="Referencia Personal - Relación" value={appData.friend_reference_relationship} />
                </div>

                {/* Additional Information */}
                {appData.additional_notes && (
                    <>
                        <SectionHeader title="Información Adicional" />
                        <div className="rounded-b-md overflow-hidden">
                            <div className="py-2 px-3 border-b border-x border-gray-200">
                                <p className="text-xs text-gray-700 whitespace-pre-wrap">{appData.additional_notes}</p>
                            </div>
                        </div>
                    </>
                )}
            </main>

            <footer className="mt-6 pt-3 border-t text-center text-xs text-gray-500">
                <p className="font-semibold text-gray-600">Exclusivamente para uso interno | Autos TREFA | 2025</p>
            </footer>
        </div>
    );
};

export default PrintableApplication;