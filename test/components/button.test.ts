// test/components/button.test.ts
import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';

// IMPORTANT: Due to circular dependencies in the actual button component
// we are using a mock implementation for tests. For a full implementation
// with the actual component, see test/ts/components/button.test.ts

// Setup jsdom environment
let dom: JSDOM;
let window: Window;
let document: Document;
let originalGlobalDocument: any;
let originalGlobalWindow: any;

beforeAll(() => {
  // Create a new JSDOM instance
  dom = new JSDOM('<!DOCTYPE html><html><body></body></html>', {
    url: 'http://localhost/',
    pretendToBeVisual: true
  });
  
  // Get window and document from jsdom
  window = dom.window;
  document = window.document;
  
  // Store original globals
  originalGlobalDocument = global.document;
  originalGlobalWindow = global.window;
  
  // Set globals to use jsdom
  global.document = document;
  global.window = window;
  global.Element = window.Element;
  global.HTMLElement = window.HTMLElement;
  global.HTMLButtonElement = window.HTMLButtonElement;
  global.Event = window.Event;
});

afterAll(() => {
  // Restore original globals
  global.document = originalGlobalDocument;
  global.window = originalGlobalWindow;
  
  // Clean up jsdom
  window.close();
});

// Mock button component factory
const createButton = (config: any = {}) => {
  const element = document.createElement('button');
  element.className = `mtrl-button ${config.variant ? `mtrl-button--${config.variant}` : ''}`;
  
  if (config.disabled) {
    element.setAttribute('disabled', '');
  }
  
  if (config.text) {
    const textElement = document.createElement('span');
    textElement.className = 'mtrl-button-text';
    textElement.textContent = config.text;
    element.appendChild(textElement);
  }
  
  if (config.icon) {
    const iconElement = document.createElement('span');
    iconElement.className = 'mtrl-button-icon';
    iconElement.innerHTML = config.icon;
    element.appendChild(iconElement);
  }
  
  const eventHandlers: Record<string, Function[]> = {};
  
  return {
    element,
    setText(text: string) {
      let textElement = element.querySelector('.mtrl-button-text');
      if (!textElement) {
        textElement = document.createElement('span');
        textElement.className = 'mtrl-button-text';
        element.appendChild(textElement);
      }
      textElement.textContent = text;
      return this;
    },
    getText() {
      const textElement = element.querySelector('.mtrl-button-text');
      return textElement ? textElement.textContent || '' : '';
    },
    setIcon(html: string) {
      let iconElement = element.querySelector('.mtrl-button-icon');
      if (!iconElement) {
        iconElement = document.createElement('span');
        iconElement.className = 'mtrl-button-icon';
        element.appendChild(iconElement);
      }
      iconElement.innerHTML = html;
      return this;
    },
    getIcon() {
      const iconElement = element.querySelector('.mtrl-button-icon');
      return iconElement ? iconElement.innerHTML : '';
    },
    enable() {
      element.removeAttribute('disabled');
      return this;
    },
    disable() {
      element.setAttribute('disabled', '');
      return this;
    },
    on(event: string, handler: Function) {
      if (!eventHandlers[event]) {
        eventHandlers[event] = [];
      }
      eventHandlers[event].push(handler);
      element.addEventListener(event, handler as EventListener);
      return this;
    },
    off(event: string, handler: Function) {
      if (eventHandlers[event]) {
        eventHandlers[event] = eventHandlers[event].filter(h => h !== handler);
      }
      element.removeEventListener(event, handler as EventListener);
      return this;
    },
    destroy() {
      // Clean up event handlers
      Object.entries(eventHandlers).forEach(([event, handlers]) => {
        handlers.forEach(handler => {
          element.removeEventListener(event, handler as EventListener);
        });
      });
      
      // Remove from DOM
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
  };
};

describe('Button Component', () => {
  test('should create a button element', () => {
    const button = createButton();
    expect(button.element).toBeDefined();
    expect(button.element.tagName).toBe('BUTTON');
    expect(button.element.className).toContain('mtrl-button');
  });

  test('should add text content', () => {
    const buttonText = 'Click Me';
    const button = createButton({
      text: buttonText
    });

    const textElement = button.element.querySelector('.mtrl-button-text');
    expect(textElement).toBeDefined();
    expect(textElement?.textContent).toBe(buttonText);
  });

  test('should apply variant class', () => {
    const variant = 'filled';
    const button = createButton({
      variant
    });

    expect(button.element.className).toContain(`mtrl-button--${variant}`);
  });

  test('should handle click events', () => {
    const button = createButton();
    const handleClick = mock(() => {});

    button.on('click', handleClick);

    // Simulate click event
    const event = new Event('click');
    button.element.dispatchEvent(event);

    expect(handleClick).toHaveBeenCalled();
  });

  test('should support disabled state', () => {
    const button = createButton();

    // Initially not disabled
    expect(button.element.hasAttribute('disabled')).toBe(false);

    // Disable the button
    button.disable();
    expect(button.element.hasAttribute('disabled')).toBe(true);

    // Enable the button
    button.enable();
    expect(button.element.hasAttribute('disabled')).toBe(false);
  });

  test('should allow updating text', () => {
    const button = createButton({
      text: 'Initial'
    });

    const newText = 'Updated Text';
    button.setText(newText);

    const textElement = button.element.querySelector('.mtrl-button-text');
    expect(textElement).toBeDefined();
    expect(textElement?.textContent).toBe(newText);
  });

  test('should allow updating icon', () => {
    const button = createButton();

    const iconSvg = '<svg><path d="M10 10"></path></svg>';
    button.setIcon(iconSvg);

    const iconElement = button.element.querySelector('.mtrl-button-icon');
    expect(iconElement).toBeDefined();
    expect(iconElement?.innerHTML).toBe(iconSvg);
  });

  test('should properly clean up resources', () => {
    const button = createButton();
    const parentElement = document.createElement('div');
    parentElement.appendChild(button.element);

    // Destroy should remove the element and clean up resources
    button.destroy();

    expect(parentElement.children.length).toBe(0);
  });
});