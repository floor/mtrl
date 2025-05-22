// src/components/progress/api.ts - Clean API using CSS custom properties

import { ProgressComponent, ProgressThickness } from './types';
import { 
  PROGRESS_CLASSES, 
  PROGRESS_EVENTS,
  PROGRESS_MEASUREMENTS,
  PROGRESS_THICKNESS
} from './constants';
import { addClass, removeClass } from '../../core/dom';

/**
 * API configuration options for progress component
 */
interface ApiOptions {
  value: {
    getValue: () => number;
    setValue: (value: number) => void;
    getMax: () => number;
  };
  buffer: {
    getBuffer: () => number;
    setBuffer: (value: number) => void;
  };
  disabled: {
    enable: () => void;
    disable: () => void;
    isDisabled: () => boolean;
  };
  label: {
    show?: () => void;
    hide?: () => void;
    format?: (formatter: (value: number, max: number) => string) => void;
    formatter?: (value: number, max: number) => string;
  };
  thickness?: {
    getThickness: () => number;
    setThickness: (thickness: ProgressThickness) => void;
  };
  state: {
    setIndeterminate: (indeterminate: boolean) => void;
    isIndeterminate: () => boolean;
  };
  stopIndicator?: {
    show: () => void;
    hide: () => void;
  };
  lifecycle: {
    destroy: () => void;
  };
}

/**
 * Enhances a progress component with a streamlined API
 */
export const withAPI = (options: ApiOptions) => (comp: any): ProgressComponent => {
  // Get element references
  const { element, getClass } = comp;
  const indicator = comp.indicator || comp.components?.indicator as HTMLElement;
  const track = comp.track || comp.components?.track as HTMLElement;
  const buffer = comp.buffer || comp.components?.buffer as HTMLElement | undefined;
  
  // Determine variant once
  const isCircular = element.classList.contains(getClass(PROGRESS_CLASSES.CIRCULAR));
  
  // Create event emitter helper
  const emitEvent = (name: string, detail: Record<string, any>): void => {
    element.dispatchEvent(new CustomEvent(name, { detail }));
  };
  
  // NEW: Clean linear progress update using CSS custom properties
  const updateLinearProgress = (percentage: number, max: number): void => {
    if (!element) return;
    
    // Calculate buffer percentage
    const bufferPercentage = (options.buffer.getBuffer() / max) * 100;
    
    // Update CSS custom properties - let CSS handle the positioning
    element.style.setProperty('--progress-value', `${percentage}%`);
    element.style.setProperty('--progress-track', `100-${percentage}%`);
    element.style.setProperty('--progress-buffer', `${bufferPercentage}%`);
    
    // Add state classes for CSS to handle special cases
    element.classList.toggle(`${getClass(PROGRESS_CLASSES.CONTAINER)}--zero`, percentage <= 0.1);
    element.classList.toggle(`${getClass(PROGRESS_CLASSES.CONTAINER)}--complete`, percentage >= 99.9);
    element.classList.toggle(`${getClass(PROGRESS_CLASSES.CONTAINER)}--has-buffer`, bufferPercentage > percentage);
  };
  
  // Keep existing circular progress update (SVG-based)
  const updateCircularProgress = (percentage: number, max: number): void => {
    // Only run if we have SVG elements
    const svgIndicator = comp.indicator || comp.components?.indicator as SVGElement;
    const svgTrack = comp.track || comp.components?.track as SVGElement;
    
    if (!svgIndicator || !svgTrack) return;
    
    // Get circle dimensions
    const radius = parseFloat(svgIndicator.getAttribute('r') || '0');
    const circumference = 2 * Math.PI * radius;
    
    // Calculate gap angle based on thickness
    const strokeWidth = parseFloat(svgIndicator.getAttribute('stroke-width') || '6');
    const baseGapAngle = PROGRESS_MEASUREMENTS.CIRCULAR.GAP_ANGLE;
    const gapMultiplier = PROGRESS_MEASUREMENTS.CIRCULAR.GAP_MULTIPLIER;
    const thicknessRatio = strokeWidth / PROGRESS_THICKNESS.DEFAULT;
    const gapAngle = baseGapAngle * (1 + (thicknessRatio - 1) * gapMultiplier);
    const gapLength = (gapAngle / 360) * circumference;
    const availableLength = circumference - gapLength;
    const adjustedFillAmount = (percentage / 100) * availableLength;
    const filledPercentageAngle = (adjustedFillAmount / circumference) * 360;
    const halfGapAngle = gapAngle / 2;
    const trackRotation = filledPercentageAngle + halfGapAngle;

    let indicatorLength = `${adjustedFillAmount} ${circumference - adjustedFillAmount}`;
    if (percentage >= 100) {
      indicatorLength = `${circumference}`;
    }

    // Update SVG elements
    svgIndicator.setAttribute('stroke-dasharray', indicatorLength);
    svgIndicator.setAttribute('stroke-dashoffset', '0');
    svgIndicator.style.transform = 'rotate(0deg)';
    
    if (svgTrack) {
      if (percentage >= 98) {
        svgTrack.style.display = 'none';
      } else {
        const trackLength = availableLength - adjustedFillAmount;
        svgTrack.setAttribute('stroke-dasharray', `${trackLength} ${circumference}`);
        svgTrack.setAttribute('stroke-dashoffset', '0');
        svgTrack.style.transform = `rotate(${trackRotation}deg)`;
        svgTrack.style.display = '';
      }
    }
  };
  
  // Combined update function
  const updateProgress = (value: number, max: number): void => {
    // Skip if in indeterminate state
    if (options.state.isIndeterminate()) return;
    
    const percentage = (value / max) * 100;
    
    // Delegate to appropriate update method
    isCircular 
      ? updateCircularProgress(percentage, max) 
      : updateLinearProgress(percentage, max);
    
    // Update ARIA attribute
    element.setAttribute('aria-valuenow', value.toString());
    
    // Update label if present
    const label = comp.label || comp.components?.label;
    if (label) {
      const formatter = options.label.formatter || 
        ((v: number, m: number) => `${Math.round((v / m) * 100)}%`);
      label.textContent = formatter(value, max);
    }
  };

  const getThickness = (): number => {
    if (options.thickness && typeof options.thickness.getThickness === 'function') {
      return options.thickness.getThickness();
    }
    return PROGRESS_MEASUREMENTS.COMMON.STROKE_WIDTH;
  };

  const setThickness = (thickness: ProgressThickness): ProgressComponent => {
    if (options.thickness && typeof options.thickness.setThickness === 'function') {
      options.thickness.setThickness(thickness);
      
      let thicknessValue: number;
      
      if (thickness === 'thin') {
        thicknessValue = PROGRESS_THICKNESS.THIN;
      } else if (thickness === 'thick') {
        thicknessValue = PROGRESS_THICKNESS.THICK;
      } else if (thickness === 'default') {
        thicknessValue = PROGRESS_THICKNESS.DEFAULT;
      } else {
        thicknessValue = thickness as number;
      }
      
      if (isCircular && indicator instanceof SVGElement) {

        

        const svgSize = PROGRESS_MEASUREMENTS.CIRCULAR.SIZE;
        const centerPoint = svgSize / 2;
        const newRadius = centerPoint - thicknessValue / 2;
        
        indicator.setAttribute('r', newRadius.toString());
        if (track instanceof SVGElement) {
          track.setAttribute('r', newRadius.toString());
        }
        
        // Recalculate dimensions and update the display
        if (!options.state.isIndeterminate()) {
          updateProgress(options.value.getValue(), options.value.getMax());
        }

          indicator.setAttribute('stroke-width', thicknessValue.toString());    
          track.setAttribute('stroke-width', thicknessValue.toString());

          if (buffer) {
            buffer.setAttribute('stroke-width', thicknessValue.toString());
          }
        

      } else {
        // Update CSS custom property for linear progress
        element.style.setProperty('--progress-height', `${thicknessValue}px`);
        
        // Update thickness classes
        const containerClass = getClass(PROGRESS_CLASSES.CONTAINER);
        element.classList.remove(`${containerClass}--thin`, `${containerClass}--thick`);
        
        if (thickness === 'thin') {
          element.classList.add(`${containerClass}--thin`);
        } else if (thickness === 'thick') {
          element.classList.add(`${containerClass}--thick`);
        }
      }
      
      // Recalculate if not indeterminate
      if (!options.state.isIndeterminate()) {
        updateProgress(options.value.getValue(), options.value.getMax());
      }
    }
    
    return api;
  };

  let resizeTimer: number | undefined;
  const handleResize = (): void => {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (!options.state.isIndeterminate()) {
        updateProgress(options.value.getValue(), options.value.getMax());
      }
    }, 100);
  };
  
  // Add resize listener
  window.addEventListener('resize', handleResize);
  
  // Initialize
  requestAnimationFrame(() => {
    if (options.state.isIndeterminate()) {
      addClass(element, PROGRESS_CLASSES.INDETERMINATE);
      element.removeAttribute('aria-valuenow');
    } else {
      updateProgress(options.value.getValue(), options.value.getMax());
    }
  });
  
  // Build the API
  const api: ProgressComponent = {
    // Element references
    element,
    track: track as any,
    indicator: indicator as any,
    buffer: buffer as any,
    getClass,
    
    // Value management
    getValue: options.value.getValue,
    setValue(value: number): ProgressComponent {
      const prevValue = options.value.getValue();
      options.value.setValue(value);
      
      if (prevValue !== value) {
        if (!options.state.isIndeterminate()) {
          updateProgress(value, options.value.getMax());
        }
        
        const detail = { value, max: options.value.getMax() };
        emitEvent(PROGRESS_EVENTS.CHANGE, detail);
        
        if (value >= options.value.getMax()) {
          emitEvent(PROGRESS_EVENTS.COMPLETE, detail);
        }
      }
      
      return api;
    },
    getMax: options.value.getMax,
    
    // Buffer management
    getBuffer: options.buffer.getBuffer,
    setBuffer(value: number): ProgressComponent {
      options.buffer.setBuffer(value);
      if (!isCircular && !options.state.isIndeterminate()) {
        updateProgress(options.value.getValue(), options.value.getMax());
      }
      return api;
    },
    
    // Indeterminate state
    setIndeterminate(indeterminate: boolean): ProgressComponent {
      const wasIndeterminate = options.state.isIndeterminate();
      if (wasIndeterminate === indeterminate) return api;
      
      options.state.setIndeterminate(indeterminate);
      
      if (indeterminate) {
        addClass(element, PROGRESS_CLASSES.INDETERMINATE);
        element.removeAttribute('aria-valuenow');
      } else {
        removeClass(element, PROGRESS_CLASSES.INDETERMINATE);
        updateProgress(options.value.getValue(), options.value.getMax());
      }
      
      return api;
    },
    isIndeterminate: options.state.isIndeterminate,
    
    // Label management
    showLabel(): ProgressComponent {
      if (options.label.show) options.label.show();
      return api;
    },
    hideLabel(): ProgressComponent {
      if (options.label.hide) options.label.hide();
      return api;
    },
    setLabelFormatter(formatter: (value: number, max: number) => string): ProgressComponent {
      if (options.label.format) options.label.format(formatter);
      const label = comp.label || comp.components?.label;
      if (label) {
        label.textContent = formatter(options.value.getValue(), options.value.getMax());
      }
      return api;
    },
    
    showStopIndicator(): ProgressComponent {
      if (isCircular) return api;
      
      if (options.stopIndicator?.show) {
        options.stopIndicator.show();
      }
      
      if (options.value.getValue() > 0) {
        element.classList.add(`${getClass(PROGRESS_CLASSES.CONTAINER)}-show-stop`);
      }
      
      return api;
    },

    hideStopIndicator(): ProgressComponent {
      if (options.stopIndicator?.hide) {
        options.stopIndicator.hide();
      }
      
      element.classList.remove(`${getClass(PROGRESS_CLASSES.CONTAINER)}-show-stop`);
      
      return api;
    },

    getThickness,
    setThickness,

    // State management
    enable(): ProgressComponent {
      options.disabled.enable();
      return api;
    },
    disable(): ProgressComponent {
      options.disabled.disable();
      return api;
    },
    isDisabled: options.disabled.isDisabled,
    
    // Event handling
    on(event: string, handler: Function): ProgressComponent {
      element.addEventListener(event, handler as EventListener);
      return api;
    },
    off(event: string, handler: Function): ProgressComponent {
      element.removeEventListener(event, handler as EventListener);
      return api;
    },
    
    // Extension methods
    addClass(...classes: string[]): ProgressComponent {
      classes.forEach(className => element.classList.add(className));
      return api;
    },
    
    // Cleanup
    destroy(): void {
      window.removeEventListener('resize', handleResize);
      clearTimeout(resizeTimer);
      options.lifecycle.destroy();
    },
    
    // Required property objects
    disabled: {
      enable(): void { options.disabled.enable(); },
      disable(): void { options.disabled.disable(); },
      isDisabled: options.disabled.isDisabled
    },
    
    lifecycle: {
      destroy(): void {
        window.removeEventListener('resize', handleResize);
        clearTimeout(resizeTimer);
        options.lifecycle.destroy();
      }
    }
  };
  
  return api;
};