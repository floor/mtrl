// src/core/utils/object.ts

/**
 * Checks if a value is a plain object
 * @param value - The value to check
 * @returns true if the value is a plain object
 */
export const isObject = (value: unknown): value is Record<string, unknown> => {
  return Boolean(
    value &&
    typeof value === 'object' &&
    Object.getPrototypeOf(value) === Object.getPrototypeOf({})
  );
};

/**
 * Accesses a nested property of an object using a string path
 * @param obj - The object to traverse
 * @param path - The property path (e.g. 'user.address.street')
 * @returns The value at the specified path or undefined if not found
 */
export const byString = <T extends object, R = unknown>(obj: T, path: string): R | undefined => {
  // Convert indexes to properties
  const normalizedPath = path.replace(/\[(\w+)\]/g, '.$1');
  // Strip a leading dot
  const cleanPath = normalizedPath.replace(/^\./, '');
  const keys = cleanPath.split('.');
  
  let result: unknown = obj;
  
  for (let i = 0, n = keys.length; i < n; ++i) {
    const key = keys[i];
    if (key in (result as object)) {
      result = (result as Record<string, unknown>)[key];
    } else {
      return undefined;
    }
  }
  
  return result as R;
};