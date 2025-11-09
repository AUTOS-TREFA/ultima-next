'use client';

import React, { useState } from 'react';
import { Calendar, Filter, RotateCcw, X } from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import type { DashboardFilters } from '../../services/AnalyticsService';

interface FilterPanelProps {
    filters: DashboardFilters;
    onFilterChange: (filters: DashboardFilters) => void;
    onReset: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({ filters, onFilterChange, onReset }) => {
    const [showCustomDates, setShowCustomDates] = useState(false);

    const handleDateRangeChange = (range: DashboardFilters['dateRange']) => {
        let startDate: Date | undefined;
        let endDate: Date | undefined;

        const now = new Date();

        switch (range) {
            case 'last7days':
                startDate = subDays(now, 7);
                endDate = now;
                break;
            case 'last30days':
                startDate = subDays(now, 30);
                endDate = now;
                break;
            case 'last90days':
                startDate = subDays(now, 90);
                endDate = now;
                break;
            case 'thisMonth':
                startDate = new Date(now.getFullYear(), now.getMonth(), 1);
                endDate = now;
                break;
            case 'lastMonth':
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                endDate = new Date(now.getFullYear(), now.getMonth(), 0);
                break;
            case 'custom':
                setShowCustomDates(true);
                return;
        }

        setShowCustomDates(false);
        onFilterChange({
            ...filters,
            dateRange: range,
            startDate: startDate ? startOfDay(startDate) : undefined,
            endDate: endDate ? endOfDay(endDate) : undefined
        });
    };

    const handleSourceChange = (source: DashboardFilters['source']) => {
        onFilterChange({ ...filters, source });
    };

    const handleStatusChange = (status: DashboardFilters['status']) => {
        onFilterChange({ ...filters, status });
    };

    const handleCustomDateChange = (type: 'start' | 'end', value: string) => {
        const date = new Date(value);
        const updatedFilters = { ...filters };

        if (type === 'start') {
            updatedFilters.startDate = startOfDay(date);
        } else {
            updatedFilters.endDate = endOfDay(date);
        }

        onFilterChange(updatedFilters);
    };

    const hasActiveFilters = filters.source !== 'all' || filters.status !== 'all' || filters.dateRange !== 'last30days';

    return (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                {/* Left Side - Filters */}
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Filtros:</span>
                    </div>

                    {/* Date Range Filter */}
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <select
                            value={filters.dateRange}
                            onChange={(e) => handleDateRangeChange(e.target.value as DashboardFilters['dateRange'])}
                            className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="last7days">Últimos 7 días</option>
                            <option value="last30days">Últimos 30 días</option>
                            <option value="last90days">Últimos 90 días</option>
                            <option value="thisMonth">Este mes</option>
                            <option value="lastMonth">Mes pasado</option>
                            <option value="custom">Personalizado</option>
                        </select>
                    </div>

                    {/* Custom Date Inputs */}
                    {showCustomDates && (
                        <div className="flex items-center gap-2">
                            <input
                                type="date"
                                value={filters.startDate ? format(filters.startDate, 'yyyy-MM-dd') : ''}
                                onChange={(e) => handleCustomDateChange('start', e.target.value)}
                                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-gray-500">a</span>
                            <input
                                type="date"
                                value={filters.endDate ? format(filters.endDate, 'yyyy-MM-dd') : ''}
                                onChange={(e) => handleCustomDateChange('end', e.target.value)}
                                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    )}

                    {/* Source Filter */}
                    <select
                        value={filters.source || 'all'}
                        onChange={(e) => handleSourceChange(e.target.value as DashboardFilters['source'])}
                        className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todas las fuentes</option>
                        <option value="facebook">Facebook</option>
                        <option value="google">Google</option>
                        <option value="bot">Bot/WhatsApp</option>
                        <option value="direct">Directo</option>
                        <option value="other">Otros</option>
                    </select>

                    {/* Status Filter */}
                    <select
                        value={filters.status || 'all'}
                        onChange={(e) => handleStatusChange(e.target.value as DashboardFilters['status'])}
                        className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="all">Todos los estados</option>
                        <option value="pending">Pendiente</option>
                        <option value="contacted">Contactado</option>
                        <option value="uncontacted">Sin contactar</option>
                        <option value="approved">Aprobado</option>
                    </select>
                </div>

                {/* Right Side - Actions */}
                <div className="flex items-center gap-2">
                    {hasActiveFilters && (
                        <button
                            onClick={onReset}
                            className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <X className="w-4 h-4" />
                            <span>Limpiar filtros</span>
                        </button>
                    )}

                    <button
                        onClick={onReset}
                        className="flex items-center gap-2 px-3 py-1.5 text-sm text-blue-600 hover:text-blue-700 hover:bg-blue-50 rounded-md transition-colors"
                        title="Actualizar datos"
                    >
                        <RotateCcw className="w-4 h-4" />
                        <span className="hidden sm:inline">Actualizar</span>
                    </button>
                </div>
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
                <div className="mt-3 pt-3 border-t border-gray-200">
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-gray-500">Filtros activos:</span>
                        {filters.source && filters.source !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full">
                                {filters.source}
                                <button
                                    onClick={() => handleSourceChange('all')}
                                    className="hover:bg-blue-200 rounded-full p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                        {filters.status && filters.status !== 'all' && (
                            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                {filters.status}
                                <button
                                    onClick={() => handleStatusChange('all')}
                                    className="hover:bg-green-200 rounded-full p-0.5"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default FilterPanel;
