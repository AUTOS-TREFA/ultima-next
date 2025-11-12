import React from 'react';
import ApplicationAnalyticsPanel from '../components/ApplicationAnalyticsPanel';

const ApplicationAnalyticsPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">Análisis de Solicitudes</h1>
                    <p className="text-gray-600 mt-2">
                        Análisis detallado de solicitudes de financiamiento por estado y asesor
                    </p>
                </div>
                <ApplicationAnalyticsPanel />
            </div>
        </div>
    );
};

export default ApplicationAnalyticsPage;
