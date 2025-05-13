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
import { withAPI } from './api';
import { ProgressConfig, ProgressComponent } from './types';
import { createBaseConfig, getElementConfig, getApiConfig } from './config';
import { PROGRESS_VARIANTS, PROGRESS_CLASSES } from './constants';

// Helper functions
const createLinearProgressDOM = (baseClass: string) => {
  const track = document.createElement('div');
  track.className = `${baseClass}__${PROGRESS_CLASSES.TRACK}`;
  
  const indicator = document.createElement('div');
  indicator.className = `${baseClass}__${PROGRESS_CLASSES.INDICATOR}`;
  
  const buffer = document.createElement('div');
  buffer.className = `${baseClass}__${PROGRESS_CLASSES.BUFFER}`;
  
  return { track, indicator, buffer };
};

const createCircularProgressDOM = (baseClass: string) => {
  const size = 96; // Default SVG viewBox size
  const track = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  track.setAttribute('cx', '48');
  track.setAttribute('cy', '48');
  track.setAttribute('r', '45');
  track.setAttribute('fill', 'none');
  track.setAttribute('stroke-width', '6');
  track.setAttribute('class', `${baseClass}__${PROGRESS_CLASSES.TRACK}`); // FIXED: use setAttribute instead of className
  
  const indicator = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
  indicator.setAttribute('cx', '48');
  indicator.setAttribute('cy', '48');
  indicator.setAttribute('r', '45');
  indicator.setAttribute('fill', 'none');
  indicator.setAttribute('stroke-width', '6');
  indicator.setAttribute('class', `${baseClass}__${PROGRESS_CLASSES.INDICATOR}`); // FIXED: use setAttribute instead of className
  
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', `0 0 ${size} ${size}`);
  svg.appendChild(track);
  svg.appendChild(indicator);
  
  return { track, indicator, svg };
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
      withElement(getElementConfig(baseConfig)),
      withVariant(baseConfig),
      withDisabled(baseConfig),
      withLifecycle(),
      // Add DOM structure based on variant
      (component) => {
        const baseClass = component.getClass('progress');
        const isCircular = baseConfig.variant === PROGRESS_VARIANTS.CIRCULAR;
        
        if (isCircular) {
          const { track, indicator, svg } = createCircularProgressDOM(baseClass);
          component.element.appendChild(svg);
  
          trackElement = track;
          indicatorElement = indicator;
        } else {
          const { track, indicator, buffer } = createLinearProgressDOM(baseClass);
          component.element.appendChild(buffer);
          component.element.appendChild(track);
          component.element.appendChild(indicator);
          trackElement = track;
          indicatorElement = indicator;
        }
        
        // Add label if requested
        if (baseConfig.showLabel) {
          const labelElement = document.createElement('div');
          labelElement.className = `${baseClass}__${PROGRESS_CLASSES.LABEL}`;
          labelElement.textContent = state.labelFormatter(state.value, state.max);
          component.element.appendChild(labelElement);
          state.labelElement = labelElement;
        }
        
        return {
          ...component,
          trackElement,
          indicatorElement,
          labelElement: state.labelElement
        };
      },
      // Add API
      comp => withAPI(getApiConfig(comp, state))(comp)
    )(baseConfig);
    
    // Initialize state based on configuration
    if (baseConfig.indeterminate) {
      component.setIndeterminate(true);
    } else {
      component.setValue(state.value);
      if (baseConfig.buffer !== undefined) {
        component.setBuffer(baseConfig.buffer);
      }
    }

    return component;
  } catch (error) {
    console.error('Progress creation error:', error);
    throw new Error(`Failed to create progress: ${(error as Error).message}`);
  }
};

export default createProgress;