// src/components/progress/api.ts

import { ProgressComponent } from './types';
import { ProgressComponent, ProgressThickness } from './types';
import { 
  PROGRESS_CLASSES, 
  PROGRESS_EVENTS,
  PROGRESS_MEASUREMENTS,
  PROGRESS_THICKNESS
} from './constants';
import { addClass, removeClass } from '../../core/dom';

import { addClass, removeClass } from '../../core/dom';

/**
 * SVG attribute dictionary
 */
interface SVGAttributes {
  [key: string]: string | number | undefined;
}

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
  state: {
    setIndeterminate: (indeterminate: boolean) => void;
    isIndeterminate: () => boolean;
  };
  lifecycle: {
    destroy: () => void;
  };
}

/**
 * Enhances a progress component with a streamlined API
 */
export const withAPI = (options: ApiOptions) => (comp: any): ProgressComponent => {
  // Get minimal element references directly
  const { element, getClass } = comp;
  const indicator = comp.indicator || comp.components?.indicator as SVGElement;
  const track = comp.track || comp.components?.track as SVGElement; // This is the renamed element (previously 'remaining')
  const buffer = comp.buffer || comp.components?.buffer as SVGElement | undefined;
  
  // Determine variant once
  const isCircular = element.classList.contains(getClass(PROGRESS_CLASSES.CIRCULAR));
  
  // Create event emitter helper - reduces code duplication
  const emitEvent = (name: string, detail: Record<string, any>): void => {
    element.dispatchEvent(new CustomEvent(name, { detail }));
  };
  
  // Optimized helper to set attributes on SVG elements
  const updateElement = (el: SVGElement | undefined, attrs: SVGAttributes): void => {
    if (!el) return;
    
    // Apply style changes through style property
    if (attrs.style !== undefined) {
      el.style.cssText = attrs.style as string;
      delete attrs.style;
    }
    
    // Apply display property
    if (attrs.display !== undefined) {
      el.style.display = attrs.display as string;
      delete attrs.display;
    }
    
    // Apply transform
    if (attrs.transform !== undefined) {
      el.style.transform = attrs.transform as string;
      delete attrs.transform;
    }
    
    // Apply remaining attributes
    for (const attr in attrs) {
      if (attrs[attr] !== undefined) {
        el.setAttribute(attr, attrs[attr]!.toString());
      }
    }
  };
  
  // Update progress visuals efficiently - separated by variant type
  const updateLinearProgress = (percentage: number, max: number): void => {
    // Get the stroke width
    const strokeWidth = parseFloat(indicator.getAttribute('stroke-width') || '6');
    
    // Calculate the container width 
    const containerWidth = element.clientWidth;
    
    // Calculate offset needed due to stroke-linecap: round
    // The cap extends by half the stroke width on each end
    const capOffset = (strokeWidth / 2) / containerWidth * 100;
    
    // Calculate gap in percentage units - use fixed visual gap
    const baseGap = PROGRESS_MEASUREMENTS.LINEAR.GAP;
    const gap = baseGap / containerWidth * 100;
    
    // Handle special case for 0% - make a perfect circle dot
    if (percentage === 0 || percentage < (strokeWidth / containerWidth * 100)) {
      // For zero or very small values, create a circular dot
      // To create a perfect circle with stroke-linecap: round, we need:
      // x1 === x2 (same point, creates a dot)
      const dotPosition = capOffset;
      
      // Update indicator to be a dot
      updateElement(indicator, { 
        x1: dotPosition, 
        x2: dotPosition
      });
      
      // Update track - start after the dot + gap
      // The dot visual width equals the stroke width
      const dotWidth = (strokeWidth / containerWidth * 100);
      const trackStart = dotWidth + gap;
      
      updateElement(track, { 
        x1: trackStart + capOffset,
        x2: 100 - capOffset,
        display: ''
      });
    } else {
      // Normal case - indicator is a line from start to percentage
      let x2 = percentage - capOffset; // Adjust endpoint for stroke-linecap
      
      // Update indicator position with cap offset
      updateElement(indicator, { 
        x1: capOffset,
        x2: x2
      });
      
      // Update track with gap
      const trackStart = percentage + gap;
      
      // Update track with adjusted offsets
      updateElement(track, { 
        x1: trackStart + capOffset,
        x2: 100 - capOffset,
        display: percentage >= 100 ? 'none' : ''
      });
    }
    
    // Update buffer if present
    if (buffer) {
      const bufferPercentage = (options.buffer.getBuffer() / max) * 100;
      
      // Only display buffer if ahead of the current progress
      if (bufferPercentage > percentage) {
        let bufferStart;
        
        if (percentage === 0) {
          // For zero state, buffer starts after the dot + gap
          const dotWidth = (strokeWidth / containerWidth * 100);
          bufferStart = dotWidth + gap + capOffset;
        } else {
          // Normal case
          bufferStart = percentage + gap + capOffset;
        }
        
        // Update buffer
        updateElement(buffer, { 
          x1: bufferStart,
          x2: bufferPercentage - capOffset,
          display: ''
        });
      } else {
        // Hide buffer
        updateElement(buffer, { display: 'none' });
      }
    }
  };
  
  const updateCircularProgress = (percentage: number, max: number): void => {
    // Get circle dimensions
    const radius = parseFloat(indicator.getAttribute('r') || '0');
    const circumference = 2 * Math.PI * radius;
    
    // Define the gap angle
    // const gapAngle = PROGRESS_MEASUREMENTS.CIRCULAR.GAP_ANGLE;
    
    // Convert gap angle to arc length
    // const gapLength = (gapAngle / 360) * circumference;
    



    // Calculate gap angle based on thickness
    // Base gap angle + adjustment based on stroke width
    const strokeWidth = parseFloat(indicator.getAttribute('stroke-width') || '6');
    const baseGapAngle = PROGRESS_MEASUREMENTS.CIRCULAR.GAP_ANGLE;
    const gapMultiplier = PROGRESS_MEASUREMENTS.CIRCULAR.GAP_MULTIPLIER;

    // Thickness relative to the default (6px)
    const thicknessRatio = strokeWidth / PROGRESS_THICKNESS.DEFAULT;

    // Scale the gap angle based on thickness (thicker = bigger gap)
    const gapAngle = baseGapAngle * (1 + (thicknessRatio - 1) * gapMultiplier);

    const gapLength = (gapAngle / 360) * circumference;

    console.log('gapAngle', gapAngle)
    console.log('gapLength', gapLength)

    // Calculate the available length after accounting for the gap
    const availableLength = circumference - gapLength;
    
    // Calculate the filled portion based on percentage of available length
    const adjustedFillAmount = (percentage / 100) * availableLength;
    
    // Convert percentage to angle for rotation calculations
    // This represents the angle subtended by the filled portion
    const filledPercentageAngle = (adjustedFillAmount / circumference) * 360;
    
    // Calculate half the gap angle
    const halfGapAngle = gapAngle / 2;
    
    // Indicator should start at top (0 degrees)
    // Since SVG is already rotated -90deg by CSS, this puts it at the correct position
    const indicatorRotation = 0;
    
    // Track should be positioned at the end of the indicator plus the gap
    const trackRotation = filledPercentageAngle + halfGapAngle;

    let indicatorLength = `${adjustedFillAmount} ${circumference - adjustedFillAmount}`

    if (percentage >= 100) {
      indicatorLength =  `${circumference}`
    }

    // For the indicator - rotate it clockwise from top
    updateElement(indicator, {
      'stroke-dasharray': indicatorLength,
      'stroke-dashoffset': '0',
      'transform': `rotate(${indicatorRotation}deg)`
    });
    
    // Update track
    if (track) {
      if (percentage >= 98) {
        track.style.display = 'none';
      } else {
        // The track should represent the remaining portion after accounting for the gap
        const trackLength = availableLength - adjustedFillAmount;
        
        updateElement(track, {
          display: '',
          'stroke-dasharray': `${trackLength} ${circumference}`,
          'stroke-dashoffset': '0',
          'transform': `rotate(${trackRotation}deg)`
        });
      }
    }
  };
  
  // Combined update function - delegates to variant-specific implementation
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
    return PROGRESS_MEASUREMENTS.COMMON.STROKE_WIDTH; // Default fallback
  };

  const setThickness = (thickness: ProgressThickness): ProgressComponent => {
    if (options.thickness && typeof options.thickness.setThickness === 'function') {
      // Update the state
      options.thickness.setThickness(thickness);
      
      // Get the numeric thickness value
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
      
      // Update the DOM elements
      if (indicator instanceof SVGElement) {
        indicator.setAttribute('stroke-width', thicknessValue.toString());
      }
      
      if (track instanceof SVGElement) {
        track.setAttribute('stroke-width', thicknessValue.toString());
      }
      
      if (buffer instanceof SVGElement) {
        buffer.setAttribute('stroke-width', thicknessValue.toString());
      }
      
      // For circular progress, we need to adjust the radius as well
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
      } else if (!isCircular) {
        // For linear progress, adjust the height if needed
        if (!options.state.isIndeterminate()) {
          const height = PROGRESS_MEASUREMENTS.LINEAR.HEIGHT;
          element.style.minHeight = `${height}px`;
          
          // Update the visual appearance
          updateProgress(options.value.getValue(), options.value.getMax());
        } else {
          // For indeterminate, use the stroke width as the height
          element.style.minHeight = `${thicknessValue}px`;
        }
      }
    }
    
    return api;
  };

  
  let resizeTimer: number | undefined;
  let lastResizeTime = 0;
  const THROTTLE_DELAY = 50; // Update every 50ms during resize
  const DEBOUNCE_DELAY = 20; // Final update after resize ends

  /**
   * Handles window resize events with both throttling (during resize) and debouncing (after resize)
   */
  const handleResize = (): void => {
    const now = Date.now();
    
    // Clear existing debounce timer
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
    
    // Throttle: Only update if enough time has passed since last update
    if (now - lastResizeTime >= THROTTLE_DELAY) {
      lastResizeTime = now;
      
      // Only update if not in indeterminate state
      if (!options.state.isIndeterminate()) {
        updateProgress(options.value.getValue(), options.value.getMax());
      }
    }
    
    // Debounce: Always schedule a final update
    resizeTimer = window.setTimeout(() => {
      if (!options.state.isIndeterminate()) {
        updateProgress(options.value.getValue(), options.value.getMax());
      }
      resizeTimer = undefined;
    }, DEBOUNCE_DELAY);
  };
  
  // Add resize listener
  window.addEventListener('resize', handleResize);
  
  // Initialize on next frame
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
    track,
    indicator,
    buffer,
    getClass,
    // Value management
    getValue: options.value.getValue,
    setValue(value: number): ProgressComponent {
      const prevValue = options.value.getValue();
      options.value.setValue(value);
      
      // Only update UI and emit events if value actually changed
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
      if (!isCircular && buffer && !options.state.isIndeterminate()) {
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
        
        // For linear progress, show track at 100%
        if (!isCircular && track) {
          updateElement(track, {
            display: 'block',
            x1: 0,
            x2: 100,
            stroke: 'var(--mtrl-surface-container-highest)'
          });
        }
        
        // For circular progress, show track at 100% 
        if (isCircular && track) {
          updateElement(track, {
            display: 'block',
            opacity: '1',
            stroke: 'var(--mtrl-surface-container-highest)', 
            'stroke-dasharray': 'none'
          });
        }
        
        // Hide buffer in indeterminate mode
        if (buffer) {
          updateElement(buffer, { display: 'none' });
        }
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
      if (isCircular) return api; // Only for linear variant
      
      if (options.stopIndicator?.show) {
        options.stopIndicator.show();
      }
      
      // Simply add a CSS class to show/hide the pseudo-element
      if (options.value.getValue() > 0) {
        element.classList.add(`${getClass(PROGRESS_CLASSES.CONTAINER)}-show-stop`);
        // By toggling this class, we can control the display of the :after pseudo-element
        element.style.setProperty('--stop-indicator', 'block');
      }
      
      return api;
    },

    hideStopIndicator(): ProgressComponent {
      if (options.stopIndicator?.hide) {
        options.stopIndicator.hide();
      }
      
      // Simply remove the CSS class
      element.classList.remove(`${getClass(PROGRESS_CLASSES.CONTAINER)}-show-stop`);
      element.style.setProperty('--stop-indicator', 'none');
      
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
      enable(): void {
        options.disabled.enable();
      },
      disable(): void {
        options.disabled.disable();
      },
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