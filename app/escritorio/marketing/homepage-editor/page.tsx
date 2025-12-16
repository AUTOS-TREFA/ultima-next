'use client';

import { Home, Eye, Save, Undo, Settings } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function HomepageEditorPage() {
  const sections = [
    { name: 'Hero Principal', status: 'activo' },
    { name: 'Propuesta de Valor', status: 'activo' },
    { name: 'Vehículos Destacados', status: 'activo' },
    { name: 'Testimoniales', status: 'activo' },
    { name: 'Sucursales', status: 'activo' },
    { name: 'Footer', status: 'activo' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Home className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold">Editor de Homepage</h1>
            <p className="text-muted-foreground">Personaliza la página principal del sitio</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Link href="/" target="_blank">
            <Button variant="outline" size="sm">
              <Eye className="w-4 h-4 mr-2" />
              Vista Previa
            </Button>
          </Link>
          <Button size="sm" disabled>
            <Save className="w-4 h-4 mr-2" />
            Guardar Cambios
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Secciones de la Página</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {sections.map((section, index) => (
                  <div
                    key={section.name}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-muted-foreground w-6">{index + 1}</span>
                      <span className="font-medium">{section.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded">
                        {section.status}
                      </span>
                      <Button variant="ghost" size="sm">
                        <Settings className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Acciones Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" className="w-full justify-start" disabled>
                <Undo className="w-4 h-4 mr-2" />
                Revertir Cambios
              </Button>
              <Link href="/escritorio/marketing/constructor" className="block">
                <Button variant="outline" className="w-full justify-start">
                  Crear Landing Page
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-amber-50 border-amber-200">
            <CardContent className="pt-6">
              <p className="text-amber-800 text-sm">
                El editor visual está en desarrollo. Por ahora puedes ver las secciones configuradas.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
