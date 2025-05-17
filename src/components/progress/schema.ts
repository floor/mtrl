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