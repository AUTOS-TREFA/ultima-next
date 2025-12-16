'use client';

import { Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function TrackingAnalyticsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Analytics de Tracking</h1>
          <p className="text-muted-foreground">Monitorea eventos y conversiones del sitio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['Visitas Totales', 'Conversiones', 'Tasa de Rebote', 'Tiempo en Sitio'].map((stat) => (
          <Card key={stat}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{stat}</p>
              <p className="text-2xl font-bold mt-1">--</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <p className="text-amber-800">
            Esta página está en desarrollo. Próximamente podrás ver métricas de tracking detalladas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
