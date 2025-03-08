// src/components/slider/types.ts
import { SLIDER_COLORS, SLIDER_SIZES, SLIDER_ORIENTATIONS, SLIDER_EVENTS } from './constants';

/**
 * Configuration interface for the Slider component
 */
export interface SliderConfig {
  /** Minimum value of the slider */
  min?: number;
  
  /** Maximum value of the slider */
  max?: number;
  
  /** Current value of the slider */
  value?: number;
  
  /** Secondary value for range slider (when using two thumbs) */
  secondValue?: number;
  
  /** Step size for discrete slider */
  step?: number;
  
  /** Whether the slider is disabled */
  disabled?: boolean;
  
  /** Color variant of the slider */
  color?: keyof typeof SLIDER_COLORS | typeof SLIDER_COLORS[keyof typeof SLIDER_COLORS];
  
  /** Size variant of the slider */
  size?: keyof typeof SLIDER_SIZES | typeof SLIDER_SIZES[keyof typeof SLIDER_SIZES];
  
  /** Orientation of the slider */
  orientation?: keyof typeof SLIDER_ORIENTATIONS | typeof SLIDER_ORIENTATIONS[keyof typeof SLIDER_ORIENTATIONS];
  
  /** Whether to show tick marks */
  ticks?: boolean;
  
  /** Whether to show tick labels */
  tickLabels?: boolean | string[];
  
  /** Whether to show the current value while dragging */
  showValue?: boolean;
  
  /** Format function for displayed values */
  valueFormatter?: (value: number) => string;
  
  /** Whether to snap to steps while dragging (discrete slider) */
  snapToSteps?: boolean;
  
  /** Whether the slider is a range slider (two thumbs) */
  range?: boolean;
  
  /** Additional CSS classes */
  class?: string;
  
  /** Event handlers for slider events */
  on?: {
    [key in keyof typeof SLIDER_EVENTS | typeof SLIDER_EVENTS[keyof typeof SLIDER_EVENTS]]?: (event: SliderEvent) => void;
  };
}

/**
 * Slider event object
 */
export interface SliderEvent {
  /** Slider component instance */
  slider: SliderComponent;
  
  /** Current slider value */
  value: number;
  
  /** Secondary slider value (for range slider) */
  secondValue?: number;
  
  /** Original event if applicable */
  originalEvent?: Event;
  
  /** Whether to prevent the default action */
  preventDefault: () => void;
  
  /** Whether default action was prevented */
  defaultPrevented: boolean;
}

/**
 * Slider component interface
 */
export interface SliderComponent {
  /** Slider element */
  element: HTMLElement;
  
  /** Sets slider value */
  setValue: (value: number, triggerEvent?: boolean) => SliderComponent;
  
  /** Gets slider value */
  getValue: () => number;
  
  /** Sets secondary slider value (for range slider) */
  setSecondValue: (value: number, triggerEvent?: boolean) => SliderComponent;
  
  /** Gets secondary slider value */
  getSecondValue: () => number | null;
  
  /** Sets slider minimum */
  setMin: (min: number) => SliderComponent;
  
  /** Gets slider minimum */
  getMin: () => number;
  
  /** Sets slider maximum */
  setMax: (max: number) => SliderComponent;
  
  /** Gets slider maximum */
  getMax: () => number;
  
  /** Sets slider step size */
  setStep: (step: number) => SliderComponent;
  
  /** Gets slider step size */
  getStep: () => number;
  
  /** Enables the slider */
  enable: () => SliderComponent;
  
  /** Disables the slider */
  disable: () => SliderComponent;
  
  /** Checks if slider is disabled */
  isDisabled: () => boolean;
  
  /** Sets slider color */
  setColor: (color: keyof typeof SLIDER_COLORS | typeof SLIDER_COLORS[keyof typeof SLIDER_COLORS]) => SliderComponent;
  
  /** Gets slider color */
  getColor: () => string;
  
  /** Sets slider size */
  setSize: (size: keyof typeof SLIDER_SIZES | typeof SLIDER_SIZES[keyof typeof SLIDER_SIZES]) => SliderComponent;
  
  /** Gets slider size */
  getSize: () => string;
  
  /** Sets slider orientation */
  setOrientation: (orientation: keyof typeof SLIDER_ORIENTATIONS | typeof SLIDER_ORIENTATIONS[keyof typeof SLIDER_ORIENTATIONS]) => SliderComponent;
  
  /** Gets slider orientation */
  getOrientation: () => string;
  
  /** Shows or hides tick marks */
  showTicks: (show: boolean) => SliderComponent;
  
  /** Shows or hides tick labels */
  showTickLabels: (show: boolean | string[]) => SliderComponent;
  
  /** Shows or hides current value while dragging */
  showCurrentValue: (show: boolean) => SliderComponent;
  
  /** Adds event listener */
  on: (event: keyof typeof SLIDER_EVENTS | typeof SLIDER_EVENTS[keyof typeof SLIDER_EVENTS], handler: (event: SliderEvent) => void) => SliderComponent;
  
  /** Removes event listener */
  off: (event: keyof typeof SLIDER_EVENTS | typeof SLIDER_EVENTS[keyof typeof SLIDER_EVENTS], handler: (event: SliderEvent) => void) => SliderComponent;
  
  /** Destroys the slider component and cleans up resources */
  destroy: () => void;
}