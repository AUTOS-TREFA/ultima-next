'use client';

import { TrendingUp, Target, DollarSign, Users, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function VentasPerformancePage() {
  const performanceStats = [
    { label: 'Ventas del Mes', value: '--', icon: DollarSign, trend: null },
    { label: 'Leads Atendidos', value: '--', icon: Users, trend: null },
    { label: 'Tasa de Conversión', value: '--%', icon: Target, trend: null },
    { label: 'Ranking', value: '--', icon: Award, trend: null },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <TrendingUp className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Mi Desempeño</h1>
          <p className="text-muted-foreground">Métricas y estadísticas de tu rendimiento</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {performanceStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <stat.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-2xl font-bold mt-1">{stat.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Metas del Mes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Ventas</span>
                  <span className="text-sm text-muted-foreground">--/-- unidades</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Leads Convertidos</span>
                  <span className="text-sm text-muted-foreground">--/--</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-green-500 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm">Tiempo de Respuesta</span>
                  <span className="text-sm text-muted-foreground">-- min promedio</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full" style={{ width: '0%' }} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actividad Reciente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-8 text-muted-foreground">
              <TrendingUp className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Sin actividad reciente</p>
              <p className="text-sm mt-2">Tu historial de actividad aparecerá aquí</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-blue-800">
            Las métricas se actualizan en tiempo real. Continúa trabajando para mejorar tu rendimiento.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
