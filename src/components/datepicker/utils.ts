// src/components/datepicker/utils.ts
import { CalendarDate } from './types';
import { MONTH_NAMES, MONTH_NAMES_SHORT } from './constants';

/**
 * Parses a date from various input types
 * @param date - Date string, Date object, or null
 * @returns Valid Date object or null if invalid
 */
export const parseDate = (date: Date | string | null): Date | null => {
  if (!date) return null;
  
  // Already a Date object
  if (date instanceof Date) {
    return isNaN(date.getTime()) ? null : date;
  }
  
  // String date
  if (typeof date === 'string') {
    // Try to parse the string
    const parsedDate = new Date(date);
    return isNaN(parsedDate.getTime()) ? null : parsedDate;
  }
  
  return null;
};

/**
 * Formats a date according to the specified format using a parser-based approach
 * This avoids string replacement issues by building the output string from scratch
 * 
 * @param date - Date to format
 * @param format - Format string (MM/DD/YYYY, etc.)
 * @returns Formatted date string
 */
export const formatDate = (date: Date | null, format: string = 'MM/DD/YYYY'): string => {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return '';
  }
  
  let result = '';
  let i = 0;
  
  while (i < format.length) {
    // Check for month name patterns
    if (format.substring(i, i+4) === 'MMMM') {
      // Full month name
      result += MONTH_NAMES[date.getMonth()];
      i += 4;
    } 
    else if (format.substring(i, i+3) === 'MMM') {
      // Abbreviated month name
      result += MONTH_NAMES_SHORT[date.getMonth()];
      i += 3;
    }
    else if (format.substring(i, i+2) === 'MM') {
      // Two-digit month
      result += (date.getMonth() + 1).toString().padStart(2, '0');
      i += 2;
    }
    else if (format.substring(i, i+1) === 'M') {
      // Single-digit month
      result += (date.getMonth() + 1);
      i += 1;
    }
    else if (format.substring(i, i+4) === 'YYYY') {
      // 4-digit year
      result += date.getFullYear();
      i += 4;
    }
    else if (format.substring(i, i+2) === 'YY') {
      // 2-digit year
      result += date.getFullYear().toString().slice(-2);
      i += 2;
    }
    else if (format.substring(i, i+2) === 'DD') {
      // Two-digit day
      result += date.getDate().toString().padStart(2, '0');
      i += 2;
    }
    else if (format.substring(i, i+1) === 'D') {
      // Single-digit day
      result += date.getDate();
      i += 1;
    }
    else {
      // Any other character is copied as-is
      result += format[i];
      i += 1;
    }
  }
  
  return result;
};

/**
 * Gets the days in a month
 * @param year - Year
 * @param month - Month (0-11)
 * @returns Number of days in the month
 */
export const getDaysInMonth = (year: number, month: number): number => {
  return new Date(year, month + 1, 0).getDate();
};

/**
 * Gets the first day of the month
 * @param year - Year
 * @param month - Month (0-11)
 * @returns Day of the week (0-6, where 0 is Sunday)
 */
export const getFirstDayOfMonth = (year: number, month: number): number => {
  return new Date(year, month, 1).getDay();
};

/**
 * Checks if two dates are the same day
 * @param date1 - First date
 * @param date2 - Second date
 * @returns True if same day, false otherwise
 */
export const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getDate() === date2.getDate() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getFullYear() === date2.getFullYear()
  );
};

/**
 * Checks if a date is between two other dates (inclusive)
 * @param date - Date to check
 * @param startDate - Start date
 * @param endDate - End date
 * @returns True if date is between start and end, false otherwise
 */
export const isDateInRange = (date: Date, startDate: Date, endDate: Date): boolean => {
  const timestamp = date.getTime();
  return timestamp >= startDate.getTime() && timestamp <= endDate.getTime();
};

/**
 * Generates calendar dates for a month
 * @param year - Year
 * @param month - Month (0-11)
 * @param selectedDate - Currently selected date
 * @param rangeEndDate - End date if range selection
 * @param minDate - Minimum selectable date
 * @param maxDate - Maximum selectable date
 * @returns Array of calendar dates
 */
export const generateCalendarDates = (
  year: number,
  month: number,
  selectedDate: Date | null = null,
  rangeEndDate: Date | null = null,
  minDate: Date | null = null,
  maxDate: Date | null = null
): CalendarDate[] => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const result: CalendarDate[] = [];
  
  // Calculate days needed from previous month
  const firstDay = getFirstDayOfMonth(year, month);
  const daysInPrevMonth = getDaysInMonth(year, month - 1);
  
  // Add days from previous month
  for (let i = firstDay - 1; i >= 0; i--) {
    const date = new Date(year, month - 1, daysInPrevMonth - i);
    const isDisabled = 
      (minDate && date < minDate) || 
      (maxDate && date > maxDate);
    
    result.push({
      date,
      day: date.getDate(),
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      isDisabled
    });
  }
  
  // Add days from current month
  const daysInMonth = getDaysInMonth(year, month);
  for (let i = 1; i <= daysInMonth; i++) {
    const date = new Date(year, month, i);
    const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
    const isDisabled = 
      (minDate && date < minDate) || 
      (maxDate && date > maxDate);
    
    const calendarDate: CalendarDate = {
      date,
      day: i,
      isCurrentMonth: true,
      isToday: isSameDay(date, today),
      isSelected,
      isDisabled
    };
    
    // Handle range selection
    if (selectedDate && rangeEndDate) {
      calendarDate.isRangeStart = isSameDay(date, selectedDate);
      calendarDate.isRangeEnd = isSameDay(date, rangeEndDate);
      calendarDate.isRangeMiddle = isDateInRange(date, selectedDate, rangeEndDate) && 
        !calendarDate.isRangeStart && !calendarDate.isRangeEnd;
    }
    
    result.push(calendarDate);
  }
  
  // Add days from next month to complete the calendar grid (6 rows × 7 columns)
  const totalDaysNeeded = 42; // 6 rows × 7 columns
  const remainingDays = totalDaysNeeded - result.length;
  
  for (let i = 1; i <= remainingDays; i++) {
    const date = new Date(year, month + 1, i);
    const isDisabled = 
      (minDate && date < minDate) || 
      (maxDate && date > maxDate);
    
    result.push({
      date,
      day: i,
      isCurrentMonth: false,
      isToday: isSameDay(date, today),
      isSelected: selectedDate ? isSameDay(date, selectedDate) : false,
      isDisabled
    });
  }
  
  return result;
};

/**
 * Generates an array of years for year selection
 * @param currentYear - Center year for the range
 * @param range - Number of years before and after current year
 * @returns Array of years
 */
export const generateYearRange = (currentYear: number, range: number = 10): number[] => {
  const years: number[] = [];
  const startYear = currentYear - range;
  const endYear = currentYear + range;
  
  for (let year = startYear; year <= endYear; year++) {
    years.push(year);
  }
  
  return years;
};

/**
 * Adds days to a date
 * @param date - Base date
 * @param days - Number of days to add
 * @returns New date with days added
 */
export const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

/**
 * Adds months to a date
 * @param date - Base date
 * @param months - Number of months to add
 * @returns New date with months added
 */
export const addMonths = (date: Date, months: number): Date => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

/**
 * Adds years to a date
 * @param date - Base date
 * @param years - Number of years to add
 * @returns New date with years added
 */
export const addYears = (date: Date, years: number): Date => {
  const result = new Date(date);
  result.setFullYear(result.getFullYear() + years);
  return result;
};