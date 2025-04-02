// test/components/divider.test.ts
import { describe, test, expect } from 'bun:test';
import { JSDOM } from 'jsdom';

// Set up JSDOM
const dom = new JSDOM(`<!DOCTYPE html><html><body></body></html>`);
global.document = dom.window.document;
global.window = dom.window;
global.Element = dom.window.Element;
global.HTMLElement = dom.window.HTMLElement;
global.Event = dom.window.Event;
global.CustomEvent = dom.window.CustomEvent;

// Import types directly to avoid circular dependencies
import type { 
  DividerComponent
} from '../../src/components/divider/types';

// Import divider config directly
import type {
  DividerConfig
} from '../../src/components/divider/config';

// Create a mock divider implementation
const createMockDivider = (config: DividerConfig = {}): DividerComponent => {
  // Default configuration
  const defaultConfig: DividerConfig = {
    orientation: 'horizontal',
    variant: 'full-width',
    thickness: 1,
    prefix: 'mtrl',
    componentName: 'divider'
  };
  
  // Merge with user configuration
  const mergedConfig = {
    ...defaultConfig,
    ...config
  };
  
  // Create main element
  const element = document.createElement('hr');
  element.className = `${mergedConfig.prefix}-${mergedConfig.componentName}`;
  
  // Add custom class if provided
  if (mergedConfig.class) {
    element.className += ` ${mergedConfig.class}`;
  }
  
  // Apply orientation class
  element.classList.add(`${mergedConfig.prefix}-${mergedConfig.componentName}--${mergedConfig.orientation}`);
  
  // Apply variant class if not full-width
  if (mergedConfig.variant !== 'full-width') {
    element.classList.add(`${mergedConfig.prefix}-${mergedConfig.componentName}--${mergedConfig.variant}`);
  }
  
  // Apply initial styles
  if (mergedConfig.orientation === 'horizontal') {
    element.style.height = `${mergedConfig.thickness}px`;
    element.style.width = '100%';
    
    // Apply inset if needed
    if (mergedConfig.variant === 'inset' || mergedConfig.variant === 'middle-inset') {
      const insetStart = mergedConfig.insetStart !== undefined ? mergedConfig.insetStart : 16;
      const insetEnd = mergedConfig.insetEnd !== undefined ? mergedConfig.insetEnd : 
                     (mergedConfig.variant === 'middle-inset' ? 16 : 0);
      
      element.style.marginLeft = `${insetStart}px`;
      element.style.marginRight = `${insetEnd}px`;
    }
  } else {
    element.style.width = `${mergedConfig.thickness}px`;
    element.style.height = '100%';
    
    // Apply inset if needed
    if (mergedConfig.variant === 'inset' || mergedConfig.variant === 'middle-inset') {
      const insetStart = mergedConfig.insetStart !== undefined ? mergedConfig.insetStart : 16;
      const insetEnd = mergedConfig.insetEnd !== undefined ? mergedConfig.insetEnd : 
                     (mergedConfig.variant === 'middle-inset' ? 16 : 0);
      
      element.style.marginTop = `${insetStart}px`;
      element.style.marginBottom = `${insetEnd}px`;
    }
  }
  
  // Apply color if provided
  if (mergedConfig.color) {
    element.style.backgroundColor = mergedConfig.color;
  }
  
  // Create the divider instance
  const divider: DividerComponent = {
    element,
    config: mergedConfig,
    
    getClass: (name: string = '') => {
      return `${mergedConfig.prefix}-${mergedConfig.componentName}${name ? '--' + name : ''}`;
    },
    
    getOrientation: () => mergedConfig.orientation as 'horizontal' | 'vertical',
    
    setOrientation: (orientation: 'horizontal' | 'vertical') => {
      // Remove existing orientation class
      element.classList.remove(`${mergedConfig.prefix}-${mergedConfig.componentName}--${mergedConfig.orientation}`);
      
      // Update config
      mergedConfig.orientation = orientation;
      
      // Add new orientation class
      element.classList.add(`${mergedConfig.prefix}-${mergedConfig.componentName}--${orientation}`);
      
      // Update styles
      if (orientation === 'horizontal') {
        element.style.height = `${mergedConfig.thickness}px`;
        element.style.width = '100%';
        
        // Reset vertical margins
        if (mergedConfig.variant !== 'full-width') {
          element.style.marginTop = '';
          element.style.marginBottom = '';
          
          // Apply horizontal margins
          const insetStart = mergedConfig.insetStart !== undefined ? mergedConfig.insetStart : 16;
          const insetEnd = mergedConfig.insetEnd !== undefined ? mergedConfig.insetEnd : 
                         (mergedConfig.variant === 'middle-inset' ? 16 : 0);
          
          element.style.marginLeft = `${insetStart}px`;
          element.style.marginRight = `${insetEnd}px`;
        }
      } else {
        element.style.width = `${mergedConfig.thickness}px`;
        element.style.height = '100%';
        
        // Reset horizontal margins
        if (mergedConfig.variant !== 'full-width') {
          element.style.marginLeft = '';
          element.style.marginRight = '';
          
          // Apply vertical margins
          const insetStart = mergedConfig.insetStart !== undefined ? mergedConfig.insetStart : 16;
          const insetEnd = mergedConfig.insetEnd !== undefined ? mergedConfig.insetEnd : 
                         (mergedConfig.variant === 'middle-inset' ? 16 : 0);
          
          element.style.marginTop = `${insetStart}px`;
          element.style.marginBottom = `${insetEnd}px`;
        }
      }
      
      return divider;
    },
    
    getVariant: () => mergedConfig.variant as 'full-width' | 'inset' | 'middle-inset',
    
    setVariant: (variant: 'full-width' | 'inset' | 'middle-inset') => {
      // Remove existing variant class if not full-width
      if (mergedConfig.variant !== 'full-width') {
        element.classList.remove(`${mergedConfig.prefix}-${mergedConfig.componentName}--${mergedConfig.variant}`);
      }
      
      // Add new variant class if not full-width
      if (variant !== 'full-width') {
        element.classList.add(`${mergedConfig.prefix}-${mergedConfig.componentName}--${variant}`);
      }
      
      // Update config
      mergedConfig.variant = variant;
      
      // Update inset styles
      if (variant === 'full-width') {
        // Reset margins
        if (mergedConfig.orientation === 'horizontal') {
          element.style.marginLeft = '';
          element.style.marginRight = '';
        } else {
          element.style.marginTop = '';
          element.style.marginBottom = '';
        }
      } else {
        const insetStart = mergedConfig.insetStart !== undefined ? mergedConfig.insetStart : 16;
        const insetEnd = mergedConfig.insetEnd !== undefined ? mergedConfig.insetEnd : 
                       (variant === 'middle-inset' ? 16 : 0);
        
        if (mergedConfig.orientation === 'horizontal') {
          element.style.marginLeft = `${insetStart}px`;
          element.style.marginRight = `${insetEnd}px`;
        } else {
          element.style.marginTop = `${insetStart}px`;
          element.style.marginBottom = `${insetEnd}px`;
        }
      }
      
      return divider;
    },
    
    setInset: (insetStart?: number, insetEnd?: number) => {
      if (mergedConfig.variant !== 'full-width') {
        if (mergedConfig.orientation === 'horizontal') {
          if (insetStart !== undefined) {
            element.style.marginLeft = `${insetStart}px`;
            mergedConfig.insetStart = insetStart;
          }
          
          if (insetEnd !== undefined) {
            element.style.marginRight = `${insetEnd}px`;
            mergedConfig.insetEnd = insetEnd;
          }
        } else {
          if (insetStart !== undefined) {
            element.style.marginTop = `${insetStart}px`;
            mergedConfig.insetStart = insetStart;
          }
          
          if (insetEnd !== undefined) {
            element.style.marginBottom = `${insetEnd}px`;
            mergedConfig.insetEnd = insetEnd;
          }
        }
      }
      
      return divider;
    },
    
    setThickness: (thickness: number) => {
      mergedConfig.thickness = thickness;
      
      if (mergedConfig.orientation === 'horizontal') {
        element.style.height = `${thickness}px`;
      } else {
        element.style.width = `${thickness}px`;
      }
      
      return divider;
    },
    
    setColor: (color: string) => {
      mergedConfig.color = color;
      element.style.backgroundColor = color;
      return divider;
    }
  };
  
  return divider;
};

describe('Divider Component', () => {
  test('should create a divider element', () => {
    const divider = createMockDivider();
    expect(divider.element).toBeDefined();
    expect(divider.element.tagName).toBe('HR');
    expect(divider.element.className).toContain('mtrl-divider');
  });

  test('should apply custom class', () => {
    const customClass = 'custom-divider';
    const divider = createMockDivider({
      class: customClass
    });
    
    expect(divider.element.className).toContain(customClass);
  });

  test('should support horizontal orientation', () => {
    const divider = createMockDivider({
      orientation: 'horizontal'
    });
    
    expect(divider.element.className).toContain('mtrl-divider--horizontal');
    expect(divider.element.style.height).toBe('1px');
    expect(divider.element.style.width).toBe('100%');
  });

  test('should support vertical orientation', () => {
    const divider = createMockDivider({
      orientation: 'vertical'
    });
    
    expect(divider.element.className).toContain('mtrl-divider--vertical');
    expect(divider.element.style.width).toBe('1px');
    expect(divider.element.style.height).toBe('100%');
  });

  test('should support changing orientation', () => {
    const divider = createMockDivider({
      orientation: 'horizontal'
    });
    
    expect(divider.getOrientation()).toBe('horizontal');
    
    divider.setOrientation('vertical');
    
    expect(divider.getOrientation()).toBe('vertical');
    expect(divider.element.className).toContain('mtrl-divider--vertical');
    expect(divider.element.style.width).toBe('1px');
    expect(divider.element.style.height).toBe('100%');
  });

  test('should support full-width variant', () => {
    const divider = createMockDivider({
      variant: 'full-width'
    });
    
    expect(divider.getVariant()).toBe('full-width');
    expect(divider.element.style.marginLeft).toBe('');
    expect(divider.element.style.marginRight).toBe('');
  });

  test('should support inset variant', () => {
    const divider = createMockDivider({
      variant: 'inset'
    });
    
    expect(divider.getVariant()).toBe('inset');
    expect(divider.element.className).toContain('mtrl-divider--inset');
    expect(divider.element.style.marginLeft).toBe('16px');
    expect(divider.element.style.marginRight).toBe('0px');
  });

  test('should support middle-inset variant', () => {
    const divider = createMockDivider({
      variant: 'middle-inset'
    });
    
    expect(divider.getVariant()).toBe('middle-inset');
    expect(divider.element.className).toContain('mtrl-divider--middle-inset');
    expect(divider.element.style.marginLeft).toBe('16px');
    expect(divider.element.style.marginRight).toBe('16px');
  });

  test('should support changing variant', () => {
    const divider = createMockDivider({
      variant: 'full-width'
    });
    
    expect(divider.getVariant()).toBe('full-width');
    
    divider.setVariant('inset');
    
    expect(divider.getVariant()).toBe('inset');
    expect(divider.element.className).toContain('mtrl-divider--inset');
    expect(divider.element.style.marginLeft).toBe('16px');
    expect(divider.element.style.marginRight).toBe('0px');
  });

  test('should support custom inset values', () => {
    const divider = createMockDivider({
      variant: 'inset',
      insetStart: 24,
      insetEnd: 8
    });
    
    expect(divider.element.style.marginLeft).toBe('24px');
    expect(divider.element.style.marginRight).toBe('8px');
  });

  test('should support setting inset values', () => {
    const divider = createMockDivider({
      variant: 'inset'
    });
    
    divider.setInset(32, 16);
    
    expect(divider.element.style.marginLeft).toBe('32px');
    expect(divider.element.style.marginRight).toBe('16px');
  });

  test('should support setting thickness', () => {
    const divider = createMockDivider({
      orientation: 'horizontal'
    });
    
    expect(divider.element.style.height).toBe('1px');
    
    divider.setThickness(2);
    
    expect(divider.element.style.height).toBe('2px');
  });

  test('should support setting color', () => {
    const divider = createMockDivider();
    
    divider.setColor('#FF0000');
    
    // Different browsers may format colors differently (rgb vs hex)
    // We just need to verify the color was set to red, regardless of format
    const bgColor = divider.element.style.backgroundColor;
    
    // Check if it contains red components in any format
    expect(
      bgColor === '#FF0000' || 
      bgColor === 'rgb(255, 0, 0)' || 
      bgColor === 'rgba(255, 0, 0, 1)'
    ).toBe(true);
  });

  test('should handle orientation and variant together', () => {
    const divider = createMockDivider({
      orientation: 'horizontal',
      variant: 'inset'
    });
    
    expect(divider.element.style.marginLeft).toBe('16px');
    expect(divider.element.style.marginRight).toBe('0px');
    
    divider.setOrientation('vertical');
    
    expect(divider.element.style.marginLeft).toBe('');
    expect(divider.element.style.marginRight).toBe('');
    expect(divider.element.style.marginTop).toBe('16px');
    expect(divider.element.style.marginBottom).toBe('0px');
  });
});