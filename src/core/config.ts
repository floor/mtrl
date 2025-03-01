// src/core/config.ts

/**
 * Library prefix used for all components
 */
export const PREFIX = 'mtrl';

/**
 * Gets a prefixed component class name
 * @param type - Component type
 * @returns Prefixed class name
 */
export const getComponentClass = (type: string): string => `${PREFIX}-${type}`;

/**
 * Gets a BEM modifier class name
 * @param baseClass - Base class name
 * @param modifier - Modifier name
 * @returns Modifier class name
 */
export const getModifierClass = (baseClass: string, modifier: string): string => `${baseClass}--${modifier}`;

/**
 * Gets a BEM element class name
 * @param baseClass - Base class name
 * @param element - Element name
 * @returns Element class name
 */
export const getElementClass = (baseClass: string, element: string): string => `${baseClass}-${element}`;

/**
 * Component type identifiers
 */
export enum COMPONENTS {
  BUTTON = 'button',
  TEXTFIELD = 'textfield',
  CONTAINER = 'container',
  SNACKBAR = 'snackbar',
  SWITCH = 'switch'
}

/**
 * Theme configuration interface
 */
export interface ThemeConfig {
  /**
   * Theme name
   */
  name: string;
  
  /**
   * Theme CSS variables
   */
  variables: Record<string, string>;
  
  /**
   * Theme variants
   */
  variants: Record<string, any>;
}

/**
 * Component configuration interface
 */
export interface ComponentConfig {
  prefix: string;
  type: string;
  baseClass: string;
  getClass: () => string;
  getModifierClass: (modifier: string) => string;
  getElementClass: (element: string) => string;
  withTheme: (theme: string) => ThemedComponentConfig;
  withVariants: (...variants: string[]) => VariantComponentConfig;
  withStates: (...states: string[]) => StateComponentConfig;
}

/**
 * Themed component configuration interface
 */
export interface ThemedComponentConfig extends ComponentConfig {
  theme: string;
  getThemeClass: (variant: string) => string;
}

/**
 * Variant component configuration interface
 */
export interface VariantComponentConfig extends ComponentConfig {
  variants: string[];
  hasVariant: (variant: string) => boolean;
  getVariantClass: (variant: string) => string | null;
}

/**
 * State component configuration interface
 */
export interface StateComponentConfig extends ComponentConfig {
  states: string[];
  getStateClass: (state: string) => string | null;
}

/**
 * Creates a component configuration object
 * @param type - Component type
 * @returns Component configuration interface
 */
export const createComponentConfig = (type: string): ComponentConfig => {
  const baseClass = `${PREFIX}-${type}`;

  // Create the base config object
  const config: ComponentConfig = {
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
  };

  return config;
};

/**
 * Common component states
 */
export enum STATES {
  DISABLED = 'disabled',
  FOCUSED = 'focused',
  ACTIVE = 'active',
  LOADING = 'loading',
  ERROR = 'error'
}

/**
 * CSS class generation utilities
 */
export const classNames = {
  /**
   * Creates a BEM-style class name
   * @param block - Block name
   * @param element - Element name
   * @param modifier - Modifier name
   * @returns BEM class name
   */
  bem: (block: string, element?: string, modifier?: string): string => {
    let className = block;
    if (element) className += `-${element}`;
    if (modifier) className += `--${modifier}`;
    return className;
  },

  /**
   * Joins class names, filtering out falsy values
   * @param classes - Class names to join
   * @returns Joined class names
   */
  join: (...classes: (string | undefined | null | false)[]): string => 
    classes.filter(Boolean).join(' ')
};

/**
 * Creates a themed component configuration
 * @param type - Component type
 * @param theme - Theme configuration
 * @returns Themed component configuration
 */
export const createThemedComponent = (type: string, theme: ThemeConfig): ThemedComponentConfig => {
  const config = createComponentConfig(type);

  return {
    ...config,
    theme: theme.name,

    // Theme-specific class generators
    getThemeClass: (variant) =>
      `${config.getClass()}--theme-${theme.name}${variant ? `-${variant}` : ''}`,

    // Theme CSS variables
    getCssVariables: () =>
      Object.entries(theme.variables).reduce((acc, [key, value]) => ({
        ...acc,
        [`--${PREFIX}-${type}-${key}`]: value
      }), {} as Record<string, string>)
  };
};