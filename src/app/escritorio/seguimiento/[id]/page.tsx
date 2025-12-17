'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Loader2, FileText, Download, Eye, X, Car, Copy, Check, QrCode, ArrowLeft, CheckCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import PrintableApplication from '@/components/PrintableApplication';
import { APPLICATION_STATUS, type ApplicationStatus } from '@/constants/applicationStatus';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { DEFAULT_PLACEHOLDER_IMAGE } from '@/utils/constants';
import { supabase } from '@/lib/supabase/client';

const BUCKET_NAME = 'application-documents';

interface ApplicationData {
  id: string;
  status: ApplicationStatus;
  created_at: string;
  car_info: any;
  personal_info_snapshot: any;
  selected_banks: string[];
  application_data: any;
  public_upload_token: string | null;
}

export default function SeguimientoDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user, profile } = useAuth();
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPrintable, setShowPrintable] = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [uploadLinkVisible, setUploadLinkVisible] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);

  useEffect(() => {
    const loadApplication = async () => {
      // Validate id is a valid UUID (not "undefined" or "null" strings)
      if (!user || !id || id === 'undefined' || id === 'null') {
        if (id === 'undefined' || id === 'null') {
          setError('ID de solicitud inválido');
          setLoading(false);
        }
        return;
      }

      try {
        setLoading(true);

        // First, try to get the application without user_id filter
        const { data: app, error: appError } = await supabase
          .from('financing_applications')
          .select('*')
          .eq('id', id)
          .maybeSingle();

        // If application doesn't exist, show error
        if (!app) {
          setError('Solicitud no encontrada');
          setLoading(false);
          return;
        }

        if (appError) {
          console.error('Error fetching application:', appError);
          setError('Error al cargar la solicitud');
          setLoading(false);
          return;
        }

        // Check permissions: owner, assigned sales advisor, or admin
        const isOwner = app.user_id === user.id;
        const isAdmin = profile?.role === 'admin';

        // For sales users, check if they are assigned to this lead
        let isSalesAdvisor = false;
        if (profile?.role === 'sales') {
          // Get lead profile to check assigned advisor
          const { data: leadProfile } = await supabase
            .from('profiles')
            .select('asesor_asignado_id')
            .eq('id', app.user_id)
            .single();

          isSalesAdvisor = leadProfile?.asesor_asignado_id === user.id;
        }

        // Deny access if user is not owner, assigned sales advisor, or admin
        if (!isOwner && !isSalesAdvisor && !isAdmin) {
          setError('No tienes permiso para ver esta solicitud');
          setLoading(false);
          return;
        }

        setApplication(app);

        // Load documents for this application
        const { data: docs, error: docsError } = await supabase
          .from('uploaded_documents')
          .select('*')
          .eq('application_id', id)
          .order('created_at', { ascending: false });

        if (docsError) {
          console.error('Error loading documents:', docsError);
        } else {
          setDocuments(docs || []);
        }
      } catch (err) {
        console.error('Error loading application:', err);
        setError('Error al cargar la solicitud');
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [id, user, profile]);

  const getStatusConfig = (status: string) => {
    const configs: Record<string, { text: string; color: string; bgColor: string }> = {
      [APPLICATION_STATUS.DRAFT]: { text: 'Borrador', color: 'text-gray-700', bgColor: 'bg-gray-100' },
      [APPLICATION_STATUS.FALTAN_DOCUMENTOS]: { text: 'Faltan Documentos', color: 'text-yellow-900', bgColor: 'bg-yellow-400' },
      [APPLICATION_STATUS.COMPLETA]: { text: 'Completa', color: 'text-green-700', bgColor: 'bg-green-100' },
      [APPLICATION_STATUS.EN_REVISION]: { text: 'En Revisión', color: 'text-indigo-700', bgColor: 'bg-indigo-100' },
      [APPLICATION_STATUS.APROBADA]: { text: 'Aprobada', color: 'text-green-700', bgColor: 'bg-green-100' },
      [APPLICATION_STATUS.RECHAZADA]: { text: 'Rechazada', color: 'text-red-700', bgColor: 'bg-red-100' },
    };
    return configs[status] || configs[APPLICATION_STATUS.DRAFT];
  };

  const copyUploadLink = async () => {
    if (!application?.public_upload_token) return;

    const link = `${window.location.origin}/documentos/${application.public_upload_token}`;
    await navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 0 }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-6">
        <p className="text-red-600 mb-4">{error || 'Solicitud no encontrada'}</p>
        <Button onClick={() => router.push('/escritorio/seguimiento')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Volver a Seguimiento
        </Button>
      </div>
    );
  }

  const statusConfig = getStatusConfig(application.status);
  const carInfo = application.car_info || {};
  const appData = application.application_data || {};
  const uploadLink = application.public_upload_token
    ? `${window.location.origin}/documentos/${application.public_upload_token}`
    : null;

  return (
    <div className="-m-4 sm:-m-6 min-h-screen bg-gray-50 no-print overflow-x-hidden">
      {/* Animated Status Bar - Full Width */}
      <div className={`${statusConfig.bgColor} ${statusConfig.color} h-[60px] flex items-center overflow-hidden sticky top-0 z-50 border-b-2 ${application.status === APPLICATION_STATUS.FALTAN_DOCUMENTOS ? 'border-yellow-600' : 'border-transparent'} mb-4 sm:mb-6`}>
        <div className="animate-marquee whitespace-nowrap flex items-center">
          <span className="text-sm sm:text-base lg:text-lg font-bold px-4 sm:px-8">
            {statusConfig.text} • Solicitud #{application.id.substring(0, 8)} • {statusConfig.text} • Solicitud #{application.id.substring(0, 8)} • {statusConfig.text} • Solicitud #{application.id.substring(0, 8)} • {statusConfig.text} • Solicitud #{application.id.substring(0, 8)}
          </span>
        </div>
      </div>

      <div className="w-full px-4 sm:px-6 max-w-full">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Main Content - Printable Application */}
          <div className="lg:col-span-3 space-y-4">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => router.push('/escritorio/seguimiento')}
                className="text-gray-600 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Volver
              </Button>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPrintable(!showPrintable)}
                  className="border-gray-300 hover:bg-gray-100"
                >
                  {showPrintable ? <X className="w-4 h-4 mr-1" /> : <Eye className="w-4 h-4 mr-1" />}
                  {showPrintable ? 'Ocultar' : 'Ver Solicitud'}
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handlePrint}
                  className="bg-primary-600 hover:bg-primary-700 text-white"
                >
                  <Download className="w-4 h-4 mr-1" />
                  Descargar PDF
                </Button>
              </div>
            </div>

            {showPrintable && (
              <div className="bg-white rounded-lg border border-gray-200 max-h-[calc(100vh-200px)] overflow-y-auto">
                <PrintableApplication application={application} />
              </div>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4 lg:sticky lg:top-24 lg:self-start">
            {/* Document Upload Dropzone - Apple Style */}
            {application.public_upload_token && (
              <Card className="border-2 border-dashed border-gray-300 hover:border-primary-500 transition-all duration-300">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    {/* Pulsating Animation Circle */}
                    <div className="relative mx-auto w-24 h-24">
                      <div className="absolute inset-0 bg-primary-500 rounded-full animate-ping opacity-20"></div>
                      <div className="absolute inset-0 bg-primary-500 rounded-full animate-pulse opacity-30"></div>
                      <div className="relative w-24 h-24 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center shadow-lg">
                        <FileText className="w-10 h-10 text-white" />
                      </div>
                    </div>

                    <div>
                      <h3 className="font-bold text-gray-900 mb-1">Sube tus Documentos</h3>
                      <p className="text-xs text-gray-600">
                        Arrastra archivos aquí o usa el link público
                      </p>
                    </div>

                    <div className="space-y-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setUploadLinkVisible(!uploadLinkVisible)}
                        className="w-full border-gray-300 hover:bg-gray-100"
                      >
                        <QrCode className="w-4 h-4 mr-2" />
                        {uploadLinkVisible ? 'Ocultar Link' : 'Mostrar Link Público'}
                      </Button>

                      {uploadLinkVisible && uploadLink && (
                        <div className="space-y-2 animate-in fade-in duration-300">
                          <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                            <p className="text-xs text-gray-600 break-all font-mono">
                              {uploadLink}
                            </p>
                          </div>
                          <Button
                            variant="default"
                            size="sm"
                            onClick={copyUploadLink}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white"
                          >
                            {copySuccess ? (
                              <>
                                <Check className="w-4 h-4 mr-2" />
                                ¡Copiado!
                              </>
                            ) : (
                              <>
                                <Copy className="w-4 h-4 mr-2" />
                                Copiar Link
                              </>
                            )}
                          </Button>
                          <p className="text-xs text-gray-500 italic">
                            Esta liga solamente es para la carga de documentos. Puedes compartirla con tu asesor o usarla cuando quieras para cargar documentos.
                          </p>
                        </div>
                      )}

                      <Link
                        href={`/documentos/${application.public_upload_token}`}
                        target="_blank"
                        className="block"
                      >
                        <Button variant="default" size="sm" className="w-full bg-primary-600 hover:bg-primary-700 text-white">
                          Cargar Documentos
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Vehicle Card */}
            {carInfo._vehicleTitle && (
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Car className="w-4 h-4 text-primary-600" />
                    <h3 className="font-bold text-sm text-gray-900">Tu Vehículo</h3>
                  </div>
                  <img
                    src={carInfo._featureImage || DEFAULT_PLACEHOLDER_IMAGE}
                    alt={carInfo._vehicleTitle}
                    className="w-full h-32 object-cover rounded-lg mb-3"
                  />
                  <h4 className="font-bold text-gray-900 text-sm mb-2">{carInfo._vehicleTitle}</h4>
                  <div className="space-y-1 text-xs text-gray-600">
                    <div className="flex justify-between">
                      <span>Precio:</span>
                      <span className="font-semibold text-gray-900">
                        {carInfo.precio ? formatCurrency(carInfo.precio) : 'N/A'}
                      </span>
                    </div>
                    {appData.down_payment_amount && (
                      <div className="flex justify-between">
                        <span>Enganche:</span>
                        <span className="font-semibold text-gray-900">
                          {formatCurrency(appData.down_payment_amount)}
                        </span>
                      </div>
                    )}
                    {appData.loan_term_months && (
                      <div className="flex justify-between">
                        <span>Plazo:</span>
                        <span className="font-semibold text-gray-900">
                          {appData.loan_term_months} meses
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Action Buttons */}
            <Card>
              <CardContent className="p-4 space-y-3">
                <a
                  href={`https://wa.me/5218187049079?text=Hola,%20quisiera%20dar%20seguimiento%20a%20mi%20solicitud%20${application.id.substring(0, 8)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block"
                >
                  <Button className="w-full bg-green-600 hover:bg-green-700 !text-white py-6">
                    Contactar por WhatsApp
                  </Button>
                </a>
                <Link href={`/escritorio/aplicacion/${application.id}`}>
                  <Button variant="outline" className="w-full border-gray-300 hover:bg-gray-100">
                    Editar Solicitud
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Documents Viewer */}
            {documents.length > 0 && (
              <Card>
                <CardContent className="p-4">
                  <DocumentViewer documents={documents} />
                </CardContent>
              </Card>
            )}

            {/* Survey Benefits Box */}
            <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-bold text-sm text-blue-900 mb-1">
                      ¿Ya completaste la encuesta?
                    </h4>
                    <p className="text-xs text-blue-800 mb-2">
                      Responde nuestra breve encuesta y recibe un cupón de descuento exclusivo válido para tu próxima compra.
                    </p>
                    <Link href="/escritorio/encuesta">
                      <Button variant="outline" size="sm" className="w-full border-blue-400 text-blue-700 hover:bg-blue-100 hover:border-blue-500">
                        Ir a Encuesta
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee {
          animation: marquee 20s linear infinite;
        }
        @media print {
          .no-print {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// Document Viewer Component
const DocumentViewer: React.FC<{ documents: any[] }> = ({ documents }) => {
  const [viewingDoc, setViewingDoc] = useState<any | null>(null);
  const [documentsWithUrls, setDocumentsWithUrls] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDocumentUrls = async () => {
      setLoading(true);
      const docsWithSignedUrls = await Promise.all(
        documents.map(async (doc) => {
          try {
            const { data, error } = await supabase.storage
              .from(BUCKET_NAME)
              .createSignedUrl(doc.file_path, 3600); // 1 hour expiry

            if (error) {
              console.error(`Error generating signed URL for ${doc.file_path}:`, error);
              return { ...doc, url: null };
            }

            return { ...doc, url: data.signedUrl };
          } catch (error) {
            console.error('Error loading document URL:', error);
            return { ...doc, url: null };
          }
        })
      );
      setDocumentsWithUrls(docsWithSignedUrls);
      setLoading(false);
    };

    if (documents.length > 0) {
      loadDocumentUrls();
    } else {
      setDocumentsWithUrls([]);
      setLoading(false);
    }
  }, [documents]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-200';
      case 'reviewing': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const downloadDocument = async (doc: any) => {
    try {
      if (!doc.url) {
        alert('No se pudo generar la URL del documento');
        return;
      }

      const response = await fetch(doc.url);
      if (!response.ok) {
        throw new Error('Error al descargar el archivo');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = doc.file_name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading document:', error);
      alert('Error al descargar el documento');
    }
  };

  return (
    <div>
      <h3 className="font-bold text-sm text-gray-900 mb-3">Documentos Cargados ({documents.length})</h3>
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="w-6 h-6 animate-spin text-primary-600" />
          <span className="ml-2 text-sm text-gray-600">Cargando documentos...</span>
        </div>
      ) : (
        <div className="space-y-2 max-h-80 overflow-y-auto">
          {documentsWithUrls.length > 0 ? (
            documentsWithUrls.map((doc) => (
              <div key={doc.id} className="p-3 border rounded-lg hover:bg-gray-50">
                <div className="flex items-center gap-3 mb-2">
                  <FileText className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  <div className="flex-grow min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{doc.file_name}</p>
                    <p className="text-xs text-gray-500">
                      {doc.document_type} - {new Date(doc.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full border ${getStatusColor(doc.status)}`}>
                    {doc.status === 'approved'
                      ? 'Aprobado'
                      : doc.status === 'rejected'
                      ? 'Rechazado'
                      : doc.status === 'reviewing'
                      ? 'En Revisión'
                      : 'Pendiente'}
                  </span>
                  <div className="flex-grow"></div>
                  <button
                    onClick={() => setViewingDoc(doc)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="Ver documento"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => downloadDocument(doc)}
                    className="p-2 text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                    title="Descargar documento"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-gray-500 text-center py-8">No hay documentos cargados.</p>
          )}
        </div>
      )}

      {viewingDoc && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={() => setViewingDoc(null)}>
          <div className="relative bg-white w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-xl flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="p-4 border-b flex justify-between items-center flex-shrink-0">
              <div>
                <h3 className="text-lg font-bold">{viewingDoc.file_name}</h3>
                <p className="text-sm text-gray-500">{viewingDoc.document_type}</p>
              </div>
              <button onClick={() => setViewingDoc(null)} className="p-2 rounded-full hover:bg-gray-100">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 p-4 bg-gray-100">
              {viewingDoc.content_type?.startsWith('image/') ? (
                <img src={viewingDoc.url} alt={viewingDoc.file_name} className="max-w-full h-auto mx-auto" />
              ) : viewingDoc.content_type === 'application/pdf' ? (
                <iframe src={viewingDoc.url} className="w-full h-full min-h-[600px]" title={viewingDoc.file_name} />
              ) : (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">Vista previa no disponible para este tipo de archivo</p>
                  <button
                    onClick={() => downloadDocument(viewingDoc)}
                    className="mt-4 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700"
                  >
                    Descargar Archivo
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
