// src/components/slider/structure.ts
import { SliderConfig } from './types';

/**
 * Creates the base slider structure definition
 * 
 * @param component Component for class name generation
 * @param config Slider configuration
 * @returns Structure schema object
 */
export function createSliderSchema(component, config: SliderConfig) {
  // Get prefixed class names
  const getClass = (className) => component.getClass(className);

  // Set default values
  const min = config.min || 0;
  const max = config.max || 100;
  const value = config.value !== undefined ? config.value : min;
  const isDisabled = config.disabled === true;
  const formatter = config.valueFormatter || (val => val.toString());
  
  // Calculate initial position
  const valuePercent = ((value - min) / (max - min)) * 100;
  
  // Return base structure definition formatted for createLayout
  return {
    element: {
      options: {
        className: [getClass('slider'), config.class].filter(Boolean),
        attrs: {
          tabindex: '-1',
          role: 'none',
          'aria-disabled': isDisabled ? 'true' : 'false'
        }
      },
      children: {
        // Container with all slider elements
        container: {
          options: {
            className: getClass('slider-container')
          },
          children: {
            // Track with segments
            track: {
              options: {
                className: getClass('slider-track')
              },
              children: {
                activeTrack: {
                  options: {
                    className: getClass('slider-active-track'),
                    style: {
                      width: `${valuePercent}%`
                    }
                  }
                },
                startTrack: {
                  options: {
                    className: getClass('slider-start-track'),
                    style: {
                      display: 'none', // Initially hidden for single slider
                      width: '0%'
                    }
                  }
                },
                remainingTrack: {
                  options: {
                    className: getClass('slider-remaining-track'),
                    style: {
                      width: `${100 - valuePercent}%`
                    }
                  }
                }
              }
            },
            
            // Ticks container
            ticksContainer: {
              options: {
                className: getClass('slider-ticks-container')
              }
            },
            
            // Dots for ends
            startDot: {
              options: {
                className: [
                  getClass('slider-dot'),
                  getClass('slider-dot--start')
                ]
              }
            },
            endDot: {
              options: {
                className: [
                  getClass('slider-dot'),
                  getClass('slider-dot--end')
                ]
              }
            },
            
            // Main handle
            handle: {
              options: {
                className: getClass('slider-handle'),
                attrs: {
                  role: 'slider',
                  'aria-valuemin': String(min),
                  'aria-valuemax': String(max),
                  'aria-valuenow': String(value),
                  'aria-orientation': 'horizontal',
                  tabindex: isDisabled ? '-1' : '0',
                  'aria-disabled': isDisabled ? 'true' : 'false',
                  'data-value': String(value),
                  'data-handle-index': '0'
                },
                style: {
                  left: `${valuePercent}%`
                }
              }
            }, 
            // Main value bubble
            valueBubble: {
              options: {
                className: getClass('slider-value'),
                attrs: {
                  'aria-hidden': 'true',
                  'data-handle-index': '0'
                },
                text: formatter(value),
                style: {
                  left: `${valuePercent}%`
                }
              }
            }
          }
        }
      }
    }
  };
}