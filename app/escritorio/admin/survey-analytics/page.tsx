'use client';

import { FileBarChart, Users, Star, MessageSquare } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function SurveyAnalyticsPage() {
  const surveyStats = [
    { label: 'Encuestas Enviadas', value: '--', icon: FileBarChart },
    { label: 'Respuestas', value: '--', icon: Users },
    { label: 'Promedio NPS', value: '--', icon: Star },
    { label: 'Comentarios', value: '--', icon: MessageSquare },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <FileBarChart className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Analytics de Encuestas</h1>
          <p className="text-muted-foreground">Resultados y métricas de satisfacción del cliente</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {surveyStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <stat.icon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Distribución de Respuestas NPS</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <span className="text-sm w-24">Promotores (9-10)</span>
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '0%' }} />
              </div>
              <span className="text-sm text-muted-foreground">--%</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm w-24">Pasivos (7-8)</span>
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: '0%' }} />
              </div>
              <span className="text-sm text-muted-foreground">--%</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm w-24">Detractores (0-6)</span>
              <div className="flex-1 h-4 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: '0%' }} />
              </div>
              <span className="text-sm text-muted-foreground">--%</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <p className="text-amber-800">
            Esta página está en desarrollo. Próximamente podrás ver resultados detallados de encuestas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
