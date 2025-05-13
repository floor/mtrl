// src/core/utils/validate.ts

/**
 * Validation rule interface
 */
export interface ValidationRule {
  /**
   * Whether field is required
   */
  required?: boolean;
  
  /**
   * Expected data type
   */
  type?: string;
  
  /**
   * Minimum value for numbers
   */
  minimum?: number;
  
  /**
   * Maximum value for numbers
   */
  maximum?: number;
  
  /**
   * Regular expression pattern for strings
   */
  pattern?: string | RegExp;
  
  /**
   * Allowed values (enum)
   */
  enum?: any[];
  
  /**
   * Minimum string length
   */
  minLength?: number;
  
  /**
   * Maximum string length
   */
  maxLength?: number;
  
  /**
   * Default value
   */
  default?: any;
  
  /**
   * Custom validator function
   */
  validator?: (value: any) => boolean | string;
}

/**
 * Validation schema type
 */
export type ValidationSchema = Record<string, ValidationRule>;

/**
 * Validates configuration object against schema
 * 
 * @param config - Configuration to validate
 * @param schema - Validation schema
 * @throws Error if validation fails
 */
export const validateConfig = (
  config: Record<string, any>, 
  schema: ValidationSchema
): void => {
  const errors: string[] = [];

  Object.entries(schema).forEach(([key, rule]) => {
    // Check required fields
    if (rule.required && config[key] === undefined) {
      errors.push(`Missing required field: ${key}`);
    }

    if (config[key] !== undefined) {
      // Check type if value exists
      if (rule.type) {
        const actualType = typeof config[key];
        if (actualType !== rule.type) {
          errors.push(`Invalid type for ${key}: expected ${rule.type}, got ${actualType}`);
        }
      }

      // Check numbers
      if (typeof config[key] === 'number') {
        if (rule.minimum !== undefined && config[key] < rule.minimum) {
          errors.push(`Value for ${key} is too small: minimum is ${rule.minimum}`);
        }
        if (rule.maximum !== undefined && config[key] > rule.maximum) {
          errors.push(`Value for ${key} is too large: maximum is ${rule.maximum}`);
        }
      }

      // Check strings
      if (typeof config[key] === 'string') {
        if (rule.minLength !== undefined && config[key].length < rule.minLength) {
          errors.push(`String for ${key} is too short: minimum length is ${rule.minLength}`);
        }
        if (rule.maxLength !== undefined && config[key].length > rule.maxLength) {
          errors.push(`String for ${key} is too long: maximum length is ${rule.maxLength}`);
        }
        if (rule.pattern) {
          const pattern = rule.pattern instanceof RegExp 
            ? rule.pattern 
            : new RegExp(rule.pattern);
          
          if (!pattern.test(config[key])) {
            errors.push(`Invalid format for ${key}: must match pattern ${pattern}`);
          }
        }
      }

      // Check allowed values
      if (rule.enum) {
        if (!rule.enum.includes(config[key])) {
          errors.push(`Invalid value for ${key}. Must be one of: ${rule.enum.join(', ')}`);
        }
      }

      // Custom validator
      if (rule.validator) {
        const result = rule.validator(config[key]);
        if (result === false) {
          errors.push(`Invalid value for ${key}`);
        } else if (typeof result === 'string') {
          errors.push(result);
        }
      }
    }
  });

  if (errors.length > 0) {
    throw new Error(`Configuration validation failed:\n${errors.join('\n')}`);
  }
};

/**
 * Validates a single value against a rule
 * 
 * @param value - Value to validate
 * @param rule - Validation rule
 * @returns Validation result (true if valid, error message if invalid)
 */
export const validateValue = (
  value: any, 
  rule: ValidationRule
): true | string => {
  // Check required
  if (rule.required && value === undefined) {
    return 'Value is required';
  }

  if (value !== undefined) {
    // Check type
    if (rule.type && typeof value !== rule.type) {
      return `Expected ${rule.type}, got ${typeof value}`;
    }

    // Check numbers
    if (typeof value === 'number') {
      if (rule.minimum !== undefined && value < rule.minimum) {
        return `Value is too small: minimum is ${rule.minimum}`;
      }
      if (rule.maximum !== undefined && value > rule.maximum) {
        return `Value is too large: maximum is ${rule.maximum}`;
      }
    }

    // Check strings
    if (typeof value === 'string') {
      if (rule.minLength !== undefined && value.length < rule.minLength) {
        return `String is too short: minimum length is ${rule.minLength}`;
      }
      if (rule.maxLength !== undefined && value.length > rule.maxLength) {
        return `String is too long: maximum length is ${rule.maxLength}`;
      }
      if (rule.pattern) {
        const pattern = rule.pattern instanceof RegExp 
          ? rule.pattern 
          : new RegExp(rule.pattern);
        
        if (!pattern.test(value)) {
          return `Invalid format: must match pattern ${pattern}`;
        }
      }
    }

    // Check allowed values
    if (rule.enum && !rule.enum.includes(value)) {
      return `Invalid value. Must be one of: ${rule.enum.join(', ')}`;
    }

    // Custom validator
    if (rule.validator) {
      const result = rule.validator(value);
      if (result === false) {
        return 'Invalid value';
      } else if (typeof result === 'string') {
        return result;
      }
    }
  }

  return true;
};

/**
 * Applies default values from schema to config
 * 
 * @param config - Configuration object
 * @param schema - Validation schema with defaults
 * @returns Configuration with defaults applied
 */
export const applyDefaults = <T extends Record<string, any>>(
  config: T, 
  schema: ValidationSchema
): T => {
  const result = { ...config } as Record<string, any>;

  Object.entries(schema).forEach(([key, rule]) => {
    if (result[key] === undefined && rule.default !== undefined) {
      result[key] = rule.default;
    }
  });

  return result as T;
};