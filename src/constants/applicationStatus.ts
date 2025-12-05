/**
 * Centralized Application Status Constants
 *
 * These statuses are used across the entire application for financing applications.
 * They update automatically based on certain conditions (documents, review progress, etc.)
 */

export const APPLICATION_STATUS = {
  // Initial states
  DRAFT: 'draft',                    // Borrador - Application being filled out
  COMPLETA: 'Completa',              // Complete - Submitted with all documents
  FALTAN_DOCUMENTOS: 'Faltan Documentos', // Missing documents - Submitted without docs

  // Review states
  EN_REVISION: 'En Revisión',        // Under review by bank/admin

  // Final states
  APROBADA: 'Aprobada',              // Approved
  RECHAZADA: 'Rechazada',            // Rejected

  // Legacy statuses (for backward compatibility - to be migrated)
  SUBMITTED: 'submitted',
  REVIEWING: 'reviewing',
  PENDING_DOCS: 'pending_docs',
  APPROVED: 'approved',
  IN_REVIEW: 'in_review',
} as const;

export type ApplicationStatus = typeof APPLICATION_STATUS[keyof typeof APPLICATION_STATUS];

/**
 * Status display configuration for UI
 */
export const STATUS_CONFIG: Record<string, {
  label: string;
  color: string;
  badgeClass: string;
  description: string;
  dotColor: string;
  textColor: string;
}> = {
  [APPLICATION_STATUS.DRAFT]: {
    label: 'Borrador',
    color: 'gray',
    badgeClass: 'bg-gray-100 text-gray-800',
    description: 'La solicitud está en proceso de llenado',
    dotColor: 'bg-gray-500',
    textColor: 'text-gray-700',
  },
  [APPLICATION_STATUS.COMPLETA]: {
    label: 'Completa',
    color: 'green',
    badgeClass: 'bg-green-100 text-green-800',
    description: 'Solicitud completa con todos los documentos',
    dotColor: 'bg-green-500',
    textColor: 'text-green-700',
  },
  [APPLICATION_STATUS.FALTAN_DOCUMENTOS]: {
    label: 'Faltan Documentos',
    color: 'yellow',
    badgeClass: 'bg-yellow-100 text-yellow-800',
    description: 'Solicitud enviada pero faltan documentos requeridos',
    dotColor: 'bg-amber-600',
    textColor: 'text-amber-700',
  },
  [APPLICATION_STATUS.EN_REVISION]: {
    label: 'En Revisión',
    color: 'purple',
    badgeClass: 'bg-purple-100 text-purple-800',
    description: 'La solicitud está siendo revisada',
    dotColor: 'bg-purple-500',
    textColor: 'text-purple-700',
  },
  [APPLICATION_STATUS.APROBADA]: {
    label: 'Aprobada',
    color: 'green',
    badgeClass: 'bg-green-100 text-green-800',
    description: 'Solicitud aprobada',
    dotColor: 'bg-green-500',
    textColor: 'text-green-700',
  },
  [APPLICATION_STATUS.RECHAZADA]: {
    label: 'Rechazada',
    color: 'red',
    badgeClass: 'bg-red-100 text-red-800',
    description: 'Solicitud rechazada',
    dotColor: 'bg-red-500',
    textColor: 'text-red-700',
  },
  // Legacy status mappings
  [APPLICATION_STATUS.SUBMITTED]: {
    label: 'Enviada',
    color: 'blue',
    badgeClass: 'bg-blue-100 text-blue-800',
    description: 'Solicitud enviada',
    dotColor: 'bg-blue-500',
    textColor: 'text-blue-700',
  },
  [APPLICATION_STATUS.REVIEWING]: {
    label: 'En Revisión',
    color: 'purple',
    badgeClass: 'bg-purple-100 text-purple-800',
    description: 'En revisión',
    dotColor: 'bg-purple-500',
    textColor: 'text-purple-700',
  },
  [APPLICATION_STATUS.PENDING_DOCS]: {
    label: 'Pendiente Documentos',
    color: 'yellow',
    badgeClass: 'bg-yellow-100 text-yellow-800',
    description: 'Documentos pendientes',
    dotColor: 'bg-amber-600',
    textColor: 'text-amber-700',
  },
  [APPLICATION_STATUS.APPROVED]: {
    label: 'Aprobada',
    color: 'green',
    badgeClass: 'bg-green-100 text-green-800',
    description: 'Aprobada',
    dotColor: 'bg-green-500',
    textColor: 'text-green-700',
  },
  [APPLICATION_STATUS.IN_REVIEW]: {
    label: 'En Revisión',
    color: 'purple',
    badgeClass: 'bg-purple-100 text-purple-800',
    description: 'En revisión',
    dotColor: 'bg-purple-500',
    textColor: 'text-purple-700',
  },
};

/**
 * Get status display configuration
 */
export function getStatusConfig(status: string) {
  return STATUS_CONFIG[status] || {
    label: status,
    color: 'gray',
    badgeClass: 'bg-gray-100 text-gray-800',
    description: status,
    dotColor: 'bg-gray-500',
    textColor: 'text-gray-700',
  };
}

/**
 * All valid statuses for filtering and queries
 */
export const ALL_STATUSES = Object.values(APPLICATION_STATUS);

/**
 * Active statuses (not draft, not final)
 */
export const ACTIVE_STATUSES = [
  APPLICATION_STATUS.COMPLETA,
  APPLICATION_STATUS.FALTAN_DOCUMENTOS,
  APPLICATION_STATUS.EN_REVISION,
  APPLICATION_STATUS.SUBMITTED,
  APPLICATION_STATUS.REVIEWING,
  APPLICATION_STATUS.PENDING_DOCS,
  APPLICATION_STATUS.IN_REVIEW,
  APPLICATION_STATUS.APPROVED,
];

/**
 * Statuses that indicate application is in progress
 */
export const IN_PROGRESS_STATUSES = [
  APPLICATION_STATUS.COMPLETA,
  APPLICATION_STATUS.FALTAN_DOCUMENTOS,
  APPLICATION_STATUS.EN_REVISION,
  APPLICATION_STATUS.SUBMITTED,
  APPLICATION_STATUS.REVIEWING,
  APPLICATION_STATUS.PENDING_DOCS,
  APPLICATION_STATUS.IN_REVIEW,
];

/**
 * Statuses that show in dashboards
 */
export const DASHBOARD_STATUSES = [
  APPLICATION_STATUS.COMPLETA,
  APPLICATION_STATUS.FALTAN_DOCUMENTOS,
  APPLICATION_STATUS.EN_REVISION,
  APPLICATION_STATUS.APROBADA,
  APPLICATION_STATUS.RECHAZADA,
];
