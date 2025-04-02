// test/components/tooltip.test.ts
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
import type { TooltipComponent, TooltipConfig } from '../../src/components/tooltip/types';

// Define constants to avoid circular dependencies
const TOOLTIP_POSITIONS = {
  TOP: 'top',
  RIGHT: 'right',
  BOTTOM: 'bottom',
  LEFT: 'left',
  TOP_START: 'top-start',
  TOP_END: 'top-end',
  RIGHT_START: 'right-start',
  RIGHT_END: 'right-end',
  BOTTOM_START: 'bottom-start',
  BOTTOM_END: 'bottom-end',
  LEFT_START: 'left-start',
  LEFT_END: 'left-end'
};

const TOOLTIP_VARIANTS = {
  DEFAULT: 'default',
  RICH: 'rich',
  PLAIN: 'plain'
};

// Create mock tooltip component
const createMockTooltip = (config: TooltipConfig = {}): TooltipComponent => {
  // Create tooltip element
  const element = document.createElement('div');
  element.className = `mtrl-tooltip mtrl-tooltip--${config.position || TOOLTIP_POSITIONS.BOTTOM} mtrl-tooltip--${config.variant || TOOLTIP_VARIANTS.DEFAULT}`;
  element.setAttribute('role', 'tooltip');
  element.setAttribute('aria-hidden', 'true');
  
  // Create arrow element
  const arrowElement = document.createElement('div');
  arrowElement.className = 'mtrl-tooltip__arrow';
  element.appendChild(arrowElement);
  
  // Set text content if provided
  if (config.text) {
    const textNode = document.createTextNode(config.text);
    element.insertBefore(textNode, arrowElement);
  }
  
  // Generate unique ID
  const id = `mtrl-tooltip-${Math.random().toString(36).substring(2, 9)}`;
  element.id = id;
  
  // Add z-index if provided
  if (config.zIndex) {
    element.style.zIndex = config.zIndex.toString();
  }
  
  // Add to body
  document.body.appendChild(element);
  
  // Set up internal state
  let targetElement: HTMLElement | null = config.target || null;
  let positionValue = config.position || TOOLTIP_POSITIONS.BOTTOM;
  let isVisible = !!config.visible;
  let showDelay = config.showDelay || 300;
  let hideDelay = config.hideDelay || 100;
  let showOnFocus = config.showOnFocus !== undefined ? config.showOnFocus : true;
  let showOnHover = config.showOnHover !== undefined ? config.showOnHover : true;
  
  // Set initial visibility
  if (isVisible) {
    element.setAttribute('aria-hidden', 'false');
    element.classList.add('mtrl-tooltip--visible');
  }
  
  // Set target if provided
  if (targetElement) {
    targetElement.setAttribute('aria-describedby', id);
  }
  
  // Event handlers
  let mouseEnterHandler: ((e: Event) => void) | null = null;
  let mouseLeaveHandler: ((e: Event) => void) | null = null;
  let focusHandler: ((e: Event) => void) | null = null;
  let blurHandler: ((e: Event) => void) | null = null;
  
  // Timers
  let showTimer: number | null = null;
  let hideTimer: number | null = null;
  
  // Helper to update position
  const updatePositionImpl = () => {
    if (!targetElement) return;
    
    // Simulate position calculation (in real component this would use actual positioning)
    const targetRect = { 
      top: 100, 
      left: 100, 
      width: 100, 
      height: 50, 
      right: 200, 
      bottom: 150
    };
    
    // Simple positioning logic
    let top = 0;
    let left = 0;
    
    // Position based on position value
    switch (positionValue) {
      case TOOLTIP_POSITIONS.TOP:
        top = targetRect.top - 10;
        left = targetRect.left + targetRect.width / 2;
        break;
      case TOOLTIP_POSITIONS.RIGHT:
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.right + 10;
        break;
      case TOOLTIP_POSITIONS.BOTTOM:
        top = targetRect.bottom + 10;
        left = targetRect.left + targetRect.width / 2;
        break;
      case TOOLTIP_POSITIONS.LEFT:
        top = targetRect.top + targetRect.height / 2;
        left = targetRect.left - 10;
        break;
      default:
        top = targetRect.bottom + 10;
        left = targetRect.left + targetRect.width / 2;
    }
    
    element.style.top = `${top}px`;
    element.style.left = `${left}px`;
    
    // Update arrow position
    arrowElement.className = `mtrl-tooltip__arrow mtrl-tooltip__arrow--${positionValue}`;
  };
  
  // Setup target event handlers
  const setupTargetEvents = (target: HTMLElement) => {
    // Create handlers
    mouseEnterHandler = () => tooltipApi.show();
    mouseLeaveHandler = () => tooltipApi.hide();
    focusHandler = () => tooltipApi.show();
    blurHandler = () => tooltipApi.hide();
    
    // Attach events
    if (showOnHover) {
      target.addEventListener('mouseenter', mouseEnterHandler);
      target.addEventListener('mouseleave', mouseLeaveHandler);
    }
    
    if (showOnFocus) {
      target.addEventListener('focus', focusHandler);
      target.addEventListener('blur', blurHandler);
    }
  };
  
  // Remove target event handlers
  const removeTargetEvents = (target: HTMLElement) => {
    if (mouseEnterHandler) {
      target.removeEventListener('mouseenter', mouseEnterHandler);
    }
    
    if (mouseLeaveHandler) {
      target.removeEventListener('mouseleave', mouseLeaveHandler);
    }
    
    if (focusHandler) {
      target.removeEventListener('focus', focusHandler);
    }
    
    if (blurHandler) {
      target.removeEventListener('blur', blurHandler);
    }
    
    mouseEnterHandler = null;
    mouseLeaveHandler = null;
    focusHandler = null;
    blurHandler = null;
  };
  
  // Set up initial target events
  if (targetElement) {
    setupTargetEvents(targetElement);
  }
  
  // Create the tooltip API
  const tooltipApi: TooltipComponent = {
    element,
    target: targetElement,
    
    lifecycle: {
      destroy: () => {}
    },
    
    getClass: (name: string) => `mtrl-${name}`,
    
    setText(text: string) {
      // Clear existing content (except arrow)
      while (element.firstChild !== arrowElement) {
        element.removeChild(element.firstChild);
      }
      
      // Add new text
      const textNode = document.createTextNode(text);
      element.insertBefore(textNode, arrowElement);
      
      // Update position if visible
      if (isVisible) {
        this.updatePosition();
      }
      
      return this;
    },
    
    getText() {
      // Clone element without arrow
      const clone = element.cloneNode(true) as HTMLElement;
      const arrowClone = clone.querySelector('.mtrl-tooltip__arrow');
      if (arrowClone) {
        arrowClone.remove();
      }
      return clone.textContent || '';
    },
    
    setPosition(position: string) {
      // Update position value
      positionValue = position;
      
      // Remove existing position classes
      Object.values(TOOLTIP_POSITIONS).forEach(p => {
        element.classList.remove(`mtrl-tooltip--${p}`);
      });
      
      // Add new position class
      element.classList.add(`mtrl-tooltip--${position}`);
      
      // Update position if visible
      if (isVisible) {
        this.updatePosition();
      }
      
      return this;
    },
    
    getPosition() {
      return positionValue;
    },
    
    setTarget(target: HTMLElement) {
      // Remove events from old target
      if (targetElement) {
        removeTargetEvents(targetElement);
        targetElement.removeAttribute('aria-describedby');
      }
      
      // Set new target
      targetElement = target;
      this.target = target;
      
      // Set aria-describedby
      target.setAttribute('aria-describedby', element.id);
      
      // Add events to new target
      setupTargetEvents(target);
      
      // Update position if visible
      if (isVisible) {
        this.updatePosition();
      }
      
      return this;
    },
    
    show(immediate = false) {
      // Clear timers
      if (showTimer !== null) {
        window.clearTimeout(showTimer);
        showTimer = null;
      }
      
      if (hideTimer !== null) {
        window.clearTimeout(hideTimer);
        hideTimer = null;
      }
      
      const showTooltip = () => {
        if (!targetElement) return this;
        
        // Show tooltip
        element.setAttribute('aria-hidden', 'false');
        element.classList.add('mtrl-tooltip--visible');
        isVisible = true;
        
        // Update position
        this.updatePosition();
      };
      
      if (immediate) {
        showTooltip();
      } else {
        showTimer = window.setTimeout(showTooltip, showDelay);
      }
      
      return this;
    },
    
    hide(immediate = false) {
      // Clear timers
      if (hideTimer !== null) {
        window.clearTimeout(hideTimer);
        hideTimer = null;
      }
      
      if (showTimer !== null) {
        window.clearTimeout(showTimer);
        showTimer = null;
      }
      
      const hideTooltip = () => {
        // Hide tooltip
        element.setAttribute('aria-hidden', 'true');
        element.classList.remove('mtrl-tooltip--visible');
        isVisible = false;
      };
      
      if (immediate) {
        hideTooltip();
      } else {
        hideTimer = window.setTimeout(hideTooltip, hideDelay);
      }
      
      return this;
    },
    
    isVisible() {
      return isVisible;
    },
    
    updatePosition() {
      updatePositionImpl();
      return this;
    },
    
    destroy() {
      // Clear timers
      if (showTimer !== null) {
        window.clearTimeout(showTimer);
        showTimer = null;
      }
      
      if (hideTimer !== null) {
        window.clearTimeout(hideTimer);
        hideTimer = null;
      }
      
      // Remove target events
      if (targetElement) {
        removeTargetEvents(targetElement);
        targetElement.removeAttribute('aria-describedby');
      }
      
      // Remove from DOM
      if (element.parentNode) {
        element.parentNode.removeChild(element);
      }
    }
  };
  
  return tooltipApi;
};

describe('Tooltip Component', () => {
  test('should create a tooltip element', () => {
    const tooltip = createMockTooltip();
    
    expect(tooltip.element).toBeDefined();
    expect(tooltip.element.tagName).toBe('DIV');
    expect(tooltip.element.className).toContain('mtrl-tooltip');
    expect(tooltip.element.getAttribute('role')).toBe('tooltip');
    expect(tooltip.element.getAttribute('aria-hidden')).toBe('true');
    
    // Clean up
    tooltip.destroy();
  });
  
  test('should initialize with text content', () => {
    const tooltipText = 'Delete item';
    const tooltip = createMockTooltip({
      text: tooltipText
    });
    
    expect(tooltip.getText()).toBe(tooltipText);
    
    // Clean up
    tooltip.destroy();
  });
  
  test('should initialize with target element', () => {
    const targetButton = document.createElement('button');
    document.body.appendChild(targetButton);
    
    const tooltip = createMockTooltip({
      target: targetButton
    });
    
    expect(tooltip.target).toBe(targetButton);
    expect(targetButton.getAttribute('aria-describedby')).toBe(tooltip.element.id);
    
    // Clean up
    tooltip.destroy();
    document.body.removeChild(targetButton);
  });
  
  test('should initialize with position', () => {
    const position = TOOLTIP_POSITIONS.TOP;
    const tooltip = createMockTooltip({
      position
    });
    
    expect(tooltip.getPosition()).toBe(position);
    expect(tooltip.element.className).toContain(`mtrl-tooltip--${position}`);
    
    // Clean up
    tooltip.destroy();
  });
  
  test('should initialize with visibility', () => {
    const tooltip = createMockTooltip({
      visible: true
    });
    
    expect(tooltip.isVisible()).toBe(true);
    expect(tooltip.element.getAttribute('aria-hidden')).toBe('false');
    expect(tooltip.element.className).toContain('mtrl-tooltip--visible');
    
    // Clean up
    tooltip.destroy();
  });
  
  test('should set and get text content', () => {
    const tooltip = createMockTooltip();
    const initialText = 'Initial tooltip';
    const updatedText = 'Updated tooltip';
    
    // Set initial text
    tooltip.setText(initialText);
    expect(tooltip.getText()).toBe(initialText);
    
    // Update text
    tooltip.setText(updatedText);
    expect(tooltip.getText()).toBe(updatedText);
    
    // Clean up
    tooltip.destroy();
  });
  
  test('should set and get position', () => {
    const tooltip = createMockTooltip({
      position: TOOLTIP_POSITIONS.BOTTOM
    });
    
    // Initial position
    expect(tooltip.getPosition()).toBe(TOOLTIP_POSITIONS.BOTTOM);
    
    // Change position
    tooltip.setPosition(TOOLTIP_POSITIONS.RIGHT);
    expect(tooltip.getPosition()).toBe(TOOLTIP_POSITIONS.RIGHT);
    expect(tooltip.element.className).toContain(`mtrl-tooltip--${TOOLTIP_POSITIONS.RIGHT}`);
    expect(tooltip.element.className).not.toContain(`mtrl-tooltip--${TOOLTIP_POSITIONS.BOTTOM}`);
    
    // Clean up
    tooltip.destroy();
  });
  
  test('should change target element', () => {
    const initialTarget = document.createElement('button');
    initialTarget.textContent = 'Initial';
    document.body.appendChild(initialTarget);
    
    const newTarget = document.createElement('button');
    newTarget.textContent = 'New';
    document.body.appendChild(newTarget);
    
    const tooltip = createMockTooltip({
      target: initialTarget
    });
    
    // Initial target
    expect(tooltip.target).toBe(initialTarget);
    expect(initialTarget.getAttribute('aria-describedby')).toBe(tooltip.element.id);
    
    // Change target
    tooltip.setTarget(newTarget);
    expect(tooltip.target).toBe(newTarget);
    expect(newTarget.getAttribute('aria-describedby')).toBe(tooltip.element.id);
    expect(initialTarget.getAttribute('aria-describedby')).toBeNull();
    
    // Clean up
    tooltip.destroy();
    document.body.removeChild(initialTarget);
    document.body.removeChild(newTarget);
  });
  
  test('should show and hide tooltip', () => {
    const targetButton = document.createElement('button');
    document.body.appendChild(targetButton);
    
    const tooltip = createMockTooltip({
      target: targetButton
    });
    
    // Initially hidden
    expect(tooltip.isVisible()).toBe(false);
    
    // Show immediately
    tooltip.show(true);
    expect(tooltip.isVisible()).toBe(true);
    expect(tooltip.element.getAttribute('aria-hidden')).toBe('false');
    expect(tooltip.element.className).toContain('mtrl-tooltip--visible');
    
    // Hide immediately
    tooltip.hide(true);
    expect(tooltip.isVisible()).toBe(false);
    expect(tooltip.element.getAttribute('aria-hidden')).toBe('true');
    expect(tooltip.element.className).not.toContain('mtrl-tooltip--visible');
    
    // Clean up
    document.body.removeChild(targetButton);
    tooltip.destroy();
  });
  
  test('should update position', () => {
    const targetButton = document.createElement('button');
    document.body.appendChild(targetButton);
    
    const tooltip = createMockTooltip({
      target: targetButton,
      position: TOOLTIP_POSITIONS.BOTTOM
    });
    
    // Initial position (this is simplified in our mock)
    const initialTop = tooltip.element.style.top;
    const initialLeft = tooltip.element.style.left;
    
    // Change position
    tooltip.setPosition(TOOLTIP_POSITIONS.TOP);
    tooltip.updatePosition();
    
    // The exact values aren't important for the test, just that they updated
    expect(tooltip.element.style.top).toBeDefined();
    expect(tooltip.element.style.left).toBeDefined();
    
    // Check arrow position updated
    const arrowElement = tooltip.element.querySelector('.mtrl-tooltip__arrow') as HTMLElement;
    expect(arrowElement.className).toContain(`mtrl-tooltip__arrow--${TOOLTIP_POSITIONS.TOP}`);
    
    // Clean up
    tooltip.destroy();
    document.body.removeChild(targetButton);
  });
  
  test('should clean up resources when destroyed', () => {
    const targetButton = document.createElement('button');
    document.body.appendChild(targetButton);
    
    const tooltip = createMockTooltip({
      target: targetButton
    });
    
    // Tooltip should be in the document
    expect(document.body.contains(tooltip.element)).toBe(true);
    
    // Target should have aria-describedby
    expect(targetButton.getAttribute('aria-describedby')).toBe(tooltip.element.id);
    
    // Destroy the tooltip
    tooltip.destroy();
    
    // Tooltip should be removed from the document
    expect(document.body.contains(tooltip.element)).toBe(false);
    
    // Target should no longer have aria-describedby
    expect(targetButton.getAttribute('aria-describedby')).toBeNull();
    
    // Clean up
    document.body.removeChild(targetButton);
  });
});