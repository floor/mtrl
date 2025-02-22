// src/core/config.js

/**
 * Library prefix used for all components
 */
export const PREFIX = 'mtrl'

export const getComponentClass = (type) => `${PREFIX}-${type}`
export const getModifierClass = (baseClass, modifier) => `${baseClass}--${modifier}`
export const getElementClass = (baseClass, element) => `${baseClass}-${element}`

/**
 * Component type identifiers
 * @enum {string}
 */
export const COMPONENTS = {
  BUTTON: 'button',
  TEXTFIELD: 'textfield',
  CONTAINER: 'container',
  SNACKBAR: 'snackbar',
  SWITCH: 'switch'
}

/**
 * Theme configuration
 * @typedef {Object} ThemeConfig
 * @property {string} name - Theme name
 * @property {Object} variables - Theme CSS variables
 * @property {Object} variants - Theme variants
 */

/**
 * Creates a component configuration object
 * @param {string} type - Component type from COMPONENT_TYPES
 * @returns {Object} Component configuration interface
 */
export const createComponentConfig = (type) => {
  const baseClass = `${PREFIX}-${type}`

  // Create the base config object
  const config = {
    prefix: PREFIX,
    type,
    baseClass,

    // Class name generators
    getClass: () => baseClass,
    getModifierClass: (modifier) => `${baseClass}--${modifier}`,
    getElementClass: (element) => `${baseClass}-${element}`,

    // Theme support
    withTheme: (theme) => ({
      ...config,
      theme,
      getThemeClass: (variant) => `${baseClass}--theme-${theme}-${variant}`
    }),

    // Variant support
    withVariants: (...variants) => ({
      ...config,
      variants,
      hasVariant: (variant) => variants.includes(variant),
      getVariantClass: (variant) =>
        variants.includes(variant) ? `${baseClass}--${variant}` : null
    }),

    // State support
    withStates: (...states) => ({
      ...config,
      states,
      getStateClass: (state) =>
        states.includes(state) ? `${baseClass}--state-${state}` : null
    })
  }

  return config
}

/**
 * Common component states
 * @enum {string}
 */
export const STATES = {
  DISABLED: 'disabled',
  FOCUSED: 'focused',
  ACTIVE: 'active',
  LOADING: 'loading',
  ERROR: 'error'
}

/**
 * CSS class generation utilities
 */
export const classNames = {
  /**
   * Creates a BEM-style class name
   * @param {string} block - Block name
   * @param {string} [element] - Element name
   * @param {string} [modifier] - Modifier name
   * @returns {string} BEM class name
   */
  bem: (block, element, modifier) => {
    let className = block
    if (element) className += `-${element}`
    if (modifier) className += `--${modifier}`
    return className
  },

  /**
   * Joins class names, filtering out falsy values
   * @param {...string} classes - Class names to join
   * @returns {string} Joined class names
   */
  join: (...classes) => classes.filter(Boolean).join(' ')
}

/**
 * Creates a themed component configuration
 * @param {string} type - Component type
 * @param {ThemeConfig} theme - Theme configuration
 */
export const createThemedComponent = (type, theme) => {
  const config = createComponentConfig(type)

  return {
    ...config,
    theme,

    // Theme-specific class generators
    getThemeClass: (variant) =>
      `${config.getClass()}--theme-${theme.name}${variant ? `-${variant}` : ''}`,

    // Theme CSS variables
    getCssVariables: () =>
      Object.entries(theme.variables).reduce((acc, [key, value]) => ({
        ...acc,
        [`--${PREFIX}-${type}-${key}`]: value
      }), {})
  }
}
