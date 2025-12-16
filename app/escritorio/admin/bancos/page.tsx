'use client';

import { Building2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function PortalBancarioPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Building2 className="w-8 h-8 text-primary" />
        <div>
          <h1 className="text-2xl font-bold">Portal Bancario</h1>
          <p className="text-muted-foreground">Gestiona las relaciones con bancos y financieras</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Representantes Bancarios</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Gestiona las cuentas de representantes de bancos y financieras
            </p>
            <Link href="/bank-dashboard">
              <Button variant="outline" className="w-full">Ver Dashboard Bancario</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Solicitudes Activas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Revisa las solicitudes de financiamiento en proceso
            </p>
            <Link href="/bank-dashboard/activas">
              <Button variant="outline" className="w-full">Ver Solicitudes</Button>
            </Link>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader>
            <CardTitle className="text-lg">Aprobaciones Pendientes</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Solicitudes de acceso de representantes pendientes de aprobar
            </p>
            <Link href="/bank-dashboard/pendientes">
              <Button variant="outline" className="w-full">Ver Pendientes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
