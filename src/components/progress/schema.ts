import { ProgressConfig } from './types';
import { PROGRESS_VARIANTS, PROGRESS_CLASSES } from './constants';
import { createSVGElement } from '../../core';
import { CIRCULAR_CIRCUMFERENCE } from './api';

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
                height: '100%',
                style: 'transform: rotate(-90deg);'
              }
            },
            children: {
              track: {
                creator: createSVGElement,
                options: {
                  tag: 'circle',
                  className: getClass(PROGRESS_CLASSES.TRACK),
                  attributes: {
                    cx: centerPoint.toString(),
                    cy: centerPoint.toString(),
                    r: radius.toString(),
                    fill: 'none',
                    'stroke-width': strokeWidth.toString(),
                    stroke: 'var(--mtrl-sys-color-surface-container-highest)'
                  }
                }
              },
              indicator: {
                creator: createSVGElement,
                options: {
                  tag: 'circle',
                  className: getClass(PROGRESS_CLASSES.INDICATOR),
                  attributes: {
                    cx: centerPoint.toString(),
                    cy: centerPoint.toString(),
                    r: radius.toString(),
                    fill: 'none',
                    'stroke-width': strokeWidth.toString(),
                    stroke: 'var(--mtrl-sys-color-primary)'
                  }
                }
              }
            }
          }
        }
      }
    };
  } else {
    // Linear progress - use div structure for better compatibility
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
          track: {
            options: {
              tag: 'div',
              className: getClass(PROGRESS_CLASSES.TRACK),
              attributes: {
                style: 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-color: var(--mtrl-sys-color-surface-container-highest); border-radius: 2px;'
              }
            },
            children: {
              buffer: {
                options: {
                  tag: 'div',
                  className: getClass(PROGRESS_CLASSES.BUFFER),
                  attributes: {
                    style: 'position: absolute; top: 0; left: 0; height: 100%; width: 0; background-color: var(--mtrl-sys-color-primary); opacity: 0.4; border-radius: 2px; transition: width 0.3s ease;'
                  }
                }
              },
              indicator: {
                options: {
                  tag: 'div',
                  className: getClass(PROGRESS_CLASSES.INDICATOR),
                  attributes: {
                    style: 'position: absolute; top: 0; left: 0; height: 100%; width: 0; background-color: var(--mtrl-sys-color-primary); border-radius: 2px; transition: width 0.3s ease; z-index: 2;'
                  }
                }
              },
              remaining: {
                options: {
                  tag: 'div',
                  className: getClass(PROGRESS_CLASSES.REMAINING),
                  attributes: {
                    style: 'position: absolute; top: 0; height: 100%; background-color: var(--mtrl-sys-color-primary); opacity: 0.24; border-radius: 2px; transition: left 0.3s ease, width 0.3s ease, margin-left 0.3s ease; z-index: 1; box-sizing: border-box;'
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