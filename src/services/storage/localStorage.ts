/**
 * LocalStorage service utilities
 * Provides type-safe localStorage operations
 */

/**
 * Get an item from localStorage
 * @param key - Storage key
 * @returns Parsed value or null if not found
 */
export const getStorageItem = <T>(key: string): T | null => {
  try {
    const item = localStorage.getItem(key);
    if (item === null) return null;
    return JSON.parse(item) as T;
  } catch (error) {
    console.error(`Error reading from localStorage key "${key}":`, error);
    return null;
  }
};

/**
 * Set an item in localStorage
 * @param key - Storage key
 * @param value - Value to store (will be JSON stringified)
 */
export const setStorageItem = <T>(key: string, value: T): void => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error(`Error writing to localStorage key "${key}":`, error);
  }
};

/**
 * Remove an item from localStorage
 * @param key - Storage key
 */
export const removeStorageItem = (key: string): void => {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.error(`Error removing from localStorage key "${key}":`, error);
  }
};

/**
 * Clear all items from localStorage
 */
export const clearStorage = (): void => {
  try {
    localStorage.clear();
  } catch (error) {
    console.error('Error clearing localStorage:', error);
  }
};

/**
 * Storage keys used in the application
 */
export const STORAGE_KEYS = {
  ONBOARDING_SHOWN: 'onboardingShown',
  AUTHENTICATED: 'isAuthenticated',
  USER_DATA: 'userData',
  PROJECTS: 'projects',
  QUOTES: 'quotes',
  MATERIAL_LISTS: 'materialLists',
} as const;

