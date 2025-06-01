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
  
  // Calculate initial track positions for centered slider
  let activeTrackStyle: any = { width: `${valuePercent}%` };
  let startTrackStyle: any = { display: 'none', width: '0%' };
  let remainingTrackStyle: any = { width: `${100 - valuePercent}%` };
  
  if (config.centered) {
    const zeroPercent = ((0 - min) / (max - min)) * 100;
    const isPositive = value >= 0;
    
    // Assume a default track width for initial render (will be updated by controller)
    const defaultTrackWidth = 300; // reasonable default
    const centerGapPixels = 4; // Total gap at center
    const halfCenterGapPercent = (centerGapPixels / 2 / defaultTrackWidth) * 100; // Split in half
    const paddingPercent = (8 / defaultTrackWidth) * 100; // Handle padding
    
    // Check if handle is at center
    const handleAtCenter = Math.abs(valuePercent - zeroPercent) < paddingPercent;
    
    if (handleAtCenter) {
      // Handle is at center - no active track, just start and remaining
      activeTrackStyle = {
        display: 'none'
      };
      startTrackStyle = {
        display: 'block',
        left: '0',
        right: `${100 - valuePercent + paddingPercent}%`,
        width: 'auto'
      };
      remainingTrackStyle = {
        left: `${valuePercent + paddingPercent}%`,
        right: '0',
        width: 'auto'
      };
    } else if (isPositive) {
      // Active track from center to handle (right)
      activeTrackStyle = {
        left: `${zeroPercent + halfCenterGapPercent}%`,
        right: `${100 - valuePercent + paddingPercent}%`,
        width: 'auto'
      };
      // Start track from minimum to center (minus half gap)
      startTrackStyle = {
        display: 'block',
        left: '0',
        right: `${100 - zeroPercent + halfCenterGapPercent}%`,
        width: 'auto'
      };
      // Remaining track from handle to maximum
      remainingTrackStyle = {
        left: `${valuePercent + paddingPercent}%`,
        right: '0',
        width: 'auto'
      };
    } else {
      // Active track from handle to center (left)
      activeTrackStyle = {
        left: `${valuePercent + paddingPercent}%`,
        right: `${100 - zeroPercent + halfCenterGapPercent}%`,
        width: 'auto'
      };
      // Start track from minimum to handle
      startTrackStyle = {
        display: 'block',
        left: '0',
        right: `${100 - valuePercent + paddingPercent}%`,
        width: 'auto'
      };
      // Remaining track from center to maximum
      remainingTrackStyle = {
        left: `${zeroPercent + halfCenterGapPercent}%`,
        right: '0',
        width: 'auto'
      };
    }
  }
  
  // Return base structure definition formatted for createLayout
  return {
    element: {
      options: {
        className: [getClass('slider'), config.class].filter(Boolean),
        attributes: {
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
                    style: activeTrackStyle
                  }
                },
                startTrack: {
                  options: {
                    className: getClass('slider-start-track'),
                    style: startTrackStyle
                  }
                },
                remainingTrack: {
                  options: {
                    className: getClass('slider-remaining-track'),
                    style: remainingTrackStyle
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
                attributes: {
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
                attributes: {
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