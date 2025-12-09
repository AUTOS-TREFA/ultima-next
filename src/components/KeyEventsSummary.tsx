import React from 'react';
import { Clock, TrendingUp, UserPlus, FileText, AlertCircle, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export interface KeyEvent {
  id: string;
  type: 'new_lead' | 'application_submitted' | 'document_uploaded' | 'status_change' | 'follow_up_needed' | 'approved';
  title: string;
  description: string;
  timestamp: string;
  link?: string;
  metadata?: {
    leadName?: string;
    leadId?: string;
    vehicleTitle?: string;
    status?: string;
  };
}

interface KeyEventsSummaryProps {
  events: KeyEvent[];
  loading?: boolean;
  maxEvents?: number;
}

const getEventIcon = (type: KeyEvent['type']) => {
  switch (type) {
    case 'new_lead':
      return <UserPlus className="w-5 h-5 text-blue-600" />;
    case 'application_submitted':
      return <FileText className="w-5 h-5 text-purple-600" />;
    case 'document_uploaded':
      return <TrendingUp className="w-5 h-5 text-green-600" />;
    case 'status_change':
      return <AlertCircle className="w-5 h-5 text-orange-600" />;
    case 'follow_up_needed':
      return <Clock className="w-5 h-5 text-red-600" />;
    case 'approved':
      return <CheckCircle2 className="w-5 h-5 text-emerald-600" />;
    default:
      return <Clock className="w-5 h-5 text-gray-600" />;
  }
};

const getEventColor = (type: KeyEvent['type']) => {
  switch (type) {
    case 'new_lead':
      return 'bg-blue-50 border-blue-200';
    case 'application_submitted':
      return 'bg-purple-50 border-purple-200';
    case 'document_uploaded':
      return 'bg-green-50 border-green-200';
    case 'status_change':
      return 'bg-orange-50 border-orange-200';
    case 'follow_up_needed':
      return 'bg-red-50 border-red-200';
    case 'approved':
      return 'bg-emerald-50 border-emerald-200';
    default:
      return 'bg-gray-50 border-gray-200';
  }
};

const formatTime = (timestamp: string): string => {
  const date = new Date(timestamp);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMins < 1) return 'Hace un momento';
  if (diffInMins === 1) return 'Hace 1 minuto';
  if (diffInMins < 60) return `Hace ${diffInMins} minutos`;
  if (diffInHours === 1) return 'Hace 1 hora';
  if (diffInHours < 24) return `Hace ${diffInHours} horas`;
  if (diffInDays === 1) return 'Ayer';
  if (diffInDays < 7) return `Hace ${diffInDays} días`;

  return date.toLocaleDateString('es-MX', { month: 'short', day: 'numeric' });
};

const KeyEventsSummary: React.FC<KeyEventsSummaryProps> = ({ events, loading = false, maxEvents = 10 }) => {
  const displayEvents = events.slice(0, maxEvents);

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-primary-600" />
          Eventos Recientes
        </h3>
        <div className="text-center py-8">
          <Clock className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500 text-sm">No hay eventos recientes</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <Clock className="w-5 h-5 mr-2 text-primary-600" />
          Eventos Recientes
        </h3>
        <p className="text-sm text-gray-500 mt-1">Actividad de las últimas 24 horas</p>
      </div>

      <div className="divide-y divide-gray-100">
        {displayEvents.map((event) => (
          <div
            key={event.id}
            className={`p-4 hover:bg-gray-50 transition-colors ${getEventColor(event.type)} border-l-4`}
          >
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {getEventIcon(event.type)}
              </div>
              <div className="flex-grow min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-grow">
                    <h4 className="text-sm font-semibold text-gray-900 truncate">
                      {event.title}
                    </h4>
                    <p className="text-sm text-gray-600 mt-0.5">
                      {event.description}
                    </p>
                    {event.metadata?.vehicleTitle && (
                      <p className="text-xs text-gray-500 mt-1 truncate">
                        {event.metadata.vehicleTitle}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">
                    {formatTime(event.timestamp)}
                  </span>
                </div>
                {event.link && (
                  <Link
                    href={event.link}
                    className="inline-flex items-center text-xs font-medium text-primary-600 hover:text-primary-700 mt-2"
                  >
                    Ver detalles →
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {events.length > maxEvents && (
        <div className="p-4 bg-gray-50 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-600">
            Mostrando {maxEvents} de {events.length} eventos
          </p>
        </div>
      )}
    </div>
  );
};

export default KeyEventsSummary;
