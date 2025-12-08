'use client';

import React, { useState, useEffect } from 'react';
import { Route, Plus, Edit, Trash2, Play, Pause, BarChart3, Loader2, AlertCircle, Download, FileJson, CheckCircle2, Circle, Target, Eye, UserCheck, FileCheck, TrendingUp, MousePointerClick, Flag } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { CustomerJourneyService, type CustomerJourney, type JourneyStep } from '@/services/CustomerJourneyService';
import { downloadGTMExport, downloadEventsJSON } from '@/utils/gtmExport';
import { journeyEventRegistration } from '@/services/JourneyEventRegistration';
import CustomerJourneysGuide from '@/components/CustomerJourneysGuide';

// Predefined event templates based on existing tracking events
const EVENT_TEMPLATES = [
  {
    value: 'PageView',
    label: 'Vista de Página',
    description: 'Usuario visita una página',
    icon: Eye,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    value: 'ViewContent',
    label: 'Ver Contenido',
    description: 'Usuario ve contenido específico (ej: auto)',
    icon: Target,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    value: 'InitialRegistration',
    label: 'Registro Inicial',
    description: 'Usuario completa OTP o Google Sign-In',
    icon: UserCheck,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    value: 'ConversionLandingPage',
    label: 'Conversión Landing Page',
    description: 'Usuario se registra desde landing page',
    icon: Flag,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    value: 'PersonalInformationComplete',
    label: 'Información Personal Completa',
    description: 'Usuario completa su perfil',
    icon: FileCheck,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-100'
  },
  {
    value: 'PerfilacionBancariaComplete',
    label: 'Perfilación Bancaria Completa',
    description: 'Usuario completa cuestionario bancario',
    icon: TrendingUp,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100'
  },
  {
    value: 'ComienzaSolicitud',
    label: 'Comienza Solicitud',
    description: 'Usuario llega a página de aplicación',
    icon: MousePointerClick,
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-100'
  },
  {
    value: 'ApplicationSubmission',
    label: 'Solicitud Enviada',
    description: 'Usuario envía solicitud (todas las fuentes)',
    icon: CheckCircle2,
    color: 'text-emerald-600',
    bgColor: 'bg-emerald-100'
  },
  {
    value: 'LeadComplete',
    label: 'Lead Completo',
    description: 'Usuario envía solicitud (solo desde landing page)',
    icon: Flag,
    color: 'text-rose-600',
    bgColor: 'bg-rose-100'
  },
  {
    value: 'ContactaPorWhatsApp',
    label: 'Contacta por WhatsApp',
    description: 'Usuario hace clic en botón de WhatsApp',
    icon: MousePointerClick,
    color: 'text-green-600',
    bgColor: 'bg-green-100'
  },
  {
    value: 'ComprarConFinanciamiento',
    label: 'Comprar con Financiamiento',
    description: 'Usuario hace clic en "Comprar con Financiamiento"',
    icon: MousePointerClick,
    color: 'text-blue-600',
    bgColor: 'bg-blue-100'
  },
  {
    value: 'AddToCart',
    label: 'Agregar al Carrito',
    description: 'Usuario agrega producto al carrito',
    icon: MousePointerClick,
    color: 'text-orange-600',
    bgColor: 'bg-orange-100'
  },
  {
    value: 'InitiateCheckout',
    label: 'Iniciar Checkout',
    description: 'Usuario inicia proceso de compra',
    icon: MousePointerClick,
    color: 'text-purple-600',
    bgColor: 'bg-purple-100'
  },
  {
    value: 'Search',
    label: 'Búsqueda',
    description: 'Usuario realiza una búsqueda',
    icon: Target,
    color: 'text-cyan-600',
    bgColor: 'bg-cyan-100'
  },
  {
    value: 'ContactoFormularioEnviado',
    label: 'Formulario de Contacto Enviado',
    description: 'Usuario envía formulario de contacto',
    icon: CheckCircle2,
    color: 'text-teal-600',
    bgColor: 'bg-teal-100'
  },
  {
    value: 'DescargaBrochure',
    label: 'Descarga Brochure',
    description: 'Usuario descarga brochure o documento',
    icon: MousePointerClick,
    color: 'text-pink-600',
    bgColor: 'bg-pink-100'
  },
  {
    value: 'VideoPlay',
    label: 'Reproducción de Video',
    description: 'Usuario reproduce un video',
    icon: Play,
    color: 'text-red-600',
    bgColor: 'bg-red-100'
  },
  {
    value: 'SolicitudTestDrive',
    label: 'Solicitud de Test Drive',
    description: 'Usuario solicita prueba de manejo',
    icon: MousePointerClick,
    color: 'text-violet-600',
    bgColor: 'bg-violet-100'
  },
  {
    value: 'CompartirEnRedes',
    label: 'Compartir en Redes Sociales',
    description: 'Usuario comparte contenido en redes sociales',
    icon: MousePointerClick,
    color: 'text-sky-600',
    bgColor: 'bg-sky-100'
  },
  {
    value: 'CalculadoraFinanciamiento',
    label: 'Uso de Calculadora de Financiamiento',
    description: 'Usuario interactúa con calculadora',
    icon: MousePointerClick,
    color: 'text-amber-600',
    bgColor: 'bg-amber-100'
  }
];

const CustomerJourneysPage: React.FC = () => {
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);
  const [journeyName, setJourneyName] = useState('');
  const [journeyRoute, setJourneyRoute] = useState('');
  const [journeyLandingPage, setJourneyLandingPage] = useState('');
  const [journeyDescription, setJourneyDescription] = useState('');
  const [funnelSteps, setFunnelSteps] = useState<Omit<JourneyStep, 'id' | 'journey_id' | 'created_at' | 'updated_at'>[]>([]);
  const [newStepName, setNewStepName] = useState('');
  const [newStepPageRoute, setNewStepPageRoute] = useState('');
  const [newStepDescription, setNewStepDescription] = useState('');
  const [newStepEventType, setNewStepEventType] = useState('');
  const [newStepTriggerType, setNewStepTriggerType] = useState<'pageview' | 'button_click' | 'form_submit' | 'custom' | 'scroll' | 'time_on_page' | 'element_visible' | 'video_play'>('pageview');
  const [newStepButtonIdentifierType, setNewStepButtonIdentifierType] = useState<'text_contains' | 'css_id' | 'css_class' | 'css_selector'>('text_contains');
  const [newStepButtonIdentifier, setNewStepButtonIdentifier] = useState('');

  // Database state
  const [journeys, setJourneys] = useState<CustomerJourney[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Load journeys from database on mount
  useEffect(() => {
    loadJourneys();
  }, []);

  const loadJourneys = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await CustomerJourneyService.getAllJourneys();
      setJourneys(data);
    } catch (err) {
      console.error('Error loading journeys:', err);
      setError('Error al cargar customer journeys');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddStep = () => {
    if (newStepName && newStepEventType && newStepPageRoute) {
      const newStep: Omit<JourneyStep, 'id' | 'journey_id' | 'created_at' | 'updated_at'> = {
        step_order: funnelSteps.length + 1,
        step_name: newStepName,
        step_description: newStepDescription || undefined,
        page_route: newStepPageRoute,
        event_type: newStepEventType,
        event_name: newStepName,
        trigger_type: newStepTriggerType,
        // Include button identifier fields if trigger is button_click
        ...(newStepTriggerType === 'button_click' && newStepButtonIdentifier ? {
          button_identifier_type: newStepButtonIdentifierType,
          button_identifier: newStepButtonIdentifier
        } : {})
      };
      setFunnelSteps([...funnelSteps, newStep]);
      setNewStepName('');
      setNewStepPageRoute('');
      setNewStepDescription('');
      setNewStepEventType('');
      setNewStepTriggerType('pageview');
      setNewStepButtonIdentifierType('text_contains');
      setNewStepButtonIdentifier('');
    }
  };

  const handleRemoveStep = (index: number) => {
    const newSteps = funnelSteps.filter((_, idx) => idx !== index);
    // Reorder remaining steps
    newSteps.forEach((step, idx) => {
      step.step_order = idx + 1;
    });
    setFunnelSteps(newSteps);
  };

  const handleMoveStepUp = (index: number) => {
    if (index > 0) {
      const newSteps = [...funnelSteps];
      [newSteps[index - 1], newSteps[index]] = [newSteps[index], newSteps[index - 1]];
      newSteps.forEach((step, idx) => {
        step.step_order = idx + 1;
      });
      setFunnelSteps(newSteps);
    }
  };

  const handleMoveStepDown = (index: number) => {
    if (index < funnelSteps.length - 1) {
      const newSteps = [...funnelSteps];
      [newSteps[index], newSteps[index + 1]] = [newSteps[index + 1], newSteps[index]];
      newSteps.forEach((step, idx) => {
        step.step_order = idx + 1;
      });
      setFunnelSteps(newSteps);
    }
  };

  const handleCreateJourney = async () => {
    try {
      setIsCreating(true);
      setError(null);

      const journeyData: Omit<CustomerJourney, 'id' | 'created_at' | 'updated_at'> = {
        name: journeyName,
        route: journeyRoute,
        landing_page: journeyLandingPage || journeyRoute,
        description: journeyDescription || undefined,
        status: 'draft',
        auto_tracking_enabled: true,
        gtm_enabled: true,
        facebook_pixel_enabled: true
      };

      const newJourney = await CustomerJourneyService.createJourney(journeyData, funnelSteps);

      // Register events if auto-tracking is enabled and status is active
      if (newJourney.auto_tracking_enabled && newJourney.status === 'active') {
        await journeyEventRegistration.registerJourneyEvents(newJourney);
      }

      // Reload journeys from database
      await loadJourneys();

      setIsWizardOpen(false);
      resetWizard();
    } catch (err) {
      console.error('Error creating journey:', err);
      setError('Error al crear customer journey');
    } finally {
      setIsCreating(false);
    }
  };

  const resetWizard = () => {
    setCurrentStep(1);
    setJourneyName('');
    setJourneyRoute('');
    setJourneyLandingPage('');
    setJourneyDescription('');
    setFunnelSteps([]);
    setNewStepName('');
    setNewStepPageRoute('');
    setNewStepDescription('');
    setNewStepEventType('');
    setNewStepTriggerType('pageview');
    setNewStepButtonIdentifierType('text_contains');
    setNewStepButtonIdentifier('');
  };

  const toggleJourneyStatus = async (journeyId: string) => {
    try {
      setError(null);
      const updatedJourney = await CustomerJourneyService.toggleJourneyStatus(journeyId);

      // Register or unregister events based on new status
      if (updatedJourney.status === 'active' && updatedJourney.auto_tracking_enabled) {
        await journeyEventRegistration.registerJourneyEvents(updatedJourney);
      } else if (updatedJourney.status === 'paused') {
        journeyEventRegistration.unregisterJourneyEvents(journeyId);
      }

      await loadJourneys();
    } catch (err) {
      console.error('Error toggling journey status:', err);
      setError('Error al cambiar estado del journey');
    }
  };

  const deleteJourney = async (journeyId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este customer journey?')) {
      try {
        setError(null);
        await CustomerJourneyService.deleteJourney(journeyId);
        await loadJourneys();
      } catch (err) {
        console.error('Error deleting journey:', err);
        setError('Error al eliminar customer journey');
      }
    }
  };

  const getStatusColor = (status: CustomerJourney['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'paused':
        return 'bg-yellow-100 text-yellow-800';
      case 'draft':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderWizardStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nombre del Customer Journey *
              </label>
              <input
                type="text"
                value={journeyName}
                onChange={(e) => setJourneyName(e.target.value)}
                placeholder="ej: Compra de Auto, Venta de Auto, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ruta principal *
              </label>
              <input
                type="text"
                value={journeyRoute}
                onChange={(e) => setJourneyRoute(e.target.value)}
                placeholder="ej: /compra-auto, /venta, etc."
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Landing Page
              </label>
              <input
                type="text"
                value={journeyLandingPage}
                onChange={(e) => setJourneyLandingPage(e.target.value)}
                placeholder="ej: /compra-auto (deja vacío para usar la ruta principal)"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descripción
              </label>
              <textarea
                value={journeyDescription}
                onChange={(e) => setJourneyDescription(e.target.value)}
                placeholder="Describe el customer journey..."
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4 mb-4">
              <p className="text-sm text-indigo-800">
                Define los pasos del funnel en orden. Cada paso representa una acción que el usuario realiza en su journey.
              </p>
            </div>

            {/* List of current steps - Level-like visual design */}
            {funnelSteps.length > 0 && (
              <div className="space-y-3 mb-4">
                <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                  <Target className="w-4 h-4 text-indigo-600" />
                  Pasos del Journey ({funnelSteps.length})
                </h4>
                <div className="relative">
                  {funnelSteps.map((step, index) => {
                    const eventTemplate = EVENT_TEMPLATES.find(t => t.value === step.event_type);
                    const StepIcon = eventTemplate?.icon || Circle;

                    return (
                      <div key={index} className="relative">
                        {/* Connector line */}
                        {index < funnelSteps.length - 1 && (
                          <div className="absolute left-6 top-16 bottom-0 w-0.5 bg-gradient-to-b from-indigo-300 to-transparent h-6" />
                        )}

                        {/* Step card */}
                        <div className="flex items-start gap-3 bg-white border-2 border-indigo-100 p-4 rounded-xl shadow-sm hover:shadow-md transition-all mb-2">
                          {/* Step number badge */}
                          <div className={`flex-shrink-0 w-12 h-12 rounded-full ${eventTemplate?.bgColor || 'bg-gray-100'} flex items-center justify-center border-2 border-white shadow-sm`}>
                            <span className={`text-lg font-bold ${eventTemplate?.color || 'text-gray-600'}`}>
                              {step.step_order}
                            </span>
                          </div>

                          {/* Step content */}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {eventTemplate && (
                                <div className={`p-1.5 rounded-lg ${eventTemplate.bgColor}`}>
                                  <StepIcon className={`w-4 h-4 ${eventTemplate.color}`} />
                                </div>
                              )}
                              <span className="font-semibold text-gray-900">{step.step_name}</span>
                            </div>
                            <Badge variant="secondary" className="text-xs mb-2">
                              {eventTemplate?.label || step.event_type}
                            </Badge>
                            <p className="text-xs text-gray-600 font-mono bg-gray-50 px-2 py-1 rounded inline-block">
                              {step.page_route}
                            </p>
                            {step.step_description && (
                              <p className="text-xs text-gray-500 mt-2 italic">{step.step_description}</p>
                            )}
                            <div className="text-xs text-gray-400 mt-1">
                              Trigger: <span className="font-medium">{step.trigger_type}</span>
                              {step.trigger_type === 'button_click' && step.button_identifier && (
                                <div className="mt-1 flex items-center gap-1 text-xs">
                                  <span className="px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded font-mono">
                                    {step.button_identifier_type === 'text_contains' && `texto: "${step.button_identifier}"`}
                                    {step.button_identifier_type === 'css_id' && `#${step.button_identifier}`}
                                    {step.button_identifier_type === 'css_class' && `.${step.button_identifier}`}
                                    {step.button_identifier_type === 'css_selector' && step.button_identifier}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>

                          {/* Action buttons */}
                          <div className="flex flex-col gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMoveStepUp(index)}
                              disabled={index === 0}
                              className="h-8 w-8 p-0"
                              title="Mover arriba"
                            >
                              ↑
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleMoveStepDown(index)}
                              disabled={index === funnelSteps.length - 1}
                              className="h-8 w-8 p-0"
                              title="Mover abajo"
                            >
                              ↓
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleRemoveStep(index)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                              title="Eliminar"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Add new step form */}
            <div className="border-t pt-4 space-y-3">
              <h4 className="text-sm font-semibold text-gray-700">Agregar nuevo paso:</h4>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre del paso *
                </label>
                <input
                  type="text"
                  value={newStepName}
                  onChange={(e) => setNewStepName(e.target.value)}
                  placeholder="ej: Visita Landing Page"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Ruta de la página *
                </label>
                <input
                  type="text"
                  value={newStepPageRoute}
                  onChange={(e) => setNewStepPageRoute(e.target.value)}
                  placeholder="ej: /compra-auto, /escritorio/aplicacion"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de evento *
                </label>
                <Select value={newStepEventType} onValueChange={setNewStepEventType}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecciona un evento..." />
                  </SelectTrigger>
                  <SelectContent>
                    {EVENT_TEMPLATES.map((template) => {
                      const Icon = template.icon;
                      return (
                        <SelectItem key={template.value} value={template.value}>
                          <div className="flex items-center gap-2">
                            <div className={`p-1 rounded ${template.bgColor}`}>
                              <Icon className={`w-4 h-4 ${template.color}`} />
                            </div>
                            <div>
                              <div className="font-medium">{template.label}</div>
                              <div className="text-xs text-gray-500">{template.description}</div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo de trigger *
                </label>
                <select
                  value={newStepTriggerType}
                  onChange={(e) => {
                    setNewStepTriggerType(e.target.value as any);
                    // Reset button identifier when changing trigger type
                    if (e.target.value !== 'button_click') {
                      setNewStepButtonIdentifier('');
                      setNewStepButtonIdentifierType('text_contains');
                    }
                  }}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="pageview">Vista de Página (Pageview)</option>
                  <option value="button_click">Click en Botón</option>
                  <option value="form_submit">Envío de Formulario</option>
                  <option value="element_visible">Elemento Visible</option>
                  <option value="scroll">Scroll en Página</option>
                  <option value="time_on_page">Tiempo en Página</option>
                  <option value="video_play">Reproducción de Video</option>
                  <option value="custom">Personalizado</option>
                </select>
              </div>

              {/* Conditional button identifier fields */}
              {newStepTriggerType === 'button_click' && (
                <div className="space-y-3 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                  <h5 className="text-sm font-semibold text-indigo-900">
                    Identificador del Botón
                  </h5>
                  <p className="text-xs text-indigo-700">
                    Especifica cómo identificar el botón que dispara este evento
                  </p>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Tipo de identificador *
                    </label>
                    <select
                      value={newStepButtonIdentifierType}
                      onChange={(e) => setNewStepButtonIdentifierType(e.target.value as any)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    >
                      <option value="text_contains">Texto contiene</option>
                      <option value="css_id">ID de CSS</option>
                      <option value="css_class">Clase de CSS</option>
                      <option value="css_selector">Selector CSS personalizado</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Valor del identificador *
                    </label>
                    <input
                      type="text"
                      value={newStepButtonIdentifier}
                      onChange={(e) => setNewStepButtonIdentifier(e.target.value)}
                      placeholder={
                        newStepButtonIdentifierType === 'text_contains' ? 'ej: Comprar con Financiamiento' :
                        newStepButtonIdentifierType === 'css_id' ? 'ej: btn-whatsapp' :
                        newStepButtonIdentifierType === 'css_class' ? 'ej: cta-button' :
                        'ej: button[data-action="submit"]'
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white font-mono text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {newStepButtonIdentifierType === 'text_contains' && 'El texto del botón debe contener este valor'}
                      {newStepButtonIdentifierType === 'css_id' && 'No incluyas el símbolo #, solo el ID (ej: "btn-whatsapp")'}
                      {newStepButtonIdentifierType === 'css_class' && 'No incluyas el punto, solo el nombre de la clase'}
                      {newStepButtonIdentifierType === 'css_selector' && 'Selector CSS completo (ej: "button[data-action=\'submit\']")'}
                    </p>
                  </div>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descripción (opcional)
                </label>
                <input
                  type="text"
                  value={newStepDescription}
                  onChange={(e) => setNewStepDescription(e.target.value)}
                  placeholder="ej: Usuario llegó a la página de inicio"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                />
              </div>
              <Button onClick={handleAddStep} className="w-full" disabled={!newStepName || !newStepEventType || !newStepPageRoute}>
                <Plus className="w-4 h-4 mr-2" />
                Agregar Paso
              </Button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <h4 className="font-semibold text-green-900 mb-2">Resumen del Customer Journey</h4>
              <div className="space-y-3">
                <div>
                  <span className="text-sm font-medium text-green-800">Nombre:</span>
                  <p className="text-gray-900">{journeyName}</p>
                </div>
                <div>
                  <span className="text-sm font-medium text-green-800">Ruta:</span>
                  <p className="text-gray-900">{journeyRoute}</p>
                </div>
                {journeyLandingPage && (
                  <div>
                    <span className="text-sm font-medium text-green-800">Landing Page:</span>
                    <p className="text-gray-900">{journeyLandingPage}</p>
                  </div>
                )}
                {journeyDescription && (
                  <div>
                    <span className="text-sm font-medium text-green-800">Descripción:</span>
                    <p className="text-gray-900">{journeyDescription}</p>
                  </div>
                )}
                <div>
                  <span className="text-sm font-medium text-green-800">Pasos del Funnel ({funnelSteps.length}):</span>
                  <div className="mt-2 space-y-2">
                    {funnelSteps.map((step, index) => (
                      <div key={index} className="flex items-start gap-2 text-sm">
                        <span className="font-bold text-gray-500">{index + 1}.</span>
                        <div>
                          <span className="font-medium text-gray-900">{step.step_name}</span>
                          <span className="text-gray-600"> ({step.event_type})</span>
                          <p className="text-xs text-gray-500">{step.page_route} - {step.trigger_type}</p>
                          {step.step_description && (
                            <p className="text-xs text-gray-500">{step.step_description}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <span className="text-sm font-medium text-green-800">Configuración de tracking:</span>
                  <p className="text-xs text-gray-600 mt-1">
                    ✓ Auto-tracking habilitado<br />
                    ✓ GTM habilitado<br />
                    ✓ Facebook Pixel habilitado
                  </p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Error banner */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-red-800">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800"
          >
            ✕
          </button>
        </div>
      )}

      {/* Guide Section */}
      <CustomerJourneysGuide />

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Customer Journeys</h1>
            <p className="text-gray-600 mt-2">
              Configura y monitorea los customer journeys y funnels de conversión
            </p>
          </div>
          <Dialog open={isWizardOpen} onOpenChange={setIsWizardOpen}>
            <DialogTrigger asChild>
              <Button className="bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4 mr-2" />
                Nuevo Customer Journey
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[700px] max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-2xl font-bold text-gray-900">Crear Customer Journey</DialogTitle>
                <DialogDescription className="sr-only">
                  Paso {currentStep} de 3: {currentStep === 1 ? 'Información básica' : currentStep === 2 ? 'Configurar pasos del funnel' : 'Revisar y confirmar'}
                </DialogDescription>

                {/* Visual wizard progress */}
                <div className="mt-4 mb-6">
                  <div className="flex items-center justify-between">
                    {[1, 2, 3].map((step) => (
                      <React.Fragment key={step}>
                        <div className="flex flex-col items-center flex-1">
                          <div className={`
                            w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all
                            ${currentStep === step
                              ? 'bg-indigo-600 text-white shadow-lg scale-110'
                              : currentStep > step
                                ? 'bg-green-500 text-white'
                                : 'bg-gray-200 text-gray-500'}
                          `}>
                            {currentStep > step ? <CheckCircle2 className="w-6 h-6" /> : step}
                          </div>
                          <span className={`text-xs mt-2 font-medium ${currentStep === step ? 'text-indigo-600' : 'text-gray-500'}`}>
                            {step === 1 ? 'Información' : step === 2 ? 'Pasos' : 'Confirmar'}
                          </span>
                        </div>
                        {step < 3 && (
                          <div className={`flex-1 h-1 mx-2 rounded-full transition-all ${currentStep > step ? 'bg-green-500' : 'bg-gray-200'}`} />
                        )}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              </DialogHeader>

              {renderWizardStep()}

              <div className="flex justify-between mt-6 pt-4 border-t">
                <Button
                  variant="outline"
                  onClick={() => {
                    if (currentStep === 1) {
                      setIsWizardOpen(false);
                      resetWizard();
                    } else {
                      setCurrentStep(currentStep - 1);
                    }
                  }}
                  disabled={isCreating}
                >
                  {currentStep === 1 ? 'Cancelar' : 'Anterior'}
                </Button>
                <Button
                  onClick={() => {
                    if (currentStep === 3) {
                      handleCreateJourney();
                    } else {
                      setCurrentStep(currentStep + 1);
                    }
                  }}
                  disabled={
                    isCreating ||
                    (currentStep === 1 && (!journeyName || !journeyRoute)) ||
                    (currentStep === 2 && funnelSteps.length === 0)
                  }
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Creando...
                    </>
                  ) : (
                    currentStep === 3 ? 'Crear Journey' : 'Siguiente'
                  )}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Journeys List */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-4" />
          <p className="text-gray-600">Cargando customer journeys...</p>
        </div>
      ) : journeys.length === 0 ? (
        <Card className="p-12">
          <div className="text-center">
            <Route className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay customer journeys</h3>
            <p className="text-gray-600 mb-6">
              Crea tu primer customer journey para comenzar a trackear el funnel de conversión.
            </p>
            <Button
              onClick={() => setIsWizardOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Crear Customer Journey
            </Button>
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {journeys.map((journey) => (
            <Card key={journey.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <Route className="w-5 h-5 text-indigo-600" />
                      <CardTitle>{journey.name}</CardTitle>
                      <Badge className={getStatusColor(journey.status)}>
                        {journey.status === 'active' ? 'Activo' : journey.status === 'paused' ? 'Pausado' : 'Borrador'}
                      </Badge>
                    </div>
                    <CardDescription className="text-sm">
                      <span className="font-mono text-indigo-600">{journey.route}</span>
                    </CardDescription>
                    {journey.description && (
                      <p className="text-sm text-gray-600 mt-2">{journey.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => journey.id && toggleJourneyStatus(journey.id)}
                    >
                      {journey.status === 'active' ? (
                        <><Pause className="w-4 h-4 mr-1" /> Pausar</>
                      ) : (
                        <><Play className="w-4 h-4 mr-1" /> Activar</>
                      )}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadGTMExport(journey)}
                      title="Export to GTM"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadEventsJSON(journey)}
                      title="Export Events JSON"
                    >
                      <FileJson className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => journey.id && deleteJourney(journey.id)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <BarChart3 className="w-4 h-4 mr-2" />
                    Pasos del Funnel ({journey.steps?.length || 0})
                  </h4>
                  <div className="relative">
                    {journey.steps?.map((step, index) => {
                      const eventTemplate = EVENT_TEMPLATES.find(t => t.value === step.event_type);
                      const StepIcon = eventTemplate?.icon || Circle;

                      return (
                        <div key={step.id} className="relative">
                          {/* Connector line */}
                          {index < (journey.steps?.length || 0) - 1 && (
                            <div className="absolute left-5 top-12 w-0.5 h-6 bg-gradient-to-b from-indigo-200 to-transparent" />
                          )}

                          {/* Step card */}
                          <div className="flex items-start gap-3 p-3 bg-gradient-to-r from-gray-50 to-white rounded-lg border border-gray-100 mb-2 hover:shadow-sm transition-all">
                            {/* Step badge with icon */}
                            <div className={`w-10 h-10 rounded-full ${eventTemplate?.bgColor || 'bg-gray-100'} flex items-center justify-center flex-shrink-0 shadow-sm border-2 border-white`}>
                              {eventTemplate ? (
                                <StepIcon className={`w-5 h-5 ${eventTemplate.color}`} />
                              ) : (
                                <span className="text-sm font-bold text-gray-700">{step.step_order}</span>
                              )}
                            </div>

                            {/* Step content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <span className="font-medium text-gray-900">{step.step_name}</span>
                                <span className="text-xs font-bold text-gray-400">#{step.step_order}</span>
                              </div>
                              <Badge variant="secondary" className="text-xs mb-1">
                                {eventTemplate?.label || step.event_type}
                              </Badge>
                              <p className="text-xs text-gray-600 font-mono bg-white px-2 py-0.5 rounded border border-gray-200 inline-block">
                                {step.page_route}
                              </p>
                              {step.step_description && (
                                <p className="text-xs text-gray-500 mt-1 italic">{step.step_description}</p>
                              )}
                            </div>

                            {/* Arrow indicator for flow */}
                            {index < (journey.steps?.length || 0) - 1 && (
                              <div className="text-indigo-300 flex-shrink-0">→</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
                {journey.created_at && journey.updated_at && (
                  <div className="mt-4 pt-4 border-t flex items-center justify-between text-xs text-gray-500">
                    <span>Creado: {new Date(journey.created_at).toLocaleDateString()}</span>
                    <span>Actualizado: {new Date(journey.updated_at).toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerJourneysPage;
