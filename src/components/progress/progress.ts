// src/components/progress/progress.ts

import { PREFIX } from '../../core/config';
import { pipe } from '../../core/compose';
import { createBase, withElement } from '../../core/compose/component';
import {
  withEvents,
  withVariant,
  withDisabled,
  withLifecycle
} from '../../core/compose/features';
import { withLayout, withDom } from '../../core/composition/features';
import { withAPI } from './api';
import { ProgressConfig, ProgressComponent } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';
import { PROGRESS_VARIANTS, PROGRESS_CLASSES } from './constants';
import { addClass } from '../../core/dom';

// Helper functions
const createLinearProgressDOM = (baseClass: string) => {
  const track = document.createElement('div');
  track.className = `${baseClass}-${PROGRESS_CLASSES.TRACK}`;
  
  const indicator = document.createElement('div');
  indicator.className = `${baseClass}-${PROGRESS_CLASSES.INDICATOR}`;
  indicator.style.width = '0%'; // Initial state
  
  const remaining = document.createElement('div');
  remaining.className = `${baseClass}-${PROGRESS_CLASSES.REMAINING}`;
  // Initial state for remaining element - simpler approach
  remaining.style.position = 'absolute';
  remaining.style.top = '0';
  remaining.style.left = '4px'; // Start 4px from left when indicator is 0%
  remaining.style.width = '100%'; // Start with full width, will be adjusted dynamically
  
  const buffer = document.createElement('div');
  buffer.className = `${baseClass}-${PROGRESS_CLASSES.BUFFER}`;
  
  return { track, indicator, remaining, buffer };
};

const createCircularProgressDOM = (baseClass: string) => {
  const size = 40; // MD3 spec: circular progress size is 40px
  const outerRadius = 16; // MD3 spec: track radius
  const innerRadius = 12; // MD3 spec: indicator radius (4px less than track for the spacing)
  const centerPoint = size / 2; // Center point of the SVG
  const trackCircumference = 2 * Math.PI * outerRadius;
  const indicatorCircumference = 2 * Math.PI * innerRadius;
  
  // Create SVG container first
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.setAttribute('width', '100%');
  svg.setAttribute('height', '100%');
  
  // Create the track circle (outer circle)
  const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  track.setAttribute('cx', `${centerPoint}`);
  track.setAttribute('cy', `${centerPoint}`);
  track.setAttribute('r', `${outerRadius}`);
  track.setAttribute('fill', 'none');
  track.setAttribute('stroke-width', '4');
  track.setAttribute('class', `${baseClass}-${PROGRESS_CLASSES.TRACK}`);
  
  // Create the indicator circle (inner circle with 4px less radius)
  const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  indicator.setAttribute('cx', `${centerPoint}`);
  indicator.setAttribute('cy', `${centerPoint}`);
  indicator.setAttribute('r', `${innerRadius}`);
  indicator.setAttribute('fill', 'none');
  indicator.setAttribute('stroke-width', '4');
  indicator.setAttribute('class', `${baseClass}-${PROGRESS_CLASSES.INDICATOR}`);
  
  // Create the remaining circle (complements the indicator)
  const remaining = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  remaining.setAttribute('cx', `${centerPoint}`);
  remaining.setAttribute('cy', `${centerPoint}`);
  remaining.setAttribute('r', `${innerRadius}`);
  remaining.setAttribute('fill', 'none');
  remaining.setAttribute('stroke-width', '4');
  remaining.setAttribute('class', `${baseClass}-${PROGRESS_CLASSES.REMAINING}`);
  
  // Initial state for determinate mode
  indicator.setAttribute('stroke-dasharray', `${indicatorCircumference}`);
  indicator.setAttribute('stroke-dashoffset', `${indicatorCircumference}`); // Start at 0% progress
  
  // Add elements to SVG - track first, then remaining, then indicator
  svg.appendChild(track);
  svg.appendChild(remaining);
  svg.appendChild(indicator);
  
  return { track, indicator, remaining, svg };
};

/**
 * Creates a new Progress component
 * @param {ProgressConfig} config - Progress configuration object
 * @returns {ProgressComponent} Progress component instance
 * 
 * @example
 * ```ts
 * // Create a linear determinate progress bar
 * const progress = createProgress({
 *   variant: 'linear',
 *   value: 42,
 *   showLabel: true
 * });
 * 
 * // Create an indeterminate circular progress
 * const loader = createProgress({
 *   variant: 'circular',
 *   indeterminate: true
 * });
 * ```
 */
const createProgress = (config: ProgressConfig = {}): ProgressComponent => {
  // Create base configuration
  const baseConfig = createBaseConfig(config);
  
  try {
    // Create state container
    const state = {
      value: baseConfig.value || 0,
      max: baseConfig.max || 100,
      buffer: baseConfig.buffer || 0,
      indeterminate: baseConfig.indeterminate || false,
      labelFormatter: (v: number, m: number) => `${Math.round((v / m) * 100)}%`,
      labelElement: undefined as HTMLElement | undefined
    };
    
    let trackElement: HTMLElement | SVGElement;
    let indicatorElement: HTMLElement | SVGElement;
    
    // Create the component with the pipe pattern
    const component = pipe(
      createBase,
      withEvents(),
      withLayout(baseConfig),
      withDom(),
      withVariant(baseConfig),
      withDisabled(baseConfig),
      withLifecycle(),
      // Add DOM structure based on variant
      (component) => {
        const baseClass = component.getClass('progress');
        const isCircular = baseConfig.variant === PROGRESS_VARIANTS.CIRCULAR;
        
        // Apply indeterminate class directly if configured
        if (baseConfig.indeterminate) {
          addClass(component.element, PROGRESS_CLASSES.INDETERMINATE);
          
          // For linear progress, remove the inline width style in indeterminate mode
          if (!isCircular && component.element) {
            setTimeout(() => {
              const indicator = component.element.querySelector(`.${baseClass}-${PROGRESS_CLASSES.INDICATOR}`);
              if (indicator && indicator instanceof HTMLElement) {
                indicator.style.width = '';
              }
            }, 0);
          }
        }
        
        if (isCircular) {
          const { track, indicator, remaining, svg } = createCircularProgressDOM(baseClass);
          component.element.appendChild(svg);
  
          trackElement = track;
          indicatorElement = indicator;
          component.remainingElement = remaining;
        } else {
          const { track, indicator, remaining, buffer } = createLinearProgressDOM(baseClass);
          component.element.appendChild(buffer);
          component.element.appendChild(track);
          component.element.appendChild(indicator);
          component.element.appendChild(remaining);
          trackElement = track;
          indicatorElement = indicator;
          component.remainingElement = remaining;
        }
        
        // Add label if requested
        if (baseConfig.showLabel) {
          const labelElement = document.createElement('div');
          labelElement.className = `${baseClass}-${PROGRESS_CLASSES.LABEL}`;
          labelElement.textContent = state.labelFormatter(state.value, state.max);
          component.element.appendChild(labelElement);
          state.labelElement = labelElement;
          component.labelElement = labelElement;
        }
        
        return {
          ...component,
          trackElement,
          indicatorElement,
          remainingElement: component.remainingElement,
          labelElement: state.labelElement
        };
      },
      // Add API
      comp => withAPI(getApiConfig(comp, state))(comp)
    )(baseConfig);
    
    // Initialize state based on configuration
    if (baseConfig.indeterminate) {
      // Set the indeterminate state through the API
      // (We've already applied the class during component creation above)
      component.setIndeterminate(true);
    } else {
      // Set initial values
      component.setValue(state.value);
      if (baseConfig.buffer !== undefined) {
        component.setBuffer(baseConfig.buffer);
      }
      
      // Ensure the remaining element is properly positioned for the initial value
      // For linear progress, we need to adjust the remaining element manually
      if (baseConfig.variant === PROGRESS_VARIANTS.LINEAR && component.remainingElement) {
        const remainingElement = component.remainingElement as HTMLElement;
        const percentage = (state.value / state.max) * 100;
        
        // Get the container width to calculate precise pixel positions
        const totalWidth = component.element.clientWidth || component.element.offsetWidth;
        
        if (totalWidth > 0) {
          // Calculate indicator width in pixels
          const indicatorWidthPx = Math.floor((percentage / 100) * totalWidth);
          // Position remaining element 4px after indicator
          remainingElement.style.left = `${indicatorWidthPx + 4}px`;
          // Set width to fill remaining space minus the 4px gap
          remainingElement.style.width = `${totalWidth - indicatorWidthPx - 4}px`;
        } else {
          // Fallback if we can't get the element width
          if (percentage === 0) {
            remainingElement.style.left = '4px';
            remainingElement.style.width = '100%';
          } else {
            // Use a simpler approach without calc
            remainingElement.style.left = `${percentage}%`;
            remainingElement.style.marginLeft = '4px';
            remainingElement.style.width = `${100 - percentage}%`;
          }
        }
      }
    }

    return component;
  } catch (error) {
    console.error('Progress creation error:', error);
    throw new Error(`Failed to create progress: ${(error as Error).message}`);
  }
};

export default createProgress;