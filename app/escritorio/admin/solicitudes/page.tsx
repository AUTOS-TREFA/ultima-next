'use client';

import { FileBarChart, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function SolicitudesAnalyticsPage() {
  const solicitudStats = [
    { label: 'Total Solicitudes', value: '--', icon: FileBarChart, color: 'text-blue-600' },
    { label: 'En Proceso', value: '--', icon: Clock, color: 'text-yellow-600' },
    { label: 'Aprobadas', value: '--', icon: CheckCircle, color: 'text-green-600' },
    { label: 'Rechazadas', value: '--', icon: XCircle, color: 'text-red-600' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileBarChart className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Dashboard de Solicitudes</h1>
            <p className="text-muted-foreground">Métricas y análisis de solicitudes de financiamiento</p>
          </div>
        </div>
        <Link href="/escritorio/admin/crm">
          <Button variant="outline">Ver CRM</Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {solicitudStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <stat.icon className={`w-5 h-5 ${stat.color}`} />
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
            <CardTitle>Por Estado</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { status: 'Nueva', count: '--' },
                { status: 'En revisión', count: '--' },
                { status: 'Documentos pendientes', count: '--' },
                { status: 'Enviada a banco', count: '--' },
                { status: 'Pre-aprobada', count: '--' },
                { status: 'Aprobada', count: '--' },
              ].map((item) => (
                <div key={item.status} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm">{item.status}</span>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Por Banco</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { banco: 'BBVA', count: '--' },
                { banco: 'Santander', count: '--' },
                { banco: 'Banorte', count: '--' },
                { banco: 'Scotiabank', count: '--' },
                { banco: 'HSBC', count: '--' },
              ].map((item) => (
                <div key={item.banco} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm">{item.banco}</span>
                  <span className="text-sm font-medium">{item.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-amber-800">
            Esta página está en desarrollo. Próximamente podrás ver métricas detalladas de solicitudes con filtros avanzados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
