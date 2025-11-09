import type { Vehicle, IntelimotorValuation } from '../../types/types';

const INTELIMOTOR_BASE_URL = 'https://app.intelimotor.com/api';

export class ValuationFailedError extends Error {
  public response: any;
  constructor(message: string, response?: any) {
    super(message);
    this.name = 'ValuationFailedError';
    this.response = response;
  }
}

interface FetchVehicleValuationParams {
    vehicle: Vehicle;
    mileage: number;
    businessUnitId: string;
    apiKey: string;
    apiSecret: string;
    proxyUrl?: string;
}

export const searchVehiclesWithAI = async (
  query: string,
  airtableApiKey: string,
  airtableBaseId: string,
  airtableTableId: string,
  airtableTableView: string,
): Promise<Vehicle[]> => {
  if (query.length < 3) return [];

  if (!airtableApiKey || !airtableBaseId || !airtableTableId || !airtableTableView) {
    const errorMsg = "La configuración de Airtable está incompleta (API Key, Base ID, Table ID/Name, or View Name). Por favor, ve a la pestaña de 'Configuración' para añadirlos.";
    console.error(errorMsg);
    throw new Error(errorMsg);
  }

  const cleanApiKey = airtableApiKey.trim();
  const cleanBaseId = airtableBaseId.trim();

  const formula = `SEARCH(LOWER("${query.replace(/"/g, '""')}"), LOWER({Vehicle Name}))`;
  const url = `https://api.airtable.com/v0/${cleanBaseId}/${airtableTableId}?view=${encodeURIComponent(airtableTableView)}&filterByFormula=${encodeURIComponent(formula)}&maxRecords=5`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${cleanApiKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Error fetching from Airtable:", errorData);
      
      let detailedMessage = 'Ocurrió un error desconocido';
      if (errorData?.error) {
        if (typeof errorData.error === 'string') {
          detailedMessage = errorData.error;
        } else if (typeof errorData.error.message === 'string') {
          detailedMessage = errorData.error.message;
        }
      } else if (response.statusText) {
        detailedMessage = response.statusText;
      }

       if (response.status === 401) {
          const newErrorMessage = `Error de autenticación con Airtable (401). Tu API Key es inválida. Por favor, verifica que:\n- El token sea un 'Personal Access Token' de Airtable (debe empezar con 'pat').\n- El token esté copiado correctamente, sin espacios extra.\n- El token no haya expirado o sido revocado.\n\nDetalles del servidor: ${detailedMessage}`;
          throw new Error(newErrorMessage);
      }
      if (response.status === 403) {
          throw new Error(`Error de permisos con Airtable (403). Por favor, verifica los siguientes puntos:\n- Que tu API Key (token) tenga los scopes 'data.records:read' y 'data.records:write'.\n- Que el token tenga acceso explícito a la base de datos que configuraste.\n- Que el API Key, Base ID, Table ID/Name y View Name estén escritos correctamente.`);
      }
      if (response.status === 404) {
          throw new Error(`No se encontró la base, la tabla o la vista en Airtable (404). Revisa tu Base ID, el nombre/ID de la tabla y el View Name. (Detalles: ${detailedMessage})`);
      }
      throw new Error(`Error de Airtable API (${response.status}): ${detailedMessage}`);
    }

    const data = await response.json();

    const vehicles: Vehicle[] = data.records.map((record: any) => {
      const fields = record.fields;
      const vehicleName = fields['Vehicle Name'] || '';

      const nameParts = vehicleName.split(' ');
      const brand = nameParts[0] || 'N/A';
      const model = nameParts[1] || 'N/A';
      const yearStr = nameParts.find((p: string) => /^\d{4}$/.test(p));
      const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
      
      let allOffers: number[] = [];
      const fieldsToProcess = [
        fields['historicalOffers'], 
        fields['Historical Offers'], 
        fields['Autos Ofertados'], 
        fields['Ofertas Historicas TREFA'],
        fields['Monto Ofertas Historicas']
      ];

      for (const offersData of fieldsToProcess) {
          if (typeof offersData === 'string' && offersData.trim() !== '') {
              const parsed = offersData.split(',')
                .map(s => {
                    const cleaned = s.trim().replace(/[$,]/g, ''); // Remove $ and commas
                    return parseInt(cleaned, 10); // parseInt will stop at '.' if it exists
                })
                .filter(n => !isNaN(n));
              allOffers.push(...parsed);
          } else if (Array.isArray(offersData)) {
              const numbers = offersData.filter((n): n is number => typeof n === 'number' && !isNaN(n));
              allOffers.push(...numbers);
          }
      }

      return {
        id: record.id,
        label: vehicleName,
        brand,
        model,
        year,
        trim: fields['Trim Name'] || 'N/A',
        brandId: fields.brandId || '',
        modelId: fields.modelId || '',
        trimId: fields.trimId || '',
        yearId: fields.yearId || '',
        historicalOffers: [...new Set(allOffers)], // Remove duplicates
      };
    });

    return vehicles;

  } catch (error) {
    console.error(`Error searching for vehicles via Airtable. URL: ${url}`, error);
    if (error instanceof Error) {
        if (error.message.includes('Failed to fetch')) {
             throw new Error("Falló la conexión de red. Revisa tu proxy (CORS) y conexión a internet.");
        }
        throw error;
    }
    throw new Error("No se pudieron obtener los datos. Verifique la conexión o la configuración del sistema.");
  }
};

export const findVehicleVariations = async (
  vehicle: Vehicle,
  airtableApiKey: string,
  airtableBaseId: string,
  airtableTableId: string,
  airtableTableView: string
): Promise<Vehicle[]> => {
  if (!vehicle.brandId || !vehicle.modelId || !vehicle.yearId) {
    console.warn('Cannot find variations for vehicle without brand, model, or year ID.');
    return [];
  }

  if (!airtableApiKey || !airtableBaseId || !airtableTableId || !airtableTableView) {
    console.error("Airtable config is incomplete for finding variations.");
    return [];
  }

  const formula = `AND({brandId} = '${vehicle.brandId}', {modelId} = '${vehicle.modelId}', {yearId} = '${vehicle.yearId}', NOT({trimId} = '${vehicle.trimId}'))`;
  const url = `https://api.airtable.com/v0/${airtableBaseId.trim()}/${airtableTableId.trim()}?view=${encodeURIComponent(airtableTableView)}&filterByFormula=${encodeURIComponent(formula)}&maxRecords=3`;

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${airtableApiKey.trim()}`,
        'Content-Type': 'application/json',
      },
    });
    if (!response.ok) {
      console.error("Error fetching variations from Airtable:", await response.json().catch(() => ({})));
      return [];
    }
    const data = await response.json();
    
    return data.records.map((record: any) => {
      const fields = record.fields;
      const vehicleName = fields['Vehicle Name'] || '';
      const nameParts = vehicleName.split(' ');
      const brand = nameParts[0] || 'N/A';
      const model = nameParts[1] || 'N/A';
      const yearStr = nameParts.find((p: string) => /^\d{4}$/.test(p));
      const year = yearStr ? parseInt(yearStr, 10) : new Date().getFullYear();
      
      let allOffers: number[] = [];
      const fieldsToProcess = [
        fields['historicalOffers'], fields['Historical Offers'], fields['Autos Ofertados'], 
        fields['Ofertas Historicas TREFA'], fields['Monto Ofertas Historicas']
      ];

      for (const offersData of fieldsToProcess) {
          if (typeof offersData === 'string' && offersData.trim() !== '') {
              const parsed = offersData.split(',').map(s => parseInt(s.trim().replace(/[$,]/g, ''), 10)).filter(n => !isNaN(n));
              allOffers.push(...parsed);
          } else if (Array.isArray(offersData)) {
              allOffers.push(...offersData.filter((n): n is number => typeof n === 'number' && !isNaN(n)));
          }
      }

      return {
        id: record.id, label: vehicleName, brand, model, year,
        trim: fields['Trim Name'] || 'N/A',
        brandId: fields.brandId || '', modelId: fields.modelId || '',
        trimId: fields.trimId || '', yearId: fields.yearId || '',
        historicalOffers: [...new Set(allOffers)],
      };
    });
  } catch (error) {
    console.error("Error finding vehicle variations:", error);
    return [];
  }
};

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const robustParseFloat = (value: any): number => {
    if (typeof value === 'number') return isNaN(value) ? 0 : value;
    if (typeof value === 'string') {
        const cleaned = value.replace(/[$,]/g, '').trim();
        const num = parseFloat(cleaned);
        return isNaN(num) ? 0 : num;
    }
    return 0;
};

// Helper to extract suggestedOffer from various possible locations in API response
const extractSuggestedOffer = (responseData: any): number => {
    console.log('🔍 Searching for suggestedOffer in response...');

    // Try all possible paths where suggestedOffer might be located
    const possiblePaths = [
        { path: 'responseData.suggestedOffer', value: responseData?.suggestedOffer },
        { path: 'responseData.offer.suggestedOffer', value: responseData?.offer?.suggestedOffer },
        { path: 'responseData.offer.amount', value: responseData?.offer?.amount },
        // Check in stats array (per Intelimotor docs)
        { path: 'responseData.stats[0].stats.suggestedOffer', value: responseData?.stats?.[0]?.stats?.suggestedOffer },
        { path: 'responseData.stats[0].values.suggestedOffer', value: responseData?.stats?.[0]?.values?.suggestedOffer },
        { path: 'responseData.regions[0].stats.suggestedOffer', value: responseData?.regions?.[0]?.stats?.suggestedOffer },
        // Check in data wrapper
        { path: 'responseData.data.suggestedOffer', value: responseData?.data?.suggestedOffer },
        { path: 'responseData.data.offer.suggestedOffer', value: responseData?.data?.offer?.suggestedOffer },
        { path: 'responseData.data.offer.amount', value: responseData?.data?.offer?.amount },
        { path: 'responseData.data.stats[0].stats.suggestedOffer', value: responseData?.data?.stats?.[0]?.stats?.suggestedOffer },
        { path: 'responseData.data.stats[0].values.suggestedOffer', value: responseData?.data?.stats?.[0]?.values?.suggestedOffer },
        { path: 'responseData.data.regions[0].stats.suggestedOffer', value: responseData?.data?.regions?.[0]?.stats?.suggestedOffer },
    ];

    for (const { path, value } of possiblePaths) {
        console.log(`  Checking ${path}:`, value);
        const parsed = robustParseFloat(value);
        if (parsed > 0) {
            console.log(`✓ Found suggestedOffer: ${parsed} at ${path}`);
            return parsed;
        }
    }

    console.warn('⚠️ No suggestedOffer found in any expected path');
    console.log('Full response data:', JSON.stringify(responseData, null, 2));
    return 0;
};

// Helper to extract ofertaAutomatica from various possible locations
// NOTE: This is also a valid offer source from Intelimotor
const extractOfertaAutomatica = (responseData: any): number => {
    console.log('🔍 Searching for ofertaAutomatica in response...');

    const possiblePaths = [
        { path: 'responseData.ofertaAutomatica', value: responseData?.ofertaAutomatica },
        { path: 'responseData.automaticOffer', value: responseData?.automaticOffer },
        { path: 'responseData.data.ofertaAutomatica', value: responseData?.data?.ofertaAutomatica },
        { path: 'responseData.data.automaticOffer', value: responseData?.data?.automaticOffer },
        { path: 'responseData.valuation.ofertaAutomatica', value: responseData?.valuation?.ofertaAutomatica },
        { path: 'responseData.valuation.automaticOffer', value: responseData?.valuation?.automaticOffer },
    ];

    for (const { path, value } of possiblePaths) {
        console.log(`  Checking ${path}:`, value);
        const parsed = robustParseFloat(value);
        if (parsed > 0) {
            console.log(`✓ Found ofertaAutomatica: ${parsed} at ${path}`);
            return parsed;
        }
    }

    console.log('⚠️ No ofertaAutomatica found');
    return 0;
};
export const fetchIntelimotorValuation = async (params: FetchVehicleValuationParams): Promise<{ valuation: IntelimotorValuation; rawResponse: any }> => {
    const { vehicle, mileage, businessUnitId, apiKey, apiSecret, proxyUrl } = params;

    const valuationProcess = async () => {
        if (!apiKey || !apiSecret) throw new Error("La API Key y/o API Secret de Intelimotor no están configurados.");
        if (!businessUnitId) throw new Error("El ID de la unidad de negocio no está configurado.");
        if (!vehicle.brandId || !vehicle.modelId || !vehicle.yearId || !vehicle.trimId) {
            throw new Error("El auto seleccionado no tiene todos los IDs necesarios (brand, model, year, trim).");
        }

        const callProxy = async (endpoint: string, method: 'POST' | 'GET', requestBody: any = null) => {
            // The proxy function will add the auth query params. We pass the credentials in headers.
            const fullUrl = `${INTELIMOTOR_BASE_URL}/${endpoint}`;

            const proxyPayload = {
                url: fullUrl,
                method: method,
                headers: {
                    'Content-Type': 'application/json'
                },
                body: requestBody
            };

            // Check if using Supabase function (needs auth) or local proxy
            const isSupabaseFunction = proxyUrl?.includes('supabase.co/functions');

            const headers: Record<string, string> = {
                'Content-Type': 'application/json',
                'x-api-key': apiKey.trim(),
                'x-api-secret': apiSecret.trim(),
            };

            // Add Supabase auth if using Supabase function
            if (isSupabaseFunction) {
                const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
                if (supabaseAnonKey) {
                    headers['Authorization'] = `Bearer ${supabaseAnonKey}`;
                    headers['apikey'] = supabaseAnonKey;
                }
            }

            const response = await fetch(proxyUrl || '/intelimotor-api/', {
                method: 'POST',
                headers,
                body: JSON.stringify(proxyPayload),
            });

            if (!response.ok) {
                const errorBody = await response.text();
                let errorMsg = `Error from proxy (${response.status}): ${errorBody}`;
                if (response.status === 401) errorMsg = "Error de autenticación con Intelimotor (401). Verifica tu API Key y API Secret.";
                const error = new Error(errorMsg);
                (error as any).response = errorBody;
                throw error;
            }
            return response.json();
        };

        // Step 1: POST to create a new valuation with lite=true
        const postBody = {
            businessUnitId: businessUnitId.trim(),
            brandIds: [vehicle.brandId],
            modelIds: [vehicle.modelId],
            yearIds: [vehicle.yearId],
            trimIds: [vehicle.trimId],
            kms: mileage,
            lite: true  // Enable lite mode as per Intelimotor API
        };

        let postResponseData;
        try {
            console.log('📤 Sending POST request to Intelimotor with body:', JSON.stringify(postBody, null, 2));
            postResponseData = await callProxy('valuations', 'POST', postBody);
            console.log('📡 POST Response received:', JSON.stringify(postResponseData, null, 2));
            console.log('📊 POST Response structure check:');
            console.log('  - postResponseData.data:', postResponseData.data ? 'EXISTS' : 'MISSING');
            console.log('  - postResponseData.suggestedOffer:', postResponseData.suggestedOffer);
            console.log('  - postResponseData.data?.suggestedOffer:', postResponseData.data?.suggestedOffer);
        } catch (e) {
            if (e instanceof Error && e.message.includes('Failed to fetch')) throw new Error("Falló la conexión de red. Revisa tu proxy y conexión a internet.");
            throw e;
        }

        // Step 2: Check for immediate suggestedOffer in the POST response
        const postDataContainer = postResponseData.data || postResponseData;

        // Log all available fields to understand what Intelimotor is returning
        console.log('🔍 Available fields in POST response:');
        console.log('  Keys in postDataContainer:', Object.keys(postDataContainer || {}));

        // Check regions array structure (per actual API response)
        if (postDataContainer?.regions && Array.isArray(postDataContainer.regions)) {
            console.log('  Regions[0].stats.suggestedOffer:', postDataContainer.regions[0]?.stats?.suggestedOffer);
            console.log('  Regions[0].stats.avgMarketValue:', postDataContainer.regions[0]?.stats?.avgMarketValue);
        }

        const immediateSuggestedOffer = extractSuggestedOffer(postDataContainer);

        if (immediateSuggestedOffer > 0) {
            console.log("✅ suggestedOffer found in initial POST response. Skipping polling.");
            const regionStats = postDataContainer?.stats?.[0]?.values;
            const valuation: IntelimotorValuation = {
                suggestedOffer: immediateSuggestedOffer,
                ofertaAutomatica: extractOfertaAutomatica(postDataContainer),
                highMarketValue: robustParseFloat(regionStats?.highMarketValue),
                lowMarketValue: robustParseFloat(regionStats?.lowMarketValue),
                avgDaysOnMarket: regionStats?.avgDaysOnMarket,
                avgKms: regionStats?.avgKms,
            };
            return { valuation, rawResponse: { initialPostResponse: postResponseData } };
        }

        console.log('⏳ No immediate offer in POST response. Will poll GET endpoint...');

        const valuationId = postDataContainer?.id || postDataContainer?.valuationId;
        console.log('📋 Valuation ID extracted:', valuationId);
        if (!valuationId) throw new Error("Respuesta de Intelimotor (POST) inválida: no se encontró el ID de la cotización para continuar.");

        // Step 3: Poll the GET endpoint if no immediate offer was found
        let finalValuationData = null;
        const maxAttempts = 12; // Increased from 6 to 12 attempts
        const pollInterval = 3000; // Reduced from 5000ms to 3000ms (3 seconds)
        // Total polling time: 12 attempts × 3 seconds = 36 seconds

        for (let attempt = 1; attempt <= maxAttempts; attempt++) {
            await sleep(pollInterval);
            console.log(`🔄 Polling attempt ${attempt}/${maxAttempts} for valuation ID: ${valuationId}...`);

            try {
                console.log(`📤 Calling GET /valuations/${valuationId} with apiKey and apiSecret`);
                const getResponseData = await callProxy(`valuations/${valuationId}`, 'GET', null);
                console.log(`📡 GET Response (attempt ${attempt}):`, JSON.stringify(getResponseData, null, 2));

                // Log structure - COMPREHENSIVE
                const getDataContainer = getResponseData.data || getResponseData;
                console.log('🔍 GET response ALL fields:', Object.keys(getDataContainer || {}));
                console.log('🔍 GET offer object:', JSON.stringify(getDataContainer?.offer, null, 2));

                // Log EVERY top-level field that might contain an offer
                console.log('🔍 Detailed field analysis:');
                if (getDataContainer) {
                    Object.keys(getDataContainer).forEach(key => {
                        const value = getDataContainer[key];
                        const type = typeof value;
                        if (type === 'number' || type === 'string') {
                            console.log(`  - ${key}: ${value} (${type})`);
                        } else if (type === 'object' && value !== null && !Array.isArray(value)) {
                            console.log(`  - ${key}: [object] keys:`, Object.keys(value));
                        }
                    });

                    // CRITICAL: Check stats array in detail
                    if (getDataContainer.stats && Array.isArray(getDataContainer.stats)) {
                        console.log('🔍 STATS ARRAY ANALYSIS:');
                        getDataContainer.stats.forEach((stat: any, idx: number) => {
                            console.log(`  Stats[${idx}]:`, JSON.stringify(stat, null, 2));
                            if (stat.values) {
                                console.log(`  Stats[${idx}].values keys:`, Object.keys(stat.values));
                                console.log(`  Stats[${idx}].values.suggestedOffer:`, stat.values.suggestedOffer);
                            }
                            if (stat.stats) {
                                console.log(`  Stats[${idx}].stats keys:`, Object.keys(stat.stats));
                                console.log(`  Stats[${idx}].stats.suggestedOffer:`, stat.stats.suggestedOffer);
                            }
                        });
                    }

                    // Check regions array
                    if (getDataContainer.regions && Array.isArray(getDataContainer.regions)) {
                        console.log('🔍 REGIONS ARRAY ANALYSIS:');
                        getDataContainer.regions.forEach((region: any, idx: number) => {
                            console.log(`  Regions[${idx}]:`, JSON.stringify(region, null, 2));
                        });
                    }
                }

                finalValuationData = getResponseData;
                const dataToInspect = getResponseData.data || getResponseData;

                const getSuggested = extractSuggestedOffer(dataToInspect);

                // CRITICAL: Check for offer in regions[0].stats
                if (getSuggested > 0) {
                    console.log(`✅ Successfully retrieved suggestedOffer on attempt ${attempt}: ${getSuggested}`);
                    break; // Success
                }

                // Log what we're seeing in regions
                if (dataToInspect?.regions?.[0]?.stats) {
                    const regionStats = dataToInspect.regions[0].stats;
                    console.log(`  📊 Region stats - suggestedOffer: ${regionStats.suggestedOffer}, avgMarketValue: ${regionStats.avgMarketValue}`);
                }

                console.log(`⏳ No suggestedOffer found yet on attempt ${attempt} (still null or 0), continuing...`);
            } catch (err) {
                 console.warn(`⚠️ Polling attempt ${attempt} failed with network error. Continuing...`, err);
            }
        }

        // Step 4: Process final data - ONLY use suggestedOffer from Intelimotor API
        const finalDataContainer = finalValuationData ? (finalValuationData.data || finalValuationData) : postDataContainer;
        const regionStats = finalDataContainer?.stats?.[0]?.values;

        console.log('🔍 Processing final valuation data...');
        console.log('🔍 Available fields in final response:');
        console.log('  Keys in finalDataContainer:', Object.keys(finalDataContainer || {}));
        if (regionStats) {
            console.log('  Keys in regionStats:', Object.keys(regionStats || {}));
            console.log('  regionStats values:', JSON.stringify(regionStats, null, 2));
        }

        // CRITICAL: ONLY use suggestedOffer from Intelimotor - never calculate our own offers
        const suggestedOffer = extractSuggestedOffer(finalDataContainer);

        if (suggestedOffer <= 0) {
            console.error('❌ No suggestedOffer received from Intelimotor API');
            console.error('Available fields:', Object.keys(finalDataContainer || {}));

            // Check if we have ofertaAutomatica as an alternative
            const ofertaAuto = extractOfertaAutomatica(finalDataContainer);
            if (ofertaAuto > 0) {
                console.warn('⚠️ Found ofertaAutomatica but not suggestedOffer:', ofertaAuto);
                console.warn('⚠️ Using ofertaAutomatica as fallback - this should be reviewed');
                // Use ofertaAutomatica if available (temporary fallback)
                const valuation: IntelimotorValuation = {
                    suggestedOffer: ofertaAuto,
                    ofertaAutomatica: ofertaAuto,
                    highMarketValue: robustParseFloat(regionStats?.highMarketValue),
                    lowMarketValue: robustParseFloat(regionStats?.lowMarketValue),
                    avgDaysOnMarket: regionStats?.avgDaysOnMarket,
                    avgKms: regionStats?.avgKms,
                };
                console.log('⚠️ USING FALLBACK - Complete valuation:', valuation);
                return { valuation, rawResponse: { initialPostResponse: postResponseData, finalGetResponse: finalValuationData } };
            }

            console.error('Full API Response:', JSON.stringify(finalDataContainer, null, 2));
            throw new ValuationFailedError(
                "No pudimos generar una oferta para esta versión específica. Esto suele ocurrir con autos poco comunes.",
                { initialPostResponse: postResponseData, finalGetResponse: finalValuationData }
            );
        }

        console.log(`✅ Using suggestedOffer from Intelimotor: ${suggestedOffer}`);

        const valuation: IntelimotorValuation = {
            suggestedOffer: suggestedOffer,
            ofertaAutomatica: extractOfertaAutomatica(finalDataContainer),
            highMarketValue: robustParseFloat(regionStats?.highMarketValue),
            lowMarketValue: robustParseFloat(regionStats?.lowMarketValue),
            avgDaysOnMarket: regionStats?.avgDaysOnMarket,
            avgKms: regionStats?.avgKms,
        };

        console.log('📊 Complete valuation:', valuation);

        return {
            valuation,
            rawResponse: { initialPostResponse: postResponseData, finalGetResponse: finalValuationData }
        };
    };

    const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() =>
            reject(new Error("La cotización está tardando más de lo esperado. Por favor, intenta de nuevo o prueba con una versión o año diferente del auto.")),
            60000 // 60s timeout (increased from 40s to allow for longer polling)
        )
    );

    return Promise.race([valuationProcess(), timeoutPromise as any]);
};

export const saveValuationToAirtable = async (
  valuationData: Record<string, any>,
  airtableApiKey: string,
  airtableBaseId: string,
  valuationsTableId: string
): Promise<any> => {
  if (!airtableApiKey || !airtableBaseId || !valuationsTableId) {
    throw new Error("La configuración de Airtable está incompleta. Se requiere API Key, Base ID y el nombre de la tabla de cotizaciones.");
  }

  const cleanApiKey = airtableApiKey.trim();
  const cleanBaseId = airtableBaseId.trim();
  const url = `https://api.airtable.com/v0/${cleanBaseId}/${valuationsTableId}`;
  
  const payload = {
    records: [
      {
        fields: valuationData,
      },
    ],
  };

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${cleanApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const responseData = await response.json();

    if (!response.ok) {
      const errorMessage = responseData?.error?.message || response.statusText || 'Ocurrió un error desconocido';
       if (response.status === 403) {
          throw new Error(`Error de permisos con Airtable (403). Asegúrate de que tu API token tenga el scope 'data.records:write' y acceso a la base.`);
      }
      if (response.status === 422) {
          const fieldError = responseData?.error?.message || '';
          if (fieldError.includes("Value is not an array of record IDs")) {
              throw new Error(
                `Error Crítico de Configuración en Airtable (422):\n\n` +
                `El campo 'Inventario' en tu tabla '${valuationsTableId}' está mal configurado.\n\n` +
                `==> SOLUCIÓN: Cambia el tipo de la columna a "Link to another record" y apúntalo a tu tabla de vehículos.`
              );
          }
          throw new Error(`Error al guardar en Airtable (422): ${errorMessage}. Revisa la guía de configuración en el código.`);
      }
      throw new Error(`Error de Airtable API (${response.status}): ${errorMessage}`);
    }

    return responseData;

  } catch (error) {
    console.error("Error saving valuation to Airtable:", error);
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("No se pudo guardar la cotización en Airtable.");
  }
};
