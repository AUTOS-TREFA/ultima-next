import React, { useState, useEffect, useCallback } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  marketingConfigService,
  MarketingConfig,
  ConversionEvent,
  TrackingEvent
} from '../services/MarketingConfigService';
import {
  Settings,
  TrendingUp,
  Activity,
  Download,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Terminal,
  Radio,
  BarChart3,
  Zap,
  RefreshCw,
  PlayCircle,
  StopCircle,
  Clock,
  Target,
  Globe
} from 'lucide-react';

const configSchema = z.object({
  gtm_container_id: z.string().regex(/^GTM-[A-Z0-9]+$/, 'Debe ser formato GTM-XXXXXXX'),
  facebook_pixel_id: z.string().regex(/^\d{15,16}$/, 'Debe ser un ID de 15-16 dígitos'),
  google_analytics_id: z.string().regex(/^G-[A-Z0-9]+$/, 'Debe ser formato G-XXXXXXXXXX').optional().or(z.literal('')),
});

type ConfigFormData = z.infer<typeof configSchema>;

// Helper function to get URL for each event type
const getEventUrl = (eventType: string): string => {
  const urlMap: Record<string, string> = {
    'PageView': 'https://trefa.mx/*',
    'ViewContent': 'https://trefa.mx/autos/*',
    'InitialRegistration': 'https://trefa.mx/acceder',
    'PersonalInformationComplete': 'https://trefa.mx/escritorio/profile/',
    'LeadComplete': 'https://trefa.mx/escritorio/aplicacion/*',
    'ConversionLandingPage': 'https://trefa.mx/financiamientos',
    'PerfilacionBancariaComplete': 'https://trefa.mx/escritorio/perfilacion-bancaria',
  };
  return urlMap[eventType] || 'https://trefa.mx';
};

// Helper function to get event parameters for each event type (DLV format)
const getEventParameters = (eventType: string): Record<string, string> => {
  const paramsMap: Record<string, Record<string, string>> = {
    'PageView': {
      'url': '{{DLV - Page URL}}',
      'pageTitle': '{{DLV - Page Title}}',
      'userId': '{{DLV - User ID}}',
    },
    'ViewContent': {
      'contentType': '{{DLV - Content Type}}',
      'vehicleId': '{{DLV - Vehicle ID}}',
      'vehiclePrice': '{{DLV - Vehicle Price}}',
      'vehicleName': '{{DLV - Vehicle Name}}',
    },
    'InitialRegistration': {
      'userId': '{{DLV - User ID}}',
      'email': '{{DLV - User Email}}',
      'registrationMethod': '{{DLV - Registration Method}}',
    },
    'PersonalInformationComplete': {
      'userId': '{{DLV - User ID}}',
      'email': '{{DLV - User Email}}',
      'profileStatus': '{{DLV - Profile Status}}',
    },
    'LeadComplete': {
      'userId': '{{DLV - User ID}}',
      'email': '{{DLV - User Email}}',
      'applicationId': '{{DLV - Application ID}}',
      'loanAmount': '{{DLV - Loan Amount}}',
    },
    'ConversionLandingPage': {
      'formType': '{{DLV - Form Type}}',
      'source': '{{DLV - Lead Source}}',
      'email': '{{DLV - User Email}}',
    },
    'PerfilacionBancariaComplete': {
      'userId': '{{DLV - User ID}}',
      'email': '{{DLV - User Email}}',
      'bankProfileStatus': '{{DLV - Bank Profile Status}}',
    },
  };
  return paramsMap[eventType] || {};
};

const defaultConversionEvents: ConversionEvent[] = [
  {
    id: 'pageview',
    name: 'Vista de Página',
    event_type: 'PageView',
    trigger_location: 'Todas las páginas',
    enabled: true,
    fb_enabled: true,
    gtm_enabled: true,
  },
  {
    id: 'viewcontent',
    name: 'Ver Contenido',
    event_type: 'ViewContent',
    trigger_location: 'Páginas de vehículos',
    enabled: true,
    fb_enabled: true,
    gtm_enabled: true,
  },
  {
    id: 'initialregistration',
    name: 'Registro Inicial',
    event_type: 'InitialRegistration',
    trigger_location: 'Página de autenticación',
    enabled: true,
    fb_enabled: true,
    gtm_enabled: true,
  },
  {
    id: 'personalinfocomplete',
    name: 'Información Personal Completa',
    event_type: 'PersonalInformationComplete',
    trigger_location: 'Página de perfil',
    enabled: true,
    fb_enabled: true,
    gtm_enabled: true,
  },
  {
    id: 'leadcomplete',
    name: 'Lead Completo',
    event_type: 'LeadComplete',
    trigger_location: 'Aplicación de financiamiento',
    enabled: true,
    fb_enabled: true,
    gtm_enabled: true,
  },
  {
    id: 'conversionlandingpage',
    name: 'Conversión Landing Page',
    event_type: 'ConversionLandingPage',
    trigger_location: 'Página de financiamientos',
    enabled: true,
    fb_enabled: true,
    gtm_enabled: true,
  },
];

interface PixelDiagnostics {
  isLoaded: boolean;
  version: string | null;
  pixelId: string | null;
  queueLength: number;
  lastEvent: string | null;
  errors: string[];
}

interface GTMDiagnostics {
  isLoaded: boolean;
  containerId: string | null;
  dataLayerLength: number;
  lastPush: any;
  errors: string[];
}

export default function MarketingConfigPage() {
  const [config, setConfig] = useState<MarketingConfig | null>(null);
  const [conversionEvents, setConversionEvents] = useState<ConversionEvent[]>(defaultConversionEvents);
  const [recentEvents, setRecentEvents] = useState<TrackingEvent[]>([]);
  const [leadSources, setLeadSources] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'config' | 'events' | 'analytics' | 'monitor'>('config');
  const [isSaving, setIsSaving] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Real-time monitoring state
  const [isMonitoring, setIsMonitoring] = useState(false);
  const [liveEvents, setLiveEvents] = useState<TrackingEvent[]>([]);
  const [pixelDiagnostics, setPixelDiagnostics] = useState<PixelDiagnostics | null>(null);
  const [gtmDiagnostics, setGTMDiagnostics] = useState<GTMDiagnostics | null>(null);
  const [eventStats, setEventStats] = useState<any>({});
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());

  const { control, handleSubmit, setValue, formState: { errors } } = useForm<ConfigFormData>({
    resolver: zodResolver(configSchema),
    defaultValues: {
      gtm_container_id: 'GTM-KDVDMB4X',
      facebook_pixel_id: '846689825695126',
      google_analytics_id: 'G-E580PSBCHH',
    }
  });

  useEffect(() => {
    loadConfig();
    loadRecentEvents();
    loadLeadSources();
    checkDiagnostics();
  }, []);

  // Auto-refresh for monitoring tab
  useEffect(() => {
    if (isMonitoring && activeTab === 'monitor') {
      const interval = setInterval(() => {
        loadRecentEvents();
        checkDiagnostics();
        calculateEventStats();
        setLastRefresh(new Date());
      }, 5000); // Refresh every 5 seconds

      return () => clearInterval(interval);
    }
  }, [isMonitoring, activeTab]);

  const loadConfig = async () => {
    const loadedConfig = await marketingConfigService.getConfig();
    if (loadedConfig) {
      setConfig(loadedConfig);
      setValue('gtm_container_id', loadedConfig.gtm_container_id);
      setValue('facebook_pixel_id', loadedConfig.facebook_pixel_id);
      setValue('google_analytics_id', loadedConfig.google_analytics_id || '');

      // Always start with default events and merge settings from saved config
      if (loadedConfig.conversion_events && loadedConfig.conversion_events.length > 0) {
        // Create a map of saved events by event_type for matching
        const savedEventsMap = new Map(
          loadedConfig.conversion_events.map(e => [e.event_type, e])
        );

        // Merge: keep default structure but use saved enabled states if they exist
        const mergedEvents = defaultConversionEvents.map(defaultEvent => {
          const savedEvent = savedEventsMap.get(defaultEvent.event_type);
          if (savedEvent) {
            // Use saved enabled states but keep default id and other properties
            return {
              ...defaultEvent,
              enabled: savedEvent.enabled,
              fb_enabled: savedEvent.fb_enabled,
              gtm_enabled: savedEvent.gtm_enabled,
            };
          }
          return defaultEvent;
        });

        setConversionEvents(mergedEvents);
      } else {
        // No saved events, use defaults
        setConversionEvents(defaultConversionEvents);
      }
    }
  };

  const loadRecentEvents = async () => {
    const events = await marketingConfigService.getTrackingEvents({ limit: 50 });
    setRecentEvents(events);
    if (isMonitoring) {
      // Add new events to live stream
      setLiveEvents(prev => [...events.slice(0, 10), ...prev].slice(0, 20));
    }
  };

  const loadLeadSources = async () => {
    const sources = await marketingConfigService.getLeadSourceAnalytics();
    setLeadSources(sources);
  };

  const checkDiagnostics = useCallback(() => {
    // Check Facebook Pixel status
    const fbPixel: PixelDiagnostics = {
      isLoaded: typeof (window as any).fbq !== 'undefined',
      version: (window as any).fbq?.version || null,
      pixelId: config?.facebook_pixel_id || null,
      queueLength: (window as any)._fbq?.queue?.length || 0,
      lastEvent: null,
      errors: []
    };

    // Try to detect pixel errors
    if (fbPixel.isLoaded && !fbPixel.version) {
      fbPixel.errors.push('Pixel loaded but version not detected');
    }

    setPixelDiagnostics(fbPixel);

    // Check GTM status
    const gtm: GTMDiagnostics = {
      isLoaded: typeof (window as any).google_tag_manager !== 'undefined',
      containerId: config?.gtm_container_id || null,
      dataLayerLength: (window as any).dataLayer?.length || 0,
      lastPush: (window as any).dataLayer?.[(window as any).dataLayer?.length - 1] || null,
      errors: []
    };

    if ((window as any).dataLayer && (window as any).dataLayer.length === 0) {
      gtm.errors.push('DataLayer is empty');
    }

    setGTMDiagnostics(gtm);
  }, [config]);

  const calculateEventStats = useCallback(() => {
    if (recentEvents.length === 0) return;

    const stats = {
      total: recentEvents.length,
      byType: {} as Record<string, number>,
      bySource: {} as Record<string, number>,
      last24h: 0,
      lastHour: 0,
    };

    const now = new Date();
    const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

    recentEvents.forEach(event => {
      // Count by type
      stats.byType[event.event_type] = (stats.byType[event.event_type] || 0) + 1;

      // Count by source
      const source = event.utm_source || 'direct';
      stats.bySource[source] = (stats.bySource[source] || 0) + 1;

      // Time-based counts
      if (event.created_at) {
        const eventDate = new Date(event.created_at);
        if (eventDate > oneDayAgo) stats.last24h++;
        if (eventDate > oneHourAgo) stats.lastHour++;
      }
    });

    setEventStats(stats);
  }, [recentEvents]);

  // Calculate stats when events change or when viewing analytics/monitor tabs
  useEffect(() => {
    if (recentEvents.length > 0 && (activeTab === 'analytics' || activeTab === 'monitor')) {
      calculateEventStats();
    }
  }, [recentEvents, activeTab, calculateEventStats]);

  const onSubmit = async (data: ConfigFormData) => {
    setIsSaving(true);
    setMessage(null);

    const configData: Partial<MarketingConfig> = {
      ...data,
      conversion_events: conversionEvents,
      active: true,
    };

    let result;
    if (config?.id) {
      result = await marketingConfigService.updateConfig(config.id, configData);
    } else {
      result = await marketingConfigService.saveConfig(configData);
    }

    setIsSaving(false);

    if (result.success) {
      setMessage({ type: 'success', text: '✅ Configuración guardada exitosamente' });
      await loadConfig();
      // Reload page to reinitialize tracking scripts
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } else {
      setMessage({ type: 'error', text: `❌ Error: ${result.error}` });
    }
  };

  const toggleEvent = (eventId: string, field: 'enabled' | 'fb_enabled' | 'gtm_enabled') => {
    setConversionEvents(prev =>
      prev.map(event =>
        event.id === eventId ? { ...event, [field]: !event[field] } : event
      )
    );
  };

  const testTracking = () => {
    const result = marketingConfigService.testTracking();
    setTestResult(result);

    // Test firing a sample event
    if (result.config) {
      marketingConfigService.trackConversionEvent(
        'test_event',
        'Lead',
        { test: true, timestamp: new Date().toISOString() }
      );
    }

    // Refresh diagnostics after test
    setTimeout(() => {
      checkDiagnostics();
      loadRecentEvents();
    }, 1000);
  };

  const testFacebookPixel = () => {
    if (typeof (window as any).fbq === 'undefined') {
      alert('❌ Facebook Pixel no está cargado');
      return;
    }

    // Fire a test event
    (window as any).fbq('track', 'Lead', {
      content_name: 'Test Event from Admin',
      test_event_code: 'TEST12345'
    });

    alert('✅ Evento de prueba enviado a Facebook Pixel. Verifica en Facebook Events Manager.');

    setTimeout(() => {
      checkDiagnostics();
      loadRecentEvents();
    }, 1000);
  };

  const exportGTMContainer = () => {
    const container = generateGTMContainer();
    const blob = new Blob([JSON.stringify(container, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'gtm-container-export.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  const generateGTMContainer = () => {
    return {
      exportFormatVersion: 2,
      exportTime: new Date().toISOString(),
      containerVersion: {
        path: "accounts/XXXXXX/containers/XXXXXX/versions/0",
        accountId: "XXXXXX",
        containerId: config?.gtm_container_id || "GTM-XXXXXX",
        containerVersionId: "0",
        name: "TREFA - Marketing Tracking",
        description: "Container para tracking de conversiones y eventos de marketing",
        container: {
          path: "accounts/XXXXXX/containers/XXXXXX",
          accountId: "XXXXXX",
          containerId: config?.gtm_container_id || "GTM-XXXXXX",
          name: "TREFA Website",
          publicId: config?.gtm_container_id || "GTM-XXXXXX",
          usageContext: ["WEB"],
          fingerprint: Date.now().toString(),
          tagManagerUrl: `https://tagmanager.google.com/#/container/accounts/XXXXXX/containers/${config?.gtm_container_id || 'GTM-XXXXXX'}/workspaces/0`,
        },
        tag: conversionEvents.filter(e => e.gtm_enabled).map((event, index) => ({
          accountId: "XXXXXX",
          containerId: config?.gtm_container_id || "GTM-XXXXXX",
          tagId: (index + 1).toString(),
          name: `FB Pixel - ${event.name}`,
          type: "html",
          parameter: [
            {
              type: "TEMPLATE",
              key: "html",
              value: `<script>
  if (window.fbq) {
    fbq('track', '${event.event_type}', {
      content_name: '{{Event Name}}',
      source: '{{utm_source}}',
      medium: '{{utm_medium}}',
      campaign: '{{utm_campaign}}'
    });
  }
</script>`
            },
            {
              type: "BOOLEAN",
              key: "supportDocumentWrite",
              value: "false"
            }
          ],
          fingerprint: Date.now().toString(),
          firingTriggerId: [(index + 1).toString()],
          tagFiringOption: "ONCE_PER_EVENT",
          monitoringMetadata: {
            type: "MAP"
          }
        })),
        trigger: conversionEvents.filter(e => e.gtm_enabled).map((event, index) => ({
          accountId: "XXXXXX",
          containerId: config?.gtm_container_id || "GTM-XXXXXX",
          triggerId: (index + 1).toString(),
          name: `Trigger - ${event.name}`,
          type: "CUSTOM_EVENT",
          customEventFilter: [
            {
              type: "EQUALS",
              parameter: [
                {
                  type: "TEMPLATE",
                  key: "arg0",
                  value: "{{_event}}"
                },
                {
                  type: "TEMPLATE",
                  key: "arg1",
                  value: event.event_type.toLowerCase()
                }
              ]
            }
          ],
          fingerprint: Date.now().toString()
        })),
        variable: [
          {
            accountId: "XXXXXX",
            containerId: config?.gtm_container_id || "GTM-XXXXXX",
            variableId: "1",
            name: "Event Name",
            type: "v",
            parameter: [{ type: "TEMPLATE", key: "name", value: "eventName" }]
          },
          {
            accountId: "XXXXXX",
            containerId: config?.gtm_container_id || "GTM-XXXXXX",
            variableId: "2",
            name: "utm_source",
            type: "v",
            parameter: [{ type: "TEMPLATE", key: "name", value: "utm_source" }]
          },
          {
            accountId: "XXXXXX",
            containerId: config?.gtm_container_id || "GTM-XXXXXX",
            variableId: "3",
            name: "utm_medium",
            type: "v",
            parameter: [{ type: "TEMPLATE", key: "name", value: "utm_medium" }]
          },
          {
            accountId: "XXXXXX",
            containerId: config?.gtm_container_id || "GTM-XXXXXX",
            variableId: "4",
            name: "utm_campaign",
            type: "v",
            parameter: [{ type: "TEMPLATE", key: "name", value: "utm_campaign" }]
          }
        ],
        fingerprint: Date.now().toString(),
        tagManagerUrl: `https://tagmanager.google.com/#/container/accounts/XXXXXX/containers/${config?.gtm_container_id || 'GTM-XXXXXX'}/workspaces/0`
      }
    };
  };

  const toggleMonitoring = () => {
    setIsMonitoring(!isMonitoring);
    if (!isMonitoring) {
      setLiveEvents([]);
      loadRecentEvents();
      checkDiagnostics();
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Configuración de Marketing</h1>
                <p className="text-sm text-gray-500">Google Tag Manager y Facebook Pixel</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={testTracking}
                className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
              >
                <Activity className="w-4 h-4" />
                Test Tracking
              </button>
              <button
                onClick={testFacebookPixel}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Target className="w-4 h-4" />
                Test FB Pixel
              </button>
              <button
                onClick={exportGTMContainer}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
              >
                <Download className="w-4 h-4" />
                Exportar GTM
              </button>
            </div>
          </div>

          {/* Test Result */}
          {testResult && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h3 className="font-semibold mb-2">Estado del Tracking:</h3>
              <div className="grid grid-cols-3 gap-4">
                <div className="flex items-center gap-2">
                  {testResult.config ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span>Configuración: {testResult.config ? 'OK' : 'No configurado'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {testResult.gtm ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span>GTM: {testResult.gtm ? 'Activo' : 'Inactivo'}</span>
                </div>
                <div className="flex items-center gap-2">
                  {testResult.facebook ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span>FB Pixel: {testResult.facebook ? 'Activo' : 'Inactivo'}</span>
                </div>
              </div>
            </div>
          )}

          {/* Message */}
          {message && (
            <div className={`mt-4 p-4 rounded-lg ${message.type === 'success' ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              {message.type === 'error' && message.text.includes('migración') ? (
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-semibold text-red-900">Tablas de base de datos no encontradas</p>
                      <p className="text-sm text-red-700 mt-1">
                        Necesitas aplicar las migraciones de base de datos antes de usar esta función.
                      </p>
                    </div>
                  </div>
                  <div className="bg-gray-900 text-green-400 p-3 rounded font-mono text-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <Terminal className="w-4 h-4" />
                      <span className="text-gray-400">Ejecuta en tu terminal:</span>
                    </div>
                    <code>supabase db push</code>
                  </div>
                  <p className="text-xs text-red-600">
                    Esto creará las tablas <code className="bg-red-100 px-1 py-0.5 rounded">marketing_config</code> y{' '}
                    <code className="bg-red-100 px-1 py-0.5 rounded">tracking_events</code> en tu base de datos.
                  </p>
                </div>
              ) : (
                <p className={message.type === 'success' ? 'text-green-800' : 'text-red-800'}>{message.text}</p>
              )}
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-sm mb-6">
          <div className="border-b border-gray-200">
            <nav className="flex -mb-px">
              <button
                onClick={() => setActiveTab('config')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'config'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Settings className="w-4 h-4 inline mr-2" />
                Configuración
              </button>
              <button
                onClick={() => setActiveTab('events')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'events'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Activity className="w-4 h-4 inline mr-2" />
                Eventos de Conversión
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'analytics'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <TrendingUp className="w-4 h-4 inline mr-2" />
                Analytics
              </button>
              <button
                onClick={() => {
                  setActiveTab('monitor');
                  if (!isMonitoring) toggleMonitoring();
                }}
                className={`px-6 py-3 border-b-2 font-medium text-sm ${
                  activeTab === 'monitor'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Radio className="w-4 h-4 inline mr-2" />
                Monitor en Vivo
                {isMonitoring && <span className="ml-2 inline-block w-2 h-2 bg-red-600 rounded-full animate-pulse"></span>}
              </button>
            </nav>
          </div>

          <div className="p-6">
            {/* Configuration Tab */}
            {activeTab === 'config' && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Tag Manager Container ID
                  </label>
                  <Controller
                    name="gtm_container_id"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="GTM-XXXXXXX"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  />
                  {errors.gtm_container_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.gtm_container_id.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Ejemplo: GTM-XXXXXX. Obtén este ID desde tu cuenta de Google Tag Manager.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Facebook Pixel ID
                  </label>
                  <Controller
                    name="facebook_pixel_id"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="123456789012345"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  />
                  {errors.facebook_pixel_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.facebook_pixel_id.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    ID numérico de 15-16 dígitos. Encuéntralo en Facebook Business Manager → Eventos.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Google Analytics 4 ID (Opcional)
                  </label>
                  <Controller
                    name="google_analytics_id"
                    control={control}
                    render={({ field }) => (
                      <input
                        {...field}
                        type="text"
                        placeholder="G-XXXXXXXXXX"
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    )}
                  />
                  {errors.google_analytics_id && (
                    <p className="mt-1 text-sm text-red-600">{errors.google_analytics_id.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">
                    Opcional. Formato: G-XXXXXXXXXX
                  </p>
                </div>

                <button
                  type="submit"
                  disabled={isSaving}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Guardando...' : 'Guardar Configuración'}
                </button>
              </form>
            )}

            {/* Events Tab */}
            {activeTab === 'events' && (
              <div className="space-y-4">
                <p className="text-sm text-gray-600 mb-4">
                  Configura qué eventos de conversión se trackean en GTM y Facebook Pixel.
                </p>
                {conversionEvents.map((event) => (
                  <div key={event.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900">{event.name}</h3>
                        <p className="text-sm text-gray-500">Evento: {event.event_type}</p>
                        <p className="text-xs text-gray-400">Ubicación: {event.trigger_location}</p>
                        <p className="text-xs text-blue-600 mt-1">
                          <Globe className="w-3 h-3 inline mr-1" />
                          URL: <a href={getEventUrl(event.event_type)} target="_blank" rel="noopener noreferrer" className="hover:underline">{getEventUrl(event.event_type)}</a>
                        </p>
                        <div className="mt-2">
                          <p className="text-xs font-medium text-gray-600">Parámetros del evento:</p>
                          <div className="mt-1 bg-gray-50 rounded p-2 text-xs text-gray-700">
                            {Object.entries(getEventParameters(event.event_type)).map(([key, value]) => (
                              <div key={key} className="mb-1">
                                <span className="font-mono text-blue-600">{key}</span>: <span className="text-gray-600">{value}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                      <label className="flex items-center gap-2 ml-4">
                        <input
                          type="checkbox"
                          checked={event.enabled}
                          onChange={() => toggleEvent(event.id, 'enabled')}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium">Activo</span>
                      </label>
                    </div>
                    <div className="flex gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={event.gtm_enabled}
                          onChange={() => toggleEvent(event.id, 'gtm_enabled')}
                          disabled={!event.enabled}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <span className="text-sm">GTM</span>
                      </label>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={event.fb_enabled}
                          onChange={() => toggleEvent(event.id, 'fb_enabled')}
                          disabled={!event.enabled}
                          className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                        />
                        <span className="text-sm">Facebook Pixel</span>
                      </label>
                    </div>
                  </div>
                ))}
                <button
                  onClick={handleSubmit(onSubmit)}
                  disabled={isSaving}
                  className="w-full px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition"
                >
                  Guardar Eventos
                </button>
              </div>
            )}

            {/* Analytics Tab */}
            {activeTab === 'analytics' && (
              <div className="space-y-6">
                {/* Lead Sources */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Fuentes de Leads</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {leadSources.map((source, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-semibold text-gray-900">{source.source}</h4>
                          <span className="text-2xl font-bold text-blue-600">{source.count}</span>
                        </div>
                        {source.medium && (
                          <p className="text-xs text-gray-500">Medium: {source.medium}</p>
                        )}
                        {source.campaign && (
                          <p className="text-xs text-gray-500">Campaign: {source.campaign}</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Events */}
                <div>
                  <h3 className="text-lg font-semibold mb-4">Eventos Recientes</h3>
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Evento</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fuente</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Fecha</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {recentEvents.map((event, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {event.event_name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {event.event_type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {event.utm_source || 'Direct'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {event.created_at ? new Date(event.created_at).toLocaleDateString('es-MX') : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Real-Time Monitor Tab */}
            {activeTab === 'monitor' && (
              <div className="space-y-6">
                {/* Monitor Controls */}
                <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    {isMonitoring ? (
                      <div className="flex items-center gap-2">
                        <Radio className="w-5 h-5 text-red-600 animate-pulse" />
                        <span className="font-semibold text-gray-900">Monitoreo Activo</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Radio className="w-5 h-5 text-gray-400" />
                        <span className="font-semibold text-gray-600">Monitoreo Pausado</span>
                      </div>
                    )}
                    <span className="text-sm text-gray-500">
                      Última actualización: {lastRefresh.toLocaleTimeString('es-MX')}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        loadRecentEvents();
                        checkDiagnostics();
                        calculateEventStats();
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Actualizar
                    </button>
                    <button
                      onClick={toggleMonitoring}
                      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${
                        isMonitoring
                          ? 'bg-red-600 text-white hover:bg-red-700'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {isMonitoring ? (
                        <>
                          <StopCircle className="w-4 h-4" />
                          Detener
                        </>
                      ) : (
                        <>
                          <PlayCircle className="w-4 h-4" />
                          Iniciar
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Diagnostics Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Facebook Pixel Status */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Facebook Pixel</h3>
                      {pixelDiagnostics?.isLoaded ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    {pixelDiagnostics && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estado:</span>
                          <span className={pixelDiagnostics.isLoaded ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {pixelDiagnostics.isLoaded ? 'Cargado' : 'No Cargado'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Pixel ID:</span>
                          <span className="font-mono text-xs">{pixelDiagnostics.pixelId || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Versión:</span>
                          <span>{pixelDiagnostics.version || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Cola de eventos:</span>
                          <span>{pixelDiagnostics.queueLength}</span>
                        </div>
                        {pixelDiagnostics.errors.length > 0 && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-xs text-red-700 font-semibold mb-1">Errores:</p>
                            {pixelDiagnostics.errors.map((error, i) => (
                              <p key={i} className="text-xs text-red-600">• {error}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* GTM Status */}
                  <div className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Google Tag Manager</h3>
                      {gtmDiagnostics?.isLoaded ? (
                        <CheckCircle className="w-6 h-6 text-green-600" />
                      ) : (
                        <XCircle className="w-6 h-6 text-red-600" />
                      )}
                    </div>
                    {gtmDiagnostics && (
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Estado:</span>
                          <span className={gtmDiagnostics.isLoaded ? 'text-green-600 font-semibold' : 'text-red-600 font-semibold'}>
                            {gtmDiagnostics.isLoaded ? 'Cargado' : 'No Cargado'}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Container ID:</span>
                          <span className="font-mono text-xs">{gtmDiagnostics.containerId || 'N/A'}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">DataLayer:</span>
                          <span>{gtmDiagnostics.dataLayerLength} eventos</span>
                        </div>
                        {gtmDiagnostics.lastPush && (
                          <div className="mt-2 p-2 bg-gray-50 rounded">
                            <p className="text-xs text-gray-600 mb-1">Último push:</p>
                            <pre className="text-xs overflow-auto max-h-20">
                              {JSON.stringify(gtmDiagnostics.lastPush, null, 2)}
                            </pre>
                          </div>
                        )}
                        {gtmDiagnostics.errors.length > 0 && (
                          <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded">
                            <p className="text-xs text-red-700 font-semibold mb-1">Errores:</p>
                            {gtmDiagnostics.errors.map((error, i) => (
                              <p key={i} className="text-xs text-red-600">• {error}</p>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                {/* Event Statistics */}
                {eventStats.total > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-blue-50 to-blue-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Total Eventos</p>
                          <p className="text-3xl font-bold text-blue-600">{eventStats.total}</p>
                        </div>
                        <BarChart3 className="w-10 h-10 text-blue-600 opacity-50" />
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-green-50 to-green-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Últimas 24h</p>
                          <p className="text-3xl font-bold text-green-600">{eventStats.last24h}</p>
                        </div>
                        <Clock className="w-10 h-10 text-green-600 opacity-50" />
                      </div>
                    </div>
                    <div className="border border-gray-200 rounded-lg p-4 bg-gradient-to-br from-purple-50 to-purple-100">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-600">Última Hora</p>
                          <p className="text-3xl font-bold text-purple-600">{eventStats.lastHour}</p>
                        </div>
                        <Zap className="w-10 h-10 text-purple-600 opacity-50" />
                      </div>
                    </div>
                  </div>
                )}

                {/* Event Type Distribution */}
                {eventStats.byType && Object.keys(eventStats.byType).length > 0 && (
                  <div className="border border-gray-200 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-4">Distribución por Tipo de Evento</h3>
                    <div className="space-y-3">
                      {Object.entries(eventStats.byType).map(([type, count]: [string, any]) => (
                        <div key={type} className="flex items-center gap-3">
                          <div className="flex-1">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-sm font-medium text-gray-700">{type}</span>
                              <span className="text-sm font-semibold text-gray-900">{count}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div
                                className="bg-blue-600 h-2 rounded-full transition-all"
                                style={{ width: `${(count / eventStats.total) * 100}%` }}
                              ></div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Live Event Stream */}
                <div className="border border-gray-200 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold text-gray-900">Stream de Eventos en Vivo</h3>
                    {isMonitoring && (
                      <span className="flex items-center gap-2 text-sm text-gray-600">
                        <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                        </span>
                        Actualizando cada 5s
                      </span>
                    )}
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {liveEvents.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <Activity className="w-12 h-12 mx-auto mb-2 opacity-50" />
                        <p>Esperando eventos...</p>
                        <p className="text-xs mt-1">Los nuevos eventos aparecerán aquí en tiempo real</p>
                      </div>
                    ) : (
                      liveEvents.map((event, index) => (
                        <div
                          key={`${event.id}-${index}`}
                          className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition animate-fade-in"
                        >
                          <div className="flex-shrink-0 mt-1">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-semibold text-gray-900 truncate">{event.event_name}</p>
                              <span className="text-xs text-gray-500 whitespace-nowrap">
                                {event.created_at ? new Date(event.created_at).toLocaleTimeString('es-MX') : 'Ahora'}
                              </span>
                            </div>
                            <div className="flex items-center gap-3 mt-1">
                              <span className="text-xs text-gray-600 bg-white px-2 py-0.5 rounded">
                                {event.event_type}
                              </span>
                              {event.utm_source && (
                                <span className="text-xs text-gray-600 flex items-center gap-1">
                                  <Globe className="w-3 h-3" />
                                  {event.utm_source}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="border border-blue-200 bg-blue-50 rounded-lg p-4">
                  <h3 className="font-semibold text-blue-900 mb-3">Acciones Rápidas</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    <button
                      onClick={testFacebookPixel}
                      className="flex items-center gap-2 px-4 py-3 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition text-sm"
                    >
                      <Target className="w-4 h-4 text-blue-600" />
                      <span>Enviar Evento de Prueba a FB</span>
                    </button>
                    <button
                      onClick={() => window.open('https://business.facebook.com/events_manager', '_blank')}
                      className="flex items-center gap-2 px-4 py-3 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition text-sm"
                    >
                      <Eye className="w-4 h-4 text-blue-600" />
                      <span>Abrir Events Manager</span>
                    </button>
                    <button
                      onClick={() => window.open(`https://tagmanager.google.com/#/container/accounts/XXXXXX/containers/${config?.gtm_container_id}/workspaces/0`, '_blank')}
                      className="flex items-center gap-2 px-4 py-3 bg-white border border-blue-300 rounded-lg hover:bg-blue-100 transition text-sm"
                    >
                      <Settings className="w-4 h-4 text-blue-600" />
                      <span>Abrir GTM Container</span>
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
          <h3 className="font-semibold text-blue-900 mb-3">📋 Instrucciones de Instalación</h3>
          <ol className="list-decimal list-inside space-y-2 text-sm text-blue-800">
            <li>Ingresa tu GTM Container ID y Facebook Pixel ID arriba</li>
            <li>Haz clic en "Guardar Configuración" - esto inicializará automáticamente GTM y FB Pixel</li>
            <li>Configura los eventos de conversión en la pestaña "Eventos de Conversión"</li>
            <li>Haz clic en "Exportar GTM" para descargar el contenedor y subirlo a Google Tag Manager</li>
            <li>Usa "Test Tracking" para verificar que todo esté funcionando correctamente</li>
            <li>Monitorea tus conversiones en tiempo real en la pestaña "Monitor en Vivo"</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
