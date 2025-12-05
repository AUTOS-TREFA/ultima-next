import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { supabase } from '../../supabaseClient';
import { BankProfilingService } from '../services/BankProfilingService';
import type { BankProfileData } from '../types/types';
import { getStatusConfig } from '../constants/applicationStatus';

const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
    <h3 className="text-sm font-bold uppercase tracking-wider text-white bg-trefa-blue p-2 rounded-t-md mt-3">{title}</h3>
);

const DataRow: React.FC<{ label: string, value: any }> = ({ label, value }) => (
    <div className="flex justify-between py-1.5 px-3 border-b border-x border-gray-200">
        <p className="text-xs text-gray-600">{label}:</p>
        <p className="text-xs font-semibold text-gray-800 text-right">{value || 'N/A'}</p>
    </div>
);

// Los 4 documentos requeridos según el sistema
const REQUIRED_DOCUMENTS = [
    'INE Front',
    'INE Back',
    'Comprobante Domicilio',
    'Comprobante Ingresos'
];

const PrintableApplication: React.FC<{ application: any }> = ({ application }) => {
    const profile = application.personal_info_snapshot || {};
    const appData = application.application_data || {};
    const carInfo = application.car_info || {};
    const [advisorName, setAdvisorName] = useState<string | null>(null);
    const [hasAllDocuments, setHasAllDocuments] = useState<boolean>(false);
    const [uploadedDocumentTypes, setUploadedDocumentTypes] = useState<string[]>([]);
    const [isCheckingDocuments, setIsCheckingDocuments] = useState<boolean>(true);
    const [bankProfile, setBankProfile] = useState<BankProfileData | null>(null);
    const [refreshKey, setRefreshKey] = useState<number>(0);

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

    // Check if ALL 4 required documents are uploaded FOR THIS SPECIFIC APPLICATION
    useEffect(() => {
        const checkDocuments = async () => {
            if (!application.id) {
                setIsCheckingDocuments(false);
                return;
            }

            setIsCheckingDocuments(true);

            try {
                console.log('[PrintableApplication] Checking documents for application:', application.id);

                // Get all documents for this application
                const { data, error } = await supabase
                    .from('uploaded_documents')
                    .select('document_type')
                    .eq('application_id', application.id);

                if (error) {
                    console.error('[PrintableApplication] Error fetching documents:', error);
                    setHasAllDocuments(false);
                    setUploadedDocumentTypes([]);
                } else if (data) {
                    // Extract unique document types
                    const uploadedTypes = [...new Set(data.map(doc => doc.document_type))];
                    setUploadedDocumentTypes(uploadedTypes);

                    // Check if all 4 required documents are present
                    const hasAll = REQUIRED_DOCUMENTS.every(reqDoc => uploadedTypes.includes(reqDoc));
                    setHasAllDocuments(hasAll);

                    console.log('[PrintableApplication] Documents check result:', {
                        uploadedTypes,
                        requiredDocs: REQUIRED_DOCUMENTS,
                        hasAllDocuments: hasAll
                    });
                } else {
                    setHasAllDocuments(false);
                    setUploadedDocumentTypes([]);
                }
            } catch (err) {
                console.error('[PrintableApplication] Error checking documents:', err);
                setHasAllDocuments(false);
                setUploadedDocumentTypes([]);
            } finally {
                setIsCheckingDocuments(false);
            }
        };

        checkDocuments();
    }, [application.id, refreshKey]);

    // Set up polling interval in a separate useEffect to avoid creating multiple intervals
    useEffect(() => {
        console.log('[PrintableApplication] Setting up auto-refresh polling (every 5 seconds)');
        const pollInterval = setInterval(() => {
            console.log('[PrintableApplication] Auto-refreshing document status...');
            setRefreshKey(prev => prev + 1);
        }, 5000);

        // Cleanup interval on unmount
        return () => {
            console.log('[PrintableApplication] Clearing auto-refresh polling');
            clearInterval(pollInterval);
        };
    }, []);

    // Fetch banking profile data
    useEffect(() => {
        const fetchBankProfile = async () => {
            if (!application.user_id) {
                console.log('[PrintableApplication] No user_id provided');
                return;
            }

            try {
                console.log('[PrintableApplication] Fetching bank profile for user:', application.user_id);
                const profile = await BankProfilingService.getUserBankProfile(application.user_id);
                console.log('[PrintableApplication] Bank profile fetched:', profile);
                setBankProfile(profile);
            } catch (err) {
                console.error('[PrintableApplication] Error fetching bank profile:', err);
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

    // Get missing documents list
    const getMissingDocuments = () => {
        return REQUIRED_DOCUMENTS.filter(reqDoc => !uploadedDocumentTypes.includes(reqDoc));
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
                    <p className="text-xs font-semibold text-primary-600 mt-1">
                        Status: {getStatusConfig(application.status || 'draft').label}
                    </p>
                    {advisorName && (
                        <p className="text-xs text-gray-600 mt-1">Asesor Asignado: {advisorName}</p>
                    )}
                </div>
                <div className="flex flex-col items-end gap-2">
                    <img src="/images/trefalogo.png" alt="TREFA Logo" className="h-10" />
                </div>
            </header>

            {/* Document Completion Status Warning */}
            {!isCheckingDocuments && (
                <div className={`mt-4 p-3 rounded-lg border-2 ${
                    hasAllDocuments
                        ? 'bg-green-50 border-green-500'
                        : 'bg-yellow-50 border-yellow-500'
                }`}>
                    <div className="flex items-start gap-3">
                        <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                            hasAllDocuments ? 'bg-green-500' : 'bg-yellow-500'
                        }`}>
                            {hasAllDocuments ? (
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
                            <div className="flex items-center justify-between mb-1">
                                <p className={`text-sm font-bold ${
                                    hasAllDocuments ? 'text-green-900' : 'text-yellow-900'
                                }`}>
                                    {hasAllDocuments ? '✓ Documentos Completos' : '⚠ Documentos Incompletos'}
                                </p>
                                <button
                                    onClick={() => {
                                        console.log('[PrintableApplication] Manual refresh triggered');
                                        setRefreshKey(prev => prev + 1);
                                    }}
                                    className="flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded hover:bg-white/50 transition-colors"
                                    title="Actualizar estado de documentos"
                                >
                                    <RefreshCw className="w-3 h-3" />
                                    <span className="hidden sm:inline">Actualizar</span>
                                </button>
                            </div>
                            <p className={`text-xs ${
                                hasAllDocuments ? 'text-green-700' : 'text-yellow-700'
                            }`}>
                                {hasAllDocuments
                                    ? 'Esta solicitud cuenta con todos los documentos requeridos (4/4).'
                                    : `Faltan ${getMissingDocuments().length} de 4 documentos requeridos.`}
                            </p>
                            {!hasAllDocuments && uploadedDocumentTypes.length > 0 && (
                                <div className="mt-2 text-xs">
                                    <p className="font-semibold text-yellow-800 mb-1">Documentos faltantes:</p>
                                    <ul className="list-disc list-inside text-yellow-700 space-y-0.5">
                                        {getMissingDocuments().map(doc => (
                                            <li key={doc}>{doc}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}
                            {uploadedDocumentTypes.length === 0 && (
                                <p className="mt-1 text-xs text-yellow-700">
                                    No se han cargado documentos para esta solicitud. Se requiere solicitar al cliente.
                                </p>
                            )}
                            <p className="mt-2 text-xs text-gray-500 italic">
                                Se actualiza automáticamente cada 5 segundos
                            </p>
                        </div>
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

                {/* Financing Preferences */}
                {(appData.loan_term_months || appData.down_payment_amount || appData.estimated_monthly_payment || bankProfile?.banco_recomendado) && (
                    <>
                        <SectionHeader title="Preferencias de Financiamiento" />
                        <div className="grid grid-cols-1 md:grid-cols-2 rounded-b-md overflow-hidden">
                            {bankProfile?.banco_recomendado && (
                                <DataRow label="Banco Recomendado" value={bankProfile.banco_recomendado} />
                            )}
                            {bankProfile?.banco_segunda_opcion && (
                                <DataRow label="Banco Segunda Opción" value={bankProfile.banco_segunda_opcion} />
                            )}
                            <DataRow label="Plazo del Crédito" value={appData.loan_term_months ? `${appData.loan_term_months} meses` : 'N/A'} />
                            <DataRow label="Enganche" value={formatCurrency(appData.down_payment_amount)} />
                            <DataRow label="Mensualidad Estimada" value={formatCurrency(appData.estimated_monthly_payment)} />
                        </div>
                        <div className="py-2 px-3 border-b border-x border-gray-200 bg-yellow-50">
                            <p className="text-xs text-gray-700">*Cálculo estimado con tasa de interés promedio del 15% anual. La tasa final será determinada por el banco.</p>
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
                    <DataRow label="Compañía Telefónica" value={profile.cellphone_company} />
                    <DataRow label="RFC" value={profile.rfc} />
                    <DataRow label="Fecha de Nacimiento" value={profile.birth_date} />
                    <DataRow label="Estado Civil" value={normalizeCivilStatus(profile.civil_status)} />
                    <DataRow label="Nombre del Cónyuge" value={capitalizeName(getSpouseName())} />
                    <DataRow label="Género" value={profile.gender} />
                    <DataRow label="Nivel de Estudios" value={appData.grado_de_estudios || profile.education_level || appData.education_level || 'N/A'} />
                    <DataRow label="Número de Dependientes" value={appData.dependents || profile.dependents || appData.number_of_dependents || 'N/A'} />
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
                    <DataRow label="Ingreso Mensual Bruto" value={formatCurrency(appData.net_monthly_income)} />
                </div>

                {/* Banking Profile - From Perfilación Bancaria */}
                {bankProfile && bankProfile.respuestas && (
                    <>
                        <SectionHeader title="Perfilación Bancaria" />
                        <div className="grid grid-cols-1 md:grid-cols-2 rounded-b-md overflow-hidden">
                            <DataRow label="Antigüedad en el Empleo" value={bankProfile.respuestas?.trabajo_tiempo || 'N/A'} />
                            <DataRow label="Banco de Nómina" value={bankProfile.respuestas?.banco_nomina || 'N/A'} />
                            <DataRow label="Historial Crediticio" value={bankProfile.respuestas?.historial_crediticio || 'N/A'} />
                            <DataRow label="Créditos Vigentes" value={bankProfile.respuestas?.creditos_vigentes || 'N/A'} />
                            <DataRow label="Atrasos en Últimos 12 Meses" value={bankProfile.respuestas?.atrasos_12_meses || 'N/A'} />
                            <DataRow label="Enganche Planeado" value={bankProfile.respuestas?.enganche || 'N/A'} />
                            <DataRow label="Prioridad en Financiamiento" value={bankProfile.respuestas?.prioridad_financiamiento || 'N/A'} />
                            <DataRow label="Ingresos Mensuales Comprobables" value={bankProfile.respuestas?.ingreso_mensual || 'N/A'} />
                        </div>
                    </>
                )}

                {/* References */}
                <SectionHeader title="Referencias Personales" />
                <div className="rounded-b-md overflow-hidden space-y-3">
                    {/* Family Reference */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-2 border-x border-t border-gray-200">Referencia Familiar</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3">
                            <DataRow label="Nombre" value={appData.family_reference_name} />
                            <DataRow label="Teléfono" value={appData.family_reference_phone} />
                            <DataRow label="Parentesco" value={appData.parentesco || appData.family_reference_relationship} />
                        </div>
                    </div>
                    {/* Personal Reference */}
                    <div>
                        <h4 className="text-xs font-bold text-gray-700 bg-gray-100 px-3 py-2 border-x border-t border-gray-200">Referencia Personal</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3">
                            <DataRow label="Nombre" value={appData.friend_reference_name} />
                            <DataRow label="Teléfono" value={appData.friend_reference_phone} />
                            <DataRow label="Relación" value={appData.friend_reference_relationship} />
                        </div>
                    </div>
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