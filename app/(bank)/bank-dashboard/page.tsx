'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { BankService } from '@/services/BankService';
import { BANKS } from '@/types/bank';
import type { BankRepDashboardStats, BankRepAssignedLead } from '@/types/bank';
import { Download, FileText, Clock, CheckCircle, XCircle, MessageSquare, Loader2, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BankPINVerify from '@/components/BankPINVerify';

const BankDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<BankRepDashboardStats | null>(null);
  const [leads, setLeads] = useState<BankRepAssignedLead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bankRepProfile, setBankRepProfile] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [showPINVerify, setShowPINVerify] = useState(false);
  const [pendingDownloadLead, setPendingDownloadLead] = useState<BankRepAssignedLead | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    loadDashboardData();
  }, []);

  // Set status filter based on route
  useEffect(() => {
    if (pathname.includes('/pendientes')) {
      setStatusFilter('pending');
    } else if (pathname.includes('/aprobadas')) {
      setStatusFilter('approved');
    } else if (pathname.includes('/activas')) {
      setStatusFilter('feedback_provided');
    } else if (pathname.includes('/rechazadas')) {
      setStatusFilter('rejected');
    } else if (pathname.includes('/inventario')) {
      setStatusFilter('all');
    } else if (pathname.includes('/dashboard')) {
      setStatusFilter('all');
    }
  }, [pathname]);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      const [profileData, statsData, leadsData] = await Promise.all([
        BankService.getBankRepProfile(),
        BankService.getDashboardStats(),
        BankService.getAssignedLeads()
      ]);

      if (!profileData) {
        router.push('/bank-login');
        return;
      }

      if (!profileData.is_approved) {
        setError('Tu cuenta está pendiente de aprobación por un administrador.');
        setBankRepProfile(profileData);
        setLoading(false);
        return;
      }

      setBankRepProfile(profileData);
      setStats(statsData);
      setLeads(leadsData);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Error al cargar datos del dashboard';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const getTimeAgo = (hours: number): string => {
    if (hours < 1) return 'Hace menos de una hora';
    if (hours < 24) return `Hace ${Math.floor(hours)} horas`;
    const days = Math.floor(hours / 24);
    return `Hace ${days} día${days > 1 ? 's' : ''}`;
  };

  const getStatusLabel = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'Pendiente';
      case 'reviewing':
        return 'En revisión';
      case 'approved':
        return 'Aprobada';
      case 'rejected':
        return 'Rechazada';
      case 'feedback_provided':
        return 'Retroalimentación enviada';
      default:
        return status;
    }
  };

  const filteredLeads = leads.filter((lead) => {
    const matchesSearch =
      lead.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lead.car_info?.vehicleTitle?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || lead.assignment_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando dashboard...</p>
        </div>
      </div>
    );
  }

  if (error && !bankRepProfile?.is_approved) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertTriangle className="w-8 h-8 text-yellow-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Cuenta pendiente de aprobación</h2>
            <p className="text-muted-foreground mb-6">{error}</p>
            <Button onClick={() => router.push('/bank-login')}>
              Volver al inicio
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const getPageTitle = () => {
    if (pathname.includes('/pendientes')) return 'Solicitudes Pendientes';
    if (pathname.includes('/aprobadas')) return 'Solicitudes Aprobadas';
    if (pathname.includes('/activas')) return 'Solicitudes Activas';
    if (pathname.includes('/rechazadas')) return 'Solicitudes Rechazadas';
    if (pathname.includes('/inventario')) return 'Inventario de Solicitudes';
    return 'Dashboard';
  };

  const handleDownloadClick = (lead: BankRepAssignedLead) => {
    setPendingDownloadLead(lead);
    setShowPINVerify(true);
  };

  const handlePINVerified = async () => {
    setShowPINVerify(false);

    if (!pendingDownloadLead) return;

    try {
      toast.loading('Descargando documentos...');
      await BankService.downloadAllDocuments(
        pendingDownloadLead.lead_id,
        pendingDownloadLead.application_id ?? null
      );
      toast.dismiss();
      toast.success('Documentos descargados exitosamente');
    } catch (err: unknown) {
      toast.dismiss();
      const errorMessage = err instanceof Error ? err.message : 'Error al descargar documentos';
      toast.error(errorMessage);
    } finally {
      setPendingDownloadLead(null);
    }
  };

  const handlePINCancel = () => {
    setShowPINVerify(false);
    setPendingDownloadLead(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold">{getPageTitle()}</h1>
        </div>

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Total asignadas</p>
                    <p className="text-3xl font-bold">{stats.total_assigned}</p>
                  </div>
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <FileText className="w-6 h-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Pendientes</p>
                    <p className="text-3xl font-bold text-yellow-600">{stats.pending_review}</p>
                  </div>
                  <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <Clock className="w-6 h-6 text-yellow-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Aprobadas</p>
                    <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                  </div>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <CheckCircle className="w-6 h-6 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Rechazadas</p>
                    <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                  </div>
                  <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                    <XCircle className="w-6 h-6 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Con retroalimentación</p>
                    <p className="text-3xl font-bold text-purple-600">{stats.feedback_provided}</p>
                  </div>
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <MessageSquare className="w-6 h-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="search">Buscar</Label>
                <Input
                  id="search"
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por nombre, email o vehículo..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Filtrar por estado</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona un estado" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos</SelectItem>
                    <SelectItem value="pending">Pendientes</SelectItem>
                    <SelectItem value="reviewing">En revisión</SelectItem>
                    <SelectItem value="approved">Aprobadas</SelectItem>
                    <SelectItem value="rejected">Rechazadas</SelectItem>
                    <SelectItem value="feedback_provided">Con retroalimentación</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Leads Table */}
        <Card>
          <CardContent className="p-0">
            {filteredLeads.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-lg">No hay solicitudes asignadas</p>
                <p className="text-muted-foreground text-sm mt-2">Las solicitudes aparecerán aquí cuando sean asignadas por el equipo de ventas</p>
              </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Vehículo
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documentos
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Recibida
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredLeads.map((lead) => (
                    <tr key={lead.assignment_id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {lead.first_name} {lead.last_name}
                          </div>
                          <div className="text-sm text-gray-500">{lead.email}</div>
                          {lead.phone && (
                            <div className="text-sm text-gray-500">{lead.phone}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm text-gray-900">
                          {lead.car_info?.vehicleTitle || 'Sin información'}
                        </div>
                        {lead.car_info?.price && (
                          <div className="text-sm text-gray-500">
                            ${lead.car_info.price.toLocaleString()}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={
                          lead.assignment_status === 'approved' ? 'default' :
                          lead.assignment_status === 'rejected' ? 'destructive' :
                          'secondary'
                        }>
                          {getStatusLabel(lead.assignment_status)}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {lead.approved_documents}/{lead.total_documents}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                        {getTimeAgo(lead.hours_since_received)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDownloadClick(lead)}
                            title="Descargar documentos"
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Download className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="link"
                            onClick={() => router.push(`/bank-dashboard/leads/${lead.lead_id}`)}
                            className="px-0"
                          >
                            Ver detalles →
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            )}
          </CardContent>
        </Card>

        {/* PIN Verification Modal */}
        {showPINVerify && (
          <BankPINVerify
            onVerified={handlePINVerified}
            onCancel={handlePINCancel}
            action="Descargar documentos de la solicitud"
          />
        )}
      </div>
    </div>
  );
};

export default BankDashboardPage;
