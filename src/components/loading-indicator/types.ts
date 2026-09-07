// src/components/loading-indicator/types.ts

/**
 * Configuration options for the loading indicator
 * @interface LoadingIndicatorConfig
 */
export interface LoadingIndicatorConfig {
  /** Width and height in pixels, 24 to 240 (default 48) */
  size?: number;

  /**
   * Draws the indicator on a primary-container circle, for use over other
   * content; the indicator then takes on-primary-container
   */
  contained?: boolean;

  /**
   * A value from 0 to 1 makes the indicator determinate: the shape morphs
   * with the value instead of looping. Leave unset for indeterminate.
   */
  value?: number | null;

  /** Accessible name: what is loading (default "Loading") */
  ariaLabel?: string;

  /** Additional CSS classes */
  class?: string;

  /** Component prefix for CSS classes */
  prefix?: string;

  /** Component name for CSS classes */
  componentName?: string;
}

/**
 * Loading indicator public API
 * @interface LoadingIndicatorComponent
 */
export interface LoadingIndicatorComponent {
  /** The root element */
  element: HTMLElement;

  /** The canvas the shapes are drawn on */
  canvas: HTMLCanvasElement;

  /** Sets a value from 0 to 1 (determinate) or null (indeterminate) */
  setValue: (value: number | null) => LoadingIndicatorComponent;

  /** The current value, or null when indeterminate */
  getValue: () => number | null;

  /** Sets the size in pixels, clamped to 24–240 */
  setSize: (size: number) => LoadingIndicatorComponent;

  /** The size in pixels */
  getSize: () => number;

  /** Sets the accessible name */
  setLabel: (label: string) => LoadingIndicatorComponent;

  /** Runs the indeterminate animation (it runs from creation) */
  start: () => LoadingIndicatorComponent;

  /** Freezes the indicator on its current frame */
  stop: () => LoadingIndicatorComponent;

  /** Whether the animation is running */
  isRunning: () => boolean;

  /** Stops the animation and removes the element */
  destroy: () => void;
}

/**
 * The component as it passes through the enhancers
 */
export interface BaseComponent {
  element: HTMLElement;
  getClass?: (name: string) => string;
  lifecycle?: {
    destroy?: () => void;
  };
  [key: string]: any;
}
