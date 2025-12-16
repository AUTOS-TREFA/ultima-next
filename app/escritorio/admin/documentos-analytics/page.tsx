'use client';

import { Upload, FileText, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function DocumentosAnalyticsPage() {
  const documentStats = [
    { label: 'Documentos Subidos', value: '--', icon: Upload },
    { label: 'Verificados', value: '--', icon: CheckCircle },
    { label: 'Pendientes', value: '--', icon: Clock },
    { label: 'Rechazados', value: '--', icon: XCircle },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <FileText className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Analytics de Documentos</h1>
          <p className="text-muted-foreground">Monitorea el estado de documentos subidos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {documentStats.map((stat) => (
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
          <CardTitle>Documentos por Tipo</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {['INE/IFE', 'Comprobante de Domicilio', 'Estados de Cuenta', 'Comprobante de Ingresos'].map((tipo) => (
              <div key={tipo} className="flex justify-between items-center py-2 border-b last:border-0">
                <span className="text-sm">{tipo}</span>
                <span className="text-sm text-muted-foreground">-- documentos</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="bg-amber-50 border-amber-200">
        <CardContent className="pt-6">
          <p className="text-amber-800">
            Esta página está en desarrollo. Próximamente podrás ver métricas detalladas de documentos.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
