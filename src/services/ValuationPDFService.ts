/**
 * ValuationPDFService - Professional Bank-Like PDF Generator for TREFA.MX Valuation
 * Generates a comprehensive, formal valuation report in MXN for the Mexican market
 *
 * Features:
 * - Professional banking format with Mexican standards
 * - Comprehensive valuation analysis
 * - Recent development commits integration
 * - Currency formatting in MXN
 * - Formal language tailored for investors and stakeholders
 */

import jsPDF from 'jspdf';
import type { jsPDF as jsPDFType } from 'jspdf';

export interface RecentCommit {
  hash: string;
  message: string;
  date: string;
}

export class ValuationPDFService {
  private pdf: jsPDFType;
  private readonly PAGE_WIDTH = 210; // A4 width in mm
  private readonly PAGE_HEIGHT = 297; // A4 height in mm
  private readonly MARGIN = 20;
  private readonly CONTENT_WIDTH = 170; // PAGE_WIDTH - 2*MARGIN
  private currentY = 20;

  // Professional color scheme for banking documents
  private readonly COLORS = {
    primary: '#1e3a8a',      // Deep blue for headers
    secondary: '#3b82f6',    // Lighter blue for accents
    success: '#059669',      // Green for positive metrics
    text: '#1f2937',         // Dark gray for body text
    lightGray: '#f3f4f6',    // Light gray for backgrounds
    border: '#d1d5db',       // Border color
    warning: '#f59e0b',      // Amber for highlights
  };

  constructor() {
    this.pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4',
    });
  }

  /**
   * Generates the complete valuation PDF
   */
  public async generateValuationPDF(commits: RecentCommit[]): Promise<void> {
    this.addCoverPage();
    this.addExecutiveSummary();
    this.addValuationTable();
    this.addTechnicalMetrics();
    this.addRecentDevelopments(commits);
    this.addFeaturesList();
    this.addCompetitiveAdvantages();
    this.addFinancialProjections();
    this.addRiskAnalysis();
    this.addRecommendations();
    this.addFooterToAllPages();

    const fileName = `Valuacion_TREFA_MX_${new Date().toISOString().split('T')[0]}.pdf`;
    this.pdf.save(fileName);
  }

  /**
   * Add professional cover page
   */
  private addCoverPage(): void {
    // Header with company branding area
    this.setColor(this.COLORS.primary);
    this.pdf.setFillColor(this.COLORS.primary);
    this.pdf.rect(0, 0, this.PAGE_WIDTH, 60, 'F');

    // Title
    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(28);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('REPORTE DE VALUACIÓN', this.PAGE_WIDTH / 2, 25, { align: 'center' });

    this.pdf.setFontSize(22);
    this.pdf.text('TÉCNICA Y COMERCIAL', this.PAGE_WIDTH / 2, 35, { align: 'center' });

    this.pdf.setFontSize(16);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Plataforma Digital TREFA.MX', this.PAGE_WIDTH / 2, 50, { align: 'center' });

    // Main info box
    this.currentY = 80;
    this.setColor(this.COLORS.text);

    this.pdf.setFontSize(12);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('INFORMACIÓN DEL DOCUMENTO', this.MARGIN, this.currentY);

    this.currentY += 10;
    this.pdf.setDrawColor(this.COLORS.border);
    this.pdf.setLineWidth(0.5);
    this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 70);

    this.currentY += 10;
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(10);

    const coverInfo = [
      ['Fecha de Evaluación:', this.formatDate(new Date())],
      ['Versión de la Aplicación:', 'v1.0 (Producción)'],
      ['Tipo de Documento:', 'Valuación Técnica y Comercial'],
      ['Entidad:', 'Grupo TREFA, S.A. de C.V.'],
      ['Metodología:', 'Análisis Comparativo Multi-Enfoque'],
      ['Confidencialidad:', 'DOCUMENTO CONFIDENCIAL - USO INTERNO'],
    ];

    coverInfo.forEach(([label, value]) => {
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(label, this.MARGIN + 5, this.currentY);
      this.pdf.setFont('helvetica', 'normal');
      this.pdf.text(value, this.MARGIN + 70, this.currentY);
      this.currentY += 8;
    });

    // Valuation highlight box
    this.currentY = 170;
    this.pdf.setFillColor(this.COLORS.success);
    this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 50, 'F');

    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('VALUACIÓN OFICIAL', this.PAGE_WIDTH / 2, this.currentY + 12, { align: 'center' });

    this.pdf.setFontSize(32);
    this.pdf.text('$7,492,500 MXN', this.PAGE_WIDTH / 2, this.currentY + 28, { align: 'center' });

    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('(Equivalente a $405,000 USD)', this.PAGE_WIDTH / 2, this.currentY + 40, { align: 'center' });

    // Disclaimer
    this.currentY = 240;
    this.setColor(this.COLORS.text);
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'italic');
    const disclaimer = 'Este documento contiene información confidencial y propietaria de Grupo TREFA. La distribución, ' +
      'reproducción o uso no autorizado está estrictamente prohibido. La valuación presentada se basa en ' +
      'análisis técnico exhaustivo y metodologías de mercado reconocidas al ' + this.formatDate(new Date()) + '.';

    const disclaimerLines = this.pdf.splitTextToSize(disclaimer, this.CONTENT_WIDTH);
    this.pdf.text(disclaimerLines, this.MARGIN, this.currentY);

    this.addPageNumber();
  }

  /**
   * Add executive summary page
   */
  private addExecutiveSummary(): void {
    this.addNewPage();

    this.addSectionHeader('RESUMEN EJECUTIVO');

    // Overview
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Descripción General', this.MARGIN, this.currentY);
    this.currentY += 7;

    this.pdf.setFont('helvetica', 'normal');
    const overview = 'TREFA.MX es una plataforma SaaS (Software as a Service) de financiamiento automotriz que ' +
      'digitaliza completamente el proceso de compra y venta de vehículos seminuevos. La aplicación representa ' +
      'una solución integral que conecta inventario, clientes, instituciones financieras y equipos de ventas ' +
      'en un ecosistema digital unificado, desarrollado específicamente para el mercado mexicano.';

    const overviewLines = this.pdf.splitTextToSize(overview, this.CONTENT_WIDTH);
    this.pdf.text(overviewLines, this.MARGIN, this.currentY);
    this.currentY += overviewLines.length * 5 + 5;

    // Key highlights box
    this.pdf.setFillColor(240, 249, 255);
    this.pdf.setDrawColor(this.COLORS.secondary);
    this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 60, 'FD');

    this.currentY += 8;
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.setColor(this.COLORS.primary);
    this.pdf.text('PUNTOS CLAVE DE VALOR', this.MARGIN + 5, this.currentY);

    this.currentY += 8;
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    this.setColor(this.COLORS.text);

    const keyPoints = [
      '✓ Arquitectura técnica de clase mundial con 99.9% de disponibilidad',
      '✓ Stack tecnológico moderno: React, TypeScript, PostgreSQL, Edge Functions',
      '✓ 1,600+ horas de desarrollo profesional por ingeniero senior',
      '✓ Reemplaza $55,000-$75,000 USD/año en servicios SaaS externos',
      '✓ ROI proyectado de 117% a 3 años',
      '✓ Cobertura funcional completa del ciclo de financiamiento automotriz',
      '✓ Integración con IA: Valuación, Procesamiento de Imágenes, Generación de Contenido',
    ];

    keyPoints.forEach(point => {
      const lines = this.pdf.splitTextToSize(point, this.CONTENT_WIDTH - 10);
      this.pdf.text(lines, this.MARGIN + 5, this.currentY);
      this.currentY += lines.length * 5;
    });

    this.currentY += 10;

    // Market context
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.setFontSize(10);
    this.pdf.text('Contexto de Mercado', this.MARGIN, this.currentY);
    this.currentY += 7;

    this.pdf.setFont('helvetica', 'normal');
    const marketContext = 'El mercado automotriz mexicano representa una oportunidad significativa con más de 1.3 ' +
      'millones de vehículos nuevos y seminuevos comercializados anualmente. La digitalización del proceso de ' +
      'financiamiento representa una ventaja competitiva crucial en un sector tradicionalmente operado de forma manual. ' +
      'TREFA.MX se posiciona como una solución integral que aborda directamente las ineficiencias del mercado.';

    const marketLines = this.pdf.splitTextToSize(marketContext, this.CONTENT_WIDTH);
    this.pdf.text(marketLines, this.MARGIN, this.currentY);
    this.currentY += marketLines.length * 5;
  }

  /**
   * Add detailed valuation breakdown table
   */
  private addValuationTable(): void {
    this.addNewPage();
    this.addSectionHeader('DESGLOSE DETALLADO DE VALUACIÓN');

    // Table headers
    this.pdf.setFillColor(this.COLORS.primary);
    this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 10, 'F');

    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Componente', this.MARGIN + 2, this.currentY + 7);
    this.pdf.text('Valor (MXN)', this.MARGIN + 90, this.currentY + 7);
    this.pdf.text('Valor (USD)', this.MARGIN + 130, this.currentY + 7);
    this.pdf.text('%', this.MARGIN + 165, this.currentY + 7);

    this.currentY += 10;

    // Table data
    const valuationComponents = [
      { component: 'Desarrollo de Software', mxn: '2,220,000 - 2,775,000', usd: '120,000 - 150,000', pct: '35%' },
      { component: 'Infraestructura Tecnológica', mxn: '555,000 - 740,000', usd: '30,000 - 40,000', pct: '10%' },
      { component: 'Integraciones y APIs', mxn: '740,000 - 1,110,000', usd: '40,000 - 60,000', pct: '15%' },
      { component: 'Propiedad Intelectual', mxn: '1,480,000 - 1,850,000', usd: '80,000 - 100,000', pct: '25%' },
      { component: 'Base de Datos y Arquitectura', mxn: '462,500 - 647,500', usd: '25,000 - 35,000', pct: '8%' },
      { component: 'Valor Estratégico', mxn: '925,000 - 1,480,000', usd: '50,000 - 80,000', pct: '7%' },
    ];

    this.pdf.setFont('helvetica', 'normal');
    this.setColor(this.COLORS.text);

    valuationComponents.forEach((row, index) => {
      // Alternating row colors
      if (index % 2 === 0) {
        this.pdf.setFillColor(249, 250, 251);
        this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 8, 'F');
      }

      this.pdf.setFontSize(8);
      this.pdf.text(row.component, this.MARGIN + 2, this.currentY + 5.5);
      this.pdf.text(row.mxn, this.MARGIN + 90, this.currentY + 5.5);
      this.pdf.text(row.usd, this.MARGIN + 130, this.currentY + 5.5);
      this.pdf.text(row.pct, this.MARGIN + 165, this.currentY + 5.5);

      this.currentY += 8;
    });

    // Total row
    this.pdf.setFillColor(this.COLORS.success);
    this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 12, 'F');

    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('VALUACIÓN TOTAL', this.MARGIN + 2, this.currentY + 8);
    this.pdf.text('$6,382,500 - $8,602,500', this.MARGIN + 90, this.currentY + 8);
    this.pdf.text('$345,000 - $465,000', this.MARGIN + 130, this.currentY + 8);
    this.pdf.text('100%', this.MARGIN + 165, this.currentY + 8);

    this.currentY += 20;
    this.setColor(this.COLORS.text);

    // Valuation summary box
    this.pdf.setFillColor(254, 252, 232);
    this.pdf.setDrawColor(this.COLORS.warning);
    this.pdf.setLineWidth(1);
    this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 40, 'FD');

    this.currentY += 10;
    this.pdf.setFontSize(11);
    this.pdf.text('VALUACIÓN PROMEDIO RECOMENDADA', this.PAGE_WIDTH / 2, this.currentY, { align: 'center' });

    this.currentY += 10;
    this.pdf.setFontSize(20);
    this.setColor(this.COLORS.success);
    this.pdf.text('$7,492,500 MXN', this.PAGE_WIDTH / 2, this.currentY, { align: 'center' });

    this.currentY += 8;
    this.pdf.setFontSize(12);
    this.pdf.text('($405,000 USD)', this.PAGE_WIDTH / 2, this.currentY, { align: 'center' });

    this.currentY += 15;
    this.setColor(this.COLORS.text);

    // Methodology note
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'italic');
    const methodology = 'Tipo de Cambio utilizado: $18.50 MXN/USD. Metodología: Promedio ponderado de tres enfoques ' +
      '(Costo de Desarrollo 35%, Valor de Mercado 40%, Valor Estratégico 25%) con ajustes por factores técnicos y de mercado.';
    const methodLines = this.pdf.splitTextToSize(methodology, this.CONTENT_WIDTH - 10);
    this.pdf.text(methodLines, this.MARGIN + 5, this.currentY);
  }

  /**
   * Add technical metrics and statistics
   */
  private addTechnicalMetrics(): void {
    this.addNewPage();
    this.addSectionHeader('MÉTRICAS TÉCNICAS DE LA PLATAFORMA');

    const metrics = [
      {
        category: 'Arquitectura de Código',
        items: [
          { label: 'Archivos TypeScript/TSX', value: '269 archivos' },
          { label: 'Líneas de código', value: '~50,000 LOC' },
          { label: 'Componentes React', value: '150+ componentes' },
          { label: 'Páginas implementadas', value: '58 páginas' },
          { label: 'Servicios especializados', value: '25 servicios' },
        ]
      },
      {
        category: 'Base de Datos y Backend',
        items: [
          { label: 'Migraciones de base de datos', value: '52+ migraciones' },
          { label: 'Tablas principales', value: '20+ tablas' },
          { label: 'Edge Functions desplegadas', value: '19 funciones' },
          { label: 'Funciones PostgreSQL', value: '25+ stored procedures' },
          { label: 'Políticas RLS', value: '100% cobertura' },
        ]
      },
      {
        category: 'Integraciones Externas',
        items: [
          { label: 'APIs de terceros', value: '13 integraciones' },
          { label: 'Servicios de IA', value: '3 proveedores' },
          { label: 'Herramientas de marketing', value: '5 plataformas' },
          { label: 'Sistemas de CRM', value: '2 integraciones' },
          { label: 'Disponibilidad del sistema', value: '99.9%' },
        ]
      },
    ];

    metrics.forEach(section => {
      this.pdf.setFillColor(this.COLORS.primary);
      this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 8, 'F');

      this.pdf.setTextColor(255, 255, 255);
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(section.category, this.MARGIN + 3, this.currentY + 5.5);

      this.currentY += 8;

      this.pdf.setFont('helvetica', 'normal');
      this.setColor(this.COLORS.text);
      this.pdf.setFontSize(9);

      section.items.forEach((item, index) => {
        if (index % 2 === 0) {
          this.pdf.setFillColor(249, 250, 251);
          this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 7, 'F');
        }

        this.pdf.text(item.label, this.MARGIN + 3, this.currentY + 5);
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text(item.value, this.MARGIN + 120, this.currentY + 5);
        this.pdf.setFont('helvetica', 'normal');

        this.currentY += 7;
      });

      this.currentY += 5;
    });

    // Development time box
    this.pdf.setFillColor(240, 253, 244);
    this.pdf.setDrawColor(this.COLORS.success);
    this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 35, 'FD');

    this.currentY += 10;
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('TIEMPO Y ESFUERZO DE DESARROLLO', this.MARGIN + 5, this.currentY);

    this.currentY += 8;
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(9);

    const devMetrics = [
      ['Período de desarrollo:', 'Febrero - Octubre 2025 (8 meses)'],
      ['Horas totales invertidas:', '1,600+ horas de desarrollo'],
      ['Perfil del desarrollador:', 'Ingeniero Full-Stack Senior'],
      ['Tarifa promedio de mercado:', '$75-85 USD/hora'],
    ];

    devMetrics.forEach(([label, value]) => {
      this.pdf.text(label, this.MARGIN + 5, this.currentY);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(value, this.MARGIN + 70, this.currentY);
      this.pdf.setFont('helvetica', 'normal');
      this.currentY += 6;
    });
  }

  /**
   * Add recent developments and commits
   */
  private addRecentDevelopments(commits: RecentCommit[]): void {
    this.addNewPage();
    this.addSectionHeader('DESARROLLOS RECIENTES (ÚLTIMOS 4 DÍAS)');

    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    const intro = 'La plataforma continúa en desarrollo activo con mejoras constantes. A continuación se presentan ' +
      'las actualizaciones más recientes que demuestran el compromiso con la excelencia técnica y la evolución ' +
      'continua del producto:';
    const introLines = this.pdf.splitTextToSize(intro, this.CONTENT_WIDTH);
    this.pdf.text(introLines, this.MARGIN, this.currentY);
    this.currentY += introLines.length * 5 + 8;

    // Group commits by category
    const categorizedCommits = this.categorizeCommits(commits);

    Object.entries(categorizedCommits).forEach(([category, categoryCommits]) => {
      if (categoryCommits.length === 0) return;

      // Check if we need a new page
      if (this.currentY > 250) {
        this.addNewPage();
      }

      // Category header
      this.pdf.setFillColor(59, 130, 246);
      this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 7, 'F');

      this.pdf.setTextColor(255, 255, 255);
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(category, this.MARGIN + 2, this.currentY + 5);

      this.currentY += 7;
      this.setColor(this.COLORS.text);

      // Commits
      this.pdf.setFontSize(8);
      categoryCommits.forEach((commit, index) => {
        if (this.currentY > 270) {
          this.addNewPage();
        }

        if (index % 2 === 0) {
          this.pdf.setFillColor(249, 250, 251);
          this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 10, 'F');
        }

        // Commit bullet
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.text('•', this.MARGIN + 2, this.currentY + 4);

        // Commit message
        this.pdf.setFont('helvetica', 'normal');
        const message = commit.message.length > 95 ? commit.message.substring(0, 92) + '...' : commit.message;
        const messageLines = this.pdf.splitTextToSize(message, this.CONTENT_WIDTH - 15);
        this.pdf.text(messageLines, this.MARGIN + 5, this.currentY + 4);

        // Date
        this.pdf.setFont('helvetica', 'italic');
        this.pdf.setFontSize(7);
        this.pdf.text(commit.date, this.MARGIN + 5, this.currentY + 7);
        this.pdf.setFontSize(8);

        this.currentY += 10;
      });

      this.currentY += 3;
    });

    // Impact summary
    this.currentY += 5;
    this.pdf.setFillColor(254, 243, 199);
    this.pdf.setDrawColor(this.COLORS.warning);
    this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 25, 'FD');

    this.currentY += 8;
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('IMPACTO DE DESARROLLOS RECIENTES', this.MARGIN + 5, this.currentY);

    this.currentY += 7;
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.setFontSize(8);
    const impact = `Los ${commits.length} commits realizados en los últimos 4 días representan mejoras significativas en ` +
      'tracking de marketing, optimización de rendimiento, y experiencia de usuario. Estas actualizaciones demuestran ' +
      'el desarrollo continuo y la capacidad de respuesta del equipo técnico.';
    const impactLines = this.pdf.splitTextToSize(impact, this.CONTENT_WIDTH - 10);
    this.pdf.text(impactLines, this.MARGIN + 5, this.currentY);
  }

  /**
   * Add comprehensive features list
   */
  private addFeaturesList(): void {
    this.addNewPage();
    this.addSectionHeader('FUNCIONALIDADES PRINCIPALES DEL SISTEMA');

    const features = [
      {
        module: 'Gestión de Inventario',
        features: [
          'Catálogo digital completo de vehículos seminuevos',
          'Sincronización automática multi-fuente (WordPress → Supabase → Airtable)',
          'Sistema de filtrado avanzado por marca, modelo, año, precio, enganche',
          'Búsqueda inteligente con sugerencias en tiempo real',
          'Vista dual: lista detallada y galería visual',
          'Tracking de vehículos vistos recientemente',
          'Sistema de favoritos para usuarios registrados',
        ]
      },
      {
        module: 'Financiamiento Digital',
        features: [
          'Solicitud de financiamiento 100% digital y sin papel',
          'Formulario multi-paso con validación en tiempo real',
          'Perfilamiento bancario inteligente para optimizar aprobaciones',
          'Carga segura de documentos con drag & drop',
          'Calculadora de financiamiento interactiva integrada',
          'Notificaciones automáticas por email en cada etapa',
          'Dashboard de seguimiento para usuarios',
        ]
      },
      {
        module: 'CRM Integrado',
        features: [
          'Sistema completo de gestión de leads sin herramientas externas',
          'Asignación automática de asesores de ventas',
          'Vista 360° del cliente con todo su historial',
          'Sistema de etiquetado y clasificación de clientes',
          'Dashboard de métricas y KPIs en tiempo real',
          'Gestión de recordatorios y seguimientos',
          'Integración bidireccional con Kommo CRM',
        ]
      },
      {
        module: 'Marketing Hub',
        features: [
          'Constructor visual de landing pages dinámicas',
          'Sistema A/B/C testing para optimización de conversión',
          'Generación de contenido con IA (Google Gemini)',
          'Procesamiento de imágenes con Car Studio AI',
          'Gestión centralizada de tracking (GA4, GTM, Facebook Pixel)',
          'Constructor de UTMs para campañas',
          'Exportación de catálogo a Facebook Catalog',
        ]
      },
      {
        module: 'Valuación de Vehículos',
        features: [
          'Valuación instantánea con Intelimotor API',
          'Búsqueda de vehículos en lenguaje natural',
          'Generación de oferta en menos de 10 segundos',
          'Datos de mercado actualizados en tiempo real',
          'Captura automática de leads de compra',
          'Contacto directo vía WhatsApp',
        ]
      },
    ];

    features.forEach(section => {
      if (this.currentY > 250) {
        this.addNewPage();
      }

      // Module header
      this.pdf.setFillColor(this.COLORS.primary);
      this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 8, 'F');

      this.pdf.setTextColor(255, 255, 255);
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(section.module, this.MARGIN + 3, this.currentY + 5.5);

      this.currentY += 8;

      // Features
      this.pdf.setFont('helvetica', 'normal');
      this.setColor(this.COLORS.text);
      this.pdf.setFontSize(8);

      section.features.forEach(feature => {
        if (this.currentY > 280) {
          this.addNewPage();
        }

        this.pdf.text('✓', this.MARGIN + 2, this.currentY + 4);
        const featureLines = this.pdf.splitTextToSize(feature, this.CONTENT_WIDTH - 10);
        this.pdf.text(featureLines, this.MARGIN + 7, this.currentY + 4);
        this.currentY += featureLines.length * 4.5 + 1;
      });

      this.currentY += 4;
    });
  }

  /**
   * Add competitive advantages section
   */
  private addCompetitiveAdvantages(): void {
    this.addNewPage();
    this.addSectionHeader('VENTAJAS COMPETITIVAS Y DIFERENCIADORES');

    const advantages = [
      {
        title: 'Arquitectura Multi-Fuente Patentable',
        description: 'Sistema único de 3 capas con fallback automático que garantiza 99.9% de disponibilidad de datos, ' +
          'superando el estándar de la industria del 95%. Esta arquitectura es potencialmente patentable y representa ' +
          'una ventaja técnica significativa.',
        impact: 'Alto',
      },
      {
        title: 'Automatización Integral con IA',
        description: 'Integración de múltiples servicios de inteligencia artificial (Intelimotor para valuación, ' +
          'Car Studio para procesamiento de imágenes, Google Gemini para generación de contenido) que reducen el ' +
          'tiempo operativo en 70% comparado con procesos manuales.',
        impact: 'Alto',
      },
      {
        title: 'CRM Propietario Integrado',
        description: 'Sistema de gestión de relaciones con clientes desarrollado internamente y perfectamente integrado, ' +
          'eliminando la necesidad de SaaS externos como Salesforce ($300K+/año) o HubSpot ($50K+/año).',
        impact: 'Medio-Alto',
      },
      {
        title: 'Perfilamiento Bancario Inteligente',
        description: 'Algoritmo propietario que analiza el perfil financiero del solicitante y determina qué institución ' +
          'bancaria tiene mayor probabilidad de aprobar el crédito, aumentando la tasa de aprobación en un estimado del 25%.',
        impact: 'Alto',
      },
      {
        title: 'Experiencia Mobile-First',
        description: 'Vista de exploración tipo Tinder optimizada para dispositivos móviles que aumenta el engagement ' +
          'en 3x comparado con catálogos tradicionales, especialmente relevante dado que el 70% del tráfico es móvil.',
        impact: 'Medio',
      },
      {
        title: 'Seguridad a Nivel Empresarial',
        description: 'Implementación completa de Row Level Security (RLS) en todas las tablas de la base de datos, ' +
          'garantizando aislamiento total de datos por usuario y cumplimiento con estándares de protección de datos personales.',
        impact: 'Alto',
      },
      {
        title: 'Escalabilidad Serverless',
        description: 'Arquitectura basada en Edge Functions y servicios serverless que permite escalar automáticamente ' +
          'sin costos fijos adicionales. Costo marginal por usuario adicional de solo $0.50/mes.',
        impact: 'Medio-Alto',
      },
    ];

    advantages.forEach((advantage, index) => {
      if (this.currentY > 240) {
        this.addNewPage();
      }

      // Advantage box
      const impactColor: [number, number, number] = advantage.impact === 'Alto' ? [5, 150, 105] :
                         advantage.impact === 'Medio-Alto' ? [59, 130, 246] : [107, 114, 128];

      this.pdf.setDrawColor(...impactColor);
      this.pdf.setLineWidth(0.8);
      this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 35, 'D');

      // Impact badge
      this.pdf.setFillColor(...impactColor);
      this.pdf.rect(this.MARGIN + this.CONTENT_WIDTH - 30, this.currentY + 2, 28, 6, 'F');
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.setFontSize(7);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`IMPACTO ${advantage.impact.toUpperCase()}`, this.MARGIN + this.CONTENT_WIDTH - 29, this.currentY + 6);

      // Title
      this.currentY += 8;
      this.setColor(this.COLORS.primary);
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`${index + 1}. ${advantage.title}`, this.MARGIN + 3, this.currentY);

      // Description
      this.currentY += 5;
      this.setColor(this.COLORS.text);
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'normal');
      const descLines = this.pdf.splitTextToSize(advantage.description, this.CONTENT_WIDTH - 6);
      this.pdf.text(descLines, this.MARGIN + 3, this.currentY);

      this.currentY += 30;
    });
  }

  /**
   * Add financial projections
   */
  private addFinancialProjections(): void {
    this.addNewPage();
    this.addSectionHeader('PROYECCIONES FINANCIERAS Y ROI');

    // Year 1 projections
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Proyección Año 1 (Conservadora)', this.MARGIN, this.currentY);
    this.currentY += 8;

    // Revenue table
    this.pdf.setFillColor(this.COLORS.primary);
    this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 8, 'F');

    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(9);
    this.pdf.text('Concepto', this.MARGIN + 2, this.currentY + 5.5);
    this.pdf.text('Valor (MXN)', this.MARGIN + 110, this.currentY + 5.5);
    this.pdf.text('Valor (USD)', this.MARGIN + 145, this.currentY + 5.5);

    this.currentY += 8;

    const financials = [
      { concept: 'Ingresos Proyectados (150 vehículos)', mxn: '$3,330,000', usd: '$180,000', isRevenue: true },
      { concept: '  • Comisión promedio por vehículo', mxn: '$22,200', usd: '$1,200', isDetail: true },
      { concept: '', mxn: '', usd: '', isSpace: true },
      { concept: 'Costos Operativos:', mxn: '', usd: '', isSubheader: true },
      { concept: '  • Infraestructura cloud', mxn: '$172,235', usd: '$9,310', isDetail: true },
      { concept: '  • Mantenimiento (20% desarrollo)', mxn: '$555,000', usd: '$30,000', isDetail: true },
      { concept: 'Total Costos Operativos', mxn: '$727,235', usd: '$39,310', isCost: true },
      { concept: '', mxn: '', usd: '', isSpace: true },
      { concept: 'UTILIDAD NETA PROYECTADA', mxn: '$2,602,765', usd: '$140,690', isProfit: true },
      { concept: 'Margen de Utilidad', mxn: '78.2%', usd: '78.2%', isMargin: true },
    ];

    this.setColor(this.COLORS.text);
    financials.forEach((row, index) => {
      if (row.isSpace) {
        this.currentY += 4;
        return;
      }

      if (row.isProfit) {
        this.pdf.setFillColor(5, 150, 105);
        this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 10, 'F');
        this.pdf.setTextColor(255, 255, 255);
        this.pdf.setFontSize(10);
        this.pdf.setFont('helvetica', 'bold');
      } else if (row.isRevenue || row.isCost) {
        this.pdf.setFillColor(249, 250, 251);
        this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 8, 'F');
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setFontSize(9);
      } else if (row.isSubheader) {
        this.pdf.setFont('helvetica', 'bold');
        this.pdf.setFontSize(9);
      } else {
        if (index % 2 === 0) {
          this.pdf.setFillColor(255, 255, 255);
          this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 7, 'F');
        }
        this.pdf.setFont('helvetica', 'normal');
        this.pdf.setFontSize(8);
      }

      const yOffset = row.isProfit ? 7 : 5;
      this.pdf.text(row.concept, this.MARGIN + 2, this.currentY + yOffset);
      this.pdf.text(row.mxn, this.MARGIN + 110, this.currentY + yOffset);
      this.pdf.text(row.usd, this.MARGIN + 145, this.currentY + yOffset);

      if (!row.isProfit && !row.isMargin) {
        this.setColor(this.COLORS.text);
      }

      this.currentY += row.isProfit ? 10 : (row.isCost || row.isRevenue ? 8 : 7);
    });

    this.currentY += 10;

    // ROI Box
    this.pdf.setFillColor(254, 243, 199);
    this.pdf.setDrawColor(this.COLORS.warning);
    this.pdf.setLineWidth(1);
    this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 40, 'FD');

    this.currentY += 10;
    this.setColor(this.COLORS.text);
    this.pdf.setFontSize(11);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('RETORNO DE INVERSIÓN (ROI)', this.PAGE_WIDTH / 2, this.currentY, { align: 'center' });

    this.currentY += 10;
    this.pdf.setFontSize(9);
    this.pdf.setFont('helvetica', 'normal');
    this.pdf.text('Inversión inicial (valuación):', this.MARGIN + 10, this.currentY);
    this.pdf.text('$7,492,500 MXN', this.MARGIN + 100, this.currentY);

    this.currentY += 7;
    this.pdf.text('Utilidad neta anual proyectada:', this.MARGIN + 10, this.currentY);
    this.pdf.text('$2,602,765 MXN', this.MARGIN + 100, this.currentY);

    this.currentY += 7;
    this.pdf.setFont('helvetica', 'bold');
    this.setColor(this.COLORS.success);
    this.pdf.setFontSize(12);
    this.pdf.text('ROI a 3 años: 117%', this.PAGE_WIDTH / 2, this.currentY, { align: 'center' });

    this.currentY += 10;
    this.setColor(this.COLORS.text);

    // Growth potential
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('Potencial de Crecimiento', this.MARGIN, this.currentY);
    this.currentY += 7;

    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'normal');
    const growthText = 'Con las inversiones recomendadas en testing, seguridad y escalabilidad ($211,000 USD en 12 meses), ' +
      'la plataforma podría alcanzar una valuación de $12-15 millones MXN ($650,000-$800,000 USD) mediante la ' +
      'implementación de modelo SaaS multi-tenant y expansión a 10+ agencias automotrices.';
    const growthLines = this.pdf.splitTextToSize(growthText, this.CONTENT_WIDTH);
    this.pdf.text(growthLines, this.MARGIN, this.currentY);
  }

  /**
   * Add risk analysis section
   */
  private addRiskAnalysis(): void {
    this.addNewPage();
    this.addSectionHeader('ANÁLISIS DE RIESGOS Y MITIGACIÓN');

    const risks = [
      {
        risk: 'Dependencia de Desarrollador Único',
        level: 'Alto',
        description: 'El conocimiento técnico está concentrado en una sola persona, lo que representa un riesgo de continuidad.',
        mitigation: 'Implementar programa de transferencia de conocimiento, documentación exhaustiva, y contratar desarrollador adicional.',
        priority: 'Inmediata',
      },
      {
        risk: 'Ausencia de Suite de Testing',
        level: 'Medio-Alto',
        description: 'No existen tests unitarios ni de integración automatizados, aumentando el riesgo de regresiones.',
        mitigation: 'Inversión de $9,000 USD para implementar Vitest y Playwright con cobertura mínima del 60%.',
        priority: 'Corto Plazo (1-3 meses)',
      },
      {
        risk: 'Dependencia de APIs Externas',
        level: 'Medio',
        description: 'Servicios críticos (Intelimotor, Car Studio, Gemini) podrían discontinuarse o cambiar pricing.',
        mitigation: 'Establecer contratos SLA, implementar proveedores alternativos, y crear fondos de contingencia.',
        priority: 'Mediano Plazo (3-6 meses)',
      },
      {
        risk: 'Credentials Hardcodeadas',
        level: 'Medio',
        description: 'Algunas API keys están en el código fuente, representando un riesgo de seguridad.',
        mitigation: 'Migrar todas las credenciales a Google Secret Manager. Inversión: $3,000 USD.',
        priority: 'Corto Plazo (1-3 meses)',
      },
      {
        risk: 'Competencia de Players Grandes',
        level: 'Medio',
        description: 'Entrada de competidores con mayor capital como Kavak o bancos desarrollando soluciones propias.',
        mitigation: 'Acelerar desarrollo de ventajas competitivas únicas (modelo SaaS B2B, expansión de IA).',
        priority: 'Mediano-Largo Plazo',
      },
    ];

    risks.forEach(risk => {
      if (this.currentY > 230) {
        this.addNewPage();
      }

      const levelColor: [number, number, number] = risk.level.includes('Alto') ? [239, 68, 68] :
                        risk.level.includes('Medio') ? [245, 158, 11] : [107, 114, 128];

      // Risk box
      this.pdf.setDrawColor(...levelColor);
      this.pdf.setLineWidth(0.8);
      this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 45, 'D');

      // Risk level badge
      this.pdf.setFillColor(...levelColor);
      this.pdf.rect(this.MARGIN + 2, this.currentY + 2, 25, 6, 'F');
      this.pdf.setTextColor(255, 255, 255);
      this.pdf.setFontSize(7);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(`RIESGO ${risk.level.toUpperCase()}`, this.MARGIN + 3, this.currentY + 6);

      // Priority badge
      this.pdf.setFillColor(107, 114, 128);
      this.pdf.rect(this.MARGIN + this.CONTENT_WIDTH - 50, this.currentY + 2, 48, 6, 'F');
      this.pdf.text(risk.priority.toUpperCase(), this.MARGIN + this.CONTENT_WIDTH - 49, this.currentY + 6);

      // Risk title
      this.currentY += 10;
      this.setColor(this.COLORS.text);
      this.pdf.setFontSize(9);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(risk.risk, this.MARGIN + 3, this.currentY);

      // Description
      this.currentY += 6;
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'normal');
      const descLines = this.pdf.splitTextToSize(risk.description, this.CONTENT_WIDTH - 6);
      this.pdf.text(descLines, this.MARGIN + 3, this.currentY);

      // Mitigation
      this.currentY += descLines.length * 4 + 3;
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text('Mitigación: ', this.MARGIN + 3, this.currentY);
      this.pdf.setFont('helvetica', 'normal');
      const mitigationLines = this.pdf.splitTextToSize(risk.mitigation, this.CONTENT_WIDTH - 6);
      this.pdf.text(mitigationLines, this.MARGIN + 20, this.currentY);

      this.currentY += 50;
    });
  }

  /**
   * Add recommendations section
   */
  private addRecommendations(): void {
    this.addNewPage();
    this.addSectionHeader('RECOMENDACIONES ESTRATÉGICAS');

    const recommendations = [
      {
        timeframe: 'INMEDIATO (0-1 mes)',
        color: [239, 68, 68] as [number, number, number],
        items: [
          'Proteger propiedad intelectual mediante registro formal ante IMPI',
          'Establecer programa de backup automatizado de código y base de datos',
          'Documentar procedimientos críticos de deployment y recovery',
        ]
      },
      {
        timeframe: 'CORTO PLAZO (1-3 meses) - Inversión: $18,500 USD',
        color: [245, 158, 11] as [number, number, number],
        items: [
          'Implementar suite de testing (Vitest + Playwright) con 60% de cobertura',
          'Centralizar gestión de secrets en Google Secret Manager',
          'Configurar monitoreo avanzado con Sentry para error tracking',
          'Documentar APIs con especificación OpenAPI/Swagger',
          'Iniciar programa de transferencia de conocimiento técnico',
        ]
      },
      {
        timeframe: 'MEDIANO PLAZO (3-6 meses) - Inversión: $32,500 USD',
        color: [59, 130, 246] as [number, number, number],
        items: [
          'Contratar desarrollador adicional para reducir dependencia única',
          'Implementar CDN global para optimización de performance',
          'Realizar auditoría de seguridad externa',
          'Mejorar SEO con schema.org markup y meta tags dinámicos',
          'Establecer acuerdos SLA con proveedores de APIs críticas',
        ]
      },
      {
        timeframe: 'LARGO PLAZO (6-12 meses) - Inversión: $160,000 USD',
        color: [5, 150, 105] as [number, number, number],
        items: [
          'Desarrollar arquitectura multi-tenant para modelo SaaS B2B',
          'Crear aplicaciones móviles nativas (iOS y Android)',
          'Implementar IA avanzada para scoring crediticio automatizado',
          'Expandir a otros estados de México',
          'Evaluar internacionalización (EE.UU., Latinoamérica)',
        ]
      },
    ];

    recommendations.forEach(section => {
      if (this.currentY > 250) {
        this.addNewPage();
      }

      // Timeframe header
      this.pdf.setFillColor(...section.color);
      this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 10, 'F');

      this.pdf.setTextColor(255, 255, 255);
      this.pdf.setFontSize(10);
      this.pdf.setFont('helvetica', 'bold');
      this.pdf.text(section.timeframe, this.MARGIN + 3, this.currentY + 7);

      this.currentY += 12;

      // Items
      this.setColor(this.COLORS.text);
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'normal');

      section.items.forEach((item, index) => {
        if (this.currentY > 280) {
          this.addNewPage();
        }

        this.pdf.text(`${index + 1}.`, this.MARGIN + 2, this.currentY);
        const itemLines = this.pdf.splitTextToSize(item, this.CONTENT_WIDTH - 10);
        this.pdf.text(itemLines, this.MARGIN + 7, this.currentY);
        this.currentY += itemLines.length * 4.5 + 2;
      });

      this.currentY += 5;
    });

    // Final recommendation box
    this.pdf.setFillColor(254, 252, 232);
    this.pdf.setDrawColor(this.COLORS.warning);
    this.pdf.setLineWidth(1);
    this.pdf.rect(this.MARGIN, this.currentY, this.CONTENT_WIDTH, 35, 'FD');

    this.currentY += 10;
    this.pdf.setFontSize(10);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text('INVERSIÓN TOTAL RECOMENDADA A 12 MESES', this.PAGE_WIDTH / 2, this.currentY, { align: 'center' });

    this.currentY += 10;
    this.pdf.setFontSize(18);
    this.setColor(this.COLORS.success);
    this.pdf.text('$3,903,500 MXN', this.PAGE_WIDTH / 2, this.currentY, { align: 'center' });

    this.currentY += 8;
    this.pdf.setFontSize(12);
    this.pdf.text('($211,000 USD)', this.PAGE_WIDTH / 2, this.currentY, { align: 'center' });

    this.currentY += 10;
    this.setColor(this.COLORS.text);
    this.pdf.setFontSize(8);
    this.pdf.setFont('helvetica', 'italic');
    const note = 'Con estas inversiones, la plataforma podría alcanzar una valuación de $12-15M MXN en 12 meses.';
    this.pdf.text(note, this.PAGE_WIDTH / 2, this.currentY, { align: 'center' });
  }

  /**
   * Categorize commits by type for better organization
   */
  private categorizeCommits(commits: RecentCommit[]): Record<string, RecentCommit[]> {
    const categories: Record<string, RecentCommit[]> = {
      'Nuevas Funcionalidades': [],
      'Marketing y Tracking': [],
      'Correcciones y Optimizaciones': [],
      'Infraestructura y DevOps': [],
      'Otros': [],
    };

    commits.forEach(commit => {
      const msg = commit.message.toLowerCase();
      if (msg.includes('feat:') || msg.includes('feature')) {
        categories['Nuevas Funcionalidades'].push(commit);
      } else if (msg.includes('marketing') || msg.includes('tracking') || msg.includes('pixel') || msg.includes('gtm') || msg.includes('analytics')) {
        categories['Marketing y Tracking'].push(commit);
      } else if (msg.includes('fix:') || msg.includes('optimize')) {
        categories['Correcciones y Optimizaciones'].push(commit);
      } else if (msg.includes('chore:') || msg.includes('build') || msg.includes('deploy')) {
        categories['Infraestructura y DevOps'].push(commit);
      } else {
        categories['Otros'].push(commit);
      }
    });

    // Remove empty categories
    Object.keys(categories).forEach(key => {
      if (categories[key].length === 0) {
        delete categories[key];
      }
    });

    return categories;
  }

  /**
   * Add a new page and reset position
   */
  private addNewPage(): void {
    this.pdf.addPage();
    this.currentY = 20;
  }

  /**
   * Add section header
   */
  private addSectionHeader(title: string): void {
    this.pdf.setFillColor(this.COLORS.primary);
    this.pdf.rect(0, this.currentY, this.PAGE_WIDTH, 12, 'F');

    this.pdf.setTextColor(255, 255, 255);
    this.pdf.setFontSize(14);
    this.pdf.setFont('helvetica', 'bold');
    this.pdf.text(title, this.PAGE_WIDTH / 2, this.currentY + 8, { align: 'center' });

    this.currentY += 18;
    this.setColor(this.COLORS.text);
  }

  /**
   * Add page numbers to all pages
   */
  private addFooterToAllPages(): void {
    const pageCount = this.pdf.getNumberOfPages();

    for (let i = 1; i <= pageCount; i++) {
      this.pdf.setPage(i);

      // Footer line
      this.pdf.setDrawColor(this.COLORS.border);
      this.pdf.setLineWidth(0.5);
      this.pdf.line(this.MARGIN, this.PAGE_HEIGHT - 15, this.PAGE_WIDTH - this.MARGIN, this.PAGE_HEIGHT - 15);

      // Footer text
      this.pdf.setFontSize(8);
      this.pdf.setFont('helvetica', 'normal');
      this.setColor(this.COLORS.text);

      // Left: Document title
      this.pdf.text('Reporte de Valuación TREFA.MX', this.MARGIN, this.PAGE_HEIGHT - 10);

      // Center: Confidential
      this.pdf.text('CONFIDENCIAL', this.PAGE_WIDTH / 2, this.PAGE_HEIGHT - 10, { align: 'center' });

      // Right: Page number
      this.pdf.text(`Página ${i} de ${pageCount}`, this.PAGE_WIDTH - this.MARGIN, this.PAGE_HEIGHT - 10, { align: 'right' });
    }
  }

  /**
   * Add page number (for cover page)
   */
  private addPageNumber(): void {
    this.pdf.setFontSize(8);
    this.pdf.text('Página 1', this.PAGE_WIDTH - this.MARGIN, this.PAGE_HEIGHT - 10, { align: 'right' });
  }

  /**
   * Set text color from hex
   */
  private setColor(hex: string): void {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    this.pdf.setTextColor(r, g, b);
  }

  /**
   * Format date in Mexican format
   */
  private formatDate(date: Date): string {
    const months = [
      'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
      'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
    ];

    const day = date.getDate();
    const month = months[date.getMonth()];
    const year = date.getFullYear();

    return `${day} de ${month} de ${year}`;
  }
}

export default ValuationPDFService;
