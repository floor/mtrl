// src/components/progress/schema.ts
import { ProgressConfig } from './types';
import { PROGRESS_VARIANTS, PROGRESS_CLASSES } from './constants';
import { createSVGElement } from '../../core';

/**
 * Creates the base progress structure definition
 * 
 * @param component Component for class name generation
 * @param config Progress configuration
 * @returns Structure schema object
 */
export function createProgressSchema(component, config: ProgressConfig) {
  // Get prefixed class names
  const getClass = className => component.getClass(className);

  // Set up variant-specific parameters
  const isCircular = config.variant === PROGRESS_VARIANTS.CIRCULAR;
  const isIndeterminate = config.indeterminate === true;
  const value = config.value ?? 0;
  const max = config.max ?? 100;
  const valuePercent = (value / max) * 100;
  
  // Set up SVG parameters based on variant
  const svgParams = isCircular 
    ? { 
        size: 96,
        strokeWidth: 6,
        tag: 'circle',
        getAttrs: (type) => {
          const radius = svgParams.size / 2 - svgParams.strokeWidth / 2;
          const centerPoint = svgParams.size / 2;
          
          return {
            cx: centerPoint,
            cy: centerPoint,
            r: radius,
            fill: 'none',
            'stroke-width': svgParams.strokeWidth
          };
        }
      }
    : { 
        size: 100,
        height: 4,
        strokeWidth: 6,
        tag: 'line',
        getAttrs: (type) => {
          const y = svgParams.height / 2;
          
          // Base attributes for all line elements
          const attrs = {
            y1: y,
            y2: y,
            'stroke-width': svgParams.strokeWidth,
            'stroke-linecap': 'round'
          };
          
          // Add specific attributes based on element type
          if (type === PROGRESS_CLASSES.TRACK) {
            attrs.x1 = isIndeterminate ? 0 : valuePercent;
            attrs.x2 = 100;
          } else if (type === PROGRESS_CLASSES.INDICATOR) {
            attrs.x1 = 0;
            attrs.x2 = isIndeterminate ? 40 : valuePercent;
          } else if (type === PROGRESS_CLASSES.BUFFER) {
            attrs.x1 = valuePercent;
            attrs.x2 = ((config.buffer ?? 0) / max) * 100;
            if ((config.buffer ?? 0) <= value) {
              attrs.style = 'display: none;';
            }
          }
          
          return attrs;
        }
      };
  
  // Define SVG element types to create - track FIRST, then indicator, then buffer
  const elements = [
    PROGRESS_CLASSES.TRACK,
    PROGRESS_CLASSES.INDICATOR,
    PROGRESS_CLASSES.BUFFER
  ];
  
  // Generate SVG children, filtering out buffer for circular variant
  const svgChildren = elements
    .filter(type => !(isCircular && type === PROGRESS_CLASSES.BUFFER))
    .reduce((acc, type) => {
      acc[type] = {
        creator: createSVGElement,
        options: {
          tag: svgParams.tag,
          className: `${PROGRESS_CLASSES.CONTAINER}-${type}`,
          attributes: svgParams.getAttrs(type)
        }
      };
      return acc;
    }, {});

  // Return the complete schema
  return {
    element: {
      options: {
        className: [
          getClass(PROGRESS_CLASSES.CONTAINER),
          getClass(isCircular ? PROGRESS_CLASSES.CIRCULAR : PROGRESS_CLASSES.LINEAR),
          isIndeterminate ? getClass(PROGRESS_CLASSES.INDETERMINATE) : null,
          config.disabled ? getClass(PROGRESS_CLASSES.DISABLED) : null,
          config.class
        ].filter(Boolean),
        attributes: {
          role: 'progressbar',
          'aria-valuemin': '0',
          'aria-valuemax': max.toString(),
          'aria-valuenow': isIndeterminate ? undefined : value.toString(),
          'aria-disabled': config.disabled ? 'true' : undefined,
          style: isCircular ? undefined : 'min-height: 4px;'
        }
      },
      children: {
        svg: {
          creator: createSVGElement,
          options: {
            tag: 'svg',
            attributes: {
              viewBox: isCircular 
                ? `0 0 ${svgParams.size} ${svgParams.size}`
                : `0 0 ${svgParams.size} ${svgParams.height}`,
              width: '100%',
              height: '100%',
              preserveAspectRatio: isCircular ? undefined : 'none',
              style: isCircular ? undefined : 'display: block; overflow: visible;'
            }
          },
          children: svgChildren
        }
      }
    }
  };
}