'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import {
  FileText,
  Upload,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Users,
  Activity,
  ExternalLink,
  RefreshCw,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import { DocumentUploadAnalyticsService, type ApplicationDocumentStatus } from '@/services/DocumentUploadAnalyticsService';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import Link from 'next/link';

const DOCUMENT_LABELS: Record<string, string> = {
  'ine_front': 'INE (Frente)',
  'ine_back': 'INE (Reverso)',
  'proof_address': 'Comprobante de Domicilio',
  'proof_income': 'Comprobante de Ingresos',
  'constancia_fiscal': 'Constancia Fiscal',
};

const COLORS = {
  primary: '#3b82f6',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
  purple: '#8b5cf6',
  teal: '#14b8a6',
  indigo: '#6366f1'
};

const PIE_COLORS = [COLORS.primary, COLORS.success, COLORS.warning, COLORS.danger, COLORS.purple];

const DocumentUploadAnalyticsPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'complete' | 'incomplete' | 'active'>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);

  useEffect(() => {
    loadMetrics(currentPage, pageSize);
  }, [currentPage, pageSize]);

  const loadMetrics = async (page: number = 1, size: number = 25) => {
    setLoading(true);
    setError(null);
    try {
      const data = await DocumentUploadAnalyticsService.getMetrics({ page, pageSize: size });
      setMetrics(data);
    } catch (err) {
      console.error('Error loading metrics:', err);
      setError('No se pudieron cargar las métricas');
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handlePageSizeChange = (newSize: number) => {
    setPageSize(newSize);
    setCurrentPage(1); // Reset to first page when changing page size
  };

  const handleCopyToken = (token: string) => {
    const url = `${window.location.origin}/documentos/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  const filteredApplications = metrics?.recentApplications?.filter((app: ApplicationDocumentStatus) => {
    // Search filter
    const matchesSearch = searchTerm === '' ||
      app.user_email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.user_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.id.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    let matchesStatus = true;
    if (filterStatus === 'complete') {
      matchesStatus = app.is_complete;
    } else if (filterStatus === 'incomplete') {
      matchesStatus = !app.is_complete;
    } else if (filterStatus === 'active') {
      matchesStatus = app.total_documents > 0;
    }

    return matchesSearch && matchesStatus;
  }) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Card className="max-w-2xl mx-auto">
          <CardContent className="p-6 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Error al Cargar Métricas</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={() => loadMetrics()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Reintentar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Analytics de Carga de Documentos</h1>
              <p className="text-gray-600 mt-2">
                Monitoreo y análisis del progreso de carga de documentos por solicitud
              </p>
            </div>
            <Button onClick={() => loadMetrics()} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Actualizar
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total con Tokens</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {metrics.totalApplicationsWithTokens}
                  </p>
                </div>
                <div className="p-3 bg-blue-100 rounded-lg">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Solicitudes con liga de carga</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Con Actividad</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {metrics.applicationsWithActivity}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <TrendingUp className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">
                      {metrics.activityRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <Activity className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Al menos 1 documento subido</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Completas</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {metrics.completeApplications}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-600">
                      {metrics.completionRate.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-green-100 rounded-lg">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Todos los documentos subidos</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Incompletas</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {metrics.incompleteApplications}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <AlertCircle className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-semibold text-orange-600">
                      {(100 - metrics.completionRate).toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="p-3 bg-orange-100 rounded-lg">
                  <AlertCircle className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-2">Documentos faltantes</p>
            </CardContent>
          </Card>
        </div>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Documents Uploaded Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Documentos Subidos por Día (Últimos 30 días)</CardTitle>
              <CardDescription>Evolución de cargas de documentos</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.documentsUploadedOverTime && metrics.documentsUploadedOverTime.length > 0 ? (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={metrics.documentsUploadedOverTime}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => format(new Date(value), 'd MMM', { locale: es })}
                        fontSize={12}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        labelFormatter={(value) => format(new Date(value), 'd MMMM yyyy', { locale: es })}
                        formatter={(value: number) => [value, 'Documentos']}
                      />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="count"
                        name="Documentos"
                        stroke={COLORS.primary}
                        strokeWidth={2}
                        dot={{ fill: COLORS.primary, r: 3 }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No hay datos de documentos subidos
                </div>
              )}
            </CardContent>
          </Card>

          {/* Document Type Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Distribución por Tipo de Documento</CardTitle>
              <CardDescription>Documentos más subidos</CardDescription>
            </CardHeader>
            <CardContent>
              {metrics.documentTypeStats && metrics.documentTypeStats.length > 0 &&
               metrics.documentTypeStats.some((stat: any) => stat.total_uploaded > 0) ? (
                <div style={{ width: '100%', height: 300 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metrics.documentTypeStats} margin={{ bottom: 60 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="document_type"
                        tickFormatter={(value) => DOCUMENT_LABELS[value] || value}
                        angle={-35}
                        textAnchor="end"
                        fontSize={11}
                        interval={0}
                      />
                      <YAxis allowDecimals={false} />
                      <Tooltip
                        labelFormatter={(value) => DOCUMENT_LABELS[value] || value}
                        formatter={(value: number) => [value, 'Total Subidos']}
                      />
                      <Bar
                        dataKey="total_uploaded"
                        name="Total Subidos"
                        fill={COLORS.primary}
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  No hay datos de tipos de documentos
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Applications Table */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Solicitudes con Tokens de Carga</CardTitle>
                <CardDescription>
                  Detalle de cada solicitud y su estado de documentación
                </CardDescription>
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <input
                type="text"
                placeholder="Buscar por email, nombre o ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="all">Todas</option>
                <option value="active">Con Actividad</option>
                <option value="complete">Completas</option>
                <option value="incomplete">Incompletas</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Usuario
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehículo
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Progreso
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documentos
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Última Actividad
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredApplications.map((app: ApplicationDocumentStatus) => (
                    <tr key={app.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {app.user_name || 'Sin nombre'}
                          </div>
                          <div className="text-sm text-gray-500">{app.user_email}</div>
                          <div className="text-xs text-gray-400 mt-1">{app.id.slice(0, 8)}...</div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">
                          {app.car_info?._vehicleTitle || 'Sin vehículo'}
                        </div>
                        {app.car_info?._precioFormateado && (
                          <div className="text-sm text-gray-500">{app.car_info._precioFormateado}</div>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 w-24">
                            <div
                              className={`h-2 rounded-full ${
                                app.is_complete ? 'bg-green-500' : 'bg-blue-500'
                              }`}
                              style={{ width: `${app.completion_percentage}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {app.completion_percentage}%
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {app.documents_uploaded.map((doc) => (
                            <div key={doc.document_type} className="flex items-center gap-2">
                              <span className="text-xs text-gray-600">
                                {DOCUMENT_LABELS[doc.document_type]}:
                              </span>
                              <Badge variant={doc.count > 0 ? 'default' : 'secondary'}>
                                {doc.count > 0 ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {app.last_upload_at
                            ? format(new Date(app.last_upload_at), 'd MMM yyyy', { locale: es })
                            : 'Sin actividad'}
                        </div>
                        <div className="text-xs text-gray-500">
                          Creada: {format(new Date(app.created_at), 'd MMM yyyy', { locale: es })}
                        </div>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        {app.is_complete ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200">
                            <CheckCircle className="w-3 h-3 mr-1" />
                            Completa
                          </Badge>
                        ) : app.total_documents > 0 ? (
                          <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                            <Activity className="w-3 h-3 mr-1" />
                            En Progreso
                          </Badge>
                        ) : (
                          <Badge className="bg-gray-100 text-gray-800 border-gray-200">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Sin Actividad
                          </Badge>
                        )}
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Link
                            href="/escritorio/admin/solicitudes"
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </Link>
                          {app.public_upload_token && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyToken(app.public_upload_token!)}
                              className="h-8 w-8 p-0"
                            >
                              {copiedToken === app.public_upload_token ? (
                                <Check className="w-4 h-4 text-green-600" />
                              ) : (
                                <Copy className="w-4 h-4" />
                              )}
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredApplications.length === 0 && (
                <div className="text-center py-12">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No se encontraron solicitudes</p>
                </div>
              )}
            </div>

            {/* Pagination Controls */}
            {metrics?.pagination && metrics.pagination.totalPages > 0 && (
              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-t pt-4">
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-600">
                    Mostrando {((currentPage - 1) * pageSize) + 1} - {Math.min(currentPage * pageSize, metrics.pagination.totalCount)} de {metrics.pagination.totalCount} solicitudes
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => handlePageSizeChange(Number(e.target.value))}
                    className="px-3 py-1.5 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary-500"
                  >
                    <option value={10}>10 por página</option>
                    <option value={25}>25 por página</option>
                    <option value={50}>50 por página</option>
                    <option value={100}>100 por página</option>
                  </select>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(1)}
                    disabled={currentPage === 1 || loading}
                  >
                    Primera
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                  >
                    Anterior
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, metrics.pagination.totalPages) }, (_, i) => {
                      let pageNum;
                      const totalPages = metrics.pagination.totalPages;
                      if (totalPages <= 5) {
                        pageNum = i + 1;
                      } else if (currentPage <= 3) {
                        pageNum = i + 1;
                      } else if (currentPage >= totalPages - 2) {
                        pageNum = totalPages - 4 + i;
                      } else {
                        pageNum = currentPage - 2 + i;
                      }

                      return (
                        <Button
                          key={pageNum}
                          variant={currentPage === pageNum ? "default" : "outline"}
                          size="sm"
                          className="w-9"
                          onClick={() => handlePageChange(pageNum)}
                          disabled={loading}
                        >
                          {pageNum}
                        </Button>
                      );
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === metrics.pagination.totalPages || loading}
                  >
                    Siguiente
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handlePageChange(metrics.pagination.totalPages)}
                    disabled={currentPage === metrics.pagination.totalPages || loading}
                  >
                    Última
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Indicadores Clave de Valor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="border-l-4 border-blue-500 pl-4">
                <p className="text-sm text-gray-600">Promedio de Documentos por Solicitud</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {metrics.averageDocumentsPerApplication.toFixed(1)}
                </p>
              </div>
              <div className="border-l-4 border-green-500 pl-4">
                <p className="text-sm text-gray-600">Tasa de Finalización</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {metrics.completionRate.toFixed(1)}%
                </p>
              </div>
              <div className="border-l-4 border-purple-500 pl-4">
                <p className="text-sm text-gray-600">Tasa de Activación</p>
                <p className="text-2xl font-bold text-gray-900 mt-1">
                  {metrics.activityRate.toFixed(1)}%
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default DocumentUploadAnalyticsPage;
