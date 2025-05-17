import { ProgressConfig } from './types';
import { PROGRESS_VARIANTS, PROGRESS_CLASSES } from './constants';
import { createSvgElement } from '../../core/dom/svg';

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
    // Circular progress - create SVG-based structure
    const size = 96; // MD3 spec: circular progress size is 40px
    const outerRadius = 45; // MD3 spec: track radius
    const innerRadius = 45; // MD3 spec: indicator radius (4px less than track for the spacing)
    const centerPoint = size / 2; // Center point of the SVG

    return {
      element: {
        options: {
          className: [getClass(PROGRESS_CLASSES.CONTAINER), getClass(PROGRESS_CLASSES.CIRCULAR), config.class].filter(Boolean),
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
            creator: createSvgElement,
            options: {
              tag: 'svg',
              attributes: {
                viewBox: `0 0 ${size} ${size}`,
                name: 'test'
              }
            },
            children: {
              track: {
                creator: createSvgElement,
                options: {
                  tag: 'circle',
                  className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.TRACK}`,
                  attributes: {
                    cx: centerPoint.toString(),
                    cy: centerPoint.toString(),
                    r: outerRadius.toString(),
                    fill: 'none',
                    'stroke-width': '6'
                  }
                }
              },
              remaining: {
                creator: createSvgElement,
                options: {
                  tag: 'circle',
                  className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.REMAINING}`,
                  attributes: {
                    cx: centerPoint.toString(),
                    cy: centerPoint.toString(),
                    r: innerRadius.toString(),
                    fill: 'none',
                    'stroke-width': '6'
                  }
                }
              },
              indicator: {
                creator: createSvgElement,
                options: {
                  tag: 'circle',
                  className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.INDICATOR}`,
                  attributes: {
                    cx: centerPoint.toString(),
                    cy: centerPoint.toString(),
                    r: innerRadius.toString(),
                    fill: 'none',
                    'stroke-width': '6'
                  }
                }
              }
            }
          }
        }
      }
    };
  } else {
    // Linear progress - create div-based structure

    return {
      element: {
        options: {
          className: [getClass(PROGRESS_CLASSES.CONTAINER), getClass(PROGRESS_CLASSES.LINEAR), config.class].filter(Boolean),
          attributes: {
            role: 'progressbar',
            'aria-valuemin': min.toString(),
            'aria-valuemax': max.toString(),
            'aria-valuenow': config.indeterminate ? undefined : value.toString(),
            'aria-disabled': isDisabled ? 'true' : undefined
          }
        },
        children: {
          buffer: {
            options: {
              className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.BUFFER}`,
              style: {
                width: `${config.buffer || 0}%`
              }
            }
          },
          track: {
            options: {
              className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.TRACK}`,
            }
          },
          indicator: {
            options: {
              className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.INDICATOR}`,
              style: {
                width: `${valuePercent}%`
              }
            }
          },
          remaining: {
            options: {
              className: `${PROGRESS_CLASSES.CONTAINER}-${PROGRESS_CLASSES.REMAINING}`,
              style: {
                left: `calc(${valuePercent}% + 4px)`,
                width: `calc(${100 - valuePercent}% - 4px)`
              }
            }
          }
        }
      }
    };
  }
} 