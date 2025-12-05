'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { BankService } from '@/services/BankService';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, AlertTriangle, ArrowLeft } from 'lucide-react';

interface PageProps {
  params: { id: string };
}

export default function BankLeadProfilePage({ params }: PageProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadDetails, setLeadDetails] = useState<any>(null);
  const router = useRouter();
  const { id } = params;

  useEffect(() => {
    if (id) {
      loadLeadDetails();
    }
  }, [id]);

  const loadLeadDetails = async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await BankService.getLeadDetails(id);

      if (!data.success) {
        setError(data.error || 'Error al cargar detalles del cliente');
        return;
      }

      setLeadDetails(data);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar detalles del cliente';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando información del cliente...</p>
        </div>
      </div>
    );
  }

  if (error && !leadDetails) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Error</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push('/bank-dashboard')}>
              Volver al dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const lead = leadDetails?.lead;
  const application = leadDetails?.application?.[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-card border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Button
            variant="ghost"
            onClick={() => router.push('/bank-dashboard')}
            className="gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al dashboard
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="bg-destructive/10 border border-destructive/20 text-destructive px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Client Information */}
            <Card>
              <CardContent className="pt-6">
                <h2 className="text-xl font-bold mb-4">Información del Cliente</h2>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Nombre completo</p>
                    <p className="font-semibold">
                      {lead?.first_name} {lead?.last_name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Correo electrónico</p>
                    <p className="font-semibold">{lead?.email}</p>
                  </div>
                  {lead?.phone && (
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Teléfono</p>
                      <p className="font-semibold">{lead.phone}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Fecha de registro</p>
                    <p className="font-semibold">
                      {lead?.created_at ? new Date(lead.created_at).toLocaleDateString('es-MX') : 'N/A'}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Vehicle Info */}
            {application && (
              <Card>
                <CardContent className="pt-6">
                  <h2 className="text-xl font-bold mb-4">Información del Vehículo</h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <p className="text-sm text-muted-foreground mb-1">Vehículo solicitado</p>
                      <p className="font-semibold text-lg">
                        {application.car_info?.vehicleTitle || 'Sin información'}
                      </p>
                    </div>
                    {application.car_info?.price && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Precio</p>
                        <p className="font-semibold">
                          ${Number(application.car_info.price).toLocaleString('es-MX')}
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <Card>
              <CardContent className="pt-6">
                <h3 className="font-bold mb-4">Acciones</h3>
                <div className="space-y-3">
                  <Button
                    className="w-full"
                    variant="default"
                    onClick={() => {/* TODO: Implement status update */}}
                  >
                    Aprobar Solicitud
                  </Button>
                  <Button
                    className="w-full"
                    variant="destructive"
                    onClick={() => {/* TODO: Implement status update */}}
                  >
                    Rechazar Solicitud
                  </Button>
                  <Button
                    className="w-full"
                    variant="outline"
                    onClick={() => {/* TODO: Implement feedback */}}
                  >
                    Solicitar Información
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
