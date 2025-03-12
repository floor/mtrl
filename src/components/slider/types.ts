// src/components/slider/types.ts (add label and icon to SliderConfig)
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