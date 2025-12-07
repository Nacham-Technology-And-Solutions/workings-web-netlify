/**
 * Calculation utilities
 */

/**
 * Calculates the total from an array of items with quantity and unitPrice
 * @param items - Array of items with quantity and unitPrice
 * @returns Total amount
 */
export const calculateTotal = (
  items: Array<{ quantity: number; unitPrice: number }>
): number => {
  return items.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0);
};

/**
 * Calculates percentage of a number
 * @param value - The base value
 * @param percentage - The percentage to calculate
 * @returns The calculated percentage value
 */
export const calculatePercentage = (value: number, percentage: number): number => {
  return (value * percentage) / 100;
};

/**
 * Calculates the distance between two points
 * @param point1 - First point with x and y coordinates
 * @param point2 - Second point with x and y coordinates
 * @returns Distance between the two points
 */
export const calculateDistance = (
  point1: { x: number; y: number },
  point2: { x: number; y: number }
): number => {
  const dx = point2.x - point1.x;
  const dy = point2.y - point1.y;
  return Math.sqrt(dx * dx + dy * dy);
};

/**
 * Rounds a number to specified decimal places
 * @param num - Number to round
 * @param decimals - Number of decimal places (default: 2)
 * @returns Rounded number
 */
export const roundToDecimals = (num: number, decimals: number = 2): number => {
  return Math.round(num * Math.pow(10, decimals)) / Math.pow(10, decimals);
};

