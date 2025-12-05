// Bank Portal Types

export type BankName =
  | 'scotiabank'
  | 'bbva'
  | 'banregio'
  | 'banorte'
  | 'afirme'
  | 'hey_banco'
  | 'ban_bajio'
  | 'santander'
  | 'hsbc';

export interface BankInfo {
  id: BankName;
  name: string;
  logo: string;
  color: string;
}

export const BANKS: Record<BankName, BankInfo> = {
  scotiabank: {
    id: 'scotiabank',
    name: 'Scotiabank',
    logo: '/banks/scotiabank.svg',
    color: '#ED1C24'
  },
  bbva: {
    id: 'bbva',
    name: 'BBVA',
    logo: '/banks/bbva.svg',
    color: '#004481'
  },
  banregio: {
    id: 'banregio',
    name: 'Banregio',
    logo: '/banks/banregio.svg',
    color: '#00A859'
  },
  banorte: {
    id: 'banorte',
    name: 'Banorte',
    logo: '/banks/banorte.svg',
    color: '#ED1C24'
  },
  afirme: {
    id: 'afirme',
    name: 'AFIRME',
    logo: '/banks/afirme.svg',
    color: '#0066B3'
  },
  hey_banco: {
    id: 'hey_banco',
    name: 'Hey Banco',
    logo: '/banks/hey-banco.svg',
    color: '#00D9C5'
  },
  ban_bajio: {
    id: 'ban_bajio',
    name: 'BanBajío',
    logo: '/banks/ban-bajio.svg',
    color: '#003DA5'
  },
  santander: {
    id: 'santander',
    name: 'Santander',
    logo: '/banks/santander.svg',
    color: '#EC0000'
  },
  hsbc: {
    id: 'hsbc',
    name: 'HSBC',
    logo: '/banks/hsbc.svg',
    color: '#DB0011'
  }
};

export interface BankRepresentativeProfile {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
  bank_affiliation: BankName;
  is_approved: boolean;
  approved_by?: string;
  approved_at?: string;
  is_active: boolean;
  last_login_at?: string;
  login_count: number;
  created_at: string;
  updated_at: string;
}

export type AssignmentStatus =
  | 'pending'
  | 'reviewing'
  | 'approved'
  | 'rejected'
  | 'feedback_provided';

export interface LeadBankAssignment {
  id: string;
  lead_id: string;
  application_id?: string;
  bank_rep_id: string;
  bank_name: BankName;
  assigned_by?: string;
  assigned_at: string;
  status: AssignmentStatus;
  last_updated_at: string;
}

export type FeedbackType =
  | 'general'
  | 'missing_docs'
  | 'approval'
  | 'rejection'
  | 'request_info';

export interface BankFeedback {
  id: string;
  assignment_id: string;
  bank_rep_id: string;
  lead_id: string;
  message: string;
  feedback_type: FeedbackType;
  visible_to_sales: boolean;
  visible_to_client: boolean;
  created_at: string;
  read_by_sales: boolean;
  read_at?: string;
}

export interface ApplicationStatusHistory {
  id: string;
  application_id: string;
  lead_id: string;
  old_status?: string;
  new_status: string;
  changed_by?: string;
  changed_by_type: 'admin' | 'sales' | 'bank_rep' | 'system';
  bank_rep_id?: string;
  reason?: string;
  metadata?: Record<string, any>;
  created_at: string;
}

// Dashboard data types
export interface BankRepDashboardStats {
  total_assigned: number;
  pending_review: number;
  approved: number;
  rejected: number;
  feedback_provided: number;
}

export interface BankRepAssignedLead {
  lead_id: string;
  assignment_id: string;
  assignment_status: AssignmentStatus;
  assigned_at: string;

  // Lead info
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;

  // Application info
  application_id?: string;
  application_status?: string;
  car_info?: {
    brand?: string;
    model?: string;
    year?: number;
    price?: number;
    vehicleTitle?: string;
  };
  created_at: string;

  // Bank profile
  bank_profile_score?: number;
  bank_profile_risk_level?: string;

  // Document counts
  total_documents: number;
  approved_documents: number;

  // Feedback count
  feedback_count: number;

  // Time since received
  hours_since_received: number;
}

export interface BankRepLeadDetails {
  success: boolean;
  error?: string;
  lead?: {
    id: string;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    created_at: string;
  };
  application?: Array<{
    id: string;
    status: string;
    car_info: any;
    personal_info: any;
    application_data: any;
    selected_banks: string[];
    created_at: string;
    updated_at: string;
  }>;
  bank_profile?: {
    score: number;
    risk_level: string;
    profiling_data: any;
  };
  documents?: Array<{
    id: string;
    document_type: string;
    file_name: string;
    file_path: string;
    status: string;
    created_at: string;
  }>;
  feedback?: Array<{
    id: string;
    message: string;
    feedback_type: FeedbackType;
    created_at: string;
  }>;
  assignment?: {
    id: string;
    status: AssignmentStatus;
    assigned_at: string;
    last_updated_at: string;
  };
}

// API Response types
export interface BankRepUpdateStatusResponse {
  success: boolean;
  error?: string;
  assignment_id?: string;
  new_status?: string;
  lead_id?: string;
}

export interface BankRepApprovalResponse {
  success: boolean;
  error?: string;
  bank_rep_id?: string;
  is_approved?: boolean;
}

// Application status options for bank reps
export const BANK_APPLICATION_STATUSES = [
  { value: 'Aprobada', label: 'Aprobada', color: 'green' },
  { value: 'Rechazada', label: 'Rechazada', color: 'red' },
  { value: 'Faltan documentos', label: 'Faltan documentos', color: 'yellow' }
] as const;
