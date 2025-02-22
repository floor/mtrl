// src/core/utils/validate.js

/**
 * Validates configuration object against schema
 * @param {Object} config - Configuration to validate
 * @param {Object} schema - Validation schema
 * @throws {Error} If validation fails
 */
export const validateConfig = (config, schema) => {
  const errors = []

  Object.entries(schema).forEach(([key, rule]) => {
    // Check required fields
    if (rule.required && !config[key]) {
      errors.push(`Missing required field: ${key}`)
    }

    // Check type if value exists
    if (config[key] !== undefined && rule.type) {
      const type = typeof config[key]
      if (type !== rule.type) {
        errors.push(`Invalid type for ${key}: expected ${rule.type}, got ${type}`)
      }
    }

    // Check allowed values if specified
    if (config[key] !== undefined && rule.enum) {
      if (!rule.enum.includes(config[key])) {
        errors.push(`Invalid value for ${key}. Must be one of: ${rule.enum.join(', ')}`)
      }
    }
  })

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`)
  }
}
