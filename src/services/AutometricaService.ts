/**
 * AutometricaService
 *
 * Servicio para interactuar con la API de Autométrica via Supabase Edge Function.
 * Proporciona valuación de vehículos con precios de compra/venta basados en datos del mercado.
 */

import { supabase } from '../../supabaseClient';

// ============================================================================
// TIPOS
// ============================================================================

/** Vehículo del catálogo de Autométrica */
export interface AutometricaCatalogVehicle {
  index: number;
  year: number;
  brand: string;
  subbrand: string;
  version: string;
}

/** Respuesta del catálogo */
export interface AutometricaCatalogResponse {
  catalogo_lineal: AutometricaCatalogVehicle[];
}

/** Item de la respuesta de precio */
export interface AutometricaPriceItem {
  year: number;
  brand: string;
  subbrand: string;
  version: string;
  km_group: string;
  sale: number;      // Precio de venta (valor mercado)
  purchase: number;  // Precio de compra (lo que TREFA pagaría)
}

/** Respuesta de precio de Autométrica */
export interface AutometricaPriceResponse {
  lineal: AutometricaPriceItem[];
}

/** Valuación procesada para usar en la app */
export interface AutometricaValuation {
  purchasePrice: number;     // Precio de compra (oferta al cliente)
  salePrice: number;         // Precio de venta (valor mercado)
  kmAdjustment: number;      // Ajuste por kilometraje
  optionalAddons: number;    // Suma de añadires opcionales
  vehicle: {
    year: number;
    brand: string;
    subbrand: string;
    version: string;
  };
  raw: AutometricaPriceItem[];  // Respuesta cruda para debugging
}

/** Vehículo para búsqueda local (compatible con el selector) */
export interface AutometricaVehicleOption {
  id: string;
  label: string;
  year: number;
  brand: string;
  subbrand: string;
  version: string;
}

// ============================================================================
// CONSTANTES
// ============================================================================

const EDGE_FUNCTION_URL = 'autometrica-proxy';
const CATALOG_CACHE_KEY = 'autometrica_catalog';
const CATALOG_CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 días (el catálogo se actualiza mensualmente según la guía)

// ============================================================================
// SERVICIO
// ============================================================================

export const AutometricaService = {
  /**
   * Obtiene el catálogo completo de vehículos de Autométrica.
   * El catálogo se actualiza mensualmente, por lo que se cachea localmente.
   */
  async getCatalog(forceRefresh = false): Promise<AutometricaCatalogVehicle[]> {
    // Intentar usar cache local
    if (!forceRefresh) {
      const cached = this.getCachedCatalog();
      if (cached) {
        console.log('[Autométrica] Using cached catalog');
        return cached;
      }
    }

    console.log('[Autométrica] Fetching catalog from API');

    const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_URL, {
      body: { action: 'catalog' },
    });

    if (error) {
      console.error('[Autométrica] Error fetching catalog:', error);
      throw new Error('No se pudo obtener el catálogo de vehículos');
    }

    const response = data as AutometricaCatalogResponse;

    if (!response?.catalogo_lineal) {
      throw new Error('Respuesta inválida del catálogo');
    }

    // Cachear el catálogo
    this.setCachedCatalog(response.catalogo_lineal);

    return response.catalogo_lineal;
  },

  /**
   * Busca vehículos en el catálogo por texto libre.
   * Busca en marca, submarca, versión y año.
   */
  async searchVehicles(query: string): Promise<AutometricaVehicleOption[]> {
    if (!query || query.length < 2) {
      return [];
    }

    const catalog = await this.getCatalog();
    const queryLower = query.toLowerCase().trim();
    const queryWords = queryLower.split(/\s+/);

    // Filtrar vehículos que coincidan con la búsqueda
    const matches = catalog.filter((vehicle) => {
      const searchText = `${vehicle.year} ${vehicle.brand} ${vehicle.subbrand} ${vehicle.version}`.toLowerCase();

      // Todos los términos de búsqueda deben estar presentes
      return queryWords.every((word) => searchText.includes(word));
    });

    // Limitar resultados y transformar al formato esperado
    return matches.slice(0, 20).map((vehicle) => ({
      id: `${vehicle.year}-${vehicle.brand}-${vehicle.subbrand}-${vehicle.version}`,
      label: `${vehicle.brand} ${vehicle.subbrand} ${vehicle.version} ${vehicle.year}`,
      year: vehicle.year,
      brand: vehicle.brand,
      subbrand: vehicle.subbrand,
      version: vehicle.version,
    }));
  },

  /**
   * Obtiene la valuación de un vehículo específico.
   * Retorna precio de compra (oferta) y precio de venta (mercado).
   */
  async getValuation(
    vehicle: {
      year: number | string;
      brand: string;
      subbrand: string;
      version: string;
    },
    kilometraje: number | string
  ): Promise<AutometricaValuation> {
    console.log('[Autométrica] Getting valuation for:', vehicle);

    const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_URL, {
      body: {
        action: 'price',
        year: String(vehicle.year),
        brand: vehicle.brand,
        subbrand: vehicle.subbrand,
        version: vehicle.version,
        kilometraje: String(kilometraje),
      },
    });

    if (error) {
      console.error('[Autométrica] Error getting valuation:', error);
      throw new Error('No se pudo obtener la valuación del vehículo');
    }

    const response = data as AutometricaPriceResponse;

    if (!response?.lineal || response.lineal.length === 0) {
      throw new Error('No se encontró valuación para este vehículo');
    }

    // Procesar la respuesta
    // El primer item es el precio base del vehículo
    // Los siguientes pueden ser añadires opcionales o ajuste de kilometraje
    const basePrice = response.lineal.find(
      (item) => !item.version.startsWith('Añadir') && item.version !== 'Valor kilometraje'
    );

    const kmAdjustment = response.lineal.find(
      (item) => item.version === 'Valor kilometraje'
    );

    const addons = response.lineal.filter(
      (item) => item.version.startsWith('Añadir')
    );

    if (!basePrice) {
      throw new Error('No se encontró el precio base del vehículo');
    }

    const optionalAddonsSum = addons.reduce(
      (sum, addon) => sum + addon.purchase,
      0
    );

    return {
      purchasePrice: basePrice.purchase + (kmAdjustment?.purchase || 0),
      salePrice: basePrice.sale + (kmAdjustment?.sale || 0),
      kmAdjustment: kmAdjustment?.purchase || 0,
      optionalAddons: optionalAddonsSum,
      vehicle: {
        year: basePrice.year,
        brand: basePrice.brand,
        subbrand: basePrice.subbrand,
        version: basePrice.version,
      },
      raw: response.lineal,
    };
  },

  /**
   * Obtiene el catálogo cacheado del localStorage.
   */
  getCachedCatalog(): AutometricaCatalogVehicle[] | null {
    try {
      const cached = localStorage.getItem(CATALOG_CACHE_KEY);
      if (!cached) return null;

      const { data, timestamp } = JSON.parse(cached);

      // Verificar si el cache ha expirado
      if (Date.now() - timestamp > CATALOG_CACHE_DURATION) {
        localStorage.removeItem(CATALOG_CACHE_KEY);
        return null;
      }

      return data;
    } catch (e) {
      console.warn('[Autométrica] Error reading cached catalog:', e);
      return null;
    }
  },

  /**
   * Guarda el catálogo en localStorage.
   */
  setCachedCatalog(data: AutometricaCatalogVehicle[]): void {
    try {
      localStorage.setItem(
        CATALOG_CACHE_KEY,
        JSON.stringify({
          data,
          timestamp: Date.now(),
        })
      );
    } catch (e) {
      console.warn('[Autométrica] Error caching catalog:', e);
    }
  },

  /**
   * Limpia el cache del catálogo.
   */
  clearCache(): void {
    localStorage.removeItem(CATALOG_CACHE_KEY);
  },

  /**
   * Obtiene marcas únicas del catálogo.
   */
  async getBrands(): Promise<string[]> {
    const catalog = await this.getCatalog();
    const brands = [...new Set(catalog.map((v) => v.brand))];
    return brands.sort();
  },

  /**
   * Obtiene submarcas (modelos) para una marca específica.
   */
  async getSubbrands(brand: string): Promise<string[]> {
    const catalog = await this.getCatalog();
    const subbrands = [
      ...new Set(
        catalog
          .filter((v) => v.brand.toLowerCase() === brand.toLowerCase())
          .map((v) => v.subbrand)
      ),
    ];
    return subbrands.sort();
  },

  /**
   * Obtiene años disponibles para una marca y submarca.
   */
  async getYears(brand: string, subbrand: string): Promise<number[]> {
    const catalog = await this.getCatalog();
    const years = [
      ...new Set(
        catalog
          .filter(
            (v) =>
              v.brand.toLowerCase() === brand.toLowerCase() &&
              v.subbrand.toLowerCase() === subbrand.toLowerCase()
          )
          .map((v) => v.year)
      ),
    ];
    return years.sort((a, b) => b - a); // Más reciente primero
  },

  /**
   * Obtiene versiones para una marca, submarca y año específicos.
   */
  async getVersions(
    brand: string,
    subbrand: string,
    year: number
  ): Promise<string[]> {
    const catalog = await this.getCatalog();
    const versions = catalog
      .filter(
        (v) =>
          v.brand.toLowerCase() === brand.toLowerCase() &&
          v.subbrand.toLowerCase() === subbrand.toLowerCase() &&
          v.year === year
      )
      .map((v) => v.version);
    return versions.sort();
  },
};

export default AutometricaService;
