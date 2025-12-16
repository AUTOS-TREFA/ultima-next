'use client';

import { Route, ArrowRight, User, FileText, CreditCard, CheckCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function CustomerJourneysPage() {
  const journeySteps = [
    { icon: User, label: 'Registro', description: 'Usuario crea cuenta' },
    { icon: FileText, label: 'Perfil', description: 'Completa información' },
    { icon: CreditCard, label: 'Perfilación', description: 'Datos bancarios' },
    { icon: FileText, label: 'Solicitud', description: 'Selecciona vehículo' },
    { icon: CheckCircle, label: 'Aprobación', description: 'Proceso completado' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Route className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Customer Journeys</h1>
          <p className="text-muted-foreground">Visualiza y optimiza el recorrido del cliente</p>
        </div>
      </div>

      {/* Journey Flow */}
      <Card>
        <CardHeader>
          <CardTitle>Flujo Principal de Financiamiento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between overflow-x-auto pb-4">
            {journeySteps.map((step, index) => (
              <div key={step.label} className="flex items-center">
                <div className="flex flex-col items-center min-w-[120px]">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                    <step.icon className="w-6 h-6 text-primary" />
                  </div>
                  <span className="font-medium text-sm">{step.label}</span>
                  <span className="text-xs text-muted-foreground text-center">{step.description}</span>
                </div>
                {index < journeySteps.length - 1 && (
                  <ArrowRight className="w-5 h-5 text-gray-300 mx-2 flex-shrink-0" />
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Stats placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {['Conversión Total', 'Tiempo Promedio', 'Abandonos', 'Completados'].map((stat) => (
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
            Esta página está en desarrollo. Próximamente podrás ver métricas detalladas de cada paso del journey.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
