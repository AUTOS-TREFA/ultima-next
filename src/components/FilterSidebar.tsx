'use client';

import React, { useMemo, useCallback, useState, useEffect } from 'react';
import Link from 'next/link';
import AccordionItem from './AccordionItem';
import PriceRangeSlider from './PriceRangeSlider';
import { FilterIcon, CheckIcon, XCircleIcon, XIcon } from './icons';
import type { VehicleFilters, WordPressVehicle } from '../types/types';
import { formatPromotion } from '../utils/formatters';
import { getCategoryImage } from '../utils/get-category-image';
import { BRAND_LOGOS } from '../utils/constants';
import { proxyImage } from '../utils/proxyImage';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import FavoritesQuickAccess from './FavoritesQuickAccess';

// --- TYPES AND INTERFACES ---

interface FilterOption {
    name: string | number;
    count: number;
}

interface FilterSidebarProps {
    allVehicles: WordPressVehicle[];
    onFiltersChange: (filters: Partial<VehicleFilters>) => void;
    onClearFilters: () => void;
    filterOptions?: {
        marcas?: FilterOption[];
        years?: FilterOption[];
        warranties?: FilterOption[];
        promotions?: FilterOption[];
        carroceria?: FilterOption[];
        transmissions?: FilterOption[];
        combustibles?: FilterOption[];
        sucursales?: FilterOption[];
        minPrice?: number;
        maxPrice?: number;
        enganchemin?: number;
        maxEnganche?: number;
    };
    currentFilters: VehicleFilters;
    onRemoveFilter: (key: keyof VehicleFilters, value?: string | number | boolean) => void;
    activeFiltersList: { key: keyof VehicleFilters; value: string | number | boolean; label: string }[];
    isMobileSheet?: boolean;
    onCloseSheet?: () => void;
    resultsCount?: number;
}

// --- HELPER COMPONENTS ---

const CheckboxFilterGroup = React.memo<{
    options: (string | number)[];
    selected: (string | number)[];
    onChange: (value: string | number) => void;
    counts: Record<string | number, number>;
    labelFormatter?: (option: string | number) => string;
}>(({ options, selected, onChange, counts, labelFormatter = String }) => (
    <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {options.map(option => {
            const optionId = `filter-${String(option).replace(/\s/g, '-')}`;
            const isChecked = selected.includes(option);
            return (
                <label key={optionId} htmlFor={optionId} className="flex items-center justify-between text-gray-700 cursor-pointer group">
                    <div className="flex items-center">
                        <input id={optionId} type="checkbox" className="sr-only" checked={isChecked} onChange={() => onChange(option)} />
                        <div className={`w-5 h-5 border-2 rounded flex-shrink-0 flex items-center justify-center transition-all duration-200 ${isChecked ? 'bg-primary-600 border-primary-600' : 'bg-white border-gray-300 group-hover:border-primary-400'}`}>
                            {isChecked && <CheckIcon className="w-3.5 h-3.5 text-white" />}
                        </div>
                        <span className="ml-3 text-sm">{labelFormatter(option)}</span>
                    </div>
                    <span className="text-xs font-medium bg-gray-100 px-1.5 py-0.5 rounded">{counts[option] || 0}</span>
                </label>
            );
        })}
    </div>
));

CheckboxFilterGroup.displayName = 'CheckboxFilterGroup';

const ToggleSwitch = React.memo<{ label: string; isEnabled: boolean; onToggle: () => void; }>(({ label, isEnabled, onToggle }) => (
    <div className="flex items-center justify-between py-3">
        <span className="font-semibold text-gray-800 text-sm">{label}</span>
        <button onClick={onToggle} type="button" role="switch" aria-checked={isEnabled} className={`relative inline-flex items-center h-6 rounded-full w-11 transition-colors duration-300 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${isEnabled ? 'bg-primary-600' : 'bg-gray-300'}`}>
            <span className={`inline-block w-4 h-4 transform bg-white rounded-full transition-transform duration-300 ease-in-out ${isEnabled ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
    </div>
));

ToggleSwitch.displayName = 'ToggleSwitch';

// --- MAIN COMPONENT ---

const FilterSidebar: React.FC<FilterSidebarProps> = (props) => {
    const { onFiltersChange, onClearFilters, filterOptions, currentFilters, onRemoveFilter, activeFiltersList, isMobileSheet = false, onCloseSheet, resultsCount = 0 } = props;

    console.log('[FilterSidebar] Received filterOptions:', filterOptions);
    console.log('[FilterSidebar] filterOptions keys:', Object.keys(filterOptions || {}));

    const handleCheckboxChange = useCallback((filterKey: keyof VehicleFilters, value: string | number) => {
        const currentValues = (currentFilters[filterKey] as (string | number)[]) || [];
        const newValues = currentValues.includes(value) ? currentValues.filter(v => v !== value) : [...currentValues, value];
        onFiltersChange({ ...currentFilters, [filterKey]: newValues.length > 0 ? newValues : undefined });
    }, [currentFilters, onFiltersChange]);

    const handlePriceChange = useCallback((min: number, max: number) => {
        onFiltersChange({
            ...currentFilters,
            minPrice: min === filterOptions?.minPrice ? undefined : min,
            maxPrice: max === filterOptions?.maxPrice ? undefined : max
        });
    }, [currentFilters, onFiltersChange, filterOptions?.minPrice, filterOptions?.maxPrice]);

    const handleEngancheChange = useCallback((min: number, max: number) => {
        onFiltersChange({
            ...currentFilters,
            enganchemin: min === filterOptions?.enganchemin ? undefined : min,
            maxEnganche: max === filterOptions?.maxEnganche ? undefined : max
        });
    }, [currentFilters, onFiltersChange, filterOptions?.enganchemin, filterOptions?.maxEnganche]);

    const handleToggleChange = (filterKey: keyof VehicleFilters) => {
        onFiltersChange({
            ...currentFilters,
            [filterKey]: currentFilters[filterKey] ? undefined : true
        });
    };

    const counts = useMemo(() => ({
        marcas: Object.fromEntries((filterOptions?.marcas || []).map(s => [s.name, s.count])),
        autoano: Object.fromEntries((filterOptions?.years || []).map(y => [y.name, y.count])),
        garantia: Object.fromEntries((filterOptions?.warranties || []).map(c => [c.name, c.count])),
        transmision: Object.fromEntries((filterOptions?.transmissions || []).map(t => [t.name, t.count])),
        combustible: Object.fromEntries((filterOptions?.combustibles || []).map(f => [f.name, f.count])),
        carroceria: Object.fromEntries((filterOptions?.carroceria || []).map(w => [w.name, w.count])),
        promociones: Object.fromEntries((filterOptions?.promotions || []).map(p => [p.name, p.count])),
        ubicacion: Object.fromEntries((filterOptions?.sucursales || []).map(p => [p.name, p.count])),
    }), [filterOptions]);

    const FilterBody = (
        <>
            {activeFiltersList.length > 0 && (
                <div className="pb-4 mb-4">
                    <div className="flex justify-between items-center mb-3">
                        <h3 className="text-sm font-medium text-muted-foreground">Filtros Activos</h3>
                        <Button variant="ghost" size="sm" onClick={onClearFilters} className="h-auto py-1 px-2 text-xs">
                            <XCircleIcon className="w-3 h-3 mr-1" /> Limpiar
                        </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        {activeFiltersList.map(({ key, value, label }) => (
                            <Badge key={`${key}-${String(value)}`} variant="secondary" className="pl-2.5 pr-1 py-1">
                                <span>{label}</span>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="ml-1 h-auto w-auto p-0.5 hover:bg-primary/20"
                                    onClick={() => onRemoveFilter(key, value)}
                                    aria-label={`Remover filtro ${label}`}
                                >
                                    <XIcon className="w-3 h-3" />
                                </Button>
                            </Badge>
                        ))}
                    </div>
                    <Separator className="mt-4" />
                </div>
            )}

            <AccordionItem title="Carrocería" startOpen>
                <div className="grid grid-cols-4 gap-2">
                    {(filterOptions?.carroceria || [])
                        .filter(c => !['motos', 'motocicleta', 'motocicletas', 'moto'].includes(String(c.name).toLowerCase()))
                        .map(c => {
                        const isSelected = (currentFilters.carroceria || []).includes(c.name as string);
                        return (
                            <button
                                key={c.name}
                                type="button"
                                onClick={() => handleCheckboxChange('carroceria', c.name as string)}
                                className={`relative overflow-hidden rounded-lg transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 group ${isSelected ? 'border-2 border-primary-500' : 'border-0 hover:shadow-md'}`}
                                aria-pressed={isSelected}
                            >
                                <img src={getCategoryImage('carroceria', c.name as string)} alt={c.name as string} className="w-full h-auto object-cover transition-transform duration-300 group-hover:scale-105" />
                                {isSelected && <div className="absolute inset-0 bg-primary-500/10"></div>}
                            </button>
                        );
                    })}
                </div>
            </AccordionItem>

            <AccordionItem title="Marca">
                <div className="grid grid-cols-4 gap-2">
                    {(filterOptions?.marcas || []).slice(0, 12).map(m => {
                        const isSelected = (currentFilters.marca || []).includes(m.name as string);
                        return (
                            <button
                                key={m.name}
                                type="button"
                                onClick={() => {
                                    console.log('Marca button clicked:', m.name);
                                    handleCheckboxChange('marca', m.name as string);
                                }}
                                className={`relative overflow-hidden rounded-lg p-2 bg-white transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 group ${isSelected ? 'border-2 border-primary-500' : 'border-0 hover:shadow-md'}`}
                                aria-pressed={isSelected}
                            >
                                <img src={BRAND_LOGOS[m.name as string] || getCategoryImage('marca', m.name as string)} alt={m.name as string} className="w-full h-auto object-contain transition-transform duration-300 group-hover:scale-105" style={{ aspectRatio: '1/1' }} />
                            </button>
                        );
                    })}
                </div>
                {(filterOptions?.marcas || []).length > 12 && (
                    <AccordionItem title="Más marcas">
                        <CheckboxFilterGroup options={(filterOptions?.marcas || []).slice(12).map(m => m.name)} selected={currentFilters.marca || []} onChange={(v) => handleCheckboxChange('marca', v)} counts={counts.marcas} />
                    </AccordionItem>
                )}
            </AccordionItem>

            <AccordionItem title="Precio">
                <div className="px-4">
                    <PriceRangeSlider min={filterOptions?.minPrice || 0} max={filterOptions?.maxPrice || 1000000} initialMin={currentFilters.minPrice} initialMax={currentFilters.maxPrice} onPriceChange={handlePriceChange} />
                </div>
            </AccordionItem>

            <AccordionItem title="Enganche">
                <div className="px-4">
                    <PriceRangeSlider min={filterOptions?.enganchemin || 0} max={filterOptions?.maxEnganche || 500000} initialMin={currentFilters.enganchemin} initialMax={currentFilters.maxEnganche} onPriceChange={handleEngancheChange} />
                </div>
            </AccordionItem>

            <AccordionItem title="Año">
                <CheckboxFilterGroup options={(filterOptions?.years || []).map(y => y.name)} selected={currentFilters.autoano || []} onChange={(v) => handleCheckboxChange('autoano', v)} counts={counts.autoano} />
            </AccordionItem>

            <AccordionItem title="Sucursal">
                <CheckboxFilterGroup options={(filterOptions?.sucursales || []).map(s => s.name)} selected={currentFilters.ubicacion || []} onChange={(v) => handleCheckboxChange('ubicacion', v)} counts={counts.ubicacion} />
            </AccordionItem>

            <AccordionItem title="Transmisión">
                <CheckboxFilterGroup options={(filterOptions?.transmissions || []).map(t => t.name)} selected={currentFilters.transmision || []} onChange={(v) => handleCheckboxChange('transmision', v)} counts={counts.transmision} />
            </AccordionItem>

            <AccordionItem title="Combustible">
                <CheckboxFilterGroup options={(filterOptions?.combustibles || []).map(c => c.name)} selected={currentFilters.combustible || []} onChange={(v) => handleCheckboxChange('combustible', v)} counts={counts.combustible} />
            </AccordionItem>

            <AccordionItem title="Garantía">
                <CheckboxFilterGroup options={(filterOptions?.warranties || []).map(w => w.name)} selected={currentFilters.garantia || []} onChange={(v) => handleCheckboxChange('garantia', v)} counts={counts.garantia} />
            </AccordionItem>

            <AccordionItem title="Promociones">
                <CheckboxFilterGroup options={(filterOptions?.promotions || []).map(p => p.name)} selected={currentFilters.promociones || []} onChange={(v) => handleCheckboxChange('promociones', v)} counts={counts.promociones} labelFormatter={(option) => formatPromotion(String(option))} />
            </AccordionItem>

            <div className="mt-4 pt-4 border-t border-gray-200">
                <ToggleSwitch label="Ocultar separados" isEnabled={!!currentFilters.hideSeparado} onToggle={() => handleToggleChange('hideSeparado')} />
            </div>

            <div className="mt-6">
                <Button
                    variant="outline"
                    onClick={onClearFilters}
                    className="w-full"
                >
                    Limpiar Filtros
                </Button>
            </div>

            {/* Favorites Quick Access */}
            {!isMobileSheet && <FavoritesQuickAccess variant="sidebar" />}
        </>
    );

    if (isMobileSheet) {
        return (
            <div className="flex flex-col h-full overflow-hidden relative">
                <CardHeader className="flex-row items-center justify-between space-y-0 flex-shrink-0 border-b">
                    <CardTitle className="text-lg">Filtros</CardTitle>
                    <Button variant="ghost" size="icon" onClick={onCloseSheet}>
                        <XIcon className="w-5 h-5" />
                    </Button>
                </CardHeader>
                <div className="overflow-y-auto px-6 py-4 flex-grow pb-24">
                    {FilterBody}
                </div>
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-card shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.1)] z-[100]">
                    <Button onClick={onCloseSheet} className="w-full h-12 text-base" size="lg">
                        Mostrar {resultsCount} resultados
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full lg:w-96">
            <Card className="w-full overflow-visible shadow-sm" style={{ border: '1px solid rgba(0,0,0,0.06)' }}>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-xl">Filtrar por</CardTitle>
                        <FilterIcon className="w-6 h-6 text-muted-foreground" />
                    </div>
                </CardHeader>
                <CardContent className="overflow-visible">
                    {FilterBody}
                </CardContent>
            </Card>
        </div>
    );
};

export default React.memo(FilterSidebar);