/**
 * Normalizes class names input by handling various formats:
 * - String with space-separated classes
 * - Array of strings
 * - Mixed array of strings and space-separated classes
 * @param {...(string|string[])} classes - Classes to normalize
 * @returns {string[]} Array of unique, non-empty class names
 */
export const normalizeClasses = (...classes) => {
  return [...new Set(
    classes
      .flat()
      .reduce((acc, cls) => {
        if (typeof cls === 'string') {
          // Split space-separated classes and add them individually
          acc.push(...cls.split(/\s+/))
        }
        return acc
      }, [])
      .filter(Boolean) // Remove empty strings
  )]
}
