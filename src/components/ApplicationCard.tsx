'use client';

import React, { useState } from 'react';
import { Clock, CheckCircle, AlertTriangle, FileText, Eye, Edit, X } from 'lucide-react';
import Link from 'next/link';
import PrintableApplication from './PrintableApplication';

type ApplicationStatus = 'draft' | 'submitted' | 'reviewing' | 'pending_docs' | 'approved' | 'rejected' | 'pending' | 'in_progress' | 'complete';

interface Application {
  id: string;
  bank: string;
  type: string;
  status: ApplicationStatus;
  date: string;
  vehicle: string;
}

interface ApplicationCardProps {
  application: Application;
  fullApplication?: any; // Full application data for PrintableApplication
}

const statusInfo = {
  pending: { text: 'Pendiente', icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  in_progress: { text: 'En Progreso', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
  approved: { text: 'Aprobado', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
  rejected: { text: 'Rechazado', icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100' },
  draft: { text: 'Borrador', icon: FileText, color: 'text-gray-600', bg: 'bg-gray-100' },
  submitted: { text: 'Enviada', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
  reviewing: { text: 'En Revisión', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
  pending_docs: { text: 'Faltan Documentos', icon: AlertTriangle, color: 'text-yellow-600', bg: 'bg-yellow-100' },
  complete: { text: 'Completa', icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-100' },
};


const ApplicationCard: React.FC<ApplicationCardProps> = ({ application, fullApplication }) => {
  const [showPrintable, setShowPrintable] = useState(false);
  const { text, icon: Icon, color, bg } = statusInfo[application.status] || statusInfo.pending;

  // Disable edit button if status is reviewing (documents uploaded and under review)
  const canEdit = application.status !== 'reviewing';

  return (
    <>
      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:shadow-md hover:border-primary-300 transition-all duration-200">
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-grow">
            <p className="font-semibold text-gray-800">{application.vehicle}</p>
            <p className="text-sm text-gray-500">{application.type} con {application.bank}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(application.date).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${color} flex-shrink-0`}>
            <Icon className="w-4 h-4 mr-1.5" />
            {text}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => setShowPrintable(true)}
            className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            Ver Solicitud
          </button>

          {canEdit ? (
            <Link
              href={`/escritorio/aplicacion/${application.id}`}
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </Link>
          ) : (
            <button
              disabled
              className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gray-100 text-gray-400 text-sm font-medium rounded-lg cursor-not-allowed opacity-60"
            >
              <Edit className="w-4 h-4 mr-2" />
              Editar
            </button>
          )}
        </div>
      </div>

      {/* PrintableApplication Modal */}
      {showPrintable && fullApplication && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={() => setShowPrintable(false)}>
          <div className="relative bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowPrintable(false)}
              className="sticky top-4 right-4 float-right z-10 p-2 bg-white rounded-full shadow-lg hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5 text-gray-600" />
            </button>
            <div className="p-6">
              <PrintableApplication application={fullApplication} />
            </div>
          </div>
        </div>
      )}
    </>
  );
};
export default ApplicationCard;