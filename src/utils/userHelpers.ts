/**
 * Utility functions for user-related operations
 */

/**
 * Generate user initials from a name
 * @param name - User's full name
 * @returns Initials (e.g., "John Doe" -> "JD", "John" -> "J")
 */
export const getUserInitials = (name?: string): string => {
  if (!name || name.trim().length === 0) {
    return 'U'; // Default to 'U' for User
  }

  const parts = name.trim().split(/\s+/);
  
  if (parts.length === 1) {
    // Single name - return first letter
    return parts[0].charAt(0).toUpperCase();
  }
  
  // Multiple names - return first letter of first and last name
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
};

/**
 * Get display name from user profile
 * @param name - User's name
 * @param email - User's email (fallback)
 * @returns Display name or email
 */
export const getDisplayName = (name?: string, email?: string): string => {
  if (name && name.trim().length > 0) {
    return name.trim();
  }
  if (email) {
    return email;
  }
  return 'User';
};

