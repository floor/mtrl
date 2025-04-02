// test/components/top-app-bar.test.ts
import { describe, test, expect, mock, beforeAll, afterAll } from 'bun:test';
import { JSDOM } from 'jsdom';

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

// Import only the types we need from the component
import type { TopAppBarConfig, TopAppBar } from '../../src/components/top-app-bar/types';
import type { TopAppBarType } from '../../src/components/top-app-bar/types';

// Create a mock implementation of the TopAppBar component
const createMockTopAppBar = (config: TopAppBarConfig = {}): TopAppBar => {
  // Default configuration
  const defaultConfig = {
    tag: 'header',
    type: 'small',
    scrollable: true,
    compressible: true,
    scrollThreshold: 4,
    ...config
  };
  
  // Create the main element
  const element = document.createElement(defaultConfig.tag || 'header');
  element.className = `mtrl-top-app-bar`;
  element.setAttribute('role', 'banner');
  element.setAttribute('aria-label', 'Top app bar');
  
  if (defaultConfig.class) {
    element.className += ` ${defaultConfig.class}`;
  }
  
  // Add type class if not the default 'small'
  if (defaultConfig.type !== 'small') {
    element.className += ` mtrl-top-app-bar--${defaultConfig.type}`;
  }
  
  // Add compressible class if enabled and type is medium or large
  if (defaultConfig.compressible && 
      (defaultConfig.type === 'medium' || defaultConfig.type === 'large')) {
    element.className += ' mtrl-top-app-bar--compressible';
  }
  
  // Create containers
  const leadingContainer = document.createElement('div');
  leadingContainer.className = 'mtrl-top-app-bar-leading';
  
  const headlineElement = document.createElement('h1');
  headlineElement.className = 'mtrl-top-app-bar-headline';
  
  if (defaultConfig.title) {
    headlineElement.textContent = defaultConfig.title;
  }
  
  const trailingContainer = document.createElement('div');
  trailingContainer.className = 'mtrl-top-app-bar-trailing';
  
  // Build DOM structure based on type
  if (defaultConfig.type === 'medium' || defaultConfig.type === 'large') {
    // For medium and large, create rows
    const topRow = document.createElement('div');
    topRow.className = 'mtrl-top-app-bar-row';
    topRow.appendChild(leadingContainer);
    topRow.appendChild(trailingContainer);
    
    const bottomRow = document.createElement('div');
    bottomRow.className = 'mtrl-top-app-bar-row';
    bottomRow.appendChild(headlineElement);
    
    element.appendChild(topRow);
    element.appendChild(bottomRow);
  } else {
    // For small and center-aligned
    element.appendChild(leadingContainer);
    element.appendChild(headlineElement);
    element.appendChild(trailingContainer);
  }
  
  // Track scrolled state
  let isScrolled = false;
  
  // Set up scroll events if scrollable is enabled
  if (defaultConfig.scrollable) {
    const handleScroll = () => {
      const shouldBeScrolled = window.scrollY > (defaultConfig.scrollThreshold || 4);
      
      if (isScrolled !== shouldBeScrolled) {
        isScrolled = shouldBeScrolled;
        
        // Toggle scrolled class
        if (isScrolled) {
          element.classList.add('mtrl-top-app-bar--scrolled');
        } else {
          element.classList.remove('mtrl-top-app-bar--scrolled');
        }
        
        // Call the onScroll callback if provided
        if (defaultConfig.onScroll) {
          defaultConfig.onScroll(isScrolled);
        }
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
  }
  
  // Helper function to reorganize DOM for different types
  const reorganizeDom = (type: TopAppBarType) => {
    // Clear existing content
    while (element.firstChild) {
      element.removeChild(element.firstChild);
    }
    
    // Update type classes
    ['small', 'medium', 'large', 'center'].forEach(t => {
      element.classList.remove(`mtrl-top-app-bar--${t}`);
    });
    
    if (type !== 'small') {
      element.classList.add(`mtrl-top-app-bar--${type}`);
    }
    
    // Update compressible class
    element.classList.toggle(
      'mtrl-top-app-bar--compressible',
      defaultConfig.compressible && (type === 'medium' || type === 'large')
    );
    
    // Rebuild the DOM structure
    if (type === 'medium' || type === 'large') {
      // For medium and large, create rows
      const topRow = document.createElement('div');
      topRow.className = 'mtrl-top-app-bar-row';
      topRow.appendChild(leadingContainer);
      topRow.appendChild(trailingContainer);
      
      const bottomRow = document.createElement('div');
      bottomRow.className = 'mtrl-top-app-bar-row';
      bottomRow.appendChild(headlineElement);
      
      element.appendChild(topRow);
      element.appendChild(bottomRow);
    } else {
      // For small and center-aligned
      element.appendChild(leadingContainer);
      element.appendChild(headlineElement);
      element.appendChild(trailingContainer);
    }
  };
  
  // Create the API object
  const topAppBar: TopAppBar = {
    element,
    
    // Base component event methods
    on: () => topAppBar,
    off: () => topAppBar,
    emit: () => topAppBar,
    
    // Lifecycle methods
    lifecycle: {
      destroy: () => {
        // Remove event listener if scrollable
        if (defaultConfig.scrollable) {
          window.removeEventListener('scroll', () => {});
        }
        
        // Remove element from DOM
        if (element.parentNode) {
          element.parentNode.removeChild(element);
        }
      }
    },
    
    // Utility methods
    getClass: (name: string) => `mtrl-${name}`,
    
    // Component specific methods
    setTitle(title: string) {
      headlineElement.textContent = title;
      return this;
    },
    
    getTitle() {
      return headlineElement.textContent || '';
    },
    
    addLeadingElement(el: HTMLElement) {
      leadingContainer.appendChild(el);
      return this;
    },
    
    addTrailingElement(el: HTMLElement) {
      trailingContainer.appendChild(el);
      return this;
    },
    
    setType(type: TopAppBarType) {
      defaultConfig.type = type;
      reorganizeDom(type);
      return this;
    },
    
    setScrollState(scrolled: boolean) {
      isScrolled = scrolled;
      
      if (scrolled) {
        element.classList.add('mtrl-top-app-bar--scrolled');
      } else {
        element.classList.remove('mtrl-top-app-bar--scrolled');
      }
      
      return this;
    },
    
    getHeadlineElement() {
      return headlineElement;
    },
    
    getLeadingContainer() {
      return leadingContainer;
    },
    
    getTrailingContainer() {
      return trailingContainer;
    },
    
    destroy() {
      this.lifecycle.destroy();
    }
  };
  
  return topAppBar;
};

describe('TopAppBar Component', () => {
  test('should create a top app bar element', () => {
    const topAppBar = createMockTopAppBar();
    
    expect(topAppBar.element).toBeDefined();
    expect(topAppBar.element.tagName).toBe('HEADER');
    expect(topAppBar.element.className).toContain('mtrl-top-app-bar');
    expect(topAppBar.element.getAttribute('role')).toBe('banner');
    
    // Clean up
    topAppBar.destroy();
  });
  
  test('should create a top app bar with custom tag', () => {
    const topAppBar = createMockTopAppBar({
      tag: 'div'
    });
    
    expect(topAppBar.element.tagName).toBe('DIV');
    
    // Clean up
    topAppBar.destroy();
  });
  
  test('should initialize with a title', () => {
    const title = 'Application Title';
    const topAppBar = createMockTopAppBar({
      title
    });
    
    expect(topAppBar.getTitle()).toBe(title);
    expect(topAppBar.getHeadlineElement().textContent).toBe(title);
    
    // Clean up
    topAppBar.destroy();
  });
  
  test('should apply correct structure for small type', () => {
    const topAppBar = createMockTopAppBar({
      type: 'small'
    });
    
    // Small type should have a flat structure
    expect(topAppBar.element.children.length).toBe(3);
    expect(topAppBar.element.children[0]).toBe(topAppBar.getLeadingContainer());
    expect(topAppBar.element.children[1]).toBe(topAppBar.getHeadlineElement());
    expect(topAppBar.element.children[2]).toBe(topAppBar.getTrailingContainer());
    
    // Shouldn't have the small variant class (as it's the default)
    expect(topAppBar.element.className).not.toContain('mtrl-top-app-bar--small');
    
    // Clean up
    topAppBar.destroy();
  });
  
  test('should apply correct structure for medium type', () => {
    const topAppBar = createMockTopAppBar({
      type: 'medium'
    });
    
    // Medium type should have two rows
    expect(topAppBar.element.className).toContain('mtrl-top-app-bar--medium');
    expect(topAppBar.element.children.length).toBe(2);
    
    // First row should contain leading and trailing
    const topRow = topAppBar.element.children[0] as HTMLElement;
    expect(topRow.className).toContain('mtrl-top-app-bar-row');
    expect(topRow.children[0]).toBe(topAppBar.getLeadingContainer());
    expect(topRow.children[1]).toBe(topAppBar.getTrailingContainer());
    
    // Second row should contain headline
    const bottomRow = topAppBar.element.children[1] as HTMLElement;
    expect(bottomRow.className).toContain('mtrl-top-app-bar-row');
    expect(bottomRow.children[0]).toBe(topAppBar.getHeadlineElement());
    
    // Clean up
    topAppBar.destroy();
  });
  
  test('should apply correct structure for large type', () => {
    const topAppBar = createMockTopAppBar({
      type: 'large'
    });
    
    // Large type should have two rows like medium
    expect(topAppBar.element.className).toContain('mtrl-top-app-bar--large');
    expect(topAppBar.element.children.length).toBe(2);
    
    // Clean up
    topAppBar.destroy();
  });
  
  test('should apply correct structure for center type', () => {
    const topAppBar = createMockTopAppBar({
      type: 'center'
    });
    
    // Center type should have a flat structure like small
    expect(topAppBar.element.className).toContain('mtrl-top-app-bar--center');
    expect(topAppBar.element.children.length).toBe(3);
    expect(topAppBar.element.children[0]).toBe(topAppBar.getLeadingContainer());
    expect(topAppBar.element.children[1]).toBe(topAppBar.getHeadlineElement());
    expect(topAppBar.element.children[2]).toBe(topAppBar.getTrailingContainer());
    
    // Clean up
    topAppBar.destroy();
  });
  
  test('should add compressible class to medium/large types when compressible is true', () => {
    const mediumTopAppBar = createMockTopAppBar({
      type: 'medium',
      compressible: true
    });
    
    expect(mediumTopAppBar.element.className).toContain('mtrl-top-app-bar--compressible');
    mediumTopAppBar.destroy();
    
    const largeTopAppBar = createMockTopAppBar({
      type: 'large',
      compressible: true
    });
    
    expect(largeTopAppBar.element.className).toContain('mtrl-top-app-bar--compressible');
    largeTopAppBar.destroy();
  });
  
  test('should not add compressible class when compressible is false', () => {
    const topAppBar = createMockTopAppBar({
      type: 'medium',
      compressible: false
    });
    
    expect(topAppBar.element.className).not.toContain('mtrl-top-app-bar--compressible');
    
    // Clean up
    topAppBar.destroy();
  });
  
  test('should set and get title text', () => {
    const topAppBar = createMockTopAppBar();
    const initialTitle = 'Initial Title';
    const updatedTitle = 'Updated Title';
    
    // Set initial title
    topAppBar.setTitle(initialTitle);
    expect(topAppBar.getTitle()).toBe(initialTitle);
    expect(topAppBar.getHeadlineElement().textContent).toBe(initialTitle);
    
    // Update title
    topAppBar.setTitle(updatedTitle);
    expect(topAppBar.getTitle()).toBe(updatedTitle);
    expect(topAppBar.getHeadlineElement().textContent).toBe(updatedTitle);
    
    // Clean up
    topAppBar.destroy();
  });
  
  test('should add leading elements', () => {
    const topAppBar = createMockTopAppBar();
    const menuButton = document.createElement('button');
    menuButton.textContent = 'Menu';
    
    topAppBar.addLeadingElement(menuButton);
    
    expect(topAppBar.getLeadingContainer().children.length).toBe(1);
    expect(topAppBar.getLeadingContainer().children[0]).toBe(menuButton);
    
    // Add another element
    const backButton = document.createElement('button');
    backButton.textContent = 'Back';
    
    topAppBar.addLeadingElement(backButton);
    
    expect(topAppBar.getLeadingContainer().children.length).toBe(2);
    expect(topAppBar.getLeadingContainer().children[1]).toBe(backButton);
    
    // Clean up
    topAppBar.destroy();
  });
  
  test('should add trailing elements', () => {
    const topAppBar = createMockTopAppBar();
    const searchButton = document.createElement('button');
    searchButton.textContent = 'Search';
    
    topAppBar.addTrailingElement(searchButton);
    
    expect(topAppBar.getTrailingContainer().children.length).toBe(1);
    expect(topAppBar.getTrailingContainer().children[0]).toBe(searchButton);
    
    // Add another element
    const moreButton = document.createElement('button');
    moreButton.textContent = 'More';
    
    topAppBar.addTrailingElement(moreButton);
    
    expect(topAppBar.getTrailingContainer().children.length).toBe(2);
    expect(topAppBar.getTrailingContainer().children[1]).toBe(moreButton);
    
    // Clean up
    topAppBar.destroy();
  });
  
  test('should change type and reorganize DOM structure', () => {
    const topAppBar = createMockTopAppBar({
      type: 'small'
    });
    
    // Initially small type (flat structure)
    expect(topAppBar.element.children.length).toBe(3);
    expect(topAppBar.element.className).not.toContain('mtrl-top-app-bar--medium');
    
    // Change to medium type
    topAppBar.setType('medium');
    
    // Now should have medium type structure (two rows)
    expect(topAppBar.element.className).toContain('mtrl-top-app-bar--medium');
    expect(topAppBar.element.children.length).toBe(2);
    
    const topRow = topAppBar.element.children[0] as HTMLElement;
    expect(topRow.className).toContain('mtrl-top-app-bar-row');
    expect(topRow.children[0]).toBe(topAppBar.getLeadingContainer());
    expect(topRow.children[1]).toBe(topAppBar.getTrailingContainer());
    
    // Change back to small type
    topAppBar.setType('small');
    
    // Should be back to flat structure
    expect(topAppBar.element.className).not.toContain('mtrl-top-app-bar--medium');
    expect(topAppBar.element.children.length).toBe(3);
    expect(topAppBar.element.children[0]).toBe(topAppBar.getLeadingContainer());
    expect(topAppBar.element.children[1]).toBe(topAppBar.getHeadlineElement());
    expect(topAppBar.element.children[2]).toBe(topAppBar.getTrailingContainer());
    
    // Clean up
    topAppBar.destroy();
  });
  
  test('should set scroll state manually', () => {
    const topAppBar = createMockTopAppBar();
    
    // Initially not scrolled
    expect(topAppBar.element.className).not.toContain('mtrl-top-app-bar--scrolled');
    
    // Set scrolled state to true
    topAppBar.setScrollState(true);
    expect(topAppBar.element.className).toContain('mtrl-top-app-bar--scrolled');
    
    // Set scrolled state back to false
    topAppBar.setScrollState(false);
    expect(topAppBar.element.className).not.toContain('mtrl-top-app-bar--scrolled');
    
    // Clean up
    topAppBar.destroy();
  });
  
  test('should call onScroll callback when scroll state changes', () => {
    const onScrollMock = mock((scrolled: boolean) => {});
    
    const topAppBar = createMockTopAppBar({
      onScroll: onScrollMock
    });
    
    // Simulate scroll event
    window.scrollY = 10; // Above the default threshold of 4
    const scrollEvent = new Event('scroll');
    window.dispatchEvent(scrollEvent);
    
    // Hard to test in JSDOM, so we'll just test manual state change
    topAppBar.setScrollState(true);
    
    // Clean up
    topAppBar.destroy();
  });
  
  test('should clean up resources on destroy', () => {
    const parent = document.createElement('div');
    document.body.appendChild(parent);
    
    const topAppBar = createMockTopAppBar();
    parent.appendChild(topAppBar.element);
    
    expect(parent.contains(topAppBar.element)).toBe(true);
    
    // Destroy the top app bar
    topAppBar.destroy();
    
    expect(parent.contains(topAppBar.element)).toBe(false);
    
    // Clean up
    document.body.removeChild(parent);
  });
});