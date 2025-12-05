import React, { useState } from 'react';
import { Calendar } from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

export type DateRangePreset =
    | 'today'
    | 'yesterday'
    | 'last7days'
    | 'last30days'
    | 'thisMonth'
    | 'lastMonth'
    | 'last90days'
    | 'thisYear'
    | 'allTime';

export interface DateRange {
    startDate: Date | null;
    endDate: Date | null;
    preset: DateRangePreset;
}

interface DateRangeFilterProps {
    value?: DateRange;
    onChange?: (range: DateRange) => void;
    className?: string;
}

const getDateRangeForPreset = (preset: DateRangePreset): { startDate: Date | null; endDate: Date | null } => {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    switch (preset) {
        case 'today':
            return {
                startDate: today,
                endDate: endOfToday
            };

        case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            const endOfYesterday = new Date(yesterday);
            endOfYesterday.setHours(23, 59, 59, 999);
            return {
                startDate: yesterday,
                endDate: endOfYesterday
            };

        case 'last7days':
            const last7Days = new Date(today);
            last7Days.setDate(last7Days.getDate() - 6); // Today + 6 days ago = 7 days
            return {
                startDate: last7Days,
                endDate: endOfToday
            };

        case 'last30days':
            const last30Days = new Date(today);
            last30Days.setDate(last30Days.getDate() - 29); // Today + 29 days ago = 30 days
            return {
                startDate: last30Days,
                endDate: endOfToday
            };

        case 'last90days':
            const last90Days = new Date(today);
            last90Days.setDate(last90Days.getDate() - 89); // Today + 89 days ago = 90 days
            return {
                startDate: last90Days,
                endDate: endOfToday
            };

        case 'thisMonth':
            const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
            return {
                startDate: firstDayOfMonth,
                endDate: endOfToday
            };

        case 'lastMonth':
            const firstDayOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0, 0);
            const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
            return {
                startDate: firstDayOfLastMonth,
                endDate: lastDayOfLastMonth
            };

        case 'thisYear':
            const firstDayOfYear = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
            return {
                startDate: firstDayOfYear,
                endDate: endOfToday
            };

        case 'allTime':
        default:
            return {
                startDate: null,
                endDate: null
            };
    }
};

const formatDateRange = (range: DateRange): string => {
    if (!range.startDate || !range.endDate) {
        return 'Todo el tiempo';
    }

    const formatDate = (date: Date) => {
        return date.toLocaleDateString('es-MX', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined
        });
    };

    return `${formatDate(range.startDate)} - ${formatDate(range.endDate)}`;
};

export const DateRangeFilter: React.FC<DateRangeFilterProps> = ({
    value = { startDate: null, endDate: null, preset: 'allTime' },
    onChange,
    className = ''
}) => {
    const [selectedPreset, setSelectedPreset] = useState<DateRangePreset>(value.preset);

    const handlePresetChange = (preset: DateRangePreset) => {
        setSelectedPreset(preset);
        const { startDate, endDate } = getDateRangeForPreset(preset);
        onChange?.({
            startDate,
            endDate,
            preset
        });
    };

    const currentRange = getDateRangeForPreset(selectedPreset);

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            <Calendar className="h-4 w-4 text-muted-foreground flex-shrink-0" />
            <Select value={selectedPreset} onValueChange={(v) => handlePresetChange(v as DateRangePreset)}>
                <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Seleccionar período" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="today">Hoy</SelectItem>
                    <SelectItem value="yesterday">Ayer</SelectItem>
                    <SelectItem value="last7days">Últimos 7 días</SelectItem>
                    <SelectItem value="last30days">Últimos 30 días</SelectItem>
                    <SelectItem value="last90days">Últimos 90 días</SelectItem>
                    <SelectItem value="thisMonth">Este mes</SelectItem>
                    <SelectItem value="lastMonth">Mes pasado</SelectItem>
                    <SelectItem value="thisYear">Este año</SelectItem>
                    <SelectItem value="allTime">Todo el tiempo</SelectItem>
                </SelectContent>
            </Select>
            <Badge variant="secondary" className="text-xs whitespace-nowrap">
                {formatDateRange({ ...currentRange, preset: selectedPreset })}
            </Badge>
        </div>
    );
};

export default DateRangeFilter;
