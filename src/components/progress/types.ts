// src/components/progress/types.ts
import { PROGRESS_VARIANTS } from './constants';

/**
 * Configuration interface for the Progress component
 */
export interface ProgressConfig {
  /** Progress variant (linear, circular) */
  variant?: keyof typeof PROGRESS_VARIANTS | string;
  
  /** Initial progress value (0-100) */
  value?: number;
  
  /** Whether the progress indicator is initially disabled */
  disabled?: boolean;
  
  /** Maximum value (defaults to 100) */
  max?: number;
  
  /** Custom buffer value for linear progress */
  buffer?: number;
  
  /** Additional CSS classes */
  class?: string;
  
  /** Whether to show text label with percentage */
  showLabel?: boolean;
  
  /** Whether progress is indeterminate */
  indeterminate?: boolean;
  
  /** Custom label format function */
  labelFormatter?: (value: number, max: number) => string;
}

/**
 * Progress component interface
 */
export interface ProgressComponent {
  /** The component's root element */
  element: HTMLElement;
  
  /** The track element */
  trackElement: HTMLElement;
  
  /** The indicator element */
  indicatorElement: HTMLElement;
  
  /** The buffer element (for linear variant) */
  bufferElement?: HTMLElement;
  
  /** The label element (if enabled) */
  labelElement?: HTMLElement;
  
  /** Sets the current progress value */
  setValue: (value: number) => ProgressComponent;
  
  /** Gets the current progress value */
  getValue: () => number;
  
  /** Sets the buffer value (for linear variant) */
  setBuffer: (value: number) => ProgressComponent;
  
  /** Gets the current buffer value */
  getBuffer: () => number;
  
  /** Enables the progress component */
  enable: () => ProgressComponent;
  
  /** Disables the progress component */
  disable: () => ProgressComponent;
  
  /** Checks if the component is disabled */
  isDisabled: () => boolean;
  
  /** Shows the label */
  showLabel: () => ProgressComponent;
  
  /** Hides the label */
  hideLabel: () => ProgressComponent;
  
  /** Sets a custom formatter for the label */
  setLabelFormatter: (formatter: (value: number, max: number) => string) => ProgressComponent;
  
  /** Sets the indeterminate state */
  setIndeterminate: (indeterminate: boolean) => ProgressComponent;
  
  /** Checks if the component is indeterminate */
  isIndeterminate: () => boolean;
  
  /** Adds event listener */
  on: (event: string, handler: Function) => ProgressComponent;
  
  /** Removes event listener */
  off: (event: string, handler: Function) => ProgressComponent;
  
  /** Destroys the component and cleans up resources */
  destroy: () => void;
  
  /** Add CSS classes */
  addClass: (...classes: string[]) => ProgressComponent;
}