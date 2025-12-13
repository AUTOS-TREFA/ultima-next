import type { Vehicle, VehicleFilters } from '../types/types';
import { supabase } from '../../supabaseClient';
import { generateSlug } from '../utils/formatters';
import { getVehicleImage } from '../utils/getVehicleImage';
import { DEFAULT_PLACEHOLDER_IMAGE } from '../utils/constants';

interface CacheEntry<T> {
  data: T;
  totalCount: number;
  timestamp: number;
}

const isValidImageUrl = (url: any): url is string => {
    if (typeof url !== 'string' || url.trim() === '') return false;
    return url.trim().startsWith('http');
};

class VehicleService {
    private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes
    private static readonly RECENTLY_VIEWED_KEY = 'trefa_recently_viewed';
    private static cache = new Map<string, CacheEntry<Vehicle[]>>();
    private static readonly VEHICLES_PER_PAGE = 21;
    private static readonly USE_RAPID_PROCESSOR = true; // Feature flag for rapid-processor

    /**
     * Transform rapid-processor response to match expected Vehicle format
     * Ensures compatibility with existing components
     */
    private static transformRapidProcessorData(rpVehicles: any[]): Vehicle[] {
        return rpVehicles.map((item: any) => {
            const safeParseFloat = (val: any, fallback = 0) => {
                const n = parseFloat(String(val).replace(/,/g, ''));
                return isNaN(n) ? fallback : n;
            };
            const safeParseInt = (val: any, fallback = 0) => {
                const n = parseInt(String(val).replace(/,/g, ''), 10);
                return isNaN(n) ? fallback : n;
            };

            // Handle ubicacion mapping
            const sucursalMapping: Record<string, string> = {
                'MTY': 'Monterrey',
                'GPE': 'Guadalupe',
                'TMPS': 'Reynosa',
                'COAH': 'Saltillo'
            };

            const parseArrayField = (field: any): string[] => {
                if (Array.isArray(field)) return field.map(String).filter(Boolean);
                if (typeof field === 'string') {
                    try {
                        const parsed = JSON.parse(field);
                        if (Array.isArray(parsed)) return parsed.map(String).filter(Boolean);
                        return field.split(',').map((s: string) => s.trim()).filter(Boolean);
                    } catch {
                        return field.split(',').map((s: string) => s.trim()).filter(Boolean);
                    }
                }
                return [];
            };

            let normalizedSucursales: string[] = [];
            const ubicacionArray = parseArrayField(item.ubicacion);
            normalizedSucursales = ubicacionArray.map((s: string) =>
                sucursalMapping[s.trim().toUpperCase()] || s.trim()
            ).filter(Boolean);

            // Extract gallery images from rapid-processor format
            const galeriaExterior = item.galeriaExterior || item.galeria_exterior || [];
            const galeriaInterior = item.galeriaInterior || item.galeria_interior || [];

            // Get feature image from public_urls or fallback
            const featureImage = item.public_urls?.feature_image ||
                                item.thumbnail ||
                                item.feature_image ||
                                galeriaExterior[0] ||
                                '';

            // Use existing title from database, only fall back to 'Auto sin título' if missing
            const title = item.title || item.title || 'Auto sin título';

            // Helper to get first element from array or return as string
            const getFirstOrString = (field: any): string => {
                if (Array.isArray(field)) return field[0] || '';
                if (typeof field === 'string') {
                    // Try to parse as JSON first (for fields that might be stored as JSONB arrays)
                    try {
                        const parsed = JSON.parse(field);
                        if (Array.isArray(parsed)) {
                            return parsed[0] || '';
                        }
                    } catch {
                        // If JSON parse fails, return as is
                        return field;
                    }
                }
                return field || '';
            };

            return {
                id: item.id || 0,
                slug: item.slug || '',
                ordencompra: item.ordencompra || '',
                record_id: item.record_id || null,

                title: title,
                descripcion: item.descripcion || '',
                metadescripcion: item.metadescripcion || '',

                marca: item.marca || '',
                modelo: item.modelo || '',

                autoano: safeParseInt(item.autoano),
                precio: safeParseFloat(item.precio),
                kilometraje: safeParseInt(getFirstOrString(item.kilometraje)),
                transmision: getFirstOrString(item.transmision),
                combustible: getFirstOrString(item.combustible),
                carroceria: getFirstOrString(item.carroceria || item.clasificacionid),
                cilindros: safeParseInt(item.cilindros),
                AutoMotor: item.AutoMotor || '',

                enganchemin: safeParseFloat(item.enganchemin),
                enganche_recomendado: safeParseFloat(item.enganche_recomendado),
                mensualidad_minima: safeParseFloat(item.mensualidad_minima),
                mensualidad_recomendada: safeParseFloat(item.mensualidad_recomendada),
                plazomax: safeParseInt(item.plazomax),

                // Normalize image fields to match expected format
                feature_image: [featureImage],
                galeria_exterior: Array.isArray(galeriaExterior) ? galeriaExterior : [],
                fotos_exterior_url: Array.isArray(galeriaExterior) ? galeriaExterior : [],
                galeria_interior: Array.isArray(galeriaInterior) ? galeriaInterior : [],
                fotos_interior_url: Array.isArray(galeriaInterior) ? galeriaInterior : [],

                ubicacion: normalizedSucursales,
                sucursal: normalizedSucursales, // Alias

                garantia: item.garantia || '',

                vendido: !!item.vendido,
                separado: !!item.separado,
                ordenstatus: item.ordenstatus || '',

                clasificacionid: parseArrayField(item.clasificacionid),

                promociones: Array.isArray(item.promociones) ? item.promociones : [],

                view_count: safeParseInt(item.view_count),

                ingreso_inventario: item.ingreso_inventario || null,
                rezago: !!item.rezago,

                // Legacy aliases
                title: title,
                price: safeParseFloat(item.precio),
                year: safeParseInt(item.autoano),
                kms: safeParseInt(item.kilometraje),
            } as Vehicle;
        });
    }

    /**
     * Fetch vehicles from rapid-processor edge function
     */
    private static async fetchFromRapidProcessor(filters: VehicleFilters = {}, page: number = 1): Promise<{ vehicles: Vehicle[], totalCount: number }> {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        // Build query parameters
        const params = new URLSearchParams({
            page: page.toString(),
            pageSize: this.VEHICLES_PER_PAGE.toString(),
        });

        // Add array filters
        if (filters.marca?.length) {
            filters.marca.forEach(m => params.append('marca', m));
        }
        if (filters.autoano?.length) {
            filters.autoano.forEach(y => params.append('autoano', y.toString()));
        }
        if (filters.transmision?.length) {
            filters.transmision.forEach(t => params.append('transmision', t));
        }
        if (filters.combustible?.length) {
            filters.combustible.forEach(c => params.append('combustible', c));
        }
        if (filters.garantia?.length) {
            filters.garantia.forEach(g => params.append('garantia', g));
        }
        if (filters.carroceria?.length) {
            filters.carroceria.forEach(c => params.append('carroceria', c));
        }
        if (filters.ubicacion?.length) {
            filters.ubicacion.forEach(u => params.append('ubicacion', u));
        }
        if (filters.promociones?.length) {
            filters.promociones.forEach(p => params.append('promociones', p));
        }

        // Add range filters
        if (filters.minPrice) params.append('minPrice', filters.minPrice.toString());
        if (filters.maxPrice) params.append('maxPrice', filters.maxPrice.toString());
        if (filters.enganchemin) params.append('enganchemin', filters.enganchemin.toString());
        if (filters.maxEnganche) params.append('maxEnganche', filters.maxEnganche.toString());

        // Add boolean filters
        if (filters.hideSeparado) params.append('hideSeparado', 'true');

        // Add search
        if (filters.search) params.append('search', filters.search);

        // Add ordering
        if (filters.orderby) params.append('orderby', filters.orderby);

        const url = `${supabaseUrl}/functions/v1/rapid-processor?${params.toString()}`;

        console.log('[VehicleService] Fetching from rapid-processor:', url);

        const response = await fetch(url, {
            headers: {
                'Authorization': `Bearer ${supabaseKey}`,
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            throw new Error(`rapid-processor returned ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Transform data to match expected format
        const transformedVehicles = this.transformRapidProcessorData(data.vehicles || []);

        return {
            vehicles: transformedVehicles,
            totalCount: data.totalCount || 0,
        };
    }

    private static async buildSupabaseQuery(filters: VehicleFilters = {}, page: number = 1) {
        console.log('Building Supabase query with filters:', filters);
        const reverseSucursalMapping: Record<string, string> = {
            'Monterrey': 'MTY',
            'Guadalupe': 'GPE',
            'Reynosa': 'TMPS',
            'Saltillo': 'COAH'
        };

        let query = supabase.from('inventario_cache').select('*, feature_image_url, fotos_exterior_url', { count: 'exact' });

        // --- Base Filters ---
        query = query.eq('ordenstatus', 'Comprado');
        if (filters.hideSeparado) {
            query = query.or('separado.eq.false,separado.is.null');
        }

        // --- Direct Equality Filters ---
        if (filters.marca && filters.marca.length > 0) {
            query = query.in('marca', filters.marca);
        }
        if (filters.autoano && filters.autoano.length > 0) {
            query = query.in('autoano', filters.autoano);
        }
        if (filters.transmision && filters.transmision.length > 0) {
            query = query.in('transmision', filters.transmision);
        }
        if (filters.combustible && filters.combustible.length > 0) {
            query = query.in('combustible', filters.combustible);
        }
        if (filters.garantia && filters.garantia.length > 0) {
            query = query.in('garantia', filters.garantia);
        }

        // --- Range Filters ---
        if (filters.minPrice) {
            query = query.gte('precio', filters.minPrice);
        }
        if (filters.maxPrice) {
            query = query.lte('precio', filters.maxPrice);
        }
        if (filters.enganchemin) {
            query = query.gte('enganchemin', filters.enganchemin);
        }
        if (filters.maxEnganche) {
            query = query.lte('enganchemin', filters.maxEnganche);
        }

        // --- Complex Text Search / Array-like Filters ---
        // Carroceria filter - case-insensitive, checks both carroceria and clasificacionid fields
        if (filters.carroceria && filters.carroceria.length > 0) {
            // Build OR conditions for each carroceria value to be case-insensitive
            // clasificacionid is stored as comma-separated text, so use ilike with wildcards
            const carroceriaConditions = filters.carroceria.map(c => {
                const lowerVal = c.toLowerCase();
                // Match carroceria field (case-insensitive) OR clasificacionid text contains the value
                return `carroceria.ilike.%${lowerVal}%,clasificacionid.ilike.%${lowerVal}%`;
            }).join(',');
            query = query.or(carroceriaConditions);
        }
        if (filters.ubicacion && filters.ubicacion.length > 0) {
            const rawSucursales = filters.ubicacion.map(s => reverseSucursalMapping[s] || s);
            query = query.in('ubicacion', rawSucursales);
        }

        if (filters.promociones && filters.promociones.length > 0) {
            query = query.overlaps('promociones', filters.promociones);
        }

        if (filters.search) {
            const { data: searchData, error: searchError } = await supabase.rpc('search_vehicles', { search_term: filters.search });
            if (searchError) throw searchError;
            
            if (Array.isArray(searchData)) {
                const vehicleIds = searchData.map((v: any) => v.id);
                if (vehicleIds.length === 0) {
                    query = query.eq('id', -1); 
                } else {
                    query = query.in('id', vehicleIds);
                }
            }
        }
        
        // --- Pagination and Ordering ---
        const from = (page - 1) * this.VEHICLES_PER_PAGE;
        const to = from + this.VEHICLES_PER_PAGE - 1;
        query = query.range(from, to);
        
        if (filters.orderby) {
            // Handle "relevance" (Más Populares) - sort by view_count descending
            if (filters.orderby === 'relevance') {
                query = query.order('view_count', { ascending: false, nullsFirst: false });
            } else {
                const [field, direction] = filters.orderby.split('-');
                const fieldMap: Record<string, string> = {
                    price: 'precio',
                    year: 'autoano',
                    mileage: 'kilometraje'
                };
                const mappedField = fieldMap[field] || field;
                query = query.order(mappedField, { ascending: direction === 'asc' });
            }
        } else if (!filters.search) { // Don't re-order if search is active, as it's already ordered by relevance
            query = query.order('updated_at', { ascending: false });
        }

        return query;
    }

    public static async getAllVehicles(filters: VehicleFilters = {}, page: number = 1): Promise<{ vehicles: Vehicle[], totalCount: number }> {
        const cacheKey = `vehicles_${JSON.stringify(filters)}_${page}`;

        const cached = this.cache.get(cacheKey);
        if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
            console.log('[VehicleService] Cache hit!');
            return { vehicles: cached.data, totalCount: cached.totalCount };
        }

        try {
            const localCache = localStorage.getItem(cacheKey);
            if (localCache) {
                const { data, totalCount, timestamp } = JSON.parse(localCache);
                if (Date.now() - timestamp < this.CACHE_TTL) {
                    console.log('[VehicleService] Local storage cache hit!');
                    this.cache.set(cacheKey, { data, totalCount, timestamp });
                    return { vehicles: data, totalCount };
                }
            }
        } catch (e) {
            console.warn("[VehicleService] Could not read localStorage cache.", e);
        }

        // Try rapid-processor first if enabled
        if (this.USE_RAPID_PROCESSOR) {
            try {
                console.log('[VehicleService] Attempting to fetch from rapid-processor...');
                const result = await this.fetchFromRapidProcessor(filters, page);

                console.log('[VehicleService] rapid-processor fetch successful:', result.vehicles.length, 'vehicles');

                // Cache the results
                this.cache.set(cacheKey, { data: result.vehicles, totalCount: result.totalCount, timestamp: Date.now() });
                try {
                    localStorage.setItem(cacheKey, JSON.stringify({
                        data: result.vehicles,
                        totalCount: result.totalCount,
                        timestamp: Date.now()
                    }));
                } catch (e) {
                    console.warn("[VehicleService] Could not write to localStorage cache.", e);
                }

                return result;
            } catch (rapidError) {
                console.warn('[VehicleService] rapid-processor failed, falling back to direct Supabase query:', rapidError);
                // Continue to fallback below
            }
        }

        // Fallback to direct Supabase query
        try {
            console.log('[VehicleService] Using direct Supabase query (fallback)');
            const query = await this.buildSupabaseQuery(filters, page);
            const { data, error, count } = await query;

            if (error) throw error;
            if (!data) throw new Error("No data returned from Supabase.");

            const normalizedData = this.normalizeVehicleData(data);
            const totalCount = count || 0;

            console.log('[VehicleService] Supabase query successful:', normalizedData.length, 'vehicles');

            this.cache.set(cacheKey, { data: normalizedData, totalCount, timestamp: Date.now() });
            try {
                localStorage.setItem(cacheKey, JSON.stringify({ data: normalizedData, totalCount, timestamp: Date.now() }));
            } catch (e) {
                console.warn("[VehicleService] Could not write to localStorage cache.", e);
            }

            return { vehicles: normalizedData, totalCount };
        } catch (error) {
            console.error('[VehicleService] All data sources failed, attempting to use stale cache.', error);
            // If all sources fail, try to return from cache even if it's stale
            const staleCached = this.cache.get(cacheKey);
            if (staleCached) {
                console.warn('[VehicleService] Returning stale in-memory cache data.');
                return { vehicles: staleCached.data, totalCount: staleCached.totalCount };
            }
            try {
                const staleLocalCache = localStorage.getItem(cacheKey);
                if (staleLocalCache) {
                    console.warn('[VehicleService] Returning stale localStorage cache data.');
                    const { data, totalCount } = JSON.parse(staleLocalCache);
                    return { vehicles: data, totalCount };
                }
            } catch (e) {
                console.error("[VehicleService] Could not read or parse stale localStorage cache.", e);
            }
            // If there's no stale cache, re-throw the original error
            throw error;
        }
    }

    public static async getFilterOptions(): Promise<any> {
        try {
            const { data, error } = await supabase.rpc('get_filter_options');
            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Error fetching filter options:', error);
            return {};
        }
    }

    public static async getVehicleByOrdenCompra(ordencompra: string): Promise<Vehicle | null> {
        if (!ordencompra) return null;
        try {
            const { data, error } = await supabase
                .from('inventario_cache')
                .select('*')
                .eq('ordencompra', ordencompra)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // No single row found
                throw error;
            }
            if (data) {
                const normalized = this.normalizeVehicleData([data]);
                return this.recordVehicleView(normalized[0]);
            }
            return null;
        } catch (error) {
            console.error(`Error fetching vehicle by ordencompra '${ordencompra}':`, error);
            return null;
        }
    }

    public static async getAndRecordVehicleView(slug: string): Promise<Vehicle | null> {
        const vehicle = await this.getVehicleBySlug(slug);
        if (vehicle) {
            return this.recordVehicleView(vehicle);
        }
        return null;
    }

    public static async getVehicleBySlug(slug: string): Promise<Vehicle | null> {
        if (!slug) return null;
        try {
            const { data, error } = await supabase
                .from('inventario_cache')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // No single row found
                throw error;
            }
            if (data) {
                const normalized = this.normalizeVehicleData([data]);
                return normalized[0];
            }
            return null;
        } catch (error) {
            console.error(`Error fetching vehicle by slug '${slug}':`, error);
            return null;
        }
    }

    public static async getAllVehicleSlugs(): Promise<{ slug: string }[]> {
        try {
            const { data, error } = await supabase
                .from('inventario_cache')
                .select('slug')
                .eq('ordenstatus', 'Comprado')
                .order('updated_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Error fetching all vehicle slugs:', error);
            return [];
        }
    }

    private static recordVehicleView(vehicle: Vehicle): Vehicle {
        // Increment view count in database (fire-and-forget)
        if (vehicle.ordencompra) {
            supabase.rpc('increment_vehicle_views', { vehicle_ordencompra: vehicle.ordencompra })
                .then(({ error }) => {
                    if (error) {
                        console.error(`[VehicleService] Error incrementing view count for vehicle ${vehicle.id}:`, error);
                    }
                });
        }

        // Add to recently viewed
        this.addToRecentlyViewed(vehicle);

        // Return vehicle with incremented count for immediate UI feedback
        return { ...vehicle, view_count: (vehicle.view_count || 0) + 1 };
    }

    private static addToRecentlyViewed(vehicle: Vehicle) {
        try {
            const rawData = localStorage.getItem(this.RECENTLY_VIEWED_KEY);
            const recentlyViewed: Partial<Vehicle>[] = rawData ? JSON.parse(rawData) : [];
            
            const filtered = recentlyViewed.filter(v => v.id !== vehicle.id);

            const vehicleSummary = {
                id: vehicle.id,
                slug: vehicle.slug,
                title: vehicle.title,
                precio: vehicle.precio,
                feature_image: vehicle.feature_image,
                kilometraje: vehicle.kilometraje,
                autoano: vehicle.autoano,
                galeria_exterior: vehicle.galeria_exterior || [],
                fotos_exterior_url: vehicle.fotos_exterior_url || [],
            };

            filtered.unshift(vehicleSummary);
            localStorage.setItem(this.RECENTLY_VIEWED_KEY, JSON.stringify(filtered.slice(0, 10)));
        } catch (error) { console.error("Failed to update recently viewed:", error); }
    }
    
private static normalizeVehicleData(rawData: any[]): Vehicle[] {
    const safeParseFloat = (val: any, fallback = 0) => { const n = parseFloat(String(val).replace(/,/g, '')); return isNaN(n) ? fallback : n; };
    const safeParseInt = (val: any, fallback = 0) => { const n = parseInt(String(val).replace(/,/g, ''), 10); return isNaN(n) ? fallback : n; };

    const parseGalleryField = (field: any): string[] => {
        if (Array.isArray(field)) {
            return field.filter(isValidImageUrl);
        }
        if (typeof field === 'string') {
            // Try to parse as JSON first (for fields like fotos_exterior_url that come as JSON strings)
            try {
                const parsed = JSON.parse(field);
                if (Array.isArray(parsed)) {
                    return parsed.filter(isValidImageUrl);
                }
            } catch {
                // If JSON parse fails, treat as comma-separated
                return field.split(',').map(url => url.trim()).filter(isValidImageUrl);
            }
        }
        return [];
    };

    const normalizedVehicles = rawData.filter(Boolean).map((item) => {
        // Use existing title/slug from Airtable, only construct if absolutely necessary
        const title = item.title || item.title || 'Auto sin título';
        const slug = item.slug || generateSlug(title);
        
        let clasificacionid: string[] = [];
        if (Array.isArray(item.clasificacionid)) {
            clasificacionid = item.clasificacionid.map(String);
        } else if (typeof item.clasificacionid === 'string') {
            // Try to parse as JSON first (clasificacionid comes as JSON string like '["SUV"]')
            try {
                const parsed = JSON.parse(item.clasificacionid);
                if (Array.isArray(parsed)) {
                    clasificacionid = parsed.map(String);
                } else {
                    clasificacionid = item.clasificacionid.split(',').map((c: string) => c.trim()).filter(Boolean);
                }
            } catch {
                // If JSON parse fails, treat as comma-separated
                clasificacionid = item.clasificacionid.split(',').map((c: string) => c.trim()).filter(Boolean);
            }
        }

        const sucursalMapping: Record<string, string> = { 'MTY': 'Monterrey', 'GPE': 'Guadalupe', 'TMPS': 'Reynosa', 'COAH': 'Saltillo' };
        let normalizedSucursales: string[] = [];
        if (Array.isArray(item.ubicacion)) {
            normalizedSucursales = item.ubicacion.map((s: string) => sucursalMapping[s.trim().toUpperCase()] || s.trim()).filter(Boolean);
        } else if (typeof item.ubicacion === 'string') {
            // Try to parse as JSON first (ubicacion comes as JSON string like '["Reynosa"]')
            try {
                const parsed = JSON.parse(item.ubicacion);
                if (Array.isArray(parsed)) {
                    normalizedSucursales = parsed.map((s: string) => sucursalMapping[s.trim().toUpperCase()] || s.trim()).filter(Boolean);
                } else {
                    normalizedSucursales = item.ubicacion.split(',').map((s: string) => sucursalMapping[s.trim().toUpperCase()] || s.trim()).filter(Boolean);
                }
            } catch {
                // If JSON parse fails, treat as comma-separated
                normalizedSucursales = item.ubicacion.split(',').map((s: string) => sucursalMapping[s.trim().toUpperCase()] || s.trim()).filter(Boolean);
            }
        }

        const featureImage = getVehicleImage(item);

        const exteriorGallery = [
            ...parseGalleryField(item.fotos_exterior_url),
            ...parseGalleryField(item.galeria_exterior)
        ];
        
        const interiorGallery = [
            ...parseGalleryField(item.fotos_interior_url),
            ...parseGalleryField(item.galeria_interior)
        ];

        const viewCount = safeParseInt(item.view_count || item.viewcount);

        // Helper to get first element from array or return as string
        const getFirstOrString = (field: any): string => {
            if (Array.isArray(field)) return field[0] || '';
            if (typeof field === 'string') {
                // Try to parse as JSON first (for fields that might be stored as JSONB arrays)
                try {
                    const parsed = JSON.parse(field);
                    if (Array.isArray(parsed)) {
                        return parsed[0] || '';
                    }
                } catch {
                    // If JSON parse fails, return as is
                    return field;
                }
            }
            return field || '';
        };

        const normalizedVehicle = {
            id: item.id || 0,
            slug: slug,
            ordencompra: item.ordencompra || '',
            record_id: item.record_id || null,

            title: title,
            descripcion: item.descripcion || '',
            metadescripcion: item.metadescripcion || '',

            marca: item.marca || '',
            modelo: item.modelo || '',

            autoano: safeParseInt(item.autoano),
            precio: safeParseFloat(item.precio),
            kilometraje: safeParseInt(getFirstOrString(item.kilometraje)),
            transmision: getFirstOrString(item.transmision),
            combustible: getFirstOrString(item.combustible),
            carroceria: getFirstOrString(item.carroceria || item.clasificacionid),
            cilindros: safeParseInt(item.cilindros),
            
            enganchemin: safeParseFloat(item.enganchemin),
            enganche_recomendado: safeParseFloat(item.enganche_recomendado),
            mensualidad_minima: safeParseFloat(item.mensualidad_minima),
            mensualidad_recomendada: safeParseFloat(item.mensualidad_recomendada),
            plazomax: safeParseInt(item.plazomax),
            
            feature_image: [featureImage],
            galeria_exterior: [...new Set(exteriorGallery)],
            fotos_exterior_url: [...new Set(exteriorGallery)],
            galeria_interior: [...new Set(interiorGallery)],
            
            ubicacion: normalizedSucursales,
            sucursal: normalizedSucursales,
            
            garantia: item.garantia || '',
            
            vendido: !!item.vendido,
            separado: !!item.separado,
            ordenstatus: item.ordenstatus || '',
            
            clasificacionid: clasificacionid,
            
            promociones: Array.isArray(item.promociones) ? item.promociones : [],

            view_count: viewCount,

            // --- Compatibility Aliases ---
            title: title,
            price: safeParseFloat(item.precio),
            year: safeParseInt(item.autoano),
            kms: safeParseInt(item.kilometraje),
        } as Vehicle;
        
        return normalizedVehicle;
    });

    return normalizedVehicles;
}


}

export default VehicleService;
