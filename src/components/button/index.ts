// src/components/button/index.ts
export { default } from './button'
export { ButtonConfig, ButtonComponent, ButtonVariant } from './types'

// Export common button variants for convenience
export const BUTTON_VARIANTS = {
  FILLED: 'filled',
  TONAL: 'tonal',
  OUTLINED: 'outlined',
  ELEVATED: 'elevated',
  TEXT: 'text'
} as const;