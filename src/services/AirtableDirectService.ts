/**
 * AirtableDirectService - Direct Airtable API Integration
 *
 * This service fetches vehicle data directly from Airtable REST API
 * as a robust fallback when Supabase cache tables are empty or smooth-handler fails.
 */

import { config } from '@/config';

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';
const AIRTABLE_BASE_ID = config.airtable.valuation.baseId;
const AIRTABLE_TABLE_ID = 'shrqIjFEK3uqApbv4'; // Inventario table
const AIRTABLE_API_KEY = config.airtable.valuation.apiKey;

export interface AirtableVehicleRecord {
    id: string;
    fields: {
        [key: string]: any;
    };
    createdTime: string;
}

export default class AirtableDirectService {
    /**
     * Fetch vehicles directly from Airtable with proper filtering
     */
    public static async fetchVehicles(): Promise<AirtableVehicleRecord[]> {
        console.log('🚀 [Airtable] Starting fetch...');
        console.log(`🔑 [Airtable] API Key status: ${AIRTABLE_API_KEY ? `configured (${AIRTABLE_API_KEY.substring(0, 10)}...)` : 'NOT CONFIGURED'}`);
        console.log(`🔑 [Airtable] Base ID: ${AIRTABLE_BASE_ID}`);
        console.log(`🔑 [Airtable] Table ID: ${AIRTABLE_TABLE_ID}`);

        if (!AIRTABLE_API_KEY) {
            console.error('❌ [Airtable] AIRTABLE_API_KEY not configured in environment variables');
            console.error('❌ [Airtable] Make sure VITE_AIRTABLE_API_KEY is in .env file and restart dev server');
            console.error('❌ [Airtable] Current import.meta.env:', (import.meta as any).env);
            return [];
        }

        const allRecords: AirtableVehicleRecord[] = [];
        let offset: string | undefined = undefined;
        let pageCount = 0;
        const maxPages = 10; // Safety limit

        try {
            do {
                pageCount++;
                console.log(`📄 [Airtable] Fetching page ${pageCount}...`);

                const url = new URL(`${AIRTABLE_API_BASE}/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}`);

                // Filter for Comprado status only
                url.searchParams.append('filterByFormula', '{ordenstatus} = "Comprado"');
                url.searchParams.append('pageSize', '100'); // Max per page
                url.searchParams.append('sort[0][field]', 'ordencompra');
                url.searchParams.append('sort[0][direction]', 'desc');

                if (offset) {
                    url.searchParams.append('offset', offset);
                }

                console.log(`🌐 [Airtable] Request URL: ${url.toString().substring(0, 100)}...`);

                const response = await fetch(url.toString(), {
                    headers: {
                        'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                        'Content-Type': 'application/json'
                    }
                });

                console.log(`📡 [Airtable] Response status: ${response.status} ${response.statusText}`);

                if (!response.ok) {
                    const errorText = await response.text();
                    console.error(`❌ [Airtable] API error response:`, errorText);
                    throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
                }

                const data = await response.json();
                console.log(`📦 [Airtable] Received data:`, {
                    hasRecords: !!data.records,
                    recordCount: data.records?.length || 0,
                    hasOffset: !!data.offset
                });

                if (data.records && Array.isArray(data.records)) {
                    allRecords.push(...data.records);
                    console.log(`✓ [Airtable] Page ${pageCount}: ${data.records.length} records (total: ${allRecords.length})`);
                } else {
                    console.warn(`⚠️ [Airtable] Page ${pageCount}: No records array in response`);
                }

                offset = data.offset;

            } while (offset && pageCount < maxPages);

            console.log(`✅ [Airtable] Fetch complete: ${allRecords.length} total vehicles across ${pageCount} pages`);
            return allRecords;

        } catch (error) {
            console.error('❌ [Airtable] Error fetching from Airtable:', error);
            console.error('❌ [Airtable] Error details:', {
                message: error instanceof Error ? error.message : String(error),
                stack: error instanceof Error ? error.stack : undefined
            });
            throw error;
        }
    }

    /**
     * Convert Airtable records to the format expected by the app
     */
    public static normalizeAirtableRecords(records: AirtableVehicleRecord[]): any[] {
        console.log(`🔄 [Airtable] Starting normalization of ${records.length} records...`);

        if (records.length > 0) {
            console.log(`🔍 [Airtable] Sample raw record:`, {
                id: records[0].id,
                fieldsKeys: Object.keys(records[0].fields),
                OrdenStatus: records[0].fields.OrdenStatus,
                AutoMarca: records[0].fields.AutoMarca,
                Precio: records[0].fields.Precio
            });
        }

        const normalized = records.map((record, index) => {
            const fields = record.fields;
            const recordId = record.id;

            // Extract array fields safely
            const getArrayField = (fieldValue: any): string[] => {
                if (!fieldValue) return [];
                if (Array.isArray(fieldValue)) return fieldValue.map(String).filter(Boolean);
                if (typeof fieldValue === 'string') {
                    return fieldValue.split(',').map(s => s.trim()).filter(Boolean);
                }
                return [String(fieldValue)];
            };

            // Extract Airtable attachment URLs
            const getImageUrls = (attachments: any): string[] => {
                if (!attachments || !Array.isArray(attachments)) return [];
                return attachments.map((att: any) => att.url || att.thumbnails?.large?.url || att.thumbnails?.full?.url).filter(Boolean);
            };

            // Use Airtable's "Auto" field first, then construct as fallback
            const titulo = fields.Auto ||
                (fields.AutoMarca && fields.AutoSubmarcaVersion && fields.AutoAno
                    ? `${fields.AutoMarca} ${fields.AutoSubmarcaVersion} ${fields.AutoAno}`.trim()
                    : 'Auto sin título');

            // Generate numeric ID from OrdenCompra or hash recordId
            let numericId = 0;
            if (fields.OrdenCompra && /^\d+$/.test(fields.OrdenCompra)) {
                numericId = parseInt(fields.OrdenCompra, 10);
            } else if (recordId) {
                // Hash the recordId to create a numeric ID
                numericId = Math.abs(recordId.split('').reduce((acc: number, char: string) => {
                    return ((acc << 5) - acc) + char.charCodeAt(0);
                }, 0));
            } else {
                numericId = 1000000 + index; // Fallback
            }

            // Use Airtable's slug field first, then ligawp, then generate from other fields
            const slugBase = fields.slug || fields.ligawp ||
                (fields.OrdenCompra || titulo || recordId).toLowerCase().replace(/\s+/g, '-');

            // Process images
            const exteriorImages = getImageUrls(fields.fotos_exterior);
            const interiorImages = getImageUrls(fields.fotos_interior);
            const featureImageArray = getImageUrls(fields.feature_image);
            const thumbnailArray = getImageUrls(fields.thumbnail);

            const mainImage = featureImageArray[0] || exteriorImages[0] || interiorImages[0] || '';
            const thumbnailImage = thumbnailArray[0] || featureImageArray[0] || exteriorImages[0] || '';

            // Parse numeric values safely
            const precio = parseFloat(String(fields.Precio || '0').replace(/[^0-9.]/g, '')) || 0;
            const ano = parseInt(String(fields.AutoAno || '0'), 10) || 0;
            const kilometraje = parseInt(String(fields['Kilometraje Compra'] || fields.kilometraje_sucursal || '0').replace(/[^0-9]/g, ''), 10) || 0;
            const cilindros = parseInt(String(fields.AutoCilindros || '0'), 10) || 0;

            // Build complete normalized object with ALL required aliases
            const normalized = {
                // ========== IDENTIFICADORES ==========
                id: numericId,
                slug: slugBase,
                ligawp: fields.ligawp || slugBase,
                ordencompra: fields.OrdenCompra || '',
                record_id: recordId,
                ordenid: fields.OrdenCompra || '',

                // ========== TÍTULO Y DESCRIPCIÓN ==========
                titulo: titulo,
                title: titulo,
                label: titulo,
                descripcion: fields.descripcion || fields.Descripcion || '',
                description: fields.descripcion || fields.Descripcion || '',
                post_content: fields.descripcion || fields.Descripcion || '',
                metadescripcion: fields.description || '',
                post_excerpt: fields.descripcion?.substring(0, 150) || '',
                titulometa: titulo,
                permalink: `/autos/${slugBase}`,

                // ========== MARCA Y MODELO ==========
                marca: fields.AutoMarca || 'Sin Marca',
                brand: fields.AutoMarca || 'Sin Marca',
                marcas: [fields.AutoMarca || 'Sin Marca'],
                modelo: fields.AutoSubmarcaVersion || '',
                model: fields.AutoSubmarcaVersion || '',
                models: [fields.AutoSubmarcaVersion || ''],
                trim: fields.AutoSubmarcaVersion || '',

                // ========== ESPECIFICACIONES TÉCNICAS ==========
                ano: ano,
                autoano: ano,
                year: ano,
                precio: precio,
                autoprecio: precio,
                price: precio,
                kilometraje: kilometraje,
                autokilometraje: kilometraje,
                kms: kilometraje,
                transmision: fields.autotransmision || fields.Transmision || '',
                autotransmision: fields.autotransmision || fields.Transmision || '',
                transmission: fields.autotransmision || fields.Transmision || '',
                combustible: fields.autocombustible || fields.TipoCombustible || '',
                autocombustible: fields.autocombustible || fields.TipoCombustible || '',
                fuel: fields.autocombustible || fields.TipoCombustible || '',
                motor: fields.AutoMotor || '',
                automotor: fields.AutoMotor || '',
                engine: fields.AutoMotor || '',
                cilindros: cilindros,
                autocilindros: cilindros,
                cylinders: cilindros,
                color_exterior: fields.color_exterior || '',
                color_interior: fields.color_interior || '',

                // ========== FINANCIAMIENTO ==========
                enganche_minimo: parseFloat(fields.enganche_minimo || fields.enganchemin || '0') || 0,
                engancheMinimo: parseFloat(fields.enganche_minimo || fields.enganchemin || '0') || 0,
                enganchemin: parseFloat(fields.enganche_minimo || fields.enganchemin || '0') || 0,
                minDownPayment: parseFloat(fields.enganche_minimo || fields.enganchemin || '0') || 0,
                enganche: parseFloat(fields.enganche_minimo || fields.enganchemin || '0') || 0,
                enganche_recomendado: parseFloat(fields.enganche_recomendado || '0') || 0,
                enganche_ajustado: parseFloat(fields.enganche_recomendado || '0') || 0,
                recommendedDownPayment: parseFloat(fields.enganche_recomendado || '0') || 0,
                mensualidad_minima: parseFloat(fields.pagomensual || fields.mensualidad_minima || '0') || 0,
                pagomensual: parseFloat(fields.pagomensual || fields.mensualidad_minima || '0') || 0,
                monthlyPayment: parseFloat(fields.pagomensual || fields.mensualidad_minima || '0') || 0,
                mensualidad_recomendada: parseFloat(fields.mensualidad_recomendada || '0') || 0,
                mensualidad: parseFloat(fields.mensualidad_recomendada || '0') || 0,
                recommendedMonthlyPayment: parseFloat(fields.mensualidad_recomendada || '0') || 0,
                plazomax: parseInt(fields.plazomax || '0', 10) || 0,
                plazo: String(fields.plazomax || ''),
                maxTerm: parseInt(fields.plazomax || '0', 10) || 0,

                // ========== IMÁGENES ==========
                feature_image: mainImage,
                featureImage: mainImage,
                thumbnail: thumbnailImage,
                thumbnail_webp: thumbnailImage,
                feature_image_webp: mainImage,
                fotooficial: mainImage,
                fotos_exterior: exteriorImages,
                galeria_exterior: exteriorImages,
                galeriaExterior: exteriorImages,
                exteriorImages: exteriorImages,
                fotos_interior: interiorImages,
                galeria_interior: interiorImages,
                galeriaInterior: interiorImages,
                interiorImages: interiorImages,

                // ========== VIDEO ==========
                video_url: fields.video_url || '',
                video_reel: fields.reel_url || '',
                videoUrl: fields.video_url || '',
                reel_url: fields.reel_url || '',
                reel_id: fields.reel_url || '',
                reelId: fields.reel_url || '',

                // ========== UBICACIÓN ==========
                ubicacion: getArrayField(fields.Ubicacion || fields.sucursal_compra)[0] || '',
                sucursal: getArrayField(fields.Ubicacion || fields.sucursal_compra),
                location: getArrayField(fields.Ubicacion || fields.sucursal_compra),

                // ========== GARANTÍA ==========
                garantia: fields.garantia || '',
                autogarantia: fields.garantia || '',
                warranty: fields.garantia || '',

                // ========== ESTADO ==========
                vendido: fields.OrdenStatus === 'Vendido',
                isSold: fields.OrdenStatus === 'Vendido',
                separado: fields.OrdenStatus === 'Separado',
                isReserved: fields.OrdenStatus === 'Separado',
                ordenstatus: fields.OrdenStatus || '',
                status: fields.OrdenStatus || '',
                consigna: false,
                rezago: false,

                // ========== CLASIFICACIÓN Y CATEGORÍAS ==========
                clasificacionid: getArrayField(fields.ClasificacionID),
                classification: getArrayField(fields.ClasificacionID)[0] || '',

                // ========== PROMOCIONES ==========
                promociones: getArrayField(fields.promociones),
                promotions: getArrayField(fields.promociones),

                // ========== ESTADÍSTICAS ==========
                view_count: parseInt(fields.visitas || '0', 10) || 0,
                visitas: parseInt(fields.visitas || '0', 10) || 0,
                viewCount: parseInt(fields.visitas || '0', 10) || 0,

                // ========== LINKS Y FORMULARIOS ==========
                liga_financiamiento_portal: '',
                liga_financiamiento_landing: '',
                liga_financiamiento: '',
                liga_boton_whatsapp: '',
                whatsappLink: '',

                // ========== CAMPOS ADICIONALES ==========
                nosiniestros: '',
                detalles_esteticos: '',
                fichatecnica: [],
                state: [],
            };

            return normalized;
        });

        // Filter out any invalid records and log issues
        console.log(`🔍 [Airtable] Validating ${normalized.length} normalized records...`);

        const validRecords = normalized.filter((record, idx) => {
            const isValid = record.id && record.slug && record.titulo && record.precio > 0;
            if (!isValid) {
                console.warn(`⚠️ [Airtable] Skipping invalid record ${idx}:`, {
                    id: record.id,
                    slug: record.slug,
                    titulo: record.titulo,
                    precio: record.precio,
                    reason: !record.id ? 'no id' : !record.slug ? 'no slug' : !record.titulo ? 'no titulo' : 'precio <= 0'
                });
            }
            return isValid;
        });

        const skippedCount = normalized.length - validRecords.length;
        console.log(`✅ [Airtable] Validation complete: ${validRecords.length} valid vehicles (${skippedCount} skipped)`);

        // Log sample of first vehicle for verification
        if (validRecords.length > 0) {
            const sample = validRecords[0];
            console.log('📋 [Airtable] Sample normalized vehicle:', {
                id: sample.id,
                slug: sample.slug,
                titulo: sample.titulo,
                precio: sample.precio,
                feature_image: sample.feature_image ? '✓ Has image' : '✗ No image',
                ordencompra: sample.ordencompra || 'N/A',
                engancheMinimo: sample.engancheMinimo || 0,
                separado: sample.separado,
                vendido: sample.vendido
            });
        } else {
            console.error('❌ [Airtable] NO VALID VEHICLES after normalization!');
        }

        return validRecords;
    }
    private static async apiCall(endpoint: string, options: RequestInit = {}): Promise<any> {
        if (!AIRTABLE_API_KEY) {
            const errorMessage = 'AIRTABLE_API_KEY is not configured.';
            console.error(`❌ [Airtable] ${errorMessage}`);
            throw new Error(errorMessage);
        }

        const url = `${AIRTABLE_API_BASE}/${AIRTABLE_BASE_ID}/${AIRTABLE_TABLE_ID}${endpoint}`;
        
        const response = await fetch(url, {
            ...options,
            headers: {
                'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [Airtable] API error response from ${url}:`, errorText);
            throw new Error(`Airtable API error: ${response.status} ${response.statusText}`);
        }

        return response.json();
    }

    public static async getVehiclesForImageUpload(): Promise<{ id: string; ordenCompra: string }[]> {
        const formula = `
            AND(
                {ordenstatus} = "Comprado",
                OR(
                    {Foto} = BLANK(),
                    {fotos_exterior_archivos} = BLANK(),
                    {fotos_interior_archivos} = BLANK()
                )
            )
        `;

        const allRecords: AirtableVehicleRecord[] = [];
        let offset: string | undefined = undefined;

        do {
            const params = new URLSearchParams({
                filterByFormula: formula,
                pageSize: '100',
                sort: '[{ "field": "ordencompra", "direction": "desc"}]'
            });
            params.append('fields', 'OrdenCompra');
            params.append('fields', 'ordencompra');
            if (offset) {
                params.append('offset', offset);
            }

            const data = await this.apiCall(`?${params.toString()}`);
            
            if (data.records && Array.isArray(data.records)) {
                allRecords.push(...data.records);
            }
            offset = data.offset;
        } while (offset);

        return allRecords.map(record => {
            const ordenCompraField = record.fields.OrdenCompra || record.fields.ordencompra;
            // Ensure ordenCompra is always a string (handle arrays, objects, etc.)
            let ordenCompraStr: string;
            if (typeof ordenCompraField === 'string') {
                ordenCompraStr = ordenCompraField;
            } else if (typeof ordenCompraField === 'number') {
                ordenCompraStr = String(ordenCompraField);
            } else if (Array.isArray(ordenCompraField)) {
                ordenCompraStr = ordenCompraField.join(', ');
            } else if (ordenCompraField && typeof ordenCompraField === 'object') {
                ordenCompraStr = JSON.stringify(ordenCompraField);
            } else {
                ordenCompraStr = 'ID: ' + record.id;
            }
            return {
                id: record.id,
                ordenCompra: ordenCompraStr,
            };
        });
    }

    public static async updateVehicleImages(recordId: string, fieldName: string, imageUrls: string[]): Promise<{ success: boolean }> {
        const payload = {
            records: [
                {
                    id: recordId,
                    fields: {
                        [fieldName]: imageUrls.map(url => ({ url })),
                    },
                },
            ],
        };

        await this.apiCall('', {
            method: 'PATCH',
            body: JSON.stringify(payload),
        });

        return { success: true };
    }
}
