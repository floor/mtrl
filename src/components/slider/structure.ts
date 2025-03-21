// src/components/slider/structure.ts
import { createElement } from '../../core/dom/create'

/**
 * Creates the slider structure definition
 *
 * @param component Component context for class name generation
 * @param config Slider configuration
 * @returns Structure definition object
 */
export function createSliderStructure(component, config) {
  // Set default values
  const min = config.min || 0
  const max = config.max || 100
  const value = config.value !== undefined ? config.value : min
  const secondValue = config.secondValue !== undefined ? config.secondValue : null
  const isRangeSlider = config.range && secondValue !== null
  const isDisabled = config.disabled === true

  // Format the values
  const formatter = config.valueFormatter || (val => val.toString())

  // Get prefixed class names
  const getClass = (className) => component.getClass(className)

  // Initial position calculations
  const valuePercent = ((value - min) / (max - min)) * 100
  const secondValuePercent = secondValue !== null
    ? ((secondValue - min) / (max - min)) * 100
    : null

  // Create container children structure
  const containerChildren = {
    // Track with segments
    track: {
      name: 'track',
      creator: createElement,
      options: {
        tag: 'div',
        className: getClass('slider-track')
      },
      children: {
        startTrack: {
          name: 'startTrack',
          creator: createElement,
          options: {
            tag: 'div',
            className: getClass('slider-start-track'),
            style: {
              width: isRangeSlider
                ? `${Math.min(valuePercent, secondValuePercent)}%`
                : '0%'
            }
          }
        },
        activeTrack: {
          name: 'activeTrack',
          creator: createElement,
          options: {
            tag: 'div',
            className: getClass('slider-active-track'),
            style: {
              width: isRangeSlider
                ? `${Math.abs(secondValuePercent - valuePercent)}%`
                : `${valuePercent}%`
            }
          }
        },
        remainingTrack: {
          name: 'remainingTrack',
          creator: createElement,
          options: {
            tag: 'div',
            className: getClass('slider-remaining-track'),
            style: {
              width: isRangeSlider
                ? `${100 - Math.max(valuePercent, secondValuePercent)}%`
                : `${100 - valuePercent}%`
            }
          }
        }
      }
    },

    // Ticks container
    ticksContainer: {
      name: 'ticksContainer',
      creator: createElement,
      options: {
        tag: 'div',
        className: getClass('slider-ticks-container')
      }
    },

    // Dots for ends if needed
    startDot: {
      name: 'startDot',
      creator: createElement,
      options: {
        tag: 'div',
        className: [
          getClass('slider-dot'),
          getClass('slider-dot--start')
        ]
      }
    },
    endDot: {
      name: 'endDot',
      creator: createElement,
      options: {
        tag: 'div',
        className: [
          getClass('slider-dot'),
          getClass('slider-dot--end')
        ]
      }
    },

    // Main handle
    handle: {
      name: 'handle',
      creator: createElement,
      options: {
        tag: 'div',
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
      name: 'valueBubble',
      creator: createElement,
      options: {
        tag: 'div',
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
  };
  
  // Add range slider components if needed
  if (isRangeSlider) {
    // Add second handle
    containerChildren.secondHandle = {
      name: 'secondHandle',
      creator: createElement,
      options: {
        tag: 'div',
        className: getClass('slider-handle'),
        attrs: {
          role: 'slider',
          'aria-valuemin': String(min),
          'aria-valuemax': String(max),
          'aria-valuenow': String(secondValue),
          'aria-orientation': 'horizontal',
          tabindex: isDisabled ? '-1' : '0',
          'aria-disabled': isDisabled ? 'true' : 'false',
          'data-value': String(secondValue),
          'data-handle-index': '1'
        },
        style: {
          left: `${secondValuePercent}%`
        }
      }
    };
    
    // Add second value bubble
    containerChildren.secondValueBubble = {
      name: 'secondValueBubble',
      creator: createElement,
      options: {
        tag: 'div',
        className: getClass('slider-value'),
        attrs: {
          'aria-hidden': 'true',
          'data-handle-index': '1'
        },
        text: formatter(secondValue),
        style: {
          left: `${secondValuePercent}%`
        }
      }
    };
  }

  // Define slider structure with root element
  return {
    element: {
      name: 'element',
      creator: createElement,
      options: {
        tag: 'div',
        className: [
          getClass('slider'),
          config.class
        ].filter(Boolean),
        attrs: {
          tabindex: '-1',
          role: 'none',
          'aria-disabled': isDisabled ? 'true' : 'false'
        }
      },
      children: {
        // Container with all slider elements
        container: {
          name: 'container',
          creator: createElement,
          options: {
            tag: 'div',
            className: getClass('slider-container')
          },
          children: containerChildren
        }
      }
    }
  };
}