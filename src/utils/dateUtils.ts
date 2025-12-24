/**
 * Date Utilities
 * Helper functions for handling dates in local timezone
 */

/**
 * Parse a date string (YYYY-MM-DD) in local timezone
 * Avoids UTC conversion issues that occur with new Date(dateString)
 * 
 * @param dateString - Date in YYYY-MM-DD format
 * @returns Date object in local timezone
 * 
 * @example
 * // Instead of: new Date("2025-12-23") // Interprets as UTC, shifts to local
 * // Use: parseDateLocal("2025-12-23") // Parses in local timezone
 */
export function parseDateLocal(dateString: string): Date {
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
}
