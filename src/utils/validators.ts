/**
 * Validation utilities
 */

/**
 * Validates an email address
 * @param email - Email string to validate
 * @returns true if valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

/**
 * Validates a password (minimum 8 characters)
 * @param password - Password string to validate
 * @returns true if valid, false otherwise
 */
export const isValidPassword = (password: string): boolean => {
  return password.length >= 8;
};

/**
 * Validates that a value is not empty
 * @param value - Value to check
 * @returns true if not empty, false otherwise
 */
export const isNotEmpty = (value: string | null | undefined): boolean => {
  return value !== null && value !== undefined && value.trim().length > 0;
};

/**
 * Validates a phone number (basic validation)
 * @param phone - Phone number string
 * @returns true if valid, false otherwise
 */
export const isValidPhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
};

