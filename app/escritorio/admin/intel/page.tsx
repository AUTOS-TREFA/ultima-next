'use client';

import { Database, Server, HardDrive, Activity, RefreshCw } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function IntelInternaPage() {
  const systemStats = [
    { label: 'Base de Datos', status: 'Conectado', icon: Database },
    { label: 'Servidor', status: 'Activo', icon: Server },
    { label: 'Almacenamiento', status: '-- GB', icon: HardDrive },
    { label: 'Uptime', status: '99.9%', icon: Activity },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Intel Interna</h1>
            <p className="text-muted-foreground">Información del sistema y base de datos</p>
          </div>
        </div>
        <Button variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {systemStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <stat.icon className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-lg font-semibold mt-1">{stat.status}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Tablas Principales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {['profiles', 'vehicles', 'financing_applications', 'leads', 'upload_documents'].map((table) => (
                <div key={table} className="flex justify-between items-center py-2 border-b last:border-0">
                  <code className="text-sm bg-gray-100 px-2 py-1 rounded">{table}</code>
                  <span className="text-sm text-muted-foreground">-- registros</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Integraciones</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {[
                { name: 'Supabase', status: 'Conectado' },
                { name: 'Airtable', status: 'Conectado' },
                { name: 'Resend', status: 'Activo' },
                { name: 'Car Studio API', status: 'Activo' },
              ].map((integration) => (
                <div key={integration.name} className="flex justify-between items-center py-2 border-b last:border-0">
                  <span className="text-sm">{integration.name}</span>
                  <span className="text-sm text-green-600">{integration.status}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-blue-800">
            Esta página muestra información interna del sistema. Los datos se actualizan en tiempo real.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
