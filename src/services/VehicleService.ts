import type { Vehicle, VehicleFilters } from '../types/types';
import { supabase } from '../../supabaseClient';
import { generateSlug, generateVehicleSlugBase } from '../utils/formatters';
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

            // Use existing title from database (titulo field), only fall back to 'Auto sin título' if missing
            const title = item.titulo || item.title || `${item.marca || ''} ${item.modelo || ''} ${item.autoano || ''}`.trim() || 'Auto sin título';

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

                titulo: title,
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

    /**
     * Fetch a single vehicle by slug from rapid-processor edge function
     * Uses the edge function's 1-hour cache for optimal performance
     */
    private static async fetchFromRapidProcessorBySlug(slug: string): Promise<Vehicle | null> {
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
        const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.warn('[VehicleService] Missing Supabase config for rapid-processor');
            return null;
        }

        const url = `${supabaseUrl}/functions/v1/rapid-processor/${encodeURIComponent(slug)}`;
        console.log('[VehicleService] Fetching from rapid-processor by slug:', slug);

        try {
            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${supabaseKey}`,
                    'Content-Type': 'application/json',
                },
                // Short timeout to fail fast and try other sources
                signal: AbortSignal.timeout(5000),
            });

            if (!response.ok) {
                if (response.status === 404) {
                    console.log('[VehicleService] Vehicle not found in rapid-processor cache');
                    return null;
                }
                throw new Error(`rapid-processor returned ${response.status}`);
            }

            const data = await response.json();

            if (!data || !data.id) {
                console.log('[VehicleService] Invalid data from rapid-processor');
                return null;
            }

            // Transform single vehicle to match expected format
            const transformed = this.transformRapidProcessorData([data]);
            console.log('[VehicleService] Successfully fetched from rapid-processor:', transformed[0]?.titulo);
            return transformed[0] || null;
        } catch (error) {
            console.warn('[VehicleService] rapid-processor fetch failed:', error);
            return null;
        }
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

    /**
     * Check if vehicle data is complete (has essential fields)
     */
    private static isVehicleDataComplete(vehicle: Vehicle | null): boolean {
        if (!vehicle) return false;
        const hasTitle = vehicle.title && vehicle.title !== 'Auto sin título' && vehicle.title.trim() !== '';
        const hasPrice = vehicle.precio && vehicle.precio > 0;
        const hasImage = getVehicleImage(vehicle) && !getVehicleImage(vehicle).includes('placeholder');
        return hasTitle && hasPrice && hasImage;
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
                if (error.code === 'PGRST116') {
                    // No record found in Supabase, try Airtable fallback
                    console.log(`[VehicleService] Vehicle ${ordencompra} not in cache, trying Airtable...`);
                    try {
                        const AirtableDirectService = (await import('./AirtableDirectService')).default;
                        const airtableVehicle = await AirtableDirectService.getVehicleByOrdenCompra(ordencompra);
                        if (airtableVehicle) {
                            return airtableVehicle as Vehicle;
                        }
                    } catch (airtableError) {
                        console.error('[VehicleService] Airtable fallback failed:', airtableError);
                    }
                    return null;
                }
                throw error;
            }
            if (data) {
                const normalized = this.normalizeVehicleData([data]);
                const vehicle = normalized[0];

                // If vehicle data is incomplete, try to supplement from Airtable
                if (!this.isVehicleDataComplete(vehicle) && data.record_id) {
                    console.log(`[VehicleService] Vehicle ${ordencompra} has incomplete data, trying Airtable fallback...`);
                    try {
                        const AirtableDirectService = (await import('./AirtableDirectService')).default;
                        const airtableVehicle = await AirtableDirectService.getVehicleByRecordId(data.record_id);
                        if (airtableVehicle && this.isVehicleDataComplete(airtableVehicle as Vehicle)) {
                            return airtableVehicle as Vehicle;
                        }
                    } catch (airtableError) {
                        console.error('[VehicleService] Airtable fallback failed:', airtableError);
                    }
                }

                return this.recordVehicleView(vehicle);
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

    /**
     * Get vehicle by slug using 3-tier architecture for maximum reliability:
     *
     * TIER 1: rapid-processor Edge Function (1h cache, fastest)
     * TIER 2: Supabase direct query (fresh data)
     * TIER 3: Airtable API (source of truth, always has slug)
     */
    public static async getVehicleBySlug(slug: string): Promise<Vehicle | null> {
        if (!slug) return null;

        console.log(`[VehicleService] 🔍 Getting vehicle by slug: ${slug}`);

        try {
            // ═══════════════════════════════════════════════════════════════
            // TIER 1: rapid-processor Edge Function (Cache 1h - FASTEST)
            // ═══════════════════════════════════════════════════════════════
            if (this.USE_RAPID_PROCESSOR) {
                const rpVehicle = await this.fetchFromRapidProcessorBySlug(slug);
                if (rpVehicle) {
                    console.log(`[VehicleService] ✅ TIER 1: Found in rapid-processor cache`);
                    return rpVehicle;
                }
                console.log(`[VehicleService] ⏭️ TIER 1: Not in cache, trying Supabase direct...`);
            }

            // ═══════════════════════════════════════════════════════════════
            // TIER 2: Supabase Direct Query (Fresh data)
            // ═══════════════════════════════════════════════════════════════
            const { data, error } = await supabase
                .from('inventario_cache')
                .select('*')
                .eq('slug', slug)
                .single();

            if (error && error.code !== 'PGRST116') {
                console.warn('[VehicleService] Supabase query error:', error.message);
            }

            if (data) {
                console.log(`[VehicleService] ✅ TIER 2: Found in Supabase`);
                const normalized = this.normalizeVehicleData([data]);
                const vehicle = normalized[0];

                // Enrich incomplete data from Airtable if needed
                if (!this.isVehicleDataComplete(vehicle) && data.ordencompra) {
                    console.log(`[VehicleService] 🔄 Vehicle has incomplete data, enriching from Airtable...`);
                    try {
                        const AirtableDirectService = (await import('./AirtableDirectService')).default;
                        const airtableVehicle = await AirtableDirectService.getVehicleByOrdenCompra(data.ordencompra);
                        if (airtableVehicle && this.isVehicleDataComplete(airtableVehicle as Vehicle)) {
                            return { ...airtableVehicle, slug: data.slug } as Vehicle;
                        }
                    } catch (airtableError) {
                        console.warn('[VehicleService] Airtable enrichment failed:', airtableError);
                    }
                }

                return vehicle;
            }

            // Try fuzzy search for similar slugs (handles mazda-3-2024 vs mazda-3-2024-2)
            console.log(`[VehicleService] 🔎 Trying fuzzy search...`);
            const { data: fuzzyData, error: fuzzyError } = await supabase
                .from('inventario_cache')
                .select('*')
                .or(`slug.ilike.${slug}%,slug.ilike.%${slug}`)
                .eq('ordenstatus', 'Comprado')
                .limit(1)
                .maybeSingle();

            if (fuzzyError) {
                console.warn('[VehicleService] Fuzzy search error:', fuzzyError.message);
            }

            if (fuzzyData) {
                console.log(`[VehicleService] ✅ TIER 2: Found fuzzy match: ${fuzzyData.slug}`);
                const normalized = this.normalizeVehicleData([fuzzyData]);
                return normalized[0];
            }

            // ═══════════════════════════════════════════════════════════════
            // TIER 3: Airtable API (Source of Truth - Always has slug)
            // ═══════════════════════════════════════════════════════════════
            console.log(`[VehicleService] 🌐 TIER 3: Fetching from Airtable (source of truth)...`);
            try {
                const AirtableDirectService = (await import('./AirtableDirectService')).default;
                const airtableVehicle = await AirtableDirectService.getVehicleBySlug(slug);
                if (airtableVehicle) {
                    console.log(`[VehicleService] ✅ TIER 3: Found in Airtable: ${airtableVehicle.title}`);
                    return airtableVehicle as Vehicle;
                }
            } catch (airtableError) {
                console.error('[VehicleService] ❌ Airtable fallback failed:', airtableError);
            }

            // Last resort: check if slug might be an ordencompra (e.g., OC1234, ID5678)
            if (slug.startsWith('OC') || slug.startsWith('ID')) {
                console.log(`[VehicleService] Trying slug as ordencompra: ${slug}`);
                return this.getVehicleByOrdenCompra(slug);
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

    /**
     * Genera un slug único para un vehículo basado en marca-modelo-año
     * Si hay conflictos, agrega sufijo numérico: mazda-3i-2024, mazda-3i-2024-2, etc.
     * @param marca - Marca del vehículo
     * @param modelo - Modelo del vehículo
     * @param año - Año del vehículo
     * @param excludeOrdencompra - ID del vehículo actual para excluir de la búsqueda de duplicados
     */
    public static async generateUniqueVehicleSlug(
        marca: string,
        modelo: string,
        año: string | number,
        excludeOrdencompra?: string
    ): Promise<string> {
        const baseSlug = generateVehicleSlugBase(marca, modelo, año);

        if (!baseSlug) {
            // Fallback to a random slug if no valid data
            return `vehiculo-${Date.now()}`;
        }

        try {
            // Check for existing slugs that match the pattern
            let query = supabase
                .from('inventario_cache')
                .select('slug')
                .or(`slug.eq.${baseSlug},slug.like.${baseSlug}-%`);

            if (excludeOrdencompra) {
                query = query.neq('ordencompra', excludeOrdencompra);
            }

            const { data: existingSlugs, error } = await query;

            if (error) {
                console.error('Error checking existing slugs:', error);
                return baseSlug;
            }

            if (!existingSlugs || existingSlugs.length === 0) {
                return baseSlug;
            }

            // Find the highest suffix number
            const slugSet = new Set(existingSlugs.map(s => s.slug));

            if (!slugSet.has(baseSlug)) {
                return baseSlug;
            }

            // Find the next available number
            let suffix = 2;
            while (slugSet.has(`${baseSlug}-${suffix}`)) {
                suffix++;
            }

            return `${baseSlug}-${suffix}`;
        } catch (error) {
            console.error('Error generating unique slug:', error);
            return baseSlug;
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
        // Extract data from nested 'data' JSON column if individual columns are null
        // This handles cases where Airtable sync stores raw data but doesn't map to columns
        const airtableData = item.data || {};

        // Helper to get value from item or fallback to airtableData
        const getValue = (key: string, airtableKey?: string): any => {
            const val = item[key];
            if (val !== null && val !== undefined && val !== '') return val;
            if (airtableKey && airtableData[airtableKey] !== undefined) return airtableData[airtableKey];
            if (airtableData[key] !== undefined) return airtableData[key];
            return null;
        };

        // Use existing title/slug from Airtable, fallback to data.Auto or data.title
        const title = getValue('title') || airtableData.Auto || airtableData.title ||
            `${getValue('marca', 'Marca') || ''} ${getValue('modelo') || ''} ${getValue('autoano', 'AutoAno') || ''}`.trim() || 'Auto sin título';

        // Generate slug: marca-modelo-año format (e.g., mazda-3i-2024)
        // If item already has a slug, use it; otherwise generate from marca-modelo-año
        const slug = item.slug || generateVehicleSlugBase(
            getValue('marca', 'Marca') || '',
            getValue('modelo') || '',
            getValue('autoano', 'AutoAno') || ''
        ) || generateSlug(title);
        
        // Handle clasificacionid from item or airtableData
        let clasificacionid: string[] = [];
        const rawClasificacion = getValue('clasificacionid', 'ClasificacionID') || getValue('carroceria');
        if (Array.isArray(rawClasificacion)) {
            clasificacionid = rawClasificacion.map(String);
        } else if (typeof rawClasificacion === 'string') {
            try {
                const parsed = JSON.parse(rawClasificacion);
                if (Array.isArray(parsed)) {
                    clasificacionid = parsed.map(String);
                } else {
                    clasificacionid = rawClasificacion.split(',').map((c: string) => c.trim()).filter(Boolean);
                }
            } catch {
                clasificacionid = rawClasificacion.split(',').map((c: string) => c.trim()).filter(Boolean);
            }
        }

        // Handle ubicacion from item or airtableData.Ubicacion
        const sucursalMapping: Record<string, string> = { 'MTY': 'Monterrey', 'GPE': 'Guadalupe', 'TMPS': 'Reynosa', 'COAH': 'Saltillo', 'Monterrey': 'Monterrey', 'Guadalupe': 'Guadalupe', 'Reynosa': 'Reynosa', 'Saltillo': 'Saltillo' };
        let normalizedSucursales: string[] = [];
        const rawUbicacion = getValue('ubicacion', 'Ubicacion');
        if (Array.isArray(rawUbicacion)) {
            normalizedSucursales = rawUbicacion.map((s: string) => sucursalMapping[s.trim()] || s.trim()).filter(Boolean);
        } else if (typeof rawUbicacion === 'string') {
            try {
                const parsed = JSON.parse(rawUbicacion);
                if (Array.isArray(parsed)) {
                    normalizedSucursales = parsed.map((s: string) => sucursalMapping[s.trim()] || s.trim()).filter(Boolean);
                } else {
                    normalizedSucursales = [sucursalMapping[rawUbicacion.trim()] || rawUbicacion.trim()].filter(Boolean);
                }
            } catch {
                normalizedSucursales = [sucursalMapping[rawUbicacion.trim()] || rawUbicacion.trim()].filter(Boolean);
            }
        }

        // Handle images - check airtableData for galeriaExterior/galeriaInterior/image_link
        const airtableExterior = airtableData.galeriaExterior || airtableData['Foto Catalogo'] || [];
        const airtableInterior = airtableData.galeriaInterior || [];
        const airtableFeatureImage = airtableData.image_link || (Array.isArray(airtableExterior) && airtableExterior[0]) || null;

        // Get feature image from item or airtable data
        const featureImage = getVehicleImage(item) || airtableFeatureImage || DEFAULT_PLACEHOLDER_IMAGE;

        // Combine galleries from both sources
        const exteriorGallery = [
            ...parseGalleryField(item.fotos_exterior_url),
            ...parseGalleryField(item.galeria_exterior),
            ...parseGalleryField(airtableExterior)
        ];

        const interiorGallery = [
            ...parseGalleryField(item.fotos_interior_url),
            ...parseGalleryField(item.galeria_interior),
            ...parseGalleryField(airtableInterior)
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

        // Get all values with fallback to airtableData
        const marca = getValue('marca', 'Marca') || '';
        const modelo = getValue('modelo', 'Modelo') || '';
        const autoano = safeParseInt(getValue('autoano', 'AutoAno'));
        const precio = safeParseFloat(getValue('precio', 'Precio'));
        const kilometraje = safeParseInt(getFirstOrString(getValue('kilometraje', 'Kilometraje')));
        const transmision = getFirstOrString(getValue('transmision', 'Transmision'));
        const combustible = getFirstOrString(getValue('combustible', 'Combustible'));
        const carroceria = getFirstOrString(getValue('carroceria') || getValue('clasificacionid', 'ClasificacionID'));
        const cilindros = safeParseInt(getValue('cilindros', 'Cilindros'));
        const garantia = getValue('garantia', 'Garantia') || '';
        const descripcion = getValue('descripcion', 'Descripcion') || '';
        const metadescripcion = getValue('metadescripcion', 'MetaDescripcion') || '';
        const enganchemin = safeParseFloat(getValue('enganchemin', 'EngancheMin'));
        const enganche_recomendado = safeParseFloat(getValue('enganche_recomendado', 'EngancheRecomendado'));
        const mensualidad_minima = safeParseFloat(getValue('mensualidad_minima', 'MensualidadMinima'));
        const mensualidad_recomendada = safeParseFloat(getValue('mensualidad_recomendada', 'MensualidadRecomendada'));
        const plazomax = safeParseInt(getValue('plazomax', 'PlazoMax'));

        // Handle promociones from item or airtableData
        let promociones: string[] = [];
        const rawPromociones = getValue('promociones', 'Promociones');
        if (Array.isArray(rawPromociones)) {
            promociones = rawPromociones.map(String).filter(Boolean);
        } else if (typeof rawPromociones === 'string') {
            try {
                const parsed = JSON.parse(rawPromociones);
                if (Array.isArray(parsed)) {
                    promociones = parsed.map(String).filter(Boolean);
                } else {
                    promociones = rawPromociones.split(',').map((p: string) => p.trim()).filter(Boolean);
                }
            } catch {
                promociones = rawPromociones.split(',').map((p: string) => p.trim()).filter(Boolean);
            }
        }

        const normalizedVehicle = {
            id: item.id || 0,
            slug: slug,
            ordencompra: item.ordencompra || airtableData.ordenCompra || '',
            record_id: item.record_id || airtableData.record_id || null,

            titulo: title,
            title: title,
            descripcion: descripcion,
            metadescripcion: metadescripcion,

            marca: marca,
            modelo: modelo,

            autoano: autoano,
            precio: precio,
            kilometraje: kilometraje,
            transmision: transmision,
            combustible: combustible,
            carroceria: carroceria,
            cilindros: cilindros,
            AutoMotor: getValue('AutoMotor') || '',

            enganchemin: enganchemin,
            enganche_recomendado: enganche_recomendado,
            mensualidad_minima: mensualidad_minima,
            mensualidad_recomendada: mensualidad_recomendada,
            plazomax: plazomax,

            feature_image: [featureImage],
            galeria_exterior: [...new Set(exteriorGallery)],
            fotos_exterior_url: [...new Set(exteriorGallery)],
            galeria_interior: [...new Set(interiorGallery)],

            ubicacion: normalizedSucursales,
            sucursal: normalizedSucursales,

            garantia: garantia,

            vendido: !!item.vendido,
            separado: !!item.separado,
            ordenstatus: item.ordenstatus || airtableData.OrdenStatus || '',

            clasificacionid: clasificacionid,

            promociones: promociones,

            view_count: viewCount,

            ingreso_inventario: getValue('ingreso_inventario', 'IngresoInventario') || null,
            rezago: !!getValue('rezago', 'Rezago'),

            // --- Compatibility Aliases ---
            price: precio,
            year: autoano,
            kms: kilometraje,
        } as Vehicle;
        
        return normalizedVehicle;
    });

    return normalizedVehicles;
}


}

export default VehicleService;
