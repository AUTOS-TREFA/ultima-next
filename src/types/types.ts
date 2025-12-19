// types/types.ts

// =============================================================================
// VEHÍCULO - INTERFAZ UNIFICADA
// =============================================================================
export interface Vehicle {
  // ========== IDENTIFICADORES ==========
  id: number;
  slug: string;
  ordencompra: string;
  record_id: string | null;
  
  // ========== TÍTULO Y DESCRIPCIÓN ==========
  titulo: string;
  descripcion: string;
  metadescripcion: string;

  // ========== MARCA Y MODELO ==========
  marca: string;
  modelo: string;
  
  // ========== ESPECIFICACIONES TÉCNICAS ==========
  autoano: number;
  precio: number;
  kilometraje: number;
  transmision: string;
  combustible: string;
  AutoMotor: string;
  cilindros: number;
  
  // ========== FINANCIAMIENTO ==========
  enganchemin: number;
  enganche_recomendado: number;
  mensualidad_minima: number;
  mensualidad_recomendada: number;
  plazomax: number;
  
  // ========== IMÁGENES ==========
  // R2 images (highest priority - uploaded via admin panel)
  r2_feature_image?: string;
  r2_gallery?: string[];
  use_r2_images?: boolean;
  // Legacy image fields
  feature_image: string[];
  feature_image_url?: string;
  galeria_exterior: string[];
  fotos_exterior_url?: string[];
  galeria_interior: string[];
  fotos_interior_url?: string[];
  
  // ========== UBICACIÓN ==========
  ubicacion: string[];
  sucursal: string[]; // Alias for ubicacion
  
  // ========== GARANTÍA ==========
  garantia: string;
  
  // ========== ESTADO ==========
  vendido: boolean;
  separado: boolean;
  ordenstatus: string;
  
  // ========== CLASIFICACIÓN Y CATEGORÍAS ==========
  clasificacionid: string[];
  carroceria: string;
  
  // ========== PROMOCIONES ==========
  promociones: string[];
  
  // ========== ESTADÍSTICAS ==========
  view_count: number;

  // ========== FECHAS ==========
  ingreso_inventario: string | null;

  // ========== REZAGO ==========
  rezago: boolean;

  // ========== LEGACY & COMPATIBILITY (to be phased out) ==========
  // These are kept for now to avoid breaking other parts of the app
  // but the primary fields above are the source of truth.
  title: string;
  price: number;
  year: number;
  kms: number;
  [key: string]: any; // Allow other properties for now
}

export type WordPressVehicle = Vehicle;

// =============================================================================
// FILTROS
// =============================================================================
export interface VehicleFilters {
  search?: string;
  marca?: string[];
  autoano?: number[];
  promociones?: string[];
  garantia?: string[];
  carroceria?: string[];
  transmision?: string[];
  combustible?: string[];
  ubicacion?: string[];
  hideSeparado?: boolean;
  minPrice?: number;
  maxPrice?: number;
  enganchemin?: number;
  maxEnganche?: number;
  orderby?: string;
}

// Other types remain the same...

export interface WordPressPaginatedResponse {
  vehicles: Vehicle[];
  totalItems: number;
  totalPages: number;
}
export interface TaxonomyTerm {
  id: number;
  name: string;
  slug: string;
  count: number;
}
export interface InspectionReportData {
  id?: string;
  vehicle_id: number;
  status: 'approved' | 'pending' | 'rejected';
  past_owners: number;
  sinisters: number;
  police_report: string;
  inspection_points: {
    [key: string]: string[];
  };
  created_at?: string;
  updated_at?: string;
}
export interface IntelimotorValuation {
  suggestedOffer: number;
  highMarketValue: number;
  lowMarketValue: number;
  ofertaAutomatica?: number;
  avgDaysOnMarket?: number;
  avgKms?: number;
}
export interface Profile {
    id: string;
    updated_at?: string;
    email: string;
    first_name?: string;
    last_name?: string;
    phone?: string;
    phone_verified?: boolean;
    cellphone_company?: string;
    role: 'user' | 'admin' | 'sales' | 'marketing';
    asesor_asignado_id?: string;
    asesor_asignado_name?: string;
    picture_url?: string;
    [key: string]: any;
}

export interface UserVehicleForSale {
    id?: string;
    user_id: string;
    status: 'draft' | 'in_inspection' | 'offer_made' | 'accepted' | 'rejected' | 'completed';
    valuation_data?: any;
    owner_count?: number;
    key_info?: string;
    invoice_status?: 'liberada' | 'financiada';
    financing_entity_type?: 'banco' | 'agencia';
    financing_entity_name?: string;
    vehicle_state?: string;
    plate_registration_state?: string;
    accident_history?: string;
    reason_for_selling?: string;
    additional_details?: string;
    exterior_photos?: string[];
    interior_photos?: string[];
    inspection_notes?: string;
    final_offer?: number;
    listing_url?: string;
    inspection_branch?: string;
    created_at?: string;
    updated_at?: string;
    contacted?: boolean;
    asesor_asignado_id?: string;
    asesor_asignado?: string;
    tags?: string[];
}
// =============================================================================
// JOB APPLICATION - JOB POSTING INTERFACE
// =============================================================================
export interface JobApplication {
    id: string;
    candidate_name: string;
    candidate_email: string;
    candidate_phone: string;
    submitted_at: string;
    cv_url: string;
}

export interface Vacancy {
    id: string;
    title: string;
    description?: string;
    requirements?: string;
    benefits?: string;
    location?: string;
    salary_range?: string;
    job_type?: string;
    schedule?: string;
    department?: string;
    status?: 'draft' | 'published' | 'archived';
    image_url?: string;
    created_at?: string;
    updated_at?: string;
    applications_count?: number;
}

// =============================================================================
// FINANCING APPLICATION TYPES
// =============================================================================
export interface ApplicationListItem {
    id: string;
    status: string;
    created_at: string;
    updated_at: string;
}

export interface LatestApplicationData {
    id: string;
    status: string;
    created_at: string;
}

export interface UpdatedApplicationData {
    id: string;
    status: string;
    updated_at: string;
}

export interface BankProfileData {
    is_complete: boolean;
    banco_recomendado?: string;
    respuestas?: any;
    banco_segunda_opcion?: string;
}
