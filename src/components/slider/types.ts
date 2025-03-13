// src/components/slider/types.ts
import { SLIDER_COLORS, SLIDER_SIZES, SLIDER_EVENTS } from './constants';

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
  
  /** Whether to show tick marks */
  ticks?: boolean;
  
  /** Format function for displayed values */
  valueFormatter?: (value: number) => string;
  
  /** Whether to show the current value while dragging */
  showValue?: boolean;
  
  /** Whether to snap to steps while dragging (discrete slider) */
  snapToSteps?: boolean;
  
  /** Whether the slider is a range slider (two thumbs) */
  range?: boolean;
  
  /** Label text for the slider */
  label?: string;
  
  /** Position of the label (start or end) - defaults to 'start' */
  labelPosition?: 'start' | 'end';
  
  /** Icon to display with the slider */
  icon?: string;
  
  /** Position of the icon (start or end) */
  iconPosition?: 'start' | 'end';
  
  /** Additional CSS classes */
  class?: string;
  
  /** Event handlers for slider events */
  on?: {
    [key in keyof typeof SLIDER_EVENTS | typeof SLIDER_EVENTS[keyof typeof SLIDER_EVENTS]]?: (event: SliderEvent) => void;
  };
}

export interface SliderEvent {
  /** The slider component that triggered the event */
  slider: any;
  
  /** Current slider value */
  value: number;
  
  /** Secondary value (for range sliders) */
  secondValue: number | null;
  
  /** Original DOM event if available */
  originalEvent: Event | null;
  
  /** Function to prevent default behavior */
  preventDefault: () => void;
  
  /** Whether default behavior was prevented */
  defaultPrevented: boolean;
}

export interface SliderComponent {
  /** The root element of the slider */
  element: HTMLElement;
  
  /** Sets slider value */
  setValue: (value: number, triggerEvent?: boolean) => SliderComponent;
  
  /** Gets slider value */
  getValue: () => number;
  
  /** Sets secondary slider value (for range slider) */
  setSecondValue: (value: number, triggerEvent?: boolean) => SliderComponent;
  
  /** Gets secondary slider value */
  getSecondValue: () => number | null;
  
  /** Sets slider minimum value */
  setMin: (min: number) => SliderComponent;
  
  /** Gets slider minimum value */
  getMin: () => number;
  
  /** Sets slider maximum value */
  setMax: (max: number) => SliderComponent;
  
  /** Gets slider maximum value */
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
  
  /** Shows or hides tick marks */
  showTicks: (show: boolean) => SliderComponent;
  
  /** Shows or hides current value while dragging */
  showCurrentValue: (show: boolean) => SliderComponent;
  
  /** Sets label text */
  setLabel: (text: string) => SliderComponent;
  
  /** Gets label text */
  getLabel: () => string;
  
  /** Sets icon HTML */
  setIcon: (iconHtml: string) => SliderComponent;
  
  /** Gets icon HTML */
  getIcon: () => string;
  
  /** Adds event listener */
  on: (event: keyof typeof SLIDER_EVENTS | typeof SLIDER_EVENTS[keyof typeof SLIDER_EVENTS], handler: (event: SliderEvent) => void) => SliderComponent;
  
  /** Removes event listener */
  off: (event: keyof typeof SLIDER_EVENTS | typeof SLIDER_EVENTS[keyof typeof SLIDER_EVENTS], handler: (event: SliderEvent) => void) => SliderComponent;
  
  /** Destroys the slider component and cleans up resources */
  destroy: () => void;
}