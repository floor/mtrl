// test/core/layout.test.ts
import { describe, test, expect, beforeEach, afterEach, spyOn, mock } from 'bun:test';
import { JSDOM } from 'jsdom';

// Setup JSDOM environment
let dom: JSDOM;
let document: Document;
let window: Window;

// Modules that will be tested
import { 
  createLayout, 
  processSchema, 
  isComponent, 
  processClassNames, 
  applyLayoutClasses, 
  applyLayoutItemClasses,
  getLayoutType,
  cleanupLayoutClasses
} from '../../src/core/layout';

// Mock createElement for testing
import * as domCreate from '../../src/core/dom/create';

describe('Layout Module', () => {
  // Setup and teardown for each test
  beforeEach(() => {
    // Setup JSDOM environment
    dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
      url: 'http://localhost/',
      contentType: 'text/html',
    });

    global.window = dom.window as any;
    global.document = dom.window.document;
    global.HTMLElement = dom.window.HTMLElement;
    global.DocumentFragment = dom.window.DocumentFragment;
    global.Element = dom.window.Element;
    global.Node = dom.window.Node;
  });

  afterEach(() => {
    // Clean up
    delete global.window;
    delete global.document;
    delete global.HTMLElement;
    delete global.DocumentFragment;
    delete global.Element;
    delete global.Node;
  });

  describe('createLayout', () => {
    test('should create a layout from an HTML string', () => {
      const layout = createLayout('<div class="test">Hello</div>');
      expect(layout).toBeDefined();
      expect(layout.element).toBeDefined();
      expect(layout.element.textContent).toBe('Hello');
      expect(layout.element.className).toBe('test');
    });

    test('should create a layout from an array schema', () => {
      const mockComponent = { element: document.createElement('div') };
      const mockCreator = mock(() => mockComponent);

      const layout = createLayout([
        mockCreator, 'testComponent', { text: 'Hello' }
      ]);

      expect(layout).toBeDefined();
      expect(layout.element).toBeDefined();
      expect(layout.get('testComponent')).toBe(mockComponent);
    });

    test('should create a layout from an object schema', () => {
      const mockComponent = { element: document.createElement('div') };
      const mockCreator = mock(() => mockComponent);

      const layout = createLayout({
        element: {
          creator: mockCreator,
          options: { text: 'Hello' },
          name: 'testComponent'
        }
      });

      expect(layout).toBeDefined();
      expect(layout.element).toBeDefined();
      expect(layout.get('testComponent')).toBeDefined();
    });
    
    test('should handle function schema that returns an array', () => {
      const mockComponent = { element: document.createElement('div') };
      const mockCreator = mock(() => mockComponent);
      
      const schemaFn = () => [
        mockCreator, 'testComponent', { text: 'Hello' }
      ];
      
      const layout = createLayout(schemaFn);
      expect(layout).toBeDefined();
      expect(layout.element).toBeDefined();
      expect(layout.get('testComponent')).toBe(mockComponent);
    });
    
    test('should apply default options when provided', () => {
      const mockCreator = mock((options) => {
        const div = document.createElement('div');
        div.textContent = options.text || '';
        div.className = options.class || '';
        return div;
      });
      
      const layout = createLayout(
        [
          'container', { text: 'Container' },
          [
            'item', { text: 'Item' }
          ]
        ],
        null,
        { creator: mockCreator }
      );
      
      expect(layout).toBeDefined();
      expect(layout.element).toBeDefined();
      expect(layout.element.textContent).toBe('Container');
      expect(mockCreator).toHaveBeenCalled();
    });
  });

  describe('processSchema', () => {
    test('should process array schema correctly', () => {
      const mockComponent = { element: document.createElement('div') };
      const mockCreator = mock(() => mockComponent);

      const result = processSchema([
        mockCreator, 'testComponent', { text: 'Hello' }
      ]);

      expect(result).toBeDefined();
      expect(result.layout.testComponent).toBe(mockComponent);
      expect(result.get('testComponent')).toBe(mockComponent);
    });

    test('should process object schema correctly', () => {
      const mockComponent = { element: document.createElement('div') };
      const mockCreator = mock(() => mockComponent);

      const result = processSchema({
        testComponent: {
          creator: mockCreator,
          options: { text: 'Hello' }
        }
      });

      expect(result).toBeDefined();
      expect(result.layout.testComponent).toBeDefined();
      expect(result.get('testComponent')).toBeDefined();
    });
    
    test('should warn and return empty result for null schema', () => {
      // Mock console.warn
      const originalWarn = console.warn;
      let warningCalled = false;
      console.warn = () => { warningCalled = true; };
      
      const result = processSchema(null);
      
      expect(warningCalled).toBe(true);
      expect(result).toBeDefined();
      expect(result.layout).toEqual({});
      
      // Restore console.warn
      console.warn = originalWarn;
    });
    
    test('should use provided parent element', () => {
      const parent = document.createElement('div');
      const mockCreator = mock((options) => {
        const div = document.createElement('div');
        div.textContent = options.text || '';
        return div;
      });
      
      const result = processSchema([
        mockCreator, 'testComponent', { text: 'Hello' }
      ], parent);
      
      expect(parent.childNodes.length).toBe(1);
    });
  });

  describe('Array Schema Processing', () => {
    test('should process a simple array schema', () => {
      const layout = createLayout([
        'div', { text: 'Hello', class: 'test' }
      ]);
      
      expect(layout.element).toBeDefined();
      expect(layout.element.textContent).toBe('Hello');
      expect(layout.element.className).toContain('mtrl-test');
    });
    
    test('should process nested array schema', () => {
      const layout = createLayout([
        'container', { class: 'container' },
        [
          'child', { class: 'child', text: 'Child' }
        ]
      ]);
      
      expect(layout.element).toBeDefined();
      expect(layout.element.className).toContain('mtrl-container');
      expect(layout.element.firstChild).toBeDefined();
      expect((layout.element.firstChild as HTMLElement).className).toContain('mtrl-child');
    });
    
    test('should skip invalid items in array schema', () => {
      const layout = createLayout([
        'container', { class: 'container' },
        null, // Should be skipped
        undefined, // Should be skipped
        [
          'child', { class: 'child', text: 'Child' }
        ]
      ]);
      
      expect(layout.element).toBeDefined();
      expect(layout.element.className).toContain('mtrl-container');
      expect(layout.element.childNodes.length).toBe(1);
    });
    
    test('should handle creator function with options but no name', () => {
      const mockComponent = { element: document.createElement('div') };
      const mockCreator = mock(() => mockComponent);
      
      const layout = createLayout([
        mockCreator, { text: 'Hello' },
      ]);
      
      expect(layout.element).toBeDefined();
      expect(layout.element).toBe(mockComponent.element);
      expect(mockCreator).toHaveBeenCalledWith({ text: 'Hello' });
    });
    
    test('should handle additional options after main options', () => {
      const mockComponent = { element: document.createElement('div') };
      const mockCreator = mock(() => mockComponent);
      
      const layout = createLayout([
        mockCreator, 'testComponent', { text: 'Hello' }, { prefix: false }
      ]);
      
      expect(layout.element).toBeDefined();
      expect(layout.get('testComponent')).toBeDefined();
      expect(mockCreator).toHaveBeenCalledWith({ text: 'Hello', prefix: false });
    });
  });

  describe('Object Schema Processing', () => {
    test('should process a simple object schema', () => {
      const layout = createLayout({
        element: {
          options: { tag: 'div', text: 'Hello', class: 'test' }
        }
      });
      
      expect(layout.element).toBeDefined();
      expect(layout.element.textContent).toBe('Hello');
      expect(layout.element.className).toContain('mtrl-test');
    });
    
    test('should process object schema with children', () => {
      const layout = createLayout({
        element: {
          options: { tag: 'div', class: 'container' },
          children: {
            child: {
              options: { tag: 'div', class: 'child', text: 'Child' }
            }
          }
        }
      });
      
      expect(layout.element).toBeDefined();
      expect(layout.element.className).toContain('mtrl-container');
      expect(layout.element.firstChild).toBeDefined();
      expect((layout.element.firstChild as HTMLElement).className).toContain('mtrl-child');
    });
    
    test('should handle custom creator functions in object schema', () => {
      const mockComponent = { element: document.createElement('div') };
      const mockCreator = mock(() => mockComponent);
      
      const layout = createLayout({
        element: {
          creator: mockCreator,
          options: { text: 'Hello' }
        }
      });
      
      expect(layout.element).toBeDefined();
      expect(layout.element).toBe(mockComponent);
      expect(mockCreator).toHaveBeenCalled();
    });
    
    test('should process object schema without element property', () => {
      const mockComponent = { element: document.createElement('div') };
      const mockCreator = mock(() => mockComponent);
      
      const layout = createLayout({
        testComponent: {
          creator: mockCreator,
          options: { text: 'Hello' }
        }
      });
      
      expect(layout.get('testComponent')).toBeDefined();
      expect(layout.get('testComponent')).toBe(mockComponent);
    });
  });

  describe('LayoutResult Methods', () => {
    test('get should return component by name', () => {
      const mockComponent = { element: document.createElement('div') };
      const mockCreator = mock(() => mockComponent);
      
      const layout = createLayout([
        mockCreator, 'testComponent', { text: 'Hello' }
      ]);
      
      expect(layout.get('testComponent')).toBe(mockComponent);
      expect(layout.get('nonExistentComponent')).toBeNull();
    });
    
    test('getAll should return all components', () => {
      const mockComponent1 = { element: document.createElement('div') };
      const mockComponent2 = { element: document.createElement('div') };
      const mockCreator1 = mock(() => mockComponent1);
      const mockCreator2 = mock(() => mockComponent2);
      
      const layout = createLayout([
        mockCreator1, 'testComponent1', { text: 'Hello 1' },
        mockCreator2, 'testComponent2', { text: 'Hello 2' }
      ]);
      
      const allComponents = layout.getAll();
      expect(allComponents.testComponent1).toBe(mockComponent1);
      expect(allComponents.testComponent2).toBe(mockComponent2);
    });
    
    test('destroy should clean up components', () => {
      const mockDestroy = mock(() => {});
      const mockComponent = { 
        element: document.createElement('div'),
        destroy: mockDestroy
      };
      const mockCreator = mock(() => mockComponent);
      
      const layout = createLayout([
        mockCreator, 'testComponent', { text: 'Hello' }
      ]);
      
      layout.destroy();
      expect(mockDestroy).toHaveBeenCalled();
    });
    
    test('destroy should remove elements from the DOM', () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      
      const layout = createLayout(
        [
          'div', { text: 'Hello' }
        ],
        parent
      );
      
      expect(parent.childNodes.length).toBe(1);
      layout.destroy();
      expect(parent.childNodes.length).toBe(0);
    });
  });

  describe('Component Creation', () => {
    test('should create component instance from constructor', () => {
      // Mock a class constructor and instance
      class MockComponent {
        element: HTMLElement;
        constructor(options) {
          this.element = document.createElement('div');
          this.element.textContent = options.text || '';
        }
      }
      
      const layout = createLayout([
        MockComponent, 'testComponent', { text: 'Hello' }
      ]);
      
      expect(layout.get('testComponent')).toBeInstanceOf(MockComponent);
      expect(layout.get('testComponent').element.textContent).toBe('Hello');
    });
    
    test('should create component instance from factory function', () => {
      const createMockComponent = (options) => {
        const element = document.createElement('div');
        element.textContent = options.text || '';
        return { element };
      };
      
      const layout = createLayout([
        createMockComponent, 'testComponent', { text: 'Hello' }
      ]);
      
      expect(layout.get('testComponent').element.textContent).toBe('Hello');
    });
    
    test('should handle errors during component creation', () => {
      // Mock console.error
      const originalError = console.error;
      let errorCalled = false;
      console.error = () => { errorCalled = true; };
      
      const brokenCreator = () => {
        throw new Error('Component creation failed');
      };
      
      const layout = createLayout([
        brokenCreator, 'testComponent', { text: 'Hello' }
      ]);
      
      expect(errorCalled).toBe(true);
      expect(layout.get('testComponent')).toBeDefined();
      expect(layout.get('testComponent') instanceof HTMLElement).toBe(true);
      
      // Restore console.error
      console.error = originalError;
    });
  });

  describe('Layout Configuration', () => {
    test('applyLayoutClasses should add correct classes', () => {
      const element = document.createElement('div');
      
      applyLayoutClasses(element, {
        type: 'grid',
        gap: 4,
        align: 'center',
        justify: 'between',
        columns: 3
      });
      
      expect(element.classList.contains('mtrl-layout--grid')).toBe(true);
      expect(element.classList.contains('mtrl-layout--grid-gap-4')).toBe(true);
      expect(element.classList.contains('mtrl-layout--grid-center')).toBe(true);
      expect(element.classList.contains('mtrl-layout--grid-justify-between')).toBe(true);
      expect(element.classList.contains('mtrl-layout--grid-cols-3')).toBe(true);
    });
    
    test('applyLayoutClasses should add row-specific classes', () => {
      const element = document.createElement('div');
      
      applyLayoutClasses(element, {
        type: 'row',
        wrap: false,
        mobileStack: true
      });
      
      expect(element.classList.contains('mtrl-layout--row')).toBe(true);
      expect(element.classList.contains('mtrl-layout--row-nowrap')).toBe(true);
      expect(element.classList.contains('mtrl-layout--row-mobile-stack')).toBe(true);
    });
    
    test('applyLayoutItemClasses should add correct item classes', () => {
      const element = document.createElement('div');
      
      applyLayoutItemClasses(element, {
        width: 6,
        sm: 12,
        md: 8,
        lg: 6,
        span: 2,
        rowSpan: 3,
        order: 'first',
        align: 'center'
      });
      
      expect(element.classList.contains('mtrl-layout__item')).toBe(true);
      expect(element.classList.contains('mtrl-layout__item--6')).toBe(true);
      expect(element.classList.contains('mtrl-layout__item--sm-12')).toBe(true);
      expect(element.classList.contains('mtrl-layout__item--md-8')).toBe(true);
      expect(element.classList.contains('mtrl-layout__item--lg-6')).toBe(true);
      expect(element.classList.contains('mtrl-layout__item--span-2')).toBe(true);
      expect(element.classList.contains('mtrl-layout__item--row-span-3')).toBe(true);
      expect(element.classList.contains('mtrl-layout__item--order-first')).toBe(true);
      expect(element.classList.contains('mtrl-layout__item--self-center')).toBe(true);
    });
  });

  describe('Layout Utilities', () => {
    test('isComponent should identify component-like objects', () => {
      expect(isComponent({ element: document.createElement('div') })).toBe(true);
      expect(isComponent(document.createElement('div'))).toBe(false);
      expect(isComponent(null)).toBe(false);
      expect(isComponent({})).toBe(false);
    });
    
    test('processClassNames should properly prefix classes', () => {
      const options = { class: 'test-class another-class' };
      const processed = processClassNames(options);
      
      expect(processed.class).toBe('mtrl-test-class mtrl-another-class');
    });
    
    test('processClassNames should not prefix classes with prefix setting disabled', () => {
      const options = { class: 'test-class', prefix: false };
      const processed = processClassNames(options);
      
      expect(processed.class).toBe('test-class');
    });
    
    test('processClassNames should handle both class and className', () => {
      const options = { 
        class: 'test-class',
        className: 'another-class' 
      };
      const processed = processClassNames(options);
      
      expect(processed.class).toBe('mtrl-test-class mtrl-another-class');
      expect(processed.className).toBeUndefined();
    });
    
    test('getLayoutType should detect layout type from classes', () => {
      const element = document.createElement('div');
      element.className = 'mtrl-layout--grid';
      
      expect(getLayoutType(element)).toBe('grid');
      
      element.className = 'mtrl-layout--stack';
      expect(getLayoutType(element)).toBe('stack');
      
      element.className = 'mtrl-layout--row';
      expect(getLayoutType(element)).toBe('row');
      
      element.className = 'some-other-class';
      expect(getLayoutType(element)).toBe('');
    });
    
    test('cleanupLayoutClasses should remove layout-related classes', () => {
      const element = document.createElement('div');
      element.className = 'mtrl-layout--grid mtrl-layout--grid-gap-4 some-other-class';
      
      cleanupLayoutClasses(element);
      
      expect(element.classList.contains('mtrl-layout--grid')).toBe(false);
      expect(element.classList.contains('mtrl-layout--grid-gap-4')).toBe(false);
      expect(element.classList.contains('some-other-class')).toBe(true);
    });
  });

  describe('Integration Tests', () => {
    test('should create complex nested layout with mixed creators', () => {
      // Mock component creators
      const createButton = (options) => {
        const button = document.createElement('button');
        button.textContent = options.text || '';
        button.className = options.class || '';
        return { element: button, text: options.text };
      };
      
      const createCard = (options) => {
        const card = document.createElement('div');
        card.className = `card ${options.class || ''}`;
        
        if (options.title) {
          const header = document.createElement('h3');
          header.textContent = options.title;
          card.appendChild(header);
        }
        
        if (options.content) {
          const content = document.createElement('div');
          content.textContent = options.content;
          card.appendChild(content);
        }
        
        return { element: card };
      };
      
      // Create a complex layout
      const layout = createLayout([
        'container', { class: 'container', layout: { type: 'grid', columns: 2, gap: 4 } },
        [
          createCard, 'card1', { 
            title: 'Card 1', 
            content: 'This is card 1 content',
            layoutItem: { width: 6 }
          },
          createCard, 'card2', { 
            title: 'Card 2', 
            content: 'This is card 2 content',
            layoutItem: { width: 6 }
          },
          'actions', { 
            class: 'actions', 
            layout: { type: 'row', justify: 'end', gap: 2 },
            layoutItem: { width: 12 }
          },
          [
            createButton, 'cancelBtn', { text: 'Cancel', class: 'btn-text' },
            createButton, 'saveBtn', { text: 'Save', class: 'btn-primary' }
          ]
        ]
      ]);
      
      // Verify structure
      expect(layout.element).toBeDefined();
      expect(layout.element.className).toContain('mtrl-container');
      expect(layout.element.className).toContain('mtrl-layout--grid');
      
      expect(layout.get('card1')).toBeDefined();
      expect(layout.get('card2')).toBeDefined();
      expect(layout.get('actions')).toBeDefined();
      expect(layout.get('cancelBtn')).toBeDefined();
      expect(layout.get('saveBtn')).toBeDefined();
      
      // Verify layout classes
      expect(layout.element.className).toContain('mtrl-layout--grid-cols-2');
      expect(layout.element.className).toContain('mtrl-layout--grid-gap-4');
      
      expect(layout.get('actions').element.className).toContain('mtrl-layout--row');
      expect(layout.get('actions').element.className).toContain('mtrl-layout--row-justify-end');
      
      // Verify layout item classes
      expect(layout.get('card1').element.className).toContain('mtrl-layout__item--6');
      expect(layout.get('actions').element.className).toContain('mtrl-layout__item--12');
    });
    
    test('should properly handle layout creation with custom options', () => {
      const parent = document.createElement('div');
      document.body.appendChild(parent);
      
      // Mock a custom creator as the default
      const defaultCreator = (options) => {
        const div = document.createElement('div');
        div.textContent = options.text || '';
        div.className = `custom-component ${options.class || ''}`;
        return div;
      };
      
      // Create layout with custom options
      const layout = createLayout(
        [
          'container', { text: 'Container' },
          [
            'item', { text: 'Item' }
          ]
        ],
        parent,
        { 
          creator: defaultCreator,
          prefix: false,
          theme: 'dark'
        }
      );
      
      // Verify the layout used our custom options
      expect(layout.element).toBeDefined();
      expect(layout.element.className).toContain('custom-component');
      expect(layout.element.textContent).toBe('Container');
      
      // Should not have prefixed classes
      expect(layout.element.className).not.toContain('mtrl-');
      
      // Verify parent attachment
      expect(parent.firstChild).toBe(layout.element);
    });
  });
});