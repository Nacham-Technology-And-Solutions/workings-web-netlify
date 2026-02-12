/**
 * Unit Conversion Utility
 * Converts various units to millimeters (mm) for API compatibility
 */

export type Unit = 'mm' | 'cm' | 'm' | 'ft' | 'in';

/**
 * Converts a value from the given unit to millimeters
 */
export function convertToMillimeters(value: number, unit: Unit): number {
  const conversions: Record<Unit, number> = {
    mm: 1,
    cm: 10,
    m: 1000,
    ft: 304.8,
    in: 25.4,
  };

  return value * conversions[unit];
}

/**
 * Converts a string value to millimeters
 * Handles parsing and conversion in one step
 */
export function convertStringToMillimeters(value: string, unit: Unit): number {
  const numValue = parseFloat(value) || 0;
  return convertToMillimeters(numValue, unit);
}

