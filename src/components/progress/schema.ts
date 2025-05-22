// src/components/progress/schema.ts - Clean schema without inline CSS

import { ProgressConfig, ProgressThickness } from './types';
import { 
  PROGRESS_VARIANTS, 
  PROGRESS_CLASSES, 
  PROGRESS_MEASUREMENTS,
  PROGRESS_THICKNESS
} from './constants';
import { createSVGElement, createElement } from '../../core';

/**
 * Gets the stroke width value from the thickness config
 */
const getStrokeWidth = (thickness?: ProgressThickness): number => {
  if (thickness === undefined || thickness === 'default') {
    return PROGRESS_MEASUREMENTS.COMMON.STROKE_WIDTH;
  }
  
  if (typeof thickness === 'number') {
    return thickness;
  }
  
  // Handle named presets
  switch (thickness) {
    case 'thin':
      return PROGRESS_THICKNESS.THIN;
    case 'thick':
      return PROGRESS_THICKNESS.THICK;
    default:
      return PROGRESS_MEASUREMENTS.COMMON.STROKE_WIDTH;
  }
};

export function createProgressSchema(component, config: ProgressConfig) {
  // Get prefixed class names
  const getClass = className => component.getClass(className);

  // Set up variant-specific parameters
  const isCircular = config.variant === PROGRESS_VARIANTS.CIRCULAR;
  const isIndeterminate = config.indeterminate === true;
  const value = config.value ?? 0;
  const max = config.max ?? 100;
  const valuePercent = (value / max) * 100;
  
  // Determine stroke width from config
  const strokeWidth = getStrokeWidth(config.thickness);
  
  if (isCircular) {
    // Keep existing circular SVG logic
    const size = PROGRESS_MEASUREMENTS.CIRCULAR.SIZE;
    const radius = size / 2 - strokeWidth / 2;
    const centerPoint = size / 2;
    
    const svgChildren = {
      [PROGRESS_CLASSES.TRACK]: {
        creator: createSVGElement,
        options: {
          tag: 'circle',
          className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.TRACK}`,
          attributes: {
            cx: centerPoint,
            cy: centerPoint,
            r: radius,
            fill: 'none',
            'stroke-width': strokeWidth
          }
        }
      },
      [PROGRESS_CLASSES.INDICATOR]: {
        creator: createSVGElement,
        options: {
          tag: 'circle',
          className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.INDICATOR}`,
          attributes: {
            cx: centerPoint,
            cy: centerPoint,
            r: radius,
            fill: 'none',
            'stroke-width': strokeWidth
          }
        }
      }
    };

    return {
      element: {
        options: {
          className: [
            getClass(PROGRESS_CLASSES.CONTAINER),
            getClass(PROGRESS_CLASSES.CIRCULAR),
            isIndeterminate ? getClass(PROGRESS_CLASSES.INDETERMINATE) : null,
            config.disabled ? getClass(PROGRESS_CLASSES.DISABLED) : null,
            config.class
          ].filter(Boolean),
          attributes: {
            role: 'progressbar',
            'aria-valuemin': '0',
            'aria-valuemax': max.toString(),
            'aria-valuenow': isIndeterminate ? undefined : value.toString(),
            'aria-disabled': config.disabled ? 'true' : undefined
          }
        },
        children: {
          svg: {
            creator: createSVGElement,
            options: {
              tag: 'svg',
              attributes: {
                viewBox: `0 0 ${size} ${size}`,
                width: '100%',
                height: '100%'
              }
            },
            children: svgChildren
          }
        }
      }
    };
  } else {
    // Clean HTML-based linear progress - no inline styles
    const height = isIndeterminate ? strokeWidth : PROGRESS_MEASUREMENTS.LINEAR.HEIGHT;
    
    // Get thickness class for styling
    let thicknessClass = '';
    if (config.thickness === 'thin') {
      thicknessClass = `${getClass(PROGRESS_CLASSES.CONTAINER)}--thin`;
    } else if (config.thickness === 'thick') {
      thicknessClass = `${getClass(PROGRESS_CLASSES.CONTAINER)}--thick`;
    }
    
    return {
      element: {
        options: {
          className: [
            getClass(PROGRESS_CLASSES.CONTAINER),
            getClass(PROGRESS_CLASSES.LINEAR),
            isIndeterminate ? getClass(PROGRESS_CLASSES.INDETERMINATE) : null,
            config.disabled ? getClass(PROGRESS_CLASSES.DISABLED) : null,
            thicknessClass,
            config.class
          ].filter(Boolean),
          attributes: {
            role: 'progressbar',
            'aria-valuemin': '0',
            'aria-valuemax': max.toString(),
            'aria-valuenow': isIndeterminate ? undefined : value.toString(),
            'aria-disabled': config.disabled ? 'true' : undefined,
            // Use CSS custom properties for dynamic values
            style: `--progress-value: ${valuePercent}%; --progress-height: ${height}px;`
          }
        },
        children: {
          // Track (background/remaining part) - pure CSS
          track: {
            creator: createElement,
            options: {
              tag: 'div',
              className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.TRACK}`
            }
          },
          // Progress indicator (filled part) - pure CSS
          indicator: {
            creator: createElement,
            options: {
              tag: 'div',
              className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.INDICATOR}`
            }
          },
          // Buffer indicator (optional) - pure CSS
          buffer: {
            creator: createElement,
            options: {
              tag: 'div',
              className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.BUFFER}`
            }
          }
        }
      }
    };
  }
}