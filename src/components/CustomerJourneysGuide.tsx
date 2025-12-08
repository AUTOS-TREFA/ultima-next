import React, { useState } from 'react';
import { BookOpen, ChevronDown, ChevronUp, Eye, Target, MousePointerClick, Flag, CheckCircle2, Lightbulb, HelpCircle, PlayCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';

interface GuideSectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

const GuideSection: React.FC<GuideSectionProps> = ({ title, icon: Icon, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden mb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-4 py-3 bg-gradient-to-r from-indigo-50 to-white hover:from-indigo-100 hover:to-indigo-50 transition-all flex items-center justify-between"
      >
        <div className="flex items-center gap-3">
          <Icon className="w-5 h-5 text-indigo-600" />
          <span className="font-semibold text-gray-900">{title}</span>
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5 text-gray-500" />
        ) : (
          <ChevronDown className="w-5 h-5 text-gray-500" />
        )}
      </button>
      {isOpen && (
        <div className="px-4 py-4 bg-white border-t border-gray-100">
          {children}
        </div>
      )}
    </div>
  );
};

const CustomerJourneysGuide: React.FC = () => {
  const [isGuideVisible, setIsGuideVisible] = useState(true);

  if (!isGuideVisible) {
    return (
      <Button
        onClick={() => setIsGuideVisible(true)}
        variant="outline"
        className="mb-6"
      >
        <BookOpen className="w-4 h-4 mr-2" />
        Mostrar Guía de Uso
      </Button>
    );
  }

  return (
    <Card className="mb-6 border-2 border-indigo-200 shadow-lg">
      <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen className="w-6 h-6" />
            <div>
              <CardTitle className="text-xl">Guía de Customer Journeys</CardTitle>
              <p className="text-indigo-100 text-sm mt-1">
                Aprende a rastrear el comportamiento de tus usuarios y optimizar tus campañas de Facebook
              </p>
            </div>
          </div>
          <Button
            onClick={() => setIsGuideVisible(false)}
            variant="ghost"
            size="sm"
            className="text-white hover:bg-white/20"
          >
            Ocultar
          </Button>
        </div>
      </CardHeader>
      <CardContent className="pt-6">
        {/* ¿Qué son los Customer Journeys? */}
        <GuideSection
          title="¿Qué son los Customer Journeys?"
          icon={HelpCircle}
          defaultOpen={true}
        >
          <div className="space-y-3 text-gray-700">
            <p>
              Un <strong>Customer Journey</strong> es el camino que recorre un usuario desde que conoce tu marca
              hasta que completa una acción deseada (como enviar una solicitud de financiamiento).
            </p>
            <p>
              Con esta herramienta puedes:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>Rastrear cada paso del usuario en tu sitio</li>
              <li>Identificar dónde pierdes más usuarios (drop-off)</li>
              <li>Medir el rendimiento de tus campañas de Facebook</li>
              <li>Optimizar el embudo de conversión</li>
              <li>Enviar eventos automáticamente a Facebook Pixel y Google Tag Manager</li>
            </ul>
          </div>
        </GuideSection>

        {/* Conceptos Clave */}
        <GuideSection
          title="Conceptos Clave"
          icon={Lightbulb}
        >
          <div className="space-y-4">
            <div className="bg-blue-50 border-l-4 border-blue-500 p-3 rounded">
              <h4 className="font-semibold text-blue-900 mb-1">Evento</h4>
              <p className="text-sm text-blue-800">
                Una acción que realiza el usuario (ej: ver una página, hacer clic en un botón, enviar un formulario)
              </p>
            </div>
            <div className="bg-purple-50 border-l-4 border-purple-500 p-3 rounded">
              <h4 className="font-semibold text-purple-900 mb-1">Paso (Step)</h4>
              <p className="text-sm text-purple-800">
                Un punto específico en el journey donde ocurre un evento. Los pasos forman el embudo de conversión.
              </p>
            </div>
            <div className="bg-green-50 border-l-4 border-green-500 p-3 rounded">
              <h4 className="font-semibold text-green-900 mb-1">Trigger (Disparador)</h4>
              <p className="text-sm text-green-800">
                La condición que activa el evento (ej: visitar una página, hacer clic en un botón específico)
              </p>
            </div>
            <div className="bg-orange-50 border-l-4 border-orange-500 p-3 rounded">
              <h4 className="font-semibold text-orange-900 mb-1">Facebook Pixel Event</h4>
              <p className="text-sm text-orange-800">
                Evento estándar de Facebook que se envía automáticamente para optimizar tus campañas publicitarias
              </p>
            </div>
          </div>
        </GuideSection>

        {/* Ejemplo Práctico: Catálogo de Facebook */}
        <GuideSection
          title="📘 Ejemplo Práctico: Rastrear Interés en Vehículos (Catálogo de Facebook)"
          icon={PlayCircle}
          defaultOpen={true}
        >
          <div className="space-y-4">
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-indigo-200">
              <h4 className="font-bold text-indigo-900 mb-2 flex items-center gap-2">
                <Target className="w-5 h-5" />
                Objetivo: Rastrear usuarios interesados en vehículos específicos
              </h4>
              <p className="text-sm text-indigo-800">
                Vamos a crear un journey que rastree cuando los usuarios ven vehículos en el catálogo
                y envíe eventos <code className="bg-indigo-200 px-1 rounded">ViewContent</code> a Facebook
                para optimizar tus campañas de catálogo dinámico.
              </p>
            </div>

            <div className="space-y-3">
              <h5 className="font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
                Paso a Paso:
              </h5>

              {/* Paso 1 */}
              <div className="ml-6 border-l-2 border-indigo-300 pl-4 py-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div className="flex-1">
                    <h6 className="font-semibold text-gray-900 mb-1">Crear el Journey</h6>
                    <p className="text-sm text-gray-700 mb-2">
                      Haz clic en <strong>"Nuevo Customer Journey"</strong>
                    </p>
                    <div className="bg-white border border-gray-200 rounded p-3 text-sm space-y-1">
                      <div><strong>Nombre:</strong> <code className="bg-gray-100 px-2 py-0.5 rounded">Interés en Vehículos - Catálogo FB</code></div>
                      <div><strong>Ruta principal:</strong> <code className="bg-gray-100 px-2 py-0.5 rounded">/autos</code></div>
                      <div><strong>Landing Page:</strong> <code className="bg-gray-100 px-2 py-0.5 rounded">/autos</code></div>
                      <div><strong>Descripción:</strong> Rastrea usuarios que ven vehículos en el catálogo</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 2 */}
              <div className="ml-6 border-l-2 border-indigo-300 pl-4 py-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div className="flex-1">
                    <h6 className="font-semibold text-gray-900 mb-1">Agregar Pasos del Funnel</h6>
                    <p className="text-sm text-gray-700 mb-3">
                      Define los pasos que rastrearás. Para el catálogo de vehículos:
                    </p>

                    {/* Step 1: Landing en catálogo */}
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Eye className="w-4 h-4 text-blue-600" />
                        <span className="font-semibold text-blue-900">Paso 1: Usuario llega al catálogo</span>
                      </div>
                      <div className="text-sm space-y-1 text-gray-700">
                        <div><strong>Nombre del paso:</strong> Visita Catálogo de Autos</div>
                        <div><strong>Ruta de la página:</strong> <code className="bg-white px-2 py-0.5 rounded border">/autos</code></div>
                        <div><strong>Tipo de evento:</strong> PageView</div>
                        <div><strong>Tipo de trigger:</strong> Pageview</div>
                        <div className="pt-2 border-t border-blue-200 mt-2">
                          <span className="text-xs font-semibold text-blue-800">→ Facebook Event: PageView</span>
                        </div>
                      </div>
                    </div>

                    {/* Step 2: Ver detalle de auto */}
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-3 mb-3">
                      <div className="flex items-center gap-2 mb-2">
                        <Target className="w-4 h-4 text-purple-600" />
                        <span className="font-semibold text-purple-900">Paso 2: Usuario ve detalle de vehículo</span>
                      </div>
                      <div className="text-sm space-y-1 text-gray-700">
                        <div><strong>Nombre del paso:</strong> Ver Detalle de Auto</div>
                        <div><strong>Ruta de la página:</strong> <code className="bg-white px-2 py-0.5 rounded border">/autos/:id</code></div>
                        <div><strong>Tipo de evento:</strong> ViewContent</div>
                        <div><strong>Tipo de trigger:</strong> Pageview</div>
                        <div className="pt-2 border-t border-purple-200 mt-2">
                          <span className="text-xs font-semibold text-purple-800">
                            → Facebook Event: ViewContent (CLAVE para catálogo dinámico)
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Step 3: Click en Financiamientos */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                      <div className="flex items-center gap-2 mb-2">
                        <MousePointerClick className="w-4 h-4 text-yellow-600" />
                        <span className="font-semibold text-yellow-900">Paso 3: Usuario hace clic en "Financiamientos"</span>
                      </div>
                      <div className="text-sm space-y-1 text-gray-700">
                        <div><strong>Nombre del paso:</strong> Click Financiamientos</div>
                        <div><strong>Ruta de la página:</strong> <code className="bg-white px-2 py-0.5 rounded border">/autos/:id</code></div>
                        <div><strong>Tipo de evento:</strong> ComienzaSolicitud</div>
                        <div><strong>Tipo de trigger:</strong> Button Click</div>
                        <div><strong>Selector (texto del botón):</strong> <code className="bg-white px-2 py-0.5 rounded border">Financiamientos</code></div>
                        <div className="pt-2 border-t border-yellow-200 mt-2">
                          <span className="text-xs font-semibold text-yellow-800">
                            → Facebook Event: InitiateCheckout (indica intención de compra)
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Paso 3 */}
              <div className="ml-6 border-l-2 border-indigo-300 pl-4 py-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div className="flex-1">
                    <h6 className="font-semibold text-gray-900 mb-1">Activar el Journey</h6>
                    <p className="text-sm text-gray-700">
                      Revisa el resumen en el paso 3 y haz clic en <strong>"Crear Journey"</strong>.
                      El journey se creará en estado <span className="bg-gray-200 px-2 py-0.5 rounded text-xs font-semibold">BORRADOR</span>.
                    </p>
                    <p className="text-sm text-gray-700 mt-2">
                      Haz clic en el botón <strong>"Activar"</strong> para comenzar a rastrear eventos automáticamente.
                    </p>
                  </div>
                </div>
              </div>

              {/* Paso 4 */}
              <div className="ml-6 border-l-2 border-green-500 pl-4 py-2">
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-bold flex-shrink-0">
                    ✓
                  </div>
                  <div className="flex-1">
                    <h6 className="font-semibold text-green-900 mb-1">¡Listo! Verifica los eventos</h6>
                    <p className="text-sm text-gray-700 mb-2">
                      Una vez activado, los eventos se enviarán automáticamente a:
                    </p>
                    <ul className="text-sm space-y-1 text-gray-700">
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <strong>Facebook Events Manager</strong> - Verifica en tiempo real
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <strong>Google Tag Manager</strong> - Preview mode
                      </li>
                      <li className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                        <strong>Supabase</strong> - Tabla <code className="bg-gray-100 px-1 rounded">tracking_events</code>
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </GuideSection>

        {/* Eventos Disponibles */}
        <GuideSection
          title="Eventos Disponibles"
          icon={Flag}
        >
          <div className="space-y-2">
            <p className="text-sm text-gray-700 mb-3">
              Estos son los eventos estándar que puedes usar. Cada uno se mapea automáticamente a eventos de Facebook Pixel:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              <div className="bg-blue-50 p-2 rounded text-sm">
                <div className="font-semibold text-blue-900">PageView</div>
                <div className="text-xs text-blue-700">FB: PageView</div>
              </div>
              <div className="bg-purple-50 p-2 rounded text-sm">
                <div className="font-semibold text-purple-900">ViewContent</div>
                <div className="text-xs text-purple-700">FB: ViewContent (catálogo)</div>
              </div>
              <div className="bg-green-50 p-2 rounded text-sm">
                <div className="font-semibold text-green-900">InitialRegistration</div>
                <div className="text-xs text-green-700">FB: CompleteRegistration</div>
              </div>
              <div className="bg-orange-50 p-2 rounded text-sm">
                <div className="font-semibold text-orange-900">ConversionLandingPage</div>
                <div className="text-xs text-orange-700">FB: Lead (desde landing)</div>
              </div>
              <div className="bg-yellow-50 p-2 rounded text-sm">
                <div className="font-semibold text-yellow-900">ComienzaSolicitud</div>
                <div className="text-xs text-yellow-700">FB: InitiateCheckout</div>
              </div>
              <div className="bg-emerald-50 p-2 rounded text-sm">
                <div className="font-semibold text-emerald-900">ApplicationSubmission</div>
                <div className="text-xs text-emerald-700">FB: SubmitApplication</div>
              </div>
              <div className="bg-rose-50 p-2 rounded text-sm">
                <div className="font-semibold text-rose-900">LeadComplete</div>
                <div className="text-xs text-rose-700">FB: Lead (completo)</div>
              </div>
              <div className="bg-indigo-50 p-2 rounded text-sm">
                <div className="font-semibold text-indigo-900">PersonalInformationComplete</div>
                <div className="text-xs text-indigo-700">FB: CompleteRegistration</div>
              </div>
            </div>
          </div>
        </GuideSection>

        {/* Tipos de Trigger */}
        <GuideSection
          title="Tipos de Trigger (Disparadores)"
          icon={MousePointerClick}
        >
          <div className="space-y-3">
            <div className="border-l-4 border-blue-500 bg-blue-50 p-3 rounded">
              <h5 className="font-semibold text-blue-900">Pageview</h5>
              <p className="text-sm text-blue-800">Se activa cuando el usuario visita una página específica</p>
              <code className="text-xs bg-blue-100 px-2 py-1 rounded mt-1 inline-block">Ejemplo: /autos, /financiamientos</code>
            </div>
            <div className="border-l-4 border-purple-500 bg-purple-50 p-3 rounded">
              <h5 className="font-semibold text-purple-900">Button Click</h5>
              <p className="text-sm text-purple-800">Se activa cuando el usuario hace clic en un botón específico</p>
              <code className="text-xs bg-purple-100 px-2 py-1 rounded mt-1 inline-block">Ejemplo: Botón con texto "Financiamientos"</code>
            </div>
            <div className="border-l-4 border-green-500 bg-green-50 p-3 rounded">
              <h5 className="font-semibold text-green-900">Form Submit</h5>
              <p className="text-sm text-green-800">Se activa cuando el usuario envía un formulario</p>
              <code className="text-xs bg-green-100 px-2 py-1 rounded mt-1 inline-block">Ejemplo: Formulario de contacto</code>
            </div>
            <div className="border-l-4 border-orange-500 bg-orange-50 p-3 rounded">
              <h5 className="font-semibold text-orange-900">Custom</h5>
              <p className="text-sm text-orange-800">Disparador personalizado con lógica avanzada</p>
            </div>
          </div>
        </GuideSection>

        {/* Mejores Prácticas */}
        <GuideSection
          title="Mejores Prácticas"
          icon={Lightbulb}
        >
          <ul className="space-y-2 text-sm text-gray-700">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>ViewContent para catálogo:</strong> Siempre usa el evento ViewContent cuando los usuarios ven detalles de productos/vehículos. Es crucial para Dynamic Ads de Facebook.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Orden lógico:</strong> Define los pasos en el orden natural del journey (Landing → Ver Producto → Interés → Conversión)</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Nombres descriptivos:</strong> Usa nombres claros para identificar fácilmente cada paso</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Prueba antes de activar:</strong> Verifica que las rutas y selectores sean correctos usando las herramientas de desarrollo del navegador</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
              <span><strong>Monitorea regularmente:</strong> Revisa Facebook Events Manager para confirmar que los eventos se están enviando correctamente</span>
            </li>
          </ul>
        </GuideSection>

        {/* Solución de Problemas */}
        <GuideSection
          title="Solución de Problemas"
          icon={HelpCircle}
        >
          <div className="space-y-3">
            <div className="bg-yellow-50 border border-yellow-200 rounded p-3">
              <h5 className="font-semibold text-yellow-900 mb-1">Los eventos no aparecen en Facebook</h5>
              <ul className="text-sm text-yellow-800 space-y-1 ml-4 list-disc">
                <li>Verifica que el journey esté en estado "Activo"</li>
                <li>Confirma que Facebook Pixel esté instalado correctamente</li>
                <li>Usa Facebook Pixel Helper (extensión de Chrome) para verificar eventos en tiempo real</li>
                <li>Revisa la consola del navegador para errores</li>
              </ul>
            </div>
            <div className="bg-red-50 border border-red-200 rounded p-3">
              <h5 className="font-semibold text-red-900 mb-1">El trigger de botón no funciona</h5>
              <ul className="text-sm text-red-800 space-y-1 ml-4 list-disc">
                <li>Verifica que el texto del botón coincida exactamente (mayúsculas/minúsculas)</li>
                <li>Inspecciona el botón con DevTools para confirmar su estructura</li>
                <li>Prueba usando un selector CSS más específico</li>
              </ul>
            </div>
          </div>
        </GuideSection>

        {/* Call to Action */}
        <div className="mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 text-white p-6 rounded-lg">
          <h4 className="font-bold text-lg mb-2 flex items-center gap-2">
            <PlayCircle className="w-5 h-5" />
            ¿Listo para comenzar?
          </h4>
          <p className="text-indigo-100 mb-4">
            Crea tu primer Customer Journey siguiendo el ejemplo del catálogo de vehículos.
            En minutos estarás rastreando el comportamiento de tus usuarios y optimizando tus campañas de Facebook.
          </p>
          <Button
            onClick={() => setIsGuideVisible(false)}
            className="bg-white text-indigo-600 hover:bg-indigo-50"
          >
            Crear Mi Primer Journey
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default CustomerJourneysGuide;
