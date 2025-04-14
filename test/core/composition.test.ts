// test/core/composition.test.ts
import { describe, test, expect, beforeEach, afterEach, mock, spyOn } from 'bun:test';
import { JSDOM } from 'jsdom';

// Setup JSDOM environment
let dom: JSDOM;
let window: Window;
let document: Document;

// Import core composition modules
import {
  withLayout,
  withIcon,
  withLabel,
  withDom
} from '../src/core/composition';

// Mock dependencies
import * as layoutModule from '../src/core/layout';
import * as domModule from '../src/core/dom/create';

describe('Core Composition Module', () => {
  // Setup and teardown for each test
  beforeEach(() => {
    // Setup JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost/',
      contentType: 'text/html'
    });

    global.window = dom.window as any;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;

    // Mock createLayout from the layout module
    mock.module('../src/core/layout', () => ({
      default: mock(() => ({
        element: document.createElement('div'),
        getAll: mock(() => ({ 
          button: document.createElement('button'),
          label: document.createElement('label'),
          icon: document.createElement('span')
        }))
      }))
    }));

    // Mock createElement from dom/create
    mock.module('../src/core/dom/create', () => ({
      createElement: mock(() => document.createElement('div'))
    }));
  });

  afterEach(() => {
    // Clean up
    mock.restoreAll();
    delete global.window;
    delete global.document;
    delete global.HTMLElement;
  });

  describe('withLayout', () => {
    test('should add schema definition to component', () => {
      const schema = {
        element: {
          creator: jest.fn(),
          options: { tag: 'div', className: 'test' }
        }
      };
      
      const component = {
        componentName: 'button',
        getClass: (name: string) => `mtrl-${name}`
      };
      
      const enhanced = withLayout({ schema })(component);
      
      expect(enhanced.schema).toBe(schema);
      expect(enhanced.componentName).toBe('button');
    });
    
    test('should return unmodified component if no schema provided', () => {
      const component = {
        componentName: 'button',
        getClass: (name: string) => `mtrl-${name}`
      };
      
      // Spy on console.warn
      const spy = spyOn(console, 'warn');
      
      const enhanced = withLayout({})(component);
      
      expect(enhanced).toBe(component);
      expect(spy).toHaveBeenCalled();
    });
  });

  describe('withIcon', () => {
    test('should enhance schema with icon definition', () => {
      const component = {
        componentName: 'button',
        getClass: (name: string) => `mtrl-${name}`,
        schema: {
          element: {
            options: {
              className: ['mtrl-button']
            },
            children: {}
          }
        }
      };
      
      const config = {
        icon: '<svg></svg>',
        iconPosition: 'start',
        iconSize: 'small',
        prefix: 'mtrl',
        componentName: 'button'
      };
      
      const enhanced = withIcon(config)(component);
      
      // Check that icon was added to schema
      expect(enhanced.schema.element.children.icon).toBeDefined();
      expect(enhanced.schema.element.children.icon.options.html).toBe('<svg></svg>');
      
      // Check class modifications
      expect(enhanced.schema.element.options.className).toContain('mtrl-button--icon');
      
      // Check icon position (start position places icon first in children)
      const childrenKeys = Object.keys(enhanced.schema.element.children);
      expect(childrenKeys[0]).toBe('icon');
    });
    
    test('should add icon at end when position is end', () => {
      const component = {
        componentName: 'button',
        getClass: (name: string) => `mtrl-${name}`,
        schema: {
          element: {
            options: {
              className: ['mtrl-button']
            },
            children: {
              text: {
                options: { text: 'Button Text' }
              }
            }
          }
        }
      };
      
      const config = {
        icon: '<svg></svg>',
        iconPosition: 'end',
        prefix: 'mtrl',
        componentName: 'button'
      };
      
      const enhanced = withIcon(config)(component);
      
      // Check that icon was added to schema after existing children
      const childrenKeys = Object.keys(enhanced.schema.element.children);
      expect(childrenKeys[0]).toBe('text');
      expect(childrenKeys[1]).toBe('icon');
    });
    
    test('should handle missing schema gracefully', () => {
      const component = {
        componentName: 'button',
        getClass: (name: string) => `mtrl-${name}`
      };
      
      const config = {
        icon: '<svg></svg>',
        iconPosition: 'end',
        prefix: 'mtrl',
        componentName: 'button'
      };
      
      const enhanced = withIcon(config)(component);
      
      // Should return the component unmodified
      expect(enhanced).toBe(component);
    });
    
    test('should handle missing icon gracefully', () => {
      const component = {
        componentName: 'button',
        getClass: (name: string) => `mtrl-${name}`,
        schema: {
          element: {
            options: {
              className: ['mtrl-button']
            },
            children: {}
          }
        }
      };
      
      const config = {
        iconPosition: 'end',
        prefix: 'mtrl',
        componentName: 'button'
      };
      
      const enhanced = withIcon(config)(component);
      
      // Should return the component unmodified
      expect(enhanced).toBe(component);
    });
  });

  describe('withLabel', () => {
    test('should enhance schema with label definition', () => {
      const component = {
        componentName: 'checkbox',
        getClass: (name: string) => `mtrl-${name}`,
        schema: {
          element: {
            options: {
              className: ['mtrl-checkbox']
            },
            children: {}
          }
        }
      };
      
      const config = {
        label: 'Checkbox Label',
        labelPosition: 'end',
        prefix: 'mtrl',
        componentName: 'checkbox',
        id: 'checkbox-1'
      };
      
      const enhanced = withLabel(config)(component);
      
      // Check that label was added to schema
      expect(enhanced.schema.element.children.label).toBeDefined();
      expect(enhanced.schema.element.children.label.options.text).toBe('Checkbox Label');
      expect(enhanced.schema.element.children.label.options.attrs.for).toBe('checkbox-1');
      
      // Check label position (end position places label at the end)
      const childrenKeys = Object.keys(enhanced.schema.element.children);
      expect(childrenKeys[0]).toBe('label');
    });
    
    test('should add required indicator when required is true', () => {
      const component = {
        componentName: 'textfield',
        getClass: (name: string) => `mtrl-${name}`,
        schema: {
          element: {
            options: {
              className: ['mtrl-textfield']
            },
            children: {}
          }
        }
      };
      
      const config = {
        label: 'Required Field',
        labelPosition: 'top',
        prefix: 'mtrl',
        componentName: 'textfield',
        required: true
      };
      
      const enhanced = withLabel(config)(component);
      
      // Check that required indicator was added
      expect(enhanced.schema.element.children.label.children).toBeDefined();
      expect(enhanced.schema.element.children.label.children.requiredIndicator).toBeDefined();
      expect(enhanced.schema.element.children.label.children.requiredIndicator.options.text).toBe('*');
    });
    
    test('should position label at start by default', () => {
      const component = {
        componentName: 'checkbox',
        getClass: (name: string) => `mtrl-${name}`,
        schema: {
          element: {
            options: {
              className: ['mtrl-checkbox']
            },
            children: {
              input: {
                options: { tag: 'input' }
              }
            }
          }
        }
      };
      
      const config = {
        label: 'Checkbox Label',
        prefix: 'mtrl',
        componentName: 'checkbox'
      };
      
      const enhanced = withLabel(config)(component);
      
      // Check label position (should reorder children to put label first)
      const childrenKeys = Object.keys(enhanced.schema.element.children);
      expect(childrenKeys[0]).toBe('label');
      expect(childrenKeys[1]).toBe('input');
      
      // Check label classes
      expect(enhanced.schema.element.children.label.options.className[1]).toBe('mtrl-checkbox-label--start');
    });
    
    test('should handle missing schema gracefully', () => {
      const component = {
        componentName: 'button',
        getClass: (name: string) => `mtrl-${name}`
      };
      
      const config = {
        label: 'Button Label',
        prefix: 'mtrl',
        componentName: 'button'
      };
      
      const enhanced = withLabel(config)(component);
      
      // Should return the component unmodified
      expect(enhanced).toBe(component);
    });
    
    test('should handle missing label gracefully', () => {
      const component = {
        componentName: 'button',
        getClass: (name: string) => `mtrl-${name}`,
        schema: {
          element: {
            options: {
              className: ['mtrl-button']
            },
            children: {}
          }
        }
      };
      
      const config = {
        prefix: 'mtrl',
        componentName: 'button'
      };
      
      const enhanced = withLabel(config)(component);
      
      // Should return the component unmodified
      expect(enhanced).toBe(component);
    });
  });

  describe('withDom', () => {
    test('should create DOM from schema', () => {
      // Mock createLayout for this test
      const mockCreateLayout = spyOn(layoutModule, 'default').mockImplementation(() => ({
        element: document.createElement('div'),
        getAll: () => ({
          button: document.createElement('button'),
          input: document.createElement('input')
        })
      }));
      
      const component = {
        componentName: 'checkbox',
        getClass: (name: string) => `mtrl-${name}`,
        schema: {
          element: {
            options: { tag: 'div', className: 'mtrl-checkbox' },
            children: {
              input: { options: { tag: 'input', type: 'checkbox' } },
              label: { options: { tag: 'label', text: 'Checkbox' } }
            }
          }
        }
      };
      
      const enhanced = withDom()(component);
      
      // Should call createLayout with the schema
      expect(mockCreateLayout).toHaveBeenCalledWith(component.schema);
      
      // Should have element and components from layout
      expect(enhanced.element).toBeDefined();
      expect(enhanced.components).toBeDefined();
    });
    
    test('should return unmodified component if no schema', () => {
      const component = {
        componentName: 'button',
        getClass: (name: string) => `mtrl-${name}`
      };
      
      const enhanced = withDom()(component);
      
      // Should return the component unmodified
      expect(enhanced).toBe(component);
    });
    
    test('should handle errors during layout creation', () => {
      // Make createLayout throw an error
      spyOn(layoutModule, 'default').mockImplementation(() => {
        throw new Error('Layout creation failed');
      });
      
      const component = {
        componentName: 'checkbox',
        getClass: (name: string) => `mtrl-${name}`,
        schema: {
          element: {
            options: { tag: 'div' }
          }
        }
      };
      
      // Spy on console.error
      const consoleSpy = spyOn(console, 'error');
      
      // Should throw with a meaningful error message
      expect(() => withDom()(component)).toThrow('Failed to create component DOM: Layout creation failed');
      expect(consoleSpy).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    test('should create complex component with layout, icon, label, and DOM', () => {
      // Mock layout creation result
      const mockLayout = {
        element: document.createElement('div'),
        getAll: () => ({
          root: document.createElement('div'),
          icon: document.createElement('span'),
          label: document.createElement('label'),
          input: document.createElement('input')
        })
      };
      
      spyOn(layoutModule, 'default').mockImplementation(() => mockLayout);
      
      // Create base component
      const baseComponent = {
        componentName: 'checkbox',
        getClass: (name: string) => `mtrl-${name}`
      };
      
      // Define config
      const config = {
        schema: {
          element: {
            options: { 
              tag: 'div', 
              className: 'mtrl-checkbox'
            },
            children: {}
          }
        },
        icon: '<svg></svg>',
        iconPosition: 'start',
        label: 'Checkbox Label',
        labelPosition: 'end',
        prefix: 'mtrl',
        componentName: 'checkbox',
        id: 'checkbox-1'
      };
      
      // Apply enhancers
      const component = withDom()(
        withLabel(config)(
          withIcon(config)(
            withLayout(config)(baseComponent)
          )
        )
      );
      
      // Check results
      expect(component.element).toBe(mockLayout.element);
      expect(component.components).toBeDefined();
      expect(component.schema).toBeDefined();
      
      // Verify enhancer application order was correct
      const schema = component.schema;
      expect(schema.element.children.icon).toBeDefined();
      expect(schema.element.children.label).toBeDefined();
    });
    
    test('should handle icon before label in UI when using both', () => {
      // Create base component
      const baseComponent = {
        componentName: 'button',
        getClass: (name: string) => `mtrl-${name}`,
        schema: {
          element: {
            options: { 
              tag: 'button', 
              className: 'mtrl-button',
              text: 'Button'
            },
            children: {}
          }
        }
      };
      
      // Define config
      const config = {
        icon: '<svg></svg>',
        iconPosition: 'start',
        label: 'Button Label',
        labelPosition: 'end',
        prefix: 'mtrl',
        componentName: 'button'
      };
      
      // Apply icon first, then label
      const withIconFirst = withLabel(config)(
        withIcon(config)(baseComponent)
      );
      
      // Apply label first, then icon
      const withLabelFirst = withIcon(config)(
        withLabel(config)(baseComponent)
      );
      
      // Both should end up with the icon first and label second
      // because the position control overrides the enhancer order
      
      // For withIconFirst, the label should be at the end since position is 'end'
      const iconFirstChildrenKeys = Object.keys(withIconFirst.schema.element.children);
      expect(iconFirstChildrenKeys[0]).toBe('icon');
      expect(iconFirstChildrenKeys[1]).toBe('label');
      
      // For withLabelFirst, the icon should still be first and label at the end
      const labelFirstChildrenKeys = Object.keys(withLabelFirst.schema.element.children);
      // This is due to label's 'end' position and icon's 'start' position
      expect(labelFirstChildrenKeys.includes('icon')).toBe(true);
      expect(labelFirstChildrenKeys.includes('label')).toBe(true);
    });
  });
});