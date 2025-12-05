'use client';

import React from 'react';
import Link from 'next/link';
import { User, Building2, ArrowRight, Plus, FileText } from 'lucide-react';
import type { Profile } from '../types/types';

interface ApplicationStatusGuideProps {
  profile: Profile | null;
  isBankProfileComplete: boolean;
  activeApplication: any | null; // Simplified type for now
}

const ApplicationStatusGuide: React.FC<ApplicationStatusGuideProps> = ({ profile, isBankProfileComplete, activeApplication }) => {
    const requiredFields: (keyof Profile)[] = ['first_name', 'last_name', 'mother_last_name', 'phone', 'birth_date', 'homoclave', 'fiscal_situation', 'civil_status', 'address', 'city', 'state', 'zip_code', 'rfc'];
    const isProfileComplete = requiredFields.every(field => profile?.[field] && String(profile[field]).trim() !== '');

    // 1. Profile Incomplete
    if (!isProfileComplete) {
        return (
            <StatusCard
                Icon={User}
                title="Paso 1: Completa tu Perfil"
                description="Necesitamos tu información personal para poder preparar tus solicitudes."
                linkTo="/escritorio/profile"
                linkText="Ir a Mi Perfil"
            />
        );
    }

    // 2. Bank Profile Incomplete
    if (!isBankProfileComplete) {
        return (
            <StatusCard
                Icon={Building2}
                title="Paso 2: Perfilamiento Bancario"
                description="¡Excelente! Ahora completa tu perfil bancario para encontrar la mejor opción de crédito para ti."
                linkTo="/escritorio/perfilacion-bancaria"
                linkText="Comenzar Perfilación"
            />
        );
    }

    // 3. Has an Active Application
    if (activeApplication) {
        return (
            <StatusCard
                Icon={FileText}
                title="Tu Solicitud está en Proceso"
                description={`Estado actual: ${activeApplication.status}. Un asesor se pondrá en contacto contigo.`}
                linkTo={`/escritorio/seguimiento/${activeApplication.id}`}
                linkText="Ver Detalles de la Solicitud"
            />
        );
    }

    // 4. Ready to Start a New Application
    return (
        <StatusCard
            Icon={Plus}
            title="Estás listo para comenzar"
            description="Tu perfil está completo. Inicia una nueva solicitud de financiamiento cuando quieras."
            linkTo="/escritorio/aplicacion"
            linkText="Iniciar Nueva Solicitud"
        />
    );
};

const StatusCard: React.FC<{ Icon: React.ElementType, title: string, description: string, linkTo: string, linkText: string }> = 
({ Icon, title, description, linkTo, linkText }) => (
    <div className="bg-gradient-to-r from-primary-50 to-orange-50 rounded-xl border-2 border-primary-200 p-6 flex flex-col sm:flex-row items-center gap-6">
        <div className="flex-shrink-0 w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center">
            <Icon className="w-8 h-8" />
        </div>
        <div className="flex-grow text-center sm:text-left">
            <h3 className="text-lg font-bold text-primary-900">{title}</h3>
            <p className="text-sm text-primary-800 mt-1">{description}</p>
        </div>
        <Link
            href={linkTo}
            className="inline-flex items-center justify-center px-5 py-2.5 bg-primary-600 text-white rounded-lg text-sm font-semibold hover:bg-primary-700 transition-colors shadow-md flex-shrink-0 mt-4 sm:mt-0"
        >
            {linkText} <ArrowRight className="w-4 h-4 ml-2" />
        </Link>
    </div>
);

export default ApplicationStatusGuide;
