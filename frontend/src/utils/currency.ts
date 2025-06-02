// src/utils/currency.ts
// Currency formatting utilities to prevent toFixed() errors

/**
 * Safely formats a number as currency with 2 decimal places
 * @param value - The numeric value to format
 * @param defaultValue - Default value if input is invalid (default: 0)
 * @returns Formatted string with 2 decimal places
 */
export const formatCurrency = (value: number | string | undefined | null, defaultValue: number = 0): string => {
  // Handle null, undefined, empty string
  if (value === null || value === undefined || value === '') {
    return defaultValue.toFixed(2);
  }
  
  // Convert to number
  const numValue = Number(value);
  
  // Handle NaN or invalid numbers
  if (isNaN(numValue)) {
    return defaultValue.toFixed(2);
  }
  
  return numValue.toFixed(2);
};

/**
 * Safely converts any value to a number
 * @param value - The value to convert
 * @param defaultValue - Default value if conversion fails (default: 0)
 * @returns Safe numeric value
 */
export const safeNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined || value === '') {
    return defaultValue;
  }
  
  const numValue = Number(value);
  return isNaN(numValue) ? defaultValue : numValue;
};

/**
 * Formats currency with KES prefix
 * @param value - The numeric value to format
 * @param defaultValue - Default value if input is invalid (default: 0)
 * @returns Formatted string like "KES 1,234.56"
 */
export const formatKES = (value: number | string | undefined | null, defaultValue: number = 0): string => {
  const formattedValue = formatCurrency(value, defaultValue);
  const numericValue = parseFloat(formattedValue);
  
  // Add thousand separators
  return `KES ${numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
};

/**
 * Validates and sanitizes financial data object
 * @param data - Object containing financial fields
 * @param fields - Array of field names to sanitize
 * @returns Sanitized object with safe numeric values
 */
export const sanitizeFinancialData = <T extends Record<string, any>>(
  data: T, 
  fields: (keyof T)[]
): T => {
  const sanitized = { ...data };
  
  fields.forEach(field => {
    if (field in sanitized) {
      sanitized[field] = safeNumber(sanitized[field]) as T[keyof T];
    }
  });
  
  return sanitized;
};

/**
 * Validates a sale object to ensure all numeric fields are safe
 * @param sale - Sale object to validate
 * @returns Sanitized sale object
 */
export const sanitizeSaleData = (sale: any) => {
  if (!sale) return sale;
  
  return {
    ...sale,
    total_amount: safeNumber(sale.total_amount),
    items_count: safeNumber(sale.items_count),
    items: sale.items ? sale.items.map((item: any) => ({
      ...item,
      quantity: safeNumber(item.quantity),
      unit_price: safeNumber(item.unit_price),
      subtotal: safeNumber(item.subtotal),
    })) : []
  };
};

/**
 * Calculate percentage safely
 * @param value - Current value
 * @param total - Total value
 * @returns Percentage as number (0-100)
 */
export const calculatePercentage = (value: number | undefined | null, total: number | undefined | null): number => {
  const safeValue = safeNumber(value);
  const safeTotal = safeNumber(total);
  
  if (safeTotal === 0) return 0;
  return (safeValue / safeTotal) * 100;
};

/**
 * Format percentage with % symbol
 * @param value - Current value  
 * @param total - Total value
 * @param decimals - Number of decimal places (default: 1)
 * @returns Formatted percentage string like "12.5%"
 */
export const formatPercentage = (
  value: number | undefined | null, 
  total: number | undefined | null, 
  decimals: number = 1
): string => {
  const percentage = calculatePercentage(value, total);
  return `${percentage.toFixed(decimals)}%`;
};