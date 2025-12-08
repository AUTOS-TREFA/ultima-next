'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '../context/AuthContext';
import { ApplicationService } from '../services/ApplicationService';
import { conversionTracking } from '../services/ConversionTrackingService';
import { createBrowserSupabaseClient } from '@/lib/supabase/client';
import {
  CheckCircle,
  FileText,
  Upload,
  ExternalLink,
  Home,
  Loader2,
  Copy,
  Check,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import PublicUploadLinkCard from '../components/PublicUploadLinkCard';

interface ApplicationData {
  id: string;
  public_upload_token: string | null;
  car_info: any;
  status: string;
}

const ApplicationConfirmationPage: React.FC = () => {
  const params = useParams();
  const id = params?.id as string;
  const router = useRouter();
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [application, setApplication] = useState<ApplicationData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [uploadDocumentsNow, setUploadDocumentsNow] = useState(false);

  // Only show this page if coming from first submit
  const isFirstSubmit = searchParams?.get('firstSubmit') === 'true';

  useEffect(() => {
    // Redirect to dashboard if not first submit
    if (!isFirstSubmit) {
      router.replace('/escritorio');
      return;
    }

    const loadApplication = async () => {
      if (!user?.id || !id) {
        setError('No se pudo cargar la información de tu solicitud');
        setLoading(false);
        return;
      }

      try {
        const app = await ApplicationService.getApplicationById(user.id, id);
        if (!app) {
          setError('No se encontró la solicitud');
          setLoading(false);
          return;
        }
        setApplication(app);

        try {
          const supabase = createBrowserSupabaseClient();

          // Verificar si ya se disparó el evento de confirmación para esta aplicación
          const { data: shouldDispatch, error: checkError } = await supabase
            .rpc('register_confirmation_event', {
              p_application_id: id,
              p_event_type: 'SolicitudCompleta'
            });

          if (checkError) {
            throw checkError;
          }

          // Solo disparar eventos si es la primera vez que se visita la página de confirmación
          if (shouldDispatch) {
            // Fire SolicitudCompleta event (Spanish tracking event)
            const vehicleInfo = app.car_info;

            // Track SolicitudCompleta - this is shown to the user that their application is complete
            await conversionTracking.track('SolicitudCompleta', 'Solicitud Completa', {
              applicationId: id,
              vehicleId: vehicleInfo?._ordenCompra,
              vehicleName: vehicleInfo?._vehicleTitle || undefined,
              vehiclePrice: vehicleInfo?._precioNumerico || 0,
              userId: user.id,
              page: '/escritorio/aplicacion/confirmacion',
              content_name: 'Solicitud Completa',
              status: 'completed'
            });

            // Also track LeadComplete if user came from landing page
            // Check if user has ConversionLandingPage event
            const { data: landingPageEvent } = await supabase
              .from('tracking_events')
              .select('id')
              .eq('user_id', user.id)
              .eq('event_type', 'ConversionLandingPage')
              .limit(1)
              .maybeSingle();

            if (landingPageEvent) {
              await conversionTracking.track('LeadComplete', 'Lead Complete', {
                applicationId: id,
                vehicleId: vehicleInfo?._ordenCompra,
                vehicleName: vehicleInfo?._vehicleTitle || undefined,
                vehiclePrice: vehicleInfo?._precioNumerico || 0,
                userId: user.id,
                page: '/escritorio/aplicacion/confirmacion',
                value: vehicleInfo?._precioNumerico || 0,
                currency: 'MXN',
                content_name: 'Lead Complete',
                status: 'completed',
                from_landing_page: true
              });
              console.log('[ApplicationConfirmation] LeadComplete disparado (usuario desde landing page)');
            }

            console.log('[ApplicationConfirmation] Eventos disparados para aplicación:', id);
          } else {
            console.log('[ApplicationConfirmation] Eventos ya fueron disparados previamente para aplicación:', id);
          }
        } catch (trackingError) {
          console.error('[ApplicationConfirmation] Error during tracking or RPC call, not blocking UI:', trackingError);
        }

      } catch (err) {
        console.error('Error loading application:', err);
        setError('Error al cargar tu solicitud');
      } finally {
        setLoading(false);
      }
    };

    loadApplication();
  }, [id, user?.id, isFirstSubmit, router]);

  const publicUrl = application?.public_upload_token
    ? `https://trefa.mx/documentos/${application.public_upload_token}`
    : null;

  const handleCopyLink = () => {
    if (publicUrl) {
      navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error || !application) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error</h2>
            <p className="text-gray-600 mb-4">{error || 'No se pudo cargar la información'}</p>
            <Button onClick={() => router.push('/escritorio')} className="w-full">
              Volver al Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const vehicleInfo = application.car_info;

  return (
    <div className="min-h-screen bg-gray-50 py-3 sm:py-6 md:py-8 px-2 sm:px-4 md:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6 md:p-8 mb-3 sm:mb-4 md:mb-6 text-center">
          <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full mb-3 sm:mb-4">
            <CheckCircle className="w-7 h-7 sm:w-10 sm:h-10 text-green-600" />
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-2 sm:mb-3 px-2">
            ¡Felicidades! Tu Solicitud ha Sido Enviada
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-gray-600 max-w-2xl mx-auto px-2">
            Estamos revisando tu información. Te notificaremos por correo electrónico y WhatsApp sobre el progreso de tu solicitud.
          </p>
        </div>

        {/* Vehicle Info */}
        {vehicleInfo?._vehicleTitle && (
          <Card className="mb-3 sm:mb-4 md:mb-6">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="text-sm sm:text-base md:text-lg">Auto de Interés</CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0">
              <div className="flex items-center gap-3 sm:gap-4">
                <img
                  src={vehicleInfo._featureImage}
                  alt={vehicleInfo._vehicleTitle}
                  className="w-20 h-14 sm:w-24 sm:h-16 object-cover rounded-lg flex-shrink-0"
                />
                <div>
                  <h3 className="font-bold text-sm sm:text-base text-gray-900">{vehicleInfo._vehicleTitle}</h3>
                  {vehicleInfo._precioFormateado && (
                    <p className="text-xs sm:text-sm text-gray-600 mt-1">{vehicleInfo._precioFormateado}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Next Steps */}
        <Card className="mb-3 sm:mb-4 md:mb-6">
          <CardHeader className="p-3 sm:p-4 md:p-6">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
              <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
              Próximos Pasos
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-3 sm:space-y-4 md:space-y-5">
            <div className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-100 text-primary-600 font-bold flex items-center justify-center text-xs sm:text-sm">
                1
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-1">Carga tus Documentos</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Para procesar tu solicitud más rápido, necesitamos los siguientes documentos:
                </p>
                <ul className="mt-2 text-xs sm:text-sm text-gray-600 space-y-1 ml-3 sm:ml-4">
                  <li>• INE (frente y reverso)</li>
                  <li>• Comprobante de domicilio</li>
                  <li>• Comprobante de ingresos</li>
                  <li>• Constancia fiscal</li>
                </ul>

                {/* Checkbox para subir documentos ahora */}
                <div className="mt-4 p-4 bg-primary-50 border-2 border-primary-200 rounded-lg">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={uploadDocumentsNow}
                      onChange={(e) => setUploadDocumentsNow(e.target.checked)}
                      className="w-5 h-5 mt-0.5 rounded border-primary-300 text-primary-600 focus:ring-primary-500 focus:ring-2 cursor-pointer"
                    />
                    <div className="flex-1">
                      <span className="text-sm font-semibold text-gray-900">
                        ¿Quieres subir tus documentos ahora?
                      </span>
                      <p className="text-xs text-gray-600 mt-1">
                        Si tienes tus documentos a la mano, puedes subirlos en este momento para agilizar el proceso. También puedes hacerlo después desde tu dashboard.
                      </p>
                    </div>
                  </label>
                </div>

                {/* Widgets de carga si el checkbox está marcado */}
                {uploadDocumentsNow && publicUrl && (
                  <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-2 mb-3">
                      <Upload className="w-4 h-4 text-primary-600" />
                      <h5 className="font-semibold text-sm text-gray-900">Sube tus documentos</h5>
                    </div>
                    <PublicUploadLinkCard token={application.public_upload_token} />
                    <p className="text-xs text-gray-500 mt-3 flex items-center gap-1">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      No te preocupes, también puedes subir o completar tus documentos más tarde desde tu dashboard en la sección "Seguimiento".
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-100 text-primary-600 font-bold flex items-center justify-center text-xs sm:text-sm">
                2
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-1">Revisión de tu Solicitud</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Nuestro equipo revisará tu información y documentos. Este proceso generalmente toma de 1 a 2 días hábiles.
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <div className="flex-shrink-0 w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary-100 text-primary-600 font-bold flex items-center justify-center text-xs sm:text-sm">
                3
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-1">Aprobación y Siguiente Paso</h4>
                <p className="text-xs sm:text-sm text-gray-600">
                  Una vez aprobado tu crédito, podrás separar el auto de tu preferencia y coordinar la entrega.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Document Upload Section */}
        {publicUrl && (
          <Card className="mb-3 sm:mb-4 md:mb-6">
            <CardHeader className="p-3 sm:p-4 md:p-6">
              <CardTitle className="flex items-center gap-2 text-sm sm:text-base md:text-lg">
                <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-primary-600" />
                Liga para Carga de Documentos
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 md:p-6 pt-0 space-y-3 sm:space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
                <p className="text-xs sm:text-sm text-blue-900 mb-2 sm:mb-3">
                  <strong>📧 Te enviamos esta liga por correo electrónico</strong>
                </p>
                <p className="text-xs sm:text-sm text-blue-800 mb-3">
                  Puedes usar este enlace en cualquier momento para cargar tus documentos de forma segura.
                  También puedes compartir esta liga para que alguien más suba los documentos por ti.
                </p>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={publicUrl}
                    readOnly
                    className="flex-1 px-3 py-2 bg-white border border-blue-300 rounded-lg text-xs sm:text-sm text-gray-700 font-mono"
                  />
                  <Button
                    onClick={handleCopyLink}
                    variant="outline"
                    size="sm"
                    className="flex-shrink-0 w-full sm:w-auto min-h-[44px] touch-manipulation"
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4 mr-1" />
                        Copiado
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4 mr-1" />
                        Copiar
                      </>
                    )}
                  </Button>
                </div>
                <a
                  href={publicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 mt-3 text-xs sm:text-sm text-blue-700 hover:text-blue-800 font-semibold min-h-[44px] touch-manipulation"
                >
                  <ExternalLink className="w-4 h-4" />
                  Abrir liga de carga de documentos
                </a>
              </div>

              {/* Document Upload via Link */}
              <div className="border-t border-gray-200 pt-4">
                <PublicUploadLinkCard token={application.public_upload_token} />
              </div>
            </CardContent>
          </Card>
        )}

        {/* Single Call to Action */}
        <div className="mt-3 sm:mt-4">
          <Link
            href={`/escritorio/seguimiento/${id}`}
            className="block w-full"
          >
            <Button
              className="w-full min-h-[52px] sm:min-h-[56px] text-base sm:text-lg font-bold shadow-lg hover:shadow-xl transition-all touch-manipulation"
              size="lg"
              style={{ backgroundColor: '#FF6801' }}
            >
              <FileText className="w-5 h-5 sm:w-6 sm:h-6 mr-2" />
              Ver mi Solicitud
            </Button>
          </Link>
        </div>

        {/* Footer Note */}
        <div className="mt-6 sm:mt-8 text-center pb-4">
          <p className="text-xs sm:text-sm text-gray-500">
            ¿Tienes preguntas? <Link href="/contacto" className="text-primary-600 hover:text-primary-700 font-semibold underline min-h-[44px] touch-manipulation inline-flex items-center">Contáctanos</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default ApplicationConfirmationPage;
