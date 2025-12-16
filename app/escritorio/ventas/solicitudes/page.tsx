'use client';

import { FileText, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function VentasSolicitudesPage() {
  const solicitudStats = [
    { label: 'Mis Solicitudes', value: '--', icon: FileText },
    { label: 'En Proceso', value: '--', icon: Clock },
    { label: 'Aprobadas', value: '--', icon: CheckCircle },
    { label: 'Rechazadas', value: '--', icon: XCircle },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <FileText className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Mis Solicitudes</h1>
            <p className="text-muted-foreground">Gestiona las solicitudes de tus clientes</p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <Filter className="w-4 h-4 mr-2" />
          Filtrar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {solicitudStats.map((stat) => (
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
          <CardTitle>Solicitudes Recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-muted-foreground">
            <FileText className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No hay solicitudes para mostrar</p>
            <p className="text-sm mt-2">Las solicitudes de tus clientes aparecerán aquí</p>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-blue-800">
            Aquí podrás dar seguimiento a todas las solicitudes de financiamiento de tus clientes asignados.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
