import { isValid, isPast, isFuture, parseISO, isDate } from 'date-fns';

export interface DateValidationResult {
  isValid: boolean;
  isPastDate: boolean;
  error?: string;
  warning?: string;
}

/**
 * Validates a date string or Date object
 * @param date - Date string (ISO format) or Date object
 * @returns DateValidationResult with validation status and messages
 */
export function validateDate(date: string | Date | null | undefined): DateValidationResult {
  // Check if date is provided
  if (!date) {
    return {
      isValid: false,
      isPastDate: false,
      error: 'Date is required',
    };
  }

  let dateObj: Date;

  // Parse string to Date if needed
  if (typeof date === 'string') {
    try {
      dateObj = parseISO(date);
    } catch (error) {
      return {
        isValid: false,
        isPastDate: false,
        error: 'Invalid date format. Please use a valid date.',
      };
    }
  } else if (isDate(date)) {
    dateObj = date;
  } else {
    return {
      isValid: false,
      isPastDate: false,
      error: 'Invalid date type',
    };
  }

  // Check if date is valid
  if (!isValid(dateObj)) {
    return {
      isValid: false,
      isPastDate: false,
      error: 'Invalid date. Please enter a valid date.',
    };
  }

  // Check if date is in the past - NOT ALLOWED
  const now = new Date();
  const isPastDate = isPast(dateObj) && dateObj.getTime() < now.getTime();

  if (isPastDate) {
    return {
      isValid: false,
      isPastDate: true,
      error: 'Cannot schedule for a past date. Please select a future date.',
    };
  }

  return {
    isValid: true,
    isPastDate: false,
  };
}

/**
 * Validates a date range
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Validation result
 */
export function validateDateRange(
  startDate: string | Date | null | undefined,
  endDate: string | Date | null | undefined
): DateValidationResult {
  const startValidation = validateDate(startDate);
  if (!startValidation.isValid) {
    return {
      ...startValidation,
      error: `Start date: ${startValidation.error}`,
    };
  }

  const endValidation = validateDate(endDate);
  if (!endValidation.isValid) {
    return {
      ...endValidation,
      error: `End date: ${endValidation.error}`,
    };
  }

  // Parse dates for comparison
  const start = typeof startDate === 'string' ? parseISO(startDate) : startDate as Date;
  const end = typeof endDate === 'string' ? parseISO(endDate) : endDate as Date;

  // Check if end date is after start date
  if (end <= start) {
    return {
      isValid: false,
      isPastDate: false,
      error: 'End date must be after start date',
    };
  }

  return {
    isValid: true,
    isPastDate: startValidation.isPastDate || endValidation.isPastDate,
    warning: startValidation.warning || endValidation.warning,
  };
}

/**
 * Validates date format (ISO 8601)
 * @param dateString - Date string to validate
 * @returns true if format is valid
 */
export function isValidDateFormat(dateString: string): boolean {
  if (!dateString || typeof dateString !== 'string') {
    return false;
  }

  // Check ISO 8601 format
  const isoRegex = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}:\d{2}(\.\d{3})?Z?)?$/;
  if (!isoRegex.test(dateString)) {
    return false;
  }

  // Try to parse and validate
  try {
    const date = parseISO(dateString);
    return isValid(date);
  } catch {
    return false;
  }
}

/**
 * Sanitizes and validates date input before sending to server
 * @param date - Date to sanitize
 * @returns Sanitized date string or null if invalid
 */
export function sanitizeDateForServer(date: string | Date | null | undefined): string | null {
  const validation = validateDate(date);
  
  if (!validation.isValid) {
    return null;
  }

  const dateObj = typeof date === 'string' ? parseISO(date) : date as Date;
  return dateObj.toISOString();
}
