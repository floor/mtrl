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
  const getClass = (className) => component.getClass(className);

  // Set default values
  const min = 0;
  const max = config.max || 100;
  const value = config.value !== undefined ? config.value : 0;
  const isDisabled = config.disabled === true;
  const isCircular = config.variant === PROGRESS_VARIANTS.CIRCULAR;

  // Calculate initial position
  const valuePercent = (value / max) * 100;
  
  // Create base structure for the component
  if (isCircular) {
    const size = 96;
    const strokeWidth = 6
    const radius = size / 2 - strokeWidth / 2;
    const centerPoint = size / 2;
    return {
      element: {
        options: {
          className: [getClass(PROGRESS_CLASSES.TEST), getClass(PROGRESS_CLASSES.CONTAINER), getClass(PROGRESS_CLASSES.CIRCULAR), config.class].filter(Boolean),
          attributes: {
            role: 'progressbar',
            'aria-valuemin': min.toString(),
            'aria-valuemax': max.toString(),
            'aria-valuenow': config.indeterminate ? undefined : value.toString(),
            'aria-disabled': isDisabled ? 'true' : undefined
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
            children: {
              track: {
                creator: createSVGElement,
                options: {
                  tag: 'circle',
                  className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.TRACK}`,
                  attributes: {
                    cx: centerPoint.toString(),
                    cy: centerPoint.toString(),
                    r: radius.toString(),
                    fill: 'none',
                    'stroke-width': strokeWidth.toString()
                  }
                }
              },
              remaining: {
                creator: createSVGElement,
                options: {
                  tag: 'circle',
                  className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.REMAINING}`,
                  attributes: {
                    cx: centerPoint.toString(),
                    cy: centerPoint.toString(),
                    r: radius.toString(),
                    fill: 'none',
                    'stroke-width': strokeWidth.toString()
                  }
                }
              },
              indicator: {
                creator: createSVGElement,
                options: {
                  tag: 'circle',
                  className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.INDICATOR}`,
                  attributes: {
                    cx: centerPoint.toString(),
                    cy: centerPoint.toString(),
                    r: radius.toString(),
                    fill: 'none',
                    'stroke-width': strokeWidth.toString()
                  }
                }
              }
            }
          }
        }
      }
    };
  } else {
    // Linear progress - use SVG structure
    const width = 100; // Use 100 for percentage-based positioning
    const height = 4; // Height for the lines
    const strokeWidth = height * 1.5; // Make stroke slightly larger than height for visibility
    
    // For the remaining element, calculate initial position with fixed gap
    // The gap is represented in viewBox coordinates (0-100)
    const remainingPosition = valuePercent;
    
    return {
      element: {
        options: {
          className: [getClass(PROGRESS_CLASSES.CONTAINER), getClass(PROGRESS_CLASSES.LINEAR), config.class].filter(Boolean),
          attributes: {
            role: 'progressbar',
            'aria-valuemin': min.toString(),
            'aria-valuemax': max.toString(),
            'aria-valuenow': config.indeterminate ? undefined : value.toString(),
            'aria-disabled': isDisabled ? 'true' : undefined,
            style: 'min-height: 4px;' // Ensure container has minimum height
          }
        },
        children: {
          svg: {
            creator: createSVGElement,
            options: {
              tag: 'svg',
              attributes: {
                // Set viewBox to match the width and the stroke width
                viewBox: `0 0 ${width} ${height}`,
                width: '100%',
                height: '100%', // Use 100% height of container
                preserveAspectRatio: 'none',
                style: 'display: block; overflow: visible;' // Force block display and overflow
              }
            },
            children: {
              buffer: {
                creator: createSVGElement,
                options: {
                  tag: 'line',
                  className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.BUFFER}`,
                  attributes: {
                    x1: '0',
                    y1: height / 2,
                    x2: `${config.buffer || 0}`,
                    y2: height / 2,
                    'stroke-width': strokeWidth,
                    'stroke-linecap': 'round'
                  }
                }
              },
              track: {
                creator: createSVGElement,
                options: {
                  tag: 'line',
                  className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.TRACK}`,
                  attributes: {
                    x1: '0',
                    y1: height / 2,
                    x2: width,
                    y2: height / 2,
                    'stroke-width': strokeWidth,
                    'stroke-linecap': 'round'
                  }
                }
              },
              indicator: {
                creator: createSVGElement,
                options: {
                  tag: 'line',
                  className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.INDICATOR}`,
                  attributes: {
                    x1: '0',
                    y1: height / 2,
                    x2: config.indeterminate ? '0' : `${valuePercent}`,
                    y2: height / 2,
                    'stroke-width': strokeWidth,
                    'stroke-linecap': 'round'
                  }
                }
              },
              remaining: {
                creator: createSVGElement,
                options: {
                  tag: 'line',
                  className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.REMAINING}`,
                  attributes: {
                    x1: `${remainingPosition}`,  // Initial position will be recalculated by the API
                    y1: height / 2,
                    x2: width,
                    y2: height / 2,
                    'stroke-width': strokeWidth,
                    'stroke-linecap': 'round'
                  }
                }
              }
            }
          }
        }
      }
    };
  }
}