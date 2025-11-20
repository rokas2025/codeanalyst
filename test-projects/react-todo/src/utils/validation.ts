/**
 * Validation utilities for todo operations
 */

/**
 * Validate todo title
 * @param title - The title to validate
 * @returns True if valid, false otherwise
 */
export const isValidTitle = (title: string): boolean => {
  return title.trim().length > 0 && title.length <= 200
}

/**
 * Sanitize user input
 * @param input - Raw user input
 * @returns Sanitized string
 */
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML
    .slice(0, 200) // Max length
}

/**
 * Check if todo ID is valid UUID
 * @param id - The ID to validate
 * @returns True if valid UUID, false otherwise
 */
export const isValidId = (id: string): boolean => {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  return uuidRegex.test(id)
}

