import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  ColumnDef,
  flexRender,
  SortingState,
  ColumnFiltersState
} from '@tanstack/react-table';
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { saveAs } from 'file-saver';
import { useSurveyResponses, useDashboardMetrics } from '../hooks/useSurveyData';
import {
  calculateAllQuestionsAnalytics,
  calculateSectionAnalytics,
  calculateTimeSeriesData,
  calculateLikertHeatmap,
  exportToCSV,
  exportAnalyticsToJSON
} from '../lib/surveyAnalytics';
import { SURVEY_SECTIONS } from '../lib/surveyQuestions';
import type { SurveyResponse, QuestionAnalytics } from '../types/survey';

const SurveyAnalyticsDashboard: React.FC = () => {
  const { data: responses = [], isLoading, error } = useSurveyResponses();
  const { data: metrics } = useDashboardMetrics();

  const [sorting, setSorting] = useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<number | null>(null);

  // Calculate analytics
  const questionAnalytics = useMemo(
    () => calculateAllQuestionsAnalytics(responses),
    [responses]
  );

  const sectionAnalytics = useMemo(
    () => SURVEY_SECTIONS.map(section => calculateSectionAnalytics(section, responses)),
    [responses]
  );

  const timeSeriesData = useMemo(
    () => calculateTimeSeriesData(responses, 30),
    [responses]
  );

  const likertHeatmap = useMemo(
    () => calculateLikertHeatmap(responses),
    [responses]
  );

  // Table columns
  const columns = useMemo<ColumnDef<SurveyResponse>[]>(
    () => [
      {
        accessorKey: 'id',
        header: 'ID',
        cell: ({ row }) => <div className="text-xs font-mono">{row.original.id.substring(0, 8)}...</div>
      },
      {
        accessorKey: 'coupon_code',
        header: 'Coupon Code',
        cell: ({ row }) => <div className="font-mono text-sm">{row.original.coupon_code}</div>
      },
      {
        accessorKey: 'completed_at',
        header: 'Completed At',
        cell: ({ row }) => (
          <div className="text-sm">
            {format(parseISO(row.original.completed_at), 'MMM dd, yyyy HH:mm')}
          </div>
        )
      },
      {
        id: 'nps',
        header: 'Puntuación NPS',
        cell: ({ row }) => {
          const npsScore = row.original.responses['nps'];
          const score = Number(npsScore);
          const category = score >= 9 ? 'Promotor' : score >= 7 ? 'Pasivo' : 'Detractor';
          const colorClass =
            category === 'Promotor'
              ? 'bg-green-100 text-green-800'
              : category === 'Pasivo'
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-red-100 text-red-800';

          return (
            <Badge className={colorClass}>
              {score} - {category}
            </Badge>
          );
        }
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const data = JSON.stringify(row.original, null, 2);
              const blob = new Blob([data], { type: 'application/json' });
              saveAs(blob, `response-${row.original.id}.json`);
            }}
          >
            Export
          </Button>
        )
      }
    ],
    []
  );

  const table = useReactTable({
    data: responses,
    columns,
    state: {
      sorting,
      columnFilters
    },
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    initialState: {
      pagination: {
        pageSize: 10
      }
    }
  });

  // Export handlers
  const handleExportCSV = () => {
    const csv = exportToCSV(responses);
    const blob = new Blob([csv], { type: 'text/csv' });
    saveAs(blob, `survey-responses-${format(new Date(), 'yyyy-MM-dd')}.csv`);
  };

  const handleExportJSON = () => {
    const json = exportAnalyticsToJSON(responses);
    const blob = new Blob([json], { type: 'application/json' });
    saveAs(blob, `survey-analytics-${format(new Date(), 'yyyy-MM-dd')}.json`);
  };

  // Chart colors
  const COLORS = {
    primary: '#3b82f6',
    success: '#10b981',
    warning: '#f59e0b',
    danger: '#ef4444',
    purple: '#8b5cf6',
    pink: '#ec4899'
  };

  const NPS_COLORS = ['#ef4444', '#f59e0b', '#10b981'];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Card className="w-96">
          <CardHeader>
            <CardTitle className="text-red-600">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p>Failed to load survey data: {error.message}</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Dashboard de Analíticas de Encuestas</h1>
            <p className="text-slate-600 mt-1">Información detallada de encuestas anónimas de clientes</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleExportCSV} variant="outline">
              Exportar CSV
            </Button>
            <Button onClick={handleExportJSON} variant="outline">
              Exportar JSON
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Respuestas Totales</CardDescription>
              <CardTitle className="text-3xl">{metrics?.totalResponses || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">
                <div>Hoy: {metrics?.responsesToday || 0}</div>
                <div>Esta Semana: {metrics?.responsesThisWeek || 0}</div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Puntuación NPS</CardDescription>
              <CardTitle className="text-3xl">{metrics?.npsScore?.score || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-1">
                <div className="flex justify-between">
                  <span className="text-green-600">Promotores:</span>
                  <span className="font-semibold">{metrics?.npsScore?.promotersPercentage || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-yellow-600">Pasivos:</span>
                  <span className="font-semibold">{metrics?.npsScore?.passivesPercentage || 0}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-600">Detractores:</span>
                  <span className="font-semibold">{metrics?.npsScore?.detractorsPercentage || 0}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Este Mes</CardDescription>
              <CardTitle className="text-3xl">{metrics?.responsesThisMonth || 0}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">
                Seguimiento de crecimiento mensual
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Tasa de Completado</CardDescription>
              <CardTitle className="text-3xl">{metrics?.completionRate || 0}%</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-slate-600">
                Todas las encuestas completadas
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Vista General</TabsTrigger>
            <TabsTrigger value="questions">Preguntas</TabsTrigger>
            <TabsTrigger value="sections">Secciones</TabsTrigger>
            <TabsTrigger value="responses">Respuestas</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Response Trend */}
              <Card>
                <CardHeader>
                  <CardTitle>Tendencia de Respuestas (Últimos 30 Días)</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={timeSeriesData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line
                          type="monotone"
                          dataKey="responses"
                          stroke={COLORS.primary}
                          name="Respuestas Diarias"
                        />
                        <Line
                          type="monotone"
                          dataKey="cumulativeResponses"
                          stroke={COLORS.success}
                          name="Acumulativas"
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              {/* NPS Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle>Distribución NPS</CardTitle>
                </CardHeader>
                <CardContent>
                  <div style={{ width: '100%', height: 300 }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: 'Promotores', value: metrics?.npsScore?.promoters || 0 },
                            { name: 'Pasivos', value: metrics?.npsScore?.passives || 0 },
                            { name: 'Detractores', value: metrics?.npsScore?.detractors || 0 }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                          outerRadius={80}
                          fill="#8884d8"
                          dataKey="value"
                        >
                          {NPS_COLORS.map((color, index) => (
                            <Cell key={`cell-${index}`} fill={color} />
                          ))}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Section Scores */}
            <Card>
              <CardHeader>
                <CardTitle>Puntuaciones Promedio por Sección</CardTitle>
              </CardHeader>
              <CardContent>
                <div style={{ width: '100%', height: 400 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectionAnalytics.filter(s => s.averageScore)}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="section" angle={-45} textAnchor="end" height={120} />
                      <YAxis domain={[0, 5]} />
                      <Tooltip />
                      <Bar dataKey="averageScore" fill={COLORS.purple} name="Puntuación Promedio" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Questions Tab */}
          <TabsContent value="questions" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {questionAnalytics.slice(0, 12).map((qa) => (
                <Card key={qa.questionId} className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedQuestion(qa.questionId)}>
                  <CardHeader className="pb-2">
                    <Badge variant="outline" className="w-fit mb-2">{qa.section}</Badge>
                    <CardTitle className="text-sm line-clamp-2">{qa.question}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-600">Respuestas:</span>
                        <span className="font-semibold">{qa.totalResponses}</span>
                      </div>
                      {qa.averageScore && (
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-600">Puntuación Prom.:</span>
                          <span className="font-semibold">{qa.averageScore}/5</span>
                        </div>
                      )}
                      <div className="text-xs text-slate-500 mt-2">
                        <strong>Más común:</strong> {qa.mostCommonAnswer}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {selectedQuestion && (
              <Card>
                <CardHeader>
                  <CardTitle>Distribución de Pregunta #{selectedQuestion}</CardTitle>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedQuestion(null)}
                    className="absolute right-4 top-4"
                  >
                    Cerrar
                  </Button>
                </CardHeader>
                <CardContent>
                  {(() => {
                    const qa = questionAnalytics.find(q => q.questionId === selectedQuestion);
                    if (!qa) return null;

                    const chartData = Object.entries(qa.distribution).map(([key, value]) => ({
                      name: key,
                      value,
                      percentage: qa.percentages[key]
                    }));

                    return (
                      <div style={{ width: '100%', height: 300 }}>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="name" />
                            <YAxis />
                            <Tooltip />
                            <Bar dataKey="value" fill={COLORS.primary} name="Count" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Sections Tab */}
          <TabsContent value="sections" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {sectionAnalytics.map((section) => (
                <Card key={section.section}>
                  <CardHeader>
                    <CardTitle>{section.section}</CardTitle>
                    <CardDescription>{section.questionCount} questions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {section.averageScore && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-2">
                          <span className="text-sm font-medium">Average Score</span>
                          <span className="text-2xl font-bold">{section.averageScore}/5</span>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-blue-600 h-2 rounded-full"
                            style={{ width: `${(section.averageScore / 5) * 100}%` }}
                          />
                        </div>
                      </div>
                    )}
                    <div className="space-y-1">
                      <div className="text-sm font-medium">Top Insights:</div>
                      {section.topInsights.map((insight, idx) => (
                        <div key={idx} className="text-sm text-slate-600">
                          • {insight}
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Responses Table Tab */}
          <TabsContent value="responses" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Respuestas de Encuestas</CardTitle>
                <CardDescription>Todas las respuestas enviadas</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        {table.getHeaderGroups().map((headerGroup) => (
                          <tr key={headerGroup.id} className="border-b bg-slate-50">
                            {headerGroup.headers.map((header) => (
                              <th
                                key={header.id}
                                className="px-4 py-3 text-left font-medium text-slate-700"
                              >
                                {header.isPlaceholder
                                  ? null
                                  : flexRender(
                                      header.column.columnDef.header,
                                      header.getContext()
                                    )}
                              </th>
                            ))}
                          </tr>
                        ))}
                      </thead>
                      <tbody>
                        {table.getRowModel().rows.map((row) => (
                          <tr key={row.id} className="border-b hover:bg-slate-50">
                            {row.getVisibleCells().map((cell) => (
                              <td key={cell.id} className="px-4 py-3">
                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between mt-4">
                  <div className="text-sm text-slate-600">
                    Página {table.getState().pagination.pageIndex + 1} de {table.getPageCount()}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.previousPage()}
                      disabled={!table.getCanPreviousPage()}
                    >
                      Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => table.nextPage()}
                      disabled={!table.getCanNextPage()}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SurveyAnalyticsDashboard;
