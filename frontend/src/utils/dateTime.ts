// src/utils/dateTime.ts - Centralized date/time formatting for Nairobi timezone

/**
 * Formats date and time for Nairobi timezone
 * @param dateString - ISO date string from backend
 * @returns Formatted date and time string
 */
export const formatNairobiDateTime = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Invalid Date';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    // Format for Nairobi timezone (EAT - UTC+3)
    return date.toLocaleString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Nairobi'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Formats date only for Nairobi timezone
 * @param dateString - ISO date string from backend
 * @returns Formatted date string
 */
export const formatNairobiDate = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Invalid Date';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Date';
    
    return date.toLocaleDateString('en-KE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      timeZone: 'Africa/Nairobi'
    });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Invalid Date';
  }
};

/**
 * Formats time only for Nairobi timezone
 * @param dateString - ISO date string from backend
 * @returns Formatted time string
 */
export const formatNairobiTime = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Invalid Time';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Invalid Time';
    
    return date.toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
      timeZone: 'Africa/Nairobi'
    });
  } catch (error) {
    console.error('Error formatting time:', error);
    return 'Invalid Time';
  }
};

/**
 * Get current Nairobi time
 * @returns Current date/time in Nairobi timezone
 */
export const getCurrentNairobiTime = (): string => {
  const now = new Date();
  return formatNairobiDateTime(now.toISOString());
};

/**
 * Check if a date is today in Nairobi timezone
 * @param dateString - ISO date string to check
 * @returns True if the date is today in Nairobi timezone
 */
export const isToday = (dateString: string | undefined | null): boolean => {
  if (!dateString) return false;
  
  try {
    const date = new Date(dateString);
    const today = new Date();
    
    const dateNairobi = new Date(date.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
    const todayNairobi = new Date(today.toLocaleString('en-US', { timeZone: 'Africa/Nairobi' }));
    
    return dateNairobi.toDateString() === todayNairobi.toDateString();
  } catch (error) {
    return false;
  }
};

/**
 * Format relative time (e.g., "2 hours ago") in Nairobi timezone
 * @param dateString - ISO date string
 * @returns Relative time string
 */
export const formatRelativeTime = (dateString: string | undefined | null): string => {
  if (!dateString) return 'Unknown time';
  
  try {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return formatNairobiDate(dateString);
    }
  } catch (error) {
    return 'Unknown time';
  }
};