'use client';

import { Facebook, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export default function FacebookCataloguePage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Facebook className="w-8 h-8 text-blue-600" />
        <div>
          <h1 className="text-2xl font-bold">Catálogo de Facebook</h1>
          <p className="text-muted-foreground">Gestiona el inventario sincronizado con Facebook</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Feed de Inventario</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              El feed de inventario se genera automáticamente con los vehículos disponibles.
            </p>
            <Button variant="outline" asChild>
              <a href="/api/facebook-feed.xml" target="_blank" className="flex items-center gap-2">
                Ver Feed XML <ExternalLink className="w-4 h-4" />
              </a>
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estado de Sincronización</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Vehículos en feed:</span>
                <span className="font-medium">--</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Última actualización:</span>
                <span className="font-medium">--</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-blue-50 border-blue-200">
        <CardContent className="pt-6">
          <p className="text-blue-800">
            El catálogo se sincroniza automáticamente cada hora con los vehículos marcados como disponibles.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
