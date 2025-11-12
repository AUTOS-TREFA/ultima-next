'use client';

import React, { useState } from 'react';
import { FileText, Download, Loader2, CheckCircle, AlertCircle, Sparkles, Building2 } from 'lucide-react';
import ValuationPDFService, { RecentCommit } from '../services/ValuationPDFService';
import ValuationPDFServiceV2 from '../services/ValuationPDFServiceV2';
import PlatformValuationService from '../services/PlatformValuationService';

const AdminValuationPage: React.FC = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVersion, setSelectedVersion] = useState<'v1' | 'v2' | 'platform'>('platform');

  const handleGeneratePDF = async () => {
    setIsGenerating(true);
    setSuccess(false);
    setError(null);

    try {
      // Get recent commits data (from the last 4 days as per requirements)
      const recentCommits: RecentCommit[] = [
        {
          hash: 'bee3c24',
          message: 'fix: Add Contactado checkbox to admin dashboard and route sales to admin client page with PDF features',
          date: 'hace 15 minutos'
        },
        {
          hash: '8de14e2',
          message: 'fix: Correct supabase import path in ConversionTrackingService',
          date: 'hace 46 minutos'
        },
        {
          hash: 'd986b08',
          message: 'fix: Route Facebook catalogue images through Cloudflare CDN to reduce Supabase egress',
          date: 'hace 46 minutos'
        },
        {
          hash: '099f8ec',
          message: 'fix: Save UTM parameters to tracking_events table',
          date: 'hace 57 minutos'
        },
        {
          hash: '894f709',
          message: 'fix: Move Facebook Pixel noscript to body to fix build error',
          date: 'hace 78 minutos'
        },
        {
          hash: '4ff4b69',
          message: 'fix: Add Facebook Pixel directly to index.html and fix event tracking',
          date: 'hace 2 horas'
        },
        {
          hash: '3107199',
          message: 'fix: Initialize Facebook Pixel on app startup',
          date: 'hace 3 horas'
        },
        {
          hash: '036a463',
          message: 'feat: Update Sales Dashboard UI to match admin CRM style',
          date: 'hace 4 horas'
        },
        {
          hash: 'dd50ebe',
          message: 'fix: Resolve ambiguous column reference and undefined variable in sales dashboard',
          date: 'hace 4 horas'
        },
        {
          hash: '8e912f6',
          message: 'fix: Update sidebar navigation links for sales role - separate sales and admin routes',
          date: 'hace 4 horas'
        },
        {
          hash: 'ba2cd04',
          message: 'fix: Add sales CRM access and authorize all assigned leads',
          date: 'hace 5 horas'
        },
        {
          hash: 'a1ea25e',
          message: 'feat: Update Facebook Pixel ID to new clean pixel',
          date: 'hace 5 horas'
        },
        {
          hash: '40807d7',
          message: 'feat: Add conversion tracking to ProfilePage save action',
          date: 'hace 7 horas'
        },
        {
          hash: '04a1b6c',
          message: 'feat: Replace Airtable config with Marketing Config and standardize terminology',
          date: 'hace 7 horas'
        },
        {
          hash: '9ee4ee9',
          message: 'feat: Add real-time monitoring and diagnostics to marketing config page',
          date: 'hace 7 horas'
        },
        {
          hash: '60faa3a',
          message: 'fix: Update GTM container ID to correct account (GTM-KDVDMB4X)',
          date: 'hace 8 horas'
        },
        {
          hash: 'a3de9f0',
          message: 'feat: Add conversion tracking to application and auth flows',
          date: 'hace 23 horas'
        },
        {
          hash: '7644cac',
          message: 'feat: Integrate Google Tag Manager (GTM-PQ2DXFCS) and marketing tracking system',
          date: 'hace 23 horas'
        },
        {
          hash: '05f4998',
          message: 'chore: Add supabase temp directory to gitignore',
          date: 'hace 25 horas'
        },
        {
          hash: '2879e99',
          message: 'fix: Sales dashboard now uses same data source as admin with contactado checkbox',
          date: 'hace 25 horas'
        },
        {
          hash: '35edf1a',
          message: 'feat: Add Intel documentation page and fix sales/admin access (v1.8.1)',
          date: 'hace 2 días'
        },
        {
          hash: '23ad43b',
          message: 'feat: Add v1.8.0 to changelog and integrate Gemini AI into AdminRoadmap',
          date: 'hace 2 días'
        },
        {
          hash: 'd804b72',
          message: 'feat: Add comprehensive Git safety and database backup systems',
          date: 'hace 2 días'
        },
        {
          hash: '4df1372',
          message: 'fix: Display advisor name instead of UUID in admin and printable pages',
          date: 'hace 2 días'
        },
        {
          hash: 'c1e4468',
          message: 'fix: Add missing closing div tag in ChangelogPage',
          date: 'hace 2 días'
        },
        {
          hash: '45c9ec0',
          message: 'fix: Remove spouse field from Application form and make roadmap dynamic',
          date: 'hace 2 días'
        },
        {
          hash: '8503306',
          message: 'fix: Correct supabaseClient import path in AdminRoadmapManager',
          date: 'hace 2 días'
        },
        {
          hash: '3ca0593',
          message: 'feat: Add admin interface for managing dynamic roadmap items',
          date: 'hace 2 días'
        },
        {
          hash: '7b768ae',
          message: 'refactor: Optimize post-submission confirmation page and relocate survey invitation',
          date: 'hace 3 días'
        },
        {
          hash: '7914142',
          message: 'fix: Resolve address undefined issue and optimize application confirmation page',
          date: 'hace 3 días'
        },
        {
          hash: 'dd678ba',
          message: 'fix: Restore document upload section visibility for all active applications',
          date: 'hace 3 días'
        },
        {
          hash: '0187ef2',
          message: 'docs: Add Car Studio fixes summary documentation',
          date: 'hace 3 días'
        },
        {
          hash: '7d5405e',
          message: 'fix: Fix Car Studio feature image replacement and vehicle selection issues',
          date: 'hace 3 días'
        },
        {
          hash: '9d74ab5',
          message: 'feat: Enhance Car Studio with RIGHT_FRONT feature image and vehicle tracking',
          date: 'hace 3 días'
        },
        {
          hash: 'b2db311',
          message: 'refactor: Redesign KitTrefaPage with modern UI and enhanced features',
          date: 'hace 3 días'
        },
        {
          hash: 'f138298',
          message: 'feat: Add Facebook catalogue feed and improve Sales UI',
          date: 'hace 3 días'
        },
        {
          hash: '6fb780b',
          message: 'feat: Add automatic traffic redirection to deploy script',
          date: 'hace 3 días'
        },
        {
          hash: '4cb2e8c',
          message: 'feat: Add conditional spouse name field in Profile and Application',
          date: 'hace 4 días'
        },
        {
          hash: '48fbb4c',
          message: 'feat: Add spouse name field for married applicants in application form',
          date: 'hace 4 días'
        },
        {
          hash: '0d02496',
          message: 'feat: Add source tracking and fix CRM access',
          date: 'hace 4 días'
        },
        {
          hash: '88e976e',
          message: 'Simplify function syntax for better compatibility',
          date: 'hace 4 días'
        },
        {
          hash: '8338be1',
          message: 'fix: Refactor sales role check using explicit variable declaration',
          date: 'hace 4 días'
        },
        {
          hash: '17dbd6c',
          message: 'fix: Allow sales role to access leads dashboard',
          date: 'hace 4 días'
        },
        {
          hash: '394d14b',
          message: 'feat: Add maintenance alert to valuation service',
          date: 'hace 4 días'
        },
        {
          hash: '0fcaac9',
          message: 'fix: Add Airtable environment variables to deployment script',
          date: 'hace 4 días'
        },
        {
          hash: '7ef9892',
          message: 'fix: Reduce hero heading size and improve spacing',
          date: 'hace 4 días'
        },
        {
          hash: 'e1ecf38',
          message: 'chore: Update changelog.html',
          date: 'hace 4 días'
        },
        {
          hash: 'd712b36',
          message: 'feat: Critical valuation fixes, SEO enhancements, and email automation (v1.7.0)',
          date: 'hace 4 días'
        },
      ];

      if (selectedVersion === 'platform') {
        const platformService = new PlatformValuationService();
        await platformService.generatePlatformValuation();
      } else {
        const pdfService = selectedVersion === 'v2'
          ? new ValuationPDFServiceV2()
          : new ValuationPDFService();
        await pdfService.generateValuationPDF(recentCommits);
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 5000);
    } catch (err) {
      console.error('Error generating PDF:', err);
      setError('Error al generar el PDF. Por favor, intenta de nuevo.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg mb-6">
            <FileText className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">
            Generador de Valuación Profesional
            {selectedVersion === 'v2' && <span className="ml-3 text-amber-600">v2.0</span>}
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Genera un reporte de valuación profesional en formato bancario para TREFA.MX,
            incluyendo análisis técnico completo y desarrollos recientes.
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden">
          {/* Version Selector */}
          <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-sm font-bold text-gray-700 mb-3">Selecciona el Tipo de Valuación</h3>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Platform Valuation Option */}
              <button
                onClick={() => setSelectedVersion('platform')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedVersion === 'platform'
                    ? 'border-emerald-600 bg-emerald-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${selectedVersion === 'platform' ? 'text-emerald-600' : 'text-gray-400'}`}>
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900 mb-1 flex items-center gap-2">
                      Valuación de Plataforma
                      <span className="px-2 py-0.5 bg-emerald-600 text-white text-xs rounded">RECOMENDADO</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      Valuación completa del stack tecnológico, análisis de mercado mexicano, y valor comercial. Formato bancario profesional. ~10 páginas.
                    </div>
                  </div>
                  {selectedVersion === 'platform' && (
                    <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* V1 Option */}
              <button
                onClick={() => setSelectedVersion('v1')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedVersion === 'v1'
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${selectedVersion === 'v1' ? 'text-blue-600' : 'text-gray-400'}`}>
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900 mb-1">Desarrollo v1.0</div>
                    <div className="text-xs text-gray-600">
                      Reporte de desarrollo con commits recientes y métricas técnicas. ~20 páginas.
                    </div>
                  </div>
                  {selectedVersion === 'v1' && (
                    <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </button>

              {/* V2 Option */}
              <button
                onClick={() => setSelectedVersion('v2')}
                className={`p-4 rounded-lg border-2 transition-all ${
                  selectedVersion === 'v2'
                    ? 'border-amber-600 bg-amber-50'
                    : 'border-gray-300 bg-white hover:border-gray-400'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-1 ${selectedVersion === 'v2' ? 'text-amber-600' : 'text-gray-400'}`}>
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <div className="text-left flex-1">
                    <div className="font-semibold text-gray-900 mb-1">Desarrollo v2.0</div>
                    <div className="text-xs text-gray-600">
                      Incluye arquitectura completa y catálogo de servicios. ~25-30 páginas.
                    </div>
                  </div>
                  {selectedVersion === 'v2' && (
                    <CheckCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                  )}
                </div>
              </button>
            </div>
          </div>

          {/* Info Section */}
          <div className={`${
            selectedVersion === 'platform' ? 'bg-gradient-to-r from-emerald-600 to-emerald-800' :
            selectedVersion === 'v2' ? 'bg-gradient-to-r from-amber-600 to-amber-800' :
            'bg-gradient-to-r from-blue-600 to-blue-800'
          } text-white px-8 py-6`}>
            <h2 className="text-2xl font-bold mb-3">
              {selectedVersion === 'platform' ? 'Valuación Integral de la Plataforma' :
               selectedVersion === 'v2' ? 'Características del Reporte v2.0 Enhanced' :
               'Características del Reporte v1.0'}
            </h2>
            <ul className="space-y-2">
              {selectedVersion === 'platform' ? (
                <>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <span className="font-semibold">📊 Valuación profesional: MXN $2,500,000 - $4,000,000</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Análisis completo del stack tecnológico Next.js 14 + Supabase</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Estudio de mercado automotriz mexicano (TAM $450B MXN)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Evaluación de problemas resueltos y valor generado</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Ventajas competitivas vs. Kavak, Nexu, y mercado tradicional</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Valoración financiera con 3 metodologías complementarias</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Evaluación de riesgos y estrategia de mitigación</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Recomendaciones estratégicas y plan de crecimiento</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Formato profesional estilo bancario para el mercado mexicano</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Valuación completa en MXN ($7,492,500 MXN)</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Incluye {48} commits recientes de los últimos 4 días</span>
                  </li>
                  {selectedVersion === 'v2' && (
                    <>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="font-semibold">✨ NUEVO: Análisis de tecnologías de vanguardia</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="font-semibold">✨ NUEVO: Sección completa de problemas resueltos con métricas antes/después</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="font-semibold">✨ NUEVO: Arquitectura backend completa con diagramas</span>
                      </li>
                      <li className="flex items-start">
                        <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                        <span className="font-semibold">✨ NUEVO: Catálogo completo de 31 servicios especializados</span>
                      </li>
                    </>
                  )}
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Análisis técnico detallado con métricas y proyecciones financieras</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Ventajas competitivas y recomendaciones estratégicas</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0" />
                    <span>Análisis de riesgos y plan de mitigación</span>
                  </li>
                </>
              )}
            </ul>
          </div>

          {/* Content Highlights */}
          <div className="px-8 py-6 bg-gray-50 border-b border-gray-200">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Contenido del Reporte</h3>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">📊 Análisis Financiero</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Desglose detallado de valuación</li>
                  <li>• Proyecciones financieras a 3 años</li>
                  <li>• ROI del 117%</li>
                  <li>• Análisis de costos e ingresos</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">💻 Métricas Técnicas</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• 269 archivos TypeScript/TSX</li>
                  <li>• 50,000+ líneas de código</li>
                  <li>• 19 Edge Functions desplegadas</li>
                  <li>• 13 integraciones de APIs</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">🚀 Funcionalidades</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Gestión completa de inventario</li>
                  <li>• CRM integrado sin SaaS externos</li>
                  <li>• Marketing Hub con IA</li>
                  <li>• Sistema de financiamiento digital</li>
                </ul>
              </div>
              <div className="bg-white p-4 rounded-lg border border-gray-200">
                <h4 className="font-semibold text-gray-900 mb-2">⚡ Desarrollos Recientes</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Integración Facebook Pixel</li>
                  <li>• Optimización de imágenes CDN</li>
                  <li>• Dashboard de ventas mejorado</li>
                  <li>• Sistema de tracking avanzado</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Section */}
          <div className="px-8 py-8">
            <button
              onClick={handleGeneratePDF}
              disabled={isGenerating}
              className={`w-full ${selectedVersion === 'v2' ? 'bg-gradient-to-r from-amber-600 to-amber-800 hover:from-amber-700 hover:to-amber-900' : 'bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-700 hover:to-blue-900'} text-white font-bold py-4 px-6 rounded-xl shadow-lg transform transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center gap-3 text-lg`}
            >
              {isGenerating ? (
                <>
                  <Loader2 className="w-6 h-6 animate-spin" />
                  Generando Reporte PDF {selectedVersion.toUpperCase()}...
                </>
              ) : (
                <>
                  {selectedVersion === 'v2' ? <Sparkles className="w-6 h-6" /> : <Download className="w-6 h-6" />}
                  Generar Reporte de Valuación PDF {selectedVersion.toUpperCase()}
                </>
              )}
            </button>

            {/* Success Message */}
            {success && (
              <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3 animate-fade-in">
                <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-green-900">¡PDF Generado Exitosamente!</p>
                  <p className="text-sm text-green-700">
                    El archivo se ha descargado automáticamente a tu computadora.
                  </p>
                </div>
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3">
                <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                <div>
                  <p className="font-semibold text-red-900">Error</p>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              </div>
            )}

            {/* Info Note */}
            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-sm text-blue-900">
                <span className="font-semibold">Nota:</span> El PDF generado es un documento
                profesional de calidad bancaria con más de 20 páginas que incluye análisis
                exhaustivo, métricas técnicas, proyecciones financieras y recomendaciones
                estratégicas. Ideal para presentaciones a inversores, instituciones financieras
                o para uso interno.
              </p>
            </div>
          </div>
        </div>

        {/* Technical Details Card */}
        <div className="mt-8 bg-white rounded-xl shadow-md border border-gray-200 p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-4">Detalles Técnicos del Documento</h3>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="text-gray-600 mb-1">Formato</p>
              <p className="font-semibold text-gray-900">PDF A4 (210x297mm)</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Páginas Aproximadas</p>
              <p className="font-semibold text-gray-900">20-25 páginas</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Tamaño de Archivo</p>
              <p className="font-semibold text-gray-900">~500-800 KB</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Moneda</p>
              <p className="font-semibold text-gray-900">MXN (Pesos Mexicanos)</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Tipo de Cambio</p>
              <p className="font-semibold text-gray-900">$18.50 MXN/USD</p>
            </div>
            <div>
              <p className="text-gray-600 mb-1">Fecha</p>
              <p className="font-semibold text-gray-900">{new Date().toLocaleDateString('es-MX', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminValuationPage;
