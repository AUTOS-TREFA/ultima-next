import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FileText, CheckCircle, Clock, AlertTriangle, ExternalLink, Image, FileIcon } from 'lucide-react';

import { supabase } from '../../supabaseClient';

interface UploadedDocument {
  id: string;
  document_type: string;
  file_name: string;
  file_path: string;
  content_type: string;
  status: string;
  created_at: string;
}

interface UploadedDocumentsCardProps {
  applicationId: string;
  publicUploadToken?: string;
}

const DOCUMENT_LABELS: Record<string, string> = {
  'ine_front': 'INE (Frente)',
  'ine_back': 'INE (Reverso)',
  'proof_address': 'Comprobante de Domicilio',
  'proof_income': 'Comprobante de Ingresos',
  'constancia_fiscal': 'Constancia Fiscal',
};

const UploadedDocumentsCard: React.FC<UploadedDocumentsCardProps> = ({
  applicationId,
  publicUploadToken
}) => {
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [thumbnails, setThumbnails] = useState<Record<string, string>>({});

  useEffect(() => {
    loadDocuments();
  }, [applicationId]);

  const loadDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('uploaded_documents')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setDocuments(data || []);

      // Load thumbnails for images
      if (data) {
        const thumbs: Record<string, string> = {};
        for (const doc of data) {
          if (doc.content_type.startsWith('image/')) {
            const { data: urlData } = await supabase.storage
              .from('application-documents')
              .createSignedUrl(doc.file_path, 3600); // 1 hora

            if (urlData?.signedUrl) {
              thumbs[doc.id] = urlData.signedUrl;
            }
          }
        }
        setThumbnails(thumbs);
      }
    } catch (error) {
      console.error('Error loading documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-3 h-3 text-green-600" />;
      case 'rejected':
        return <AlertTriangle className="w-3 h-3 text-red-600" />;
      case 'reviewing':
      default:
        return <Clock className="w-3 h-3 text-yellow-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Aprobado';
      case 'rejected':
        return 'Rechazado';
      case 'reviewing':
      default:
        return 'En revisión';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'reviewing':
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  if (loading) {
    return (
      <div className="bg-white border border-gray-200 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-500">
          <Clock className="w-4 h-4 animate-spin" />
          <span className="text-sm">Cargando documentos...</span>
        </div>
      </div>
    );
  }

  if (documents.length === 0) {
    // No documents uploaded, show link to dropzone
    if (publicUploadToken) {
      const publicUrl = `${window.location.origin}/documentos/${publicUploadToken}`;
      return (
        <div className="bg-gradient-to-br from-blue-50 to-white border-2 border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FileText className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 text-sm">Documentos Pendientes</h4>
              <p className="text-xs text-gray-600 mt-1">
                Aún no has subido documentos para esta solicitud.
              </p>
              <Link
                to={`/escritorio/seguimiento/${applicationId}`}
                className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-lg transition-colors"
              >
                Cargar documentos ahora &gt;
              </Link>
            </div>
          </div>
        </div>
      );
    }
    return null;
  }

  // Documents uploaded, show thumbnails
  return (
    <div className="bg-gradient-to-br from-green-50 to-white border-2 border-green-200 rounded-lg p-4">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-green-100 rounded-lg">
          <CheckCircle className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h4 className="font-semibold text-gray-900 text-sm">Documentos Seguros</h4>
          <p className="text-xs text-gray-600">
            {documents.length} documento{documents.length > 1 ? 's' : ''} almacenado{documents.length > 1 ? 's' : ''} de forma segura
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {documents.map((doc) => {
          const isImage = doc.content_type.startsWith('image/');
          const isPDF = doc.content_type === 'application/pdf';
          const thumbnail = thumbnails[doc.id];

          return (
            <div
              key={doc.id}
              className="group relative bg-white border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow"
            >
              {/* Thumbnail */}
              <div className="aspect-[4/3] bg-gray-50 flex items-center justify-center relative overflow-hidden">
                {isImage && thumbnail ? (
                  <img
                    src={thumbnail}
                    alt={DOCUMENT_LABELS[doc.document_type] || doc.file_name}
                    className="w-full h-full object-cover"
                  />
                ) : isPDF ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileText className="w-8 h-8 text-red-500" />
                    <span className="text-xs text-gray-500 font-mono">PDF</span>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center gap-2">
                    <FileIcon className="w-8 h-8 text-gray-400" />
                    <span className="text-xs text-gray-500 font-mono">
                      {doc.content_type.split('/')[1]?.toUpperCase()}
                    </span>
                  </div>
                )}

                {/* Status badge */}
                <div className={`absolute top-1 right-1 flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold border ${getStatusColor(doc.status)}`}>
                  {getStatusIcon(doc.status)}
                  <span className="hidden sm:inline">{getStatusText(doc.status)}</span>
                </div>
              </div>

              {/* Document info */}
              <div className="p-2">
                <p className="text-xs font-semibold text-gray-900 truncate">
                  {DOCUMENT_LABELS[doc.document_type] || doc.document_type}
                </p>
                <p className="text-xs text-gray-500 truncate">
                  {doc.file_name}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {publicUploadToken && (
        <div className="mt-3 pt-3 border-t border-green-200">
          <a
            href={`${window.location.origin}/documentos/${publicUploadToken}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-green-700 hover:text-green-800 font-semibold"
          >
            <ExternalLink className="w-4 h-4" />
            Subir más documentos
          </a>
        </div>
      )}
    </div>
  );
};

export default UploadedDocumentsCard;
