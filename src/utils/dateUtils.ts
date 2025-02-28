import { format, parse, subDays, subMonths, subYears } from 'date-fns';

/**
 * Format a date for display
 */
export function formatDate(date: Date | string): string {
    const dateObj = typeof date === 'string' ? parse(date, 'yyyy-MM-dd', new Date()) : date;
    return format(dateObj, 'MMM dd, yyyy');
}

/**
 * Get date for a given period back from today
 */
export function getDateForPeriod(period: 'day' | 'week' | 'month' | 'year' | 'ytd'): string {
    const today = new Date();

    switch (period) {
        case 'day':
            return format(subDays(today, 1), 'yyyy-MM-dd');
        case 'week':
            return format(subDays(today, 7), 'yyyy-MM-dd');
        case 'month':
            return format(subMonths(today, 1), 'yyyy-MM-dd');
        case 'year':
            return format(subYears(today, 1), 'yyyy-MM-dd');
        case 'ytd':
            return `${today.getFullYear()}-01-01`;
        default:
            return format(today, 'yyyy-MM-dd');
    }
}


