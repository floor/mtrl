// src/components/slider/features/range.ts
import { SliderConfig } from '../types';
import { createElement } from '../../../core/dom/create';

/**
 * Enhances structure definition with range slider elements
 * 
 * @param config Slider configuration
 * @returns Component enhancer that adds range slider to structure
 */
/** What this feature reads off the component it is handed. */
interface RangeHost {
  schema?: unknown;
  getClass: (name: string) => string;
}

export const withRange =
  (config: SliderConfig) =>
  // Generic, so the accumulated pipeline type survives. Annotating the
  // parameter with a concrete shape instead would erase everything applied
  // before this feature from the type of everything after it — the defect
  // fixed in textfield's withDensity (#109).
  <C extends RangeHost>(component: C): C => {
  // If not a range slider or missing structure definition, return unmodified
  if (!config.range || !config.secondValue || !component.schema) {
    return component;
  }
  
  try {
    // Calculate values for second handle
    const min = config.min || 0;
    const max = config.max || 100;
    const secondValue = config.secondValue;
    const secondValuePercent = ((secondValue - min) / (max - min)) * 100;
    const formatter = config.valueFormatter || (val => val.toString());
    const isDisabled = config.disabled === true;
    const getClass = component.getClass;
    
    // Clone the structure definition (deep copy)
    const schema = JSON.parse(JSON.stringify(component.schema));
    
    // Add range class to root element
    const rootClasses = schema.element.options.className || [];
    if (Array.isArray(rootClasses)) {
      rootClasses.push(getClass('slider--range'));
    } else {
      schema.element.options.className = `${rootClasses} ${getClass('slider--range')}`.trim();
    }
    
    // Canvas will handle all track rendering, so we don't add any DOM track elements
    
    // Add second handle to container children
    const containerChildren = schema.element.children.container.children;
    containerChildren.secondHandle = {
      name: 'secondHandle',
      creator: createElement,
      options: {
        tag: 'div',
        className: getClass('slider__handle'),
        attributes: {
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
    
    // Add second value bubble to container children
    containerChildren.secondValueBubble = {
      name: 'secondValueBubble',
      creator: createElement,
      options: {
        tag: 'div',
        className: getClass('slider__value'),
        attributes: {
          'aria-hidden': 'true',
          'data-handle-index': '1'
        },
        text: formatter(secondValue),
        style: {
          left: `${secondValuePercent}%`
        }
      }
    };
    
    // Return component with updated structure definition
    return {
      ...component,
      schema
    };
  } catch (error) {
    console.warn('Error enhancing structure with range functionality:', error);
    return component;
  }
};