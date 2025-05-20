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
        getAttrs: (type, idx) => {
          const radius = svgParams.size / 2 - svgParams.strokeWidth / 2;
          const centerPoint = svgParams.size / 2;
          
          return {
            cx: centerPoint,
            cy: centerPoint,
            r: radius,
            fill: 'none',
            'stroke-width': svgParams.strokeWidth,
            // Custom style for remaining element in indeterminate mode
            ...(type === PROGRESS_CLASSES.REMAINING && isIndeterminate ? { style: 'display: none;' } : {})
          };
        }
      }
    : { 
        size: 100,
        height: 4,
        strokeWidth: 6,
        tag: 'line',
        getAttrs: (type, idx) => {
          const y = svgParams.height / 2;
          
          // Attribute map for different element types
          const attrs = {
            [PROGRESS_CLASSES.BUFFER]: { x1: 0, x2: config.buffer ?? 0 },
            [PROGRESS_CLASSES.TRACK]: { x1: 0, x2: 100 },
            [PROGRESS_CLASSES.INDICATOR]: { x1: 0, x2: isIndeterminate ? 100 : valuePercent },
            [PROGRESS_CLASSES.REMAINING]: { 
              x1: valuePercent, 
              x2: 100,
              style: isIndeterminate || valuePercent >= 100 ? 'display: none;' : undefined
            }
          };
          
          return {
            y1: y,
            y2: y,
            'stroke-width': svgParams.strokeWidth,
            'stroke-linecap': 'round',
            ...attrs[type]
          };
        }
      };
  
  // Define SVG element types to create
  const elements = [
    PROGRESS_CLASSES.BUFFER,
    PROGRESS_CLASSES.TRACK, 
    PROGRESS_CLASSES.INDICATOR, 
    PROGRESS_CLASSES.REMAINING
  ];
  
  // Create children object by mapping through elements
  const svgChildren = elements.reduce((acc, type, idx) => {
    // Skip buffer for circular
    if (isCircular && type === PROGRESS_CLASSES.BUFFER) return acc;
    
    acc[type] = {
      creator: createSVGElement,
      options: {
        tag: svgParams.tag,
        className: `${PROGRESS_CLASSES.CONTAINER}-${type}`,
        attributes: svgParams.getAttrs(type, idx)
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